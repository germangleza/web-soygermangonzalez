/**
 * Funciones PURAS de puntuación y priorización del checklist «¿La IA recomienda tu negocio?».
 * digital_readiness_score y commercial_fit_score son puntuaciones distintas: nunca se mezclan.
 */
import { BLOCKS, BLOCK_ORDER, QUESTIONS, optionsFor, type Answers, type BlockId, type Option, type Question } from './questions';

export interface BlockScore {
  id: BlockId;
  label: string;
  /** null = No aplica (todas sus preguntas excluidas). */
  score: number | null;
  points: number;
  validQuestions: number;
  unverified: number;
}

export interface Band { id: 'base' | 'inicial' | 'desarrollo' | 'solida'; label: string; min: number; max: number }
export const BANDS: Band[] = [
  { id: 'base', label: 'Base digital por construir', min: 0, max: 24 },
  { id: 'inicial', label: 'Presencia inicial', min: 25, max: 49 },
  { id: 'desarrollo', label: 'Presencia en desarrollo', min: 50, max: 74 },
  { id: 'solida', label: 'Base digital sólida', min: 75, max: 100 },
];
export const bandFor = (s: number) => BANDS.find((b) => s >= b.min && s <= b.max) ?? BANDS[0];

const byId = new Map(QUESTIONS.map((q) => [q.id, q]));

export function option(qid: Question['id'], answer: string | undefined): Option | undefined {
  const q = byId.get(qid);
  return q ? optionsFor(q).find((o) => o.id === answer) : undefined;
}

export function isValidAnswers(input: unknown): input is Answers {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return false;
  return Object.entries(input as Record<string, unknown>).every(
    ([k, v]) => typeof v === 'string' && byId.has(k as Question['id']) && Boolean(option(k as Question['id'], v)),
  );
}

export interface ChecklistResult {
  /** digital_readiness_score: round(sum(puntos válidos) / (2 × preguntas válidas) × 100). */
  score: number;
  points: number;
  validQuestions: number;
  blocks: BlockScore[];
  unverifiedCount: number;
  unverifiedQuestions: Question['id'][];
  excludedQuestions: Question['id'][];
  mapsApplies: boolean;
  band: Band;
  weakest: BlockScore | null;
  complete: boolean;
}

export function computeResult(answers: Answers): ChecklistResult {
  const blocks = new Map<BlockId, BlockScore>(
    BLOCK_ORDER.map((id) => [id, { id, label: BLOCKS[id].label, score: null, points: 0, validQuestions: 0, unverified: 0 }]),
  );
  const unverifiedQuestions: Question['id'][] = [];
  const excludedQuestions: Question['id'][] = [];
  let points = 0;
  let valid = 0;

  for (const q of QUESTIONS) {
    const o = option(q.id, answers[q.id]);
    if (!o) continue;
    if (o.points === null) { excludedQuestions.push(q.id); continue; }
    const b = blocks.get(q.block)!;
    b.points += o.points;
    b.validQuestions++;
    points += o.points;
    valid++;
    if (o.unverified) { b.unverified++; unverifiedQuestions.push(q.id); }
  }

  const list = BLOCK_ORDER.map((id) => {
    const b = blocks.get(id)!;
    return { ...b, score: b.validQuestions ? Math.round((b.points / (2 * b.validQuestions)) * 100) : null };
  });
  const score = valid ? Math.round((points / (2 * valid)) * 100) : 0;
  const applicable = list.filter((b) => b.score !== null);
  const weakest = applicable.length ? applicable.reduce((m, b) => ((b.score as number) < (m.score as number) ? b : m)) : null;

  return {
    score,
    points,
    validQuestions: valid,
    blocks: list,
    unverifiedCount: unverifiedQuestions.length,
    unverifiedQuestions,
    excludedQuestions,
    mapsApplies: list.find((b) => b.id === 'maps')!.score !== null,
    band: bandFor(score),
    weakest,
    complete: QUESTIONS.every((q) => Boolean(option(q.id, answers[q.id]))),
  };
}

/* ------------------------------------------------------------------ Top 3 prioridades */

export interface Priority {
  id: string;
  area: string;
  title: string;
  action: string;
  /** 'gap' = oportunidad confirmada por tus respuestas · 'verify' = respondiste «No sé» · 'keep' = mantener */
  kind: 'gap' | 'verify' | 'keep';
}

interface Rule { id: string; questions: Question['id'][]; area: string; title: string; action: string; verify: string }

