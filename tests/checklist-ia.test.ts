import { describe, expect, it } from 'vitest';
import { QUESTIONS, type Answers } from '../src/lib/checklist-ia/questions';
import { bandFor, commercialFit, computeResult, isValidAnswers, topPriorities } from '../src/lib/checklist-ia/scoring';
import { leadSchema, toLead } from '../src/lib/leads';

const all = (v: string): Answers => Object.fromEntries(QUESTIONS.map((q) => [q.id, v])) as Answers;
const set = (base: Answers, ch: Record<string, string>): Answers => ({ ...base, ...ch }) as Answers;

describe('preguntas', () => {
  it('10 preguntas en 5 bloques de 2; solo Q3 y Q4 admiten "No aplica"', () => {
    expect(QUESTIONS).toHaveLength(10);
    const per = QUESTIONS.reduce<Record<string, number>>((a, q) => ({ ...a, [q.block]: (a[q.block] ?? 0) + 1 }), {});
    expect(Object.values(per)).toEqual([2, 2, 2, 2, 2]);
    expect(QUESTIONS.filter((q) => q.allowNA).map((q) => q.id)).toEqual(['q3', 'q4']);
  });
  it('"No aplica" se rechaza fuera de Q3/Q4', () => {
    expect(isValidAnswers({ q3: 'na', q4: 'na' })).toBe(true);
    expect(isValidAnswers({ q1: 'na' })).toBe(false);
    expect(isValidAnswers({ q1: 'quizas' })).toBe(false);
    expect(isValidAnswers({ q99: 'si' })).toBe(false);
  });
});

describe('digital_readiness_score', () => {
  it('Sí=2, Parcial=1, No=0: todo Sí → 100; todo Parcial → 50; todo No → 0', () => {
    expect(computeResult(all('si')).score).toBe(100);
    expect(computeResult(all('parcial')).score).toBe(50);
    expect(computeResult(all('no')).score).toBe(0);
    expect(computeResult(all('si')).points).toBe(20);
  });
  it('score = round(puntos / (2 × válidas) × 100) y bloques sobre 100', () => {
    const a = set(all('no'), { q1: 'si', q2: 'parcial', q5: 'si' }); // 2+1+2 = 5/20 = 25
    const r = computeResult(a);
    expect(r.score).toBe(25);
    expect(r.blocks.find((b) => b.id === 'web')!.score).toBe(75);
    expect(r.blocks.find((b) => b.id === 'trust')!.score).toBe(50);
    expect(r.band.label).toBe('Presencia inicial');
  });
  it('"No aplica" en Q3 y Q4 excluye Maps del denominador y lo marca como N/A (no cero)', () => {
    const a = set(all('si'), { q3: 'na', q4: 'na', q10: 'no' }); // 14/16 = 87.5 → 88
    const r = computeResult(a);
    expect(r.validQuestions).toBe(8);
    expect(r.score).toBe(88);
    expect(r.mapsApplies).toBe(false);
    expect(r.blocks.find((b) => b.id === 'maps')!.score).toBeNull();
    expect(r.excludedQuestions).toEqual(['q3', 'q4']);
  });
  it('un solo "No aplica" en Maps: el bloque se calcula con la pregunta válida', () => {
    const r = computeResult(set(all('si'), { q3: 'parcial', q4: 'na' }));
    expect(r.blocks.find((b) => b.id === 'maps')!.score).toBe(50);
    expect(r.validQuestions).toBe(9);
  });
  it('"No sé" vale 0, cuenta como pendiente de verificar y no es "No aplica"', () => {
    const r = computeResult(set(all('si'), { q7: 'no-se', q8: 'no-se' }));
    expect(r.score).toBe(80);
    expect(r.unverifiedCount).toBe(2);
    expect(r.unverifiedQuestions).toEqual(['q7', 'q8']);
    expect(r.validQuestions).toBe(10);
  });
  it('bandas orientativas', () => {
    expect([0, 24, 25, 49, 50, 74, 75, 100].map((s) => bandFor(s).id)).toEqual(['base', 'base', 'inicial', 'inicial', 'desarrollo', 'desarrollo', 'solida', 'solida']);
  });
  it('incompleto no cuenta como completo', () => {
    const { q10: _x, ...partial } = all('si');
    expect(computeResult(partial).complete).toBe(false);
  });
});

