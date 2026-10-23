import { describe, expect, it } from 'vitest';
import { QUESTIONS, type Answers } from '../src/lib/diagnostic/questions';
import { bandFor, computeResult, isValidAnswers, leadScore, recommend } from '../src/lib/diagnostic/scoring';
import { normalizeLink, normalizeWhatsapp } from '../src/lib/diagnostic/urls';
import { leadSchema, toLead } from '../src/lib/leads';

/** Respuestas con la opción de N puntos en todas las preguntas. */
const all = (points: 0 | 2 | 4, unknown = false): Answers =>
  Object.fromEntries(
    QUESTIONS.map((q) => [q.id, q.options.find((o) => o.points === points && Boolean(o.unknown) === unknown)!.id]),
  );
const optFor = (qid: string, points: 0 | 2 | 4, unknown = false) =>
  QUESTIONS.find((q) => q.id === qid)!.options.find((o) => o.points === points && Boolean(o.unknown) === unknown)!.id;
const withAnswers = (base: Answers, changes: Record<string, [0 | 2 | 4, boolean?]>): Answers => ({
  ...base,
  ...Object.fromEntries(Object.entries(changes).map(([q, [p, u]]) => [q, optFor(q, p, u)])),
});

describe('preguntas', () => {
  it('son 16: tres por dimensión y cuatro en reputación (incluye redes), con opciones de 0/2/4 y un "No sé"', () => {
    expect(QUESTIONS).toHaveLength(16);
    const perDim = QUESTIONS.reduce<Record<string, number>>((acc, q) => ({ ...acc, [q.dimension]: (acc[q.dimension] ?? 0) + 1 }), {});
    expect(perDim).toEqual({ maps: 3, web: 3, reviews: 4, ai: 3, contact: 3 });
    for (const q of QUESTIONS) {
      expect(q.options.map((o) => o.points).sort()).toEqual(expect.arrayContaining([0, 2, 4]));
      expect(q.options.some((o) => o.unknown)).toBe(true);
    }
  });
});

describe('computeResult', () => {
  it('todo en 4 → 100 global y 100 por dimensión', () => {
    const r = computeResult(all(4));
    expect(r.digitalScore).toBe(100);
    expect(r.points).toBe(64);
    expect(r.dimensions.every((d) => d.score === 100)).toBe(true);
    expect(r.band.label).toBe('Base digital sólida');
    expect(r.complete).toBe(true);
  });

  it('todo en 0 → 0 global; todo en 2 → 50', () => {
    expect(computeResult(all(0)).digitalScore).toBe(0);
    expect(computeResult(all(2)).digitalScore).toBe(50);
    expect(computeResult(all(2)).dimensions.every((d) => d.score === 50)).toBe(true);
  });

  it('calcula dimensión = round(puntos/máx*100) y global = round(puntos/64*100)', () => {
    // Google Maps: 4+2+0 = 6/12 = 50 · Sitio web: 4+4+2 = 10/12 = 83.33 → 83
    const a = withAnswers(all(0), { q1: [4], q2: [2], q4: [4], q5: [4], q6: [2] });
    const r = computeResult(a);
    expect(r.dimensions.find((d) => d.id === 'maps')!.score).toBe(50);
    expect(r.dimensions.find((d) => d.id === 'web')!.score).toBe(83);
    expect(r.points).toBe(16);
    expect(r.digitalScore).toBe(25); // 16/64
  });

  it('"No sé" vale 0, se cuenta como pendiente y activa baja confianza desde 5', () => {
    const four = withAnswers(all(4), { q1: [0, true], q4: [0, true], q7: [0, true], q14: [0, true] });
    const r4 = computeResult(four);
    expect(r4.unknownCount).toBe(4);
    expect(r4.unknownQuestions).toEqual(['q1', 'q4', 'q7', 'q14']);
    expect(r4.lowConfidence).toBe(false);
    expect(r4.points).toBe(48);
    const r5 = computeResult(withAnswers(four, { q11: [0, true] }));
    expect(r5.unknownCount).toBe(5);
    expect(r5.lowConfidence).toBe(true);
  });

  it('dimensión más débil = menor puntuación; empate se resuelve por orden de fundamentos', () => {
    expect(computeResult(withAnswers(all(4), { q13: [0], q14: [0] })).weakest.id).toBe('contact');
    expect(computeResult(all(2)).weakest.id).toBe('maps');
  });

  it('respuestas incompletas no cuentan como completas', () => {
    const { q15: _omit, ...partial } = all(4);
    expect(computeResult(partial).complete).toBe(false);
  });

  it('rangos orientativos', () => {
    expect([0, 24, 25, 49, 50, 74, 75, 100].map((s) => bandFor(s).id)).toEqual([
      'base', 'base', 'inicial', 'inicial', 'desarrollo', 'desarrollo', 'solida', 'solida',
    ]);
  });

  it('isValidAnswers rechaza preguntas u opciones inexistentes', () => {
    expect(isValidAnswers(all(4))).toBe(true);
    expect(isValidAnswers({ q1: 'inventada' })).toBe(false);
    expect(isValidAnswers({ q99: 'completa' })).toBe(false);
    expect(isValidAnswers('x')).toBe(false);
  });
});