/** En orden de dependencia (spec): web → Maps → confianza/contenido → buscadores e IA → conversión/mejora. */
const RULES: Rule[] = [
  {
    id: 'web', questions: ['q1', 'q2'], area: BLOCKS.web.label,
    title: 'Ten una página clara de tu negocio',
    action: 'Crea una página clara sobre qué ofreces, para quién, dónde y cómo comprar o contactar.',
    verify: 'Abre tu sitio desde el celular y confirma que se entiende qué ofreces, para quién y cómo contactarte.',
  },
  {
    id: 'maps', questions: ['q3', 'q4'], area: BLOCKS.maps.label,
    title: 'Reclama y revisa tu Perfil de Empresa en Google',
    action: 'Reclama o revisa tu Perfil de Empresa en Google; corrige horarios, categoría, información y enlaces.',
    verify: 'Busca tu negocio en Google Maps y confirma si la ficha existe, si tienes acceso y si los datos coinciden con tu web.',
  },
  {
    id: 'confianza', questions: ['q5'], area: BLOCKS.trust.label,
    title: 'Muestra evidencia de confianza',
    action: 'Muestra evidencia verificable de tu experiencia y fomenta reseñas auténticas, sin manipularlas.',
    verify: 'Revisa dónde están hoy tus reseñas, testimonios o casos y si un cliente nuevo puede encontrarlos.',
  },
  {
    id: 'contenido', questions: ['q6'], area: BLOCKS.trust.label,
    title: 'Responde las dudas reales de tus clientes',
    action: 'Responde dudas reales de posibles clientes con páginas claras y actualizadas.',
    verify: 'Pregunta a tu equipo qué dudas escuchan antes de una venta y comprueba si tu sitio las responde.',
  },
  {
    id: 'busqueda-ia', questions: ['q7', 'q8'], area: BLOCKS.discovery.label,
    title: 'Comprueba cómo te encuentran buscadores e IA',
    action: 'Verifica indexación, rastreabilidad, datos públicos y respuestas de IA con consultas comparables; documenta diferencias y fechas.',
    verify: 'Revisa en Google Search Console si tus páginas importantes están indexadas y haz 3–5 consultas en asistentes de IA, anotando fecha y fuentes.',
  },
  {
    id: 'conversion', questions: ['q9'], area: BLOCKS.conversion.label,
    title: 'Quita fricción para contactar o comprar',
    action: 'Comprueba botones, mensajes, enlaces y canales de contacto en dispositivos móviles.',
    verify: 'Intenta contactarte, cotizar o comprar desde tu web y tu ficha de Google, como lo haría un cliente.',
  },
  {
    id: 'mejora', questions: ['q10'], area: BLOCKS.conversion.label,
    title: 'Agenda una revisión mensual',
    action: 'Establece una revisión mensual de información, métricas y errores.',
    verify: 'Define quién revisa cada mes tus perfiles, web y métricas, y anota qué se corrigió.',
  },
];

/**
 * Máximo 3 prioridades distintas: primero las oportunidades confirmadas (No antes que Parcial,
 * respetando dependencias), luego lo que hay que verificar («No sé»). Nunca recomienda Maps si no aplica.
 */
export function topPriorities(answers: Answers, limit = 3): Priority[] {
  type Cand = { rule: Rule; severity: number; kind: Priority['kind']; order: number };
  const cands: Cand[] = [];
  RULES.forEach((rule, order) => {
    const opts = rule.questions.map((q) => option(q, answers[q])).filter((o): o is Option => Boolean(o) && o!.points !== null);
    if (!opts.length) return; // No aplica o sin respuesta
    if (opts.some((o) => o.id === 'no')) cands.push({ rule, severity: 2, kind: 'gap', order });
    else if (opts.some((o) => o.id === 'parcial')) cands.push({ rule, severity: 1, kind: 'gap', order });
    else if (opts.some((o) => o.unverified)) cands.push({ rule, severity: 0, kind: 'verify', order });
  });
  cands.sort((a, b) => b.severity - a.severity || a.order - b.order);

  const out: Priority[] = cands.slice(0, limit).map(({ rule, kind }) => ({
    id: rule.id,
    area: rule.area,
    title: kind === 'verify' ? `Verifica: ${rule.title.charAt(0).toLowerCase()}${rule.title.slice(1)}` : rule.title,
    action: kind === 'verify' ? rule.verify : rule.action,
    kind,
  }));

  // Todo en «Sí»: mantener lo construido, sin inventar fallas.
  for (const id of ['mejora', 'busqueda-ia', 'conversion']) {
    if (out.length >= limit) break;
    if (out.some((p) => p.id === id)) continue;
    const r = RULES.find((x) => x.id === id)!;
    out.push({ id: r.id, area: r.area, title: `Mantén: ${r.title.charAt(0).toLowerCase()}${r.title.slice(1)}`, action: r.action, kind: 'keep' });
  }
  return out;
}

/* ------------------------------------------------------------------ commercial_fit_score */

export interface CommercialInput { role?: string; objective?: string; start?: string; budget?: string; wantsContact?: boolean }

const ROLE: Record<string, number> = { dueno: 25, director: 20, marketing: 12, colaborador: 6, otro: 4 };
const START: Record<string, number> = { 'este-mes': 20, '1-3-meses': 14, despues: 6, explorando: 3 };
const BUDGET: Record<string, number> = { si: 25, evaluando: 15, propuesta: 12, 'no-por-ahora': 0 };

/**
 * commercial_fit_score 0–100 = función 25 + objetivo 20 + horizonte 20 + presupuesto 25 + quiere contacto 10.
 * Heurística interna y revisable; nunca se muestra al visitante ni se mezcla con el puntaje digital.
 */
export function commercialFit(c: CommercialInput): { score: number; segment: 'A' | 'B' | 'C' } {
  const score =
    (ROLE[c.role ?? ''] ?? 0) +
    (c.objective ? (c.objective === 'explorar' ? 5 : 20) : 0) +
    (START[c.start ?? ''] ?? 0) +
    (BUDGET[c.budget ?? ''] ?? 0) +
    (c.wantsContact ? 10 : 0);
  return { score, segment: score >= 75 ? 'A' : score >= 50 ? 'B' : 'C' };
}