describe('top 3 prioridades', () => {
  const ids = (a: Answers) => topPriorities(a).map((p) => `${p.kind}:${p.id}`);
  it('ordena por dependencia: web → Maps → confianza', () => {
    expect(ids(all('no'))).toEqual(['gap:web', 'gap:maps', 'gap:confianza']);
  });
  it('"No" (confirmado) va antes que "Parcial", y ambos antes que "No sé"', () => {
    expect(ids(set(all('si'), { q1: 'parcial', q9: 'no', q7: 'no-se' }))).toEqual(['gap:conversion', 'gap:web', 'verify:busqueda-ia']);
  });
  it('"No sé" genera "Verifica…", nunca afirma una falla', () => {
    const p = topPriorities(set(all('si'), { q8: 'no-se' }))[0];
    expect(p.kind).toBe('verify');
    expect(p.title.startsWith('Verifica')).toBe(true);
  });
  it('con Maps "No aplica" no recomienda nada de Maps', () => {
    const r = topPriorities(set(all('no'), { q3: 'na', q4: 'na' }));
    expect(r.some((p) => p.id === 'maps')).toBe(false);
    expect(r.map((p) => p.id)).toEqual(['web', 'confianza', 'contenido']);
  });
  it('todo en Sí → 3 acciones de mantenimiento, sin inventar fallas', () => {
    const r = topPriorities(all('si'));
    expect(r).toHaveLength(3);
    expect(r.every((p) => p.kind === 'keep')).toBe(true);
  });
  it('nunca promete recomendaciones ni posiciones', () => {
    const txt = JSON.stringify([all('no'), all('si'), all('no-se')].flatMap((a) => topPriorities(a)));
    expect(txt).not.toMatch(/garantiz|te recomendar[áa]|primer lugar|posici[oó]n en chatgpt/i);
  });
});

describe('commercial_fit_score (separado del puntaje digital)', () => {
  it('máximo 100 y bandas A/B/C', () => {
    expect(commercialFit({ role: 'dueno', objective: 'leads', start: 'este-mes', budget: 'si', wantsContact: true })).toEqual({ score: 100, segment: 'A' });
    expect(commercialFit({ role: 'marketing', objective: 'web', start: '1-3-meses', budget: 'evaluando', wantsContact: false }).segment).toBe('B'); // 61
    expect(commercialFit({ role: 'otro', objective: 'explorar', start: 'explorando', budget: 'no-por-ahora', wantsContact: false }).segment).toBe('C');
  });
});

describe('servidor (leadSchema + toLead)', () => {
  const meta = { startedAt: Date.now() - 10000, website: '', attribution: { utm_source: 'instagram', utm_medium: 'social', utm_campaign: 'comenta-ia', landingPage: '/ia-recomienda-tu-negocio' } };
  const answers = JSON.stringify(set(all('parcial'), { q3: 'na', q4: 'na', q8: 'no-se' }));

  it('reporte: email obligatorio, marketing por separado y apagado por defecto; recalcula el puntaje', () => {
    const ok = leadSchema.safeParse({ formType: 'checklist-ia-reporte', answers, email: 'Ana@Negocio.mx', business_type: 'retail', consentimiento: true, linkedin_url: 'https://www.linkedin.com/company/negocio', ...meta });
    expect(ok.success).toBe(true);
    const lead = toLead(ok.data!) as unknown as Record<string, unknown>;
    expect(lead).toMatchObject({
      type: 'checklist-ia-reporte', email: 'ana@negocio.mx', marketing_consent: false, requested_report: true, requested_review: false,
      lead_interest: 'general', source: 'instagram', campaign: 'comenta-ia', unverified_count: 1, excluded_questions: ['q3', 'q4'],
    });
    expect((lead.scores_by_dimension as Record<string, unknown>).maps).toBe('n/a');
    expect(lead.digital_readiness_score).toBe(computeResult(JSON.parse(answers)).score);
    expect(lead.commercial_fit_score).toBeUndefined();
    expect(leadSchema.safeParse({ formType: 'checklist-ia-reporte', answers, business_type: 'retail', consentimiento: true, ...meta }).success).toBe(false);
  });

  it('rechaza enlaces inválidos, "No aplica" fuera de Maps y respuestas incompletas', () => {
    const base = { formType: 'checklist-ia-reporte', email: 'a@b.mx', business_type: 'otros', consentimiento: true, ...meta };
    expect(leadSchema.safeParse({ ...base, answers, instagram_url: 'https://evil.com/x' }).success).toBe(false);
    expect(leadSchema.safeParse({ ...base, answers: JSON.stringify(set(all('si'), { q1: 'na' })) }).success).toBe(false);
    expect(leadSchema.safeParse({ ...base, answers: '{"q1":"si"}' }).success).toBe(false);
  });

  it('revisión salud → lead_interest=health; scores distintos y nunca mezclados', () => {
    const ok = leadSchema.safeParse({
      formType: 'checklist-ia-revision', answers, full_name: 'Dra. Ana', email: 'ana@clinica.mx', company: 'Clínica Ana', business_type: 'salud',
      objective: 'visibilidad', role: 'dueno', start: 'este-mes', budget: 'evaluando', wants_contact: 'si', consentimiento: true, marketing_consent: 'true', ...meta,
    });
    expect(ok.success).toBe(true);
    const lead = toLead(ok.data!) as unknown as Record<string, unknown>;
    expect(lead).toMatchObject({ lead_interest: 'health', requested_review: true, wants_contact: true, commercial_fit_score: 90, commercial_segment: 'A', qualified_lead: true, marketing_consent: true });
    expect(lead.digital_readiness_score).not.toBe(lead.commercial_fit_score);
  });
});