describe('sin sitio web', () => {
  const ids = (a: Answers) => recommend(a).map((r) => r.id);
  it('q4 = «No tenemos sitio web» omite q5 y q6: cuentan 0, el resultado queda completo y no se marcan como «No sé»', () => {
    const { q5: _a, q6: _b, ...rest } = withAnswers(all(4), { q4: [0] });
    const r = computeResult(rest);
    expect(r.complete).toBe(true);
    expect(r.dimensions.find((d) => d.id === 'web')!.score).toBe(0);
    expect(r.unknownQuestions).not.toContain('q5');
  });
  it('sin web la primera recomendación es tener sitio propio y no se recomienda mejorar un sitio que no existe', () => {
    const { q5: _a, q6: _b, ...rest } = withAnswers(all(4), { q4: [0] });
    const r = ids(rest);
    expect(r[0]).toBe('sitio-propio');
    expect(r).not.toContain('info-servicios');
    expect(r).not.toContain('optimizar-web');
  });
  it('redes sin estrategia (q16 = 0) activa la recomendación de contenido', () => {
    expect(ids(withAnswers(all(4), { q16: [0] }))).toContain('redes-contenido');
  });
});

describe('recommend', () => {
  const ids = (a: Answers, ctx = {}) => recommend(a, computeResult(a), ctx).map((r) => r.id);

  it('siempre devuelve 3 recomendaciones distintas', () => {
    for (const a of [all(0), all(2), all(4)]) {
      const r = recommend(a);
      expect(r).toHaveLength(3);
      expect(new Set(r.map((x) => x.id)).size).toBe(3);
      for (const x of r) expect(x.title && x.why && x.firstAction && x.area).toBeTruthy();
    }
  });

  it('prioriza fundamentos: Q4=0 → sitio; Q1=0 → perfil; Q2=0 → info local', () => {
    expect(ids(all(0))).toEqual(['sitio-propio', 'perfil-empresa', 'info-local']);
  });

  it('confianza → descubrimiento → conversión cuando los fundamentos están bien', () => {
    expect(ids(withAnswers(all(4), { q8: [0], q12: [0], q15: [0] }))).toEqual(['proceso-resenas', 'consistencia', 'contacto-seguimiento']);
    expect(ids(withAnswers(all(4), { q5: [0], q11: [0] }))[0]).toBe('info-servicios');
  });

  it('las recomendaciones se basan en las respuestas (no son fijas)', () => {
    expect(ids(withAnswers(all(4), { q14: [0] }))[0]).toBe('contacto-seguimiento');
    expect(ids(withAnswers(all(4), { q11: [0] }))[0]).toBe('prueba-ia');
  });

  it('sin déficits en 0 prioriza las dimensiones con menor puntuación', () => {
    const a = withAnswers(all(4), { q13: [2], q14: [2], q7: [2] });
    expect(ids(a)).toEqual(['optimizar-contacto', 'optimizar-resenas', 'optimizar-maps']);
  });

  it('"no tengo web" pone el sitio propio primero y no la prueba de IA', () => {
    const a = withAnswers(all(4), { q11: [0], q12: [0] });
    const r = ids(a, { noWebsite: true });
    expect(r[0]).toBe('sitio-propio');
    expect(r[0]).not.toBe('prueba-ia');
  });

  it('marca como "verificar" lo que se activó solo por "No sé"', () => {
    const r = recommend(withAnswers(all(4), { q1: [0, true] }));
    expect(r[0]).toMatchObject({ id: 'perfil-empresa', needsVerification: true });
    const r2 = recommend(withAnswers(all(4), { q1: [0] }));
    expect(r2[0].needsVerification).toBe(false);
  });

  it('nunca promete posicionamiento ni recomendación garantizada', () => {
    const text = JSON.stringify([all(0), all(2), all(4)].flatMap((a) => recommend(a)));
    expect(text).not.toMatch(/garantiz|primer lugar|asegura(mos)? que/i);
  });
});

describe('leadScore', () => {
  const strong = { role: 'propietario', authorizer: 'yo', priority: 'google-ia', start: 'este-mes', investment: 'asignado' };
  const full = { hasWebsite: true, hasGoogleBusiness: true, hasSocial: true, hasCity: true };

  it('suma 25+25+20+20+10 con el perfil más fuerte y puntuación digital 0', () => {
    expect(leadScore(strong, 0, full)).toMatchObject({ score: 100, segment: 'A' });
  });
  it('bandas A ≥75, B 50–74, C <50', () => {
    expect(leadScore(strong, 100, full).segment).toBe('A'); // 25+10+20+20+10 = 85
    expect(leadScore({ ...strong, start: '1-3-meses', investment: 'evaluando' }, 60, {}).score).toBe(25 + 16 + 14 + 12); // 67 → B
    expect(leadScore({ ...strong, start: '1-3-meses', investment: 'evaluando' }, 60, {}).segment).toBe('B');
    expect(leadScore({ role: 'otro', authorizer: 'no-definido', priority: 'explorando', start: 'no-se', investment: 'no-por-ahora' }, 90, {}).segment).toBe('C');
  });
});

describe('normalizeLink', () => {
  it('normaliza dominios y URLs de sitio web', () => {
    expect(normalizeLink('website', 'miclinica.com')).toBe('https://miclinica.com');
    expect(normalizeLink('website', 'http://www.MiClinica.mx/')).toBe('https://www.miclinica.mx');
    expect(normalizeLink('website', '')).toBe('');
  });
  it('rechaza URLs peligrosas o inválidas', () => {
    for (const bad of ['javascript:alert(1)', 'ftp://x.com', 'http://127.0.0.1', 'localhost', 'https://user:pw@x.com', 'no es url', 'http://[::1]/']) {
      expect(normalizeLink('website', bad)).toBeNull();
    }
  });
  it('convierte @usuario en URL de la red del campo, sin inventar otras', () => {
    expect(normalizeLink('instagram', '@clinica.sonrisa')).toBe('https://www.instagram.com/clinica.sonrisa');
    expect(normalizeLink('instagram', 'clinicasonrisa')).toBe('https://www.instagram.com/clinicasonrisa');
    expect(normalizeLink('tiktok', '@clinica')).toBe('https://www.tiktok.com/@clinica');
    expect(normalizeLink('facebook', 'https://facebook.com/clinica')).toBe('https://facebook.com/clinica');
    expect(normalizeLink('instagram', 'https://facebook.com/clinica')).toBeNull();
    expect(normalizeLink('linkedin', 'clinica')).toBeNull();
  });
  it('acepta solo enlaces de Google Maps en el campo de ficha', () => {
    expect(normalizeLink('google_business', 'https://maps.app.goo.gl/abc123')).toBe('https://maps.app.goo.gl/abc123');
    expect(normalizeLink('google_business', 'https://www.google.com/maps/place/Clinica')).toBe('https://www.google.com/maps/place/Clinica');
    expect(normalizeLink('google_business', 'https://miclinica.com')).toBeNull();
  });
  it('WhatsApp', () => {
    expect(normalizeWhatsapp('+52 55 1234 5678')).toBe('+525512345678');
    expect(normalizeWhatsapp('abc')).toBeNull();
  });
});

describe('validación de servidor (leadSchema + toLead)', () => {
  const meta = { startedAt: Date.now() - 10000, website: '', attribution: { utm_source: 'instagram', utm_campaign: 'reel-ia' } };
  const answers = JSON.stringify(withAnswers(all(2), { q4: [0], q11: [0, true] }));

  it('reporte: solo email requerido; recalcula puntuación en el servidor; marketing opcional', () => {
    const parsed = leadSchema.safeParse({ formType: 'diagnostico-reporte', answers, email: 'Dra@Clinica.mx', consentimiento: true, instagram_url: '@clinica', ...meta });
    expect(parsed.success).toBe(true);
    const lead = toLead(parsed.data!) as unknown as Record<string, unknown>;
    expect(lead).toMatchObject({
      type: 'diagnostico-reporte', email: 'dra@clinica.mx', requested_report: true, requested_review: false,
      maguey_salud_review: false, marketing_consent: false, instagram_url: 'https://www.instagram.com/clinica',
      unknown_count: 1, utm_source: 'instagram', utm_campaign: 'reel-ia', business_unit: 'maguey-salud',
    });
    expect(lead.digital_score).toBe(computeResult(JSON.parse(answers)).digitalScore);
    expect(lead.lead_score).toBeUndefined();
    expect((lead.top_recommendations as unknown[]).length).toBe(3);
  });

  it('reporte: rechaza URLs inválidas y respuestas manipuladas o incompletas', () => {
    const bad = leadSchema.safeParse({ formType: 'diagnostico-reporte', answers, email: 'a@b.mx', consentimiento: true, website_url: 'javascript:alert(1)', ...meta });
    expect(bad.success).toBe(false);
    const tampered = leadSchema.safeParse({ formType: 'diagnostico-reporte', answers: '{"q1":"completa"}', email: 'a@b.mx', consentimiento: true, ...meta });
    expect(tampered.success).toBe(false);
    const noConsent = leadSchema.safeParse({ formType: 'diagnostico-reporte', answers, email: 'a@b.mx', ...meta });
    expect(noConsent.success).toBe(false);
  });

  it('revisión: exige datos de clínica y calificación; marca Maguey Salud y calcula lead_score', () => {
    const base = {
      formType: 'diagnostico-revision', answers, full_name: 'Dra. Ana', email: 'ana@clinica.mx', clinic_name: 'Clínica Sonrisa',
      city: 'Monterrey', specialty: 'odontologia', challenge: 'Queremos más pacientes nuevos.', consentimiento: true,
      role: 'propietario', priority: 'google-ia', start: 'este-mes', authorizer: 'yo', investment: 'asignado',
      google_business_url: 'https://maps.app.goo.gl/x1', no_website: 'true', ...meta,
    };
    const ok = leadSchema.safeParse(base);
    expect(ok.success).toBe(true);
    const lead = toLead(ok.data!) as unknown as Record<string, unknown>;
    expect(lead).toMatchObject({ requested_review: true, maguey_salud_review: true, priority_contact: true, no_website: true, lead_segment: 'A' });
    expect(lead.website_url).toBeUndefined();
    expect((lead.top_recommendations as { title: string }[])[0].title).toMatch(/sitio web propio/i);

    const { clinic_name: _c, role: _r, ...missing } = base;
    const fail = leadSchema.safeParse(missing);
    expect(fail.success).toBe(false);
    const paths = fail.error!.issues.map((i) => i.path[0]);
    expect(paths).toEqual(expect.arrayContaining(['clinic_name', 'role']));
  });
});
