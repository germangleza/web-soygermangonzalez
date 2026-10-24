/**
 * Funciones PURAS de puntuación y priorización del checklist de ventas por WhatsApp.
 * Mismo esquema que el checklist de IA: score = round(puntos / (2 × respondidas) × 100).
 */
import { BLOCKS, BLOCK_ORDER, OPTIONS, QUESTIONS, type Answers, type BlockId, type Option, type Question } from './questions';

export interface BlockScore {
  id: BlockId;
  label: string;
  score: number | null;
  points: number;
  validQuestions: number;
  unverified: number;
}

export interface Band { id: 'fugas' | 'reactiva' | 'construccion' | 'ordenado'; label: string; min: number; max: number }
export const BANDS: Band[] = [
  { id: 'fugas', label: 'Las ventas se escapan en el chat', min: 0, max: 24 },
  { id: 'reactiva', label: 'Atención reactiva', min: 25, max: 49 },
  { id: 'construccion', label: 'Seguimiento en construcción', min: 50, max: 74 },
  { id: 'ordenado', label: 'Sistema comercial ordenado', min: 75, max: 100 },
];
export const bandFor = (s: number) => BANDS.find((b) => s >= b.min && s <= b.max) ?? BANDS[0];

const byId = new Map(QUESTIONS.map((q) => [q.id, q]));

export function option(qid: Question['id'], answer: string | undefined): Option | undefined {
  return byId.has(qid) ? OPTIONS.find((o) => o.id === answer) : undefined;
}

export function isValidAnswers(input: unknown): input is Answers {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return false;
  return Object.entries(input as Record<string, unknown>).every(
    ([k, v]) => typeof v === 'string' && Boolean(option(k as Question['id'], v)),
  );
}

export interface WhatsappResult {
  score: number;
  points: number;
  validQuestions: number;
  blocks: BlockScore[];
  unverifiedCount: number;
  unverifiedQuestions: Question['id'][];
  band: Band;
  weakest: BlockScore | null;
  complete: boolean;
}

export function computeResult(answers: Answers): WhatsappResult {
  const blocks = new Map<BlockId, BlockScore>(
    BLOCK_ORDER.map((id) => [id, { id, label: BLOCKS[id].label, score: null, points: 0, validQuestions: 0, unverified: 0 }]),
  );
  const unverifiedQuestions: Question['id'][] = [];
  let points = 0;
  let valid = 0;

  for (const q of QUESTIONS) {
    const o = option(q.id, answers[q.id]);
    if (!o || o.points === null) continue;
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
  const scored = list.filter((b) => b.score !== null);
  const weakest = scored.length ? scored.reduce((m, b) => ((b.score as number) < (m.score as number) ? b : m)) : null;

  return {
    score,
    points,
    validQuestions: valid,
    blocks: list,
    unverifiedCount: unverifiedQuestions.length,
    unverifiedQuestions,
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

/** En orden de dependencia: contestar → que no dependa de un celular → seguir → registrar → agilizar → medir. */
const RULES: Rule[] = [
  {
    id: 'respuesta', questions: ['q1', 'q2'], area: BLOCKS.respuesta.label,
    title: 'Responde en minutos, también fuera de horario',
    action: 'Ten una primera respuesta útil a cualquier hora: un agente de IA puede contestar lo frecuente y pedir los datos para cotizar mientras tu equipo no está.',
    verify: 'Escríbele a tu negocio desde otro número, en horario laboral y de noche; anota cuánto tardan en contestarte y qué te responden.',
  },
  {
    id: 'responsable', questions: ['q3', 'q12'], area: BLOCKS.respuesta.label,
    title: 'Que la atención no dependa de un celular',
    action: 'Pasa WhatsApp a una bandeja compartida: varias personas atienden, cada conversación tiene responsable y el historial se queda en el negocio.',
    verify: 'Pregunta quién contesta hoy, desde qué celular y qué pasa con las conversaciones si esa persona falta una semana.',
  },
  {
    id: 'seguimiento', questions: ['q4', 'q5'], area: BLOCKS.seguimiento.label,
    title: 'Da seguimiento a cada cotización',
    action: 'Define una secuencia de seguimiento (por ejemplo, a las 24 horas, a los 3 días y a los 7 días) y automatízala para que nadie dependa de acordarse.',
    verify: 'Cuenta cuántas cotizaciones de la semana pasada no tuvieron respuesta y si alguien les volvió a escribir.',
  },
  {
    id: 'crm', questions: ['q7', 'q9'], area: BLOCKS.registro.label,
    title: 'Registra cada consulta fuera del chat',
    action: 'Conecta WhatsApp a un CRM sencillo para que cada consulta quede con nombre, origen, interés y etapa, sin capturarla a mano.',
    verify: 'Elige 10 conversaciones de la semana y revisa si sabes qué pidieron, de dónde llegaron y en qué etapa van.',
  },
  {
    id: 'respuestas-listas', questions: ['q10'], area: BLOCKS.operacion.label,
    title: 'Ten listas las respuestas de siempre',
    action: 'Documenta precios, horarios, ubicación y disponibilidad en respuestas rápidas o en una base de información que pueda usar un agente de IA.',
    verify: 'Revisa las últimas 20 conversaciones y cuenta cuántas preguntas se repiten; esas son las primeras que conviene dejar listas.',
  },
  {
    id: 'cotizacion', questions: ['q11'], area: BLOCKS.operacion.label,
    title: 'Cotiza el mismo día',
    action: 'Usa plantillas o un cotizador conectado a tu lista de precios para enviar propuestas el mismo día en que te las piden.',
    verify: 'Mide cuánto tardaron tus últimas 5 cotizaciones desde que te las pidieron hasta que las enviaste.',
  },
  {
    id: 'recordatorios', questions: ['q6'], area: BLOCKS.seguimiento.label,
    title: 'Automatiza confirmaciones y recordatorios',
    action: 'Programa confirmaciones de citas, entregas y pagos para que salgan solas y a tiempo, con respuesta del cliente registrada.',
    verify: 'Revisa cuántas confirmaciones se enviaron a mano esta semana y cuánto tiempo le tomaron a tu equipo.',
  },
  {
    id: 'medicion', questions: ['q8'], area: BLOCKS.registro.label,
    title: 'Mide consultas y cierres cada mes',
    action: 'Lleva cada mes tres números: consultas recibidas, cotizaciones enviadas y ventas cerradas. Con eso se ve en qué paso se pierde la venta.',
    verify: 'Busca el dato del mes pasado: consultas recibidas y ventas cerradas. Si no lo encuentras en 10 minutos, no se está midiendo.',
  },
];

/**
 * Máximo 3 prioridades distintas: primero las oportunidades confirmadas (No antes que Parcial,
 * respetando el orden de dependencia), luego lo que hay que verificar («No sé»); si todo es Sí, mantener.
 */
export function topPriorities(answers: Answers, limit = 3): Priority[] {
  type Cand = { rule: Rule; severity: number; kind: Priority['kind']; order: number };
  const cands: Cand[] = [];
  RULES.forEach((rule, order) => {
    const opts = rule.questions.map((q) => option(q, answers[q])).filter((o): o is Option => Boolean(o));
    if (!opts.length) return;
    if (opts.some((o) => o.id === 'no')) cands.push({ rule, severity: 2, kind: 'gap', order });
    else if (opts.some((o) => o.id === 'parcial')) cands.push({ rule, severity: 1, kind: 'gap', order });
    else if (opts.some((o) => o.unverified)) cands.push({ rule, severity: 0, kind: 'verify', order });
  });
  cands.sort((a, b) => b.severity - a.severity || a.order - b.order);

  const lower = (s: string) => `${s.charAt(0).toLowerCase()}${s.slice(1)}`;
  const out: Priority[] = cands.slice(0, limit).map(({ rule, kind }) => ({
    id: rule.id,
    area: rule.area,
    title: kind === 'verify' ? `Verifica: ${lower(rule.title)}` : rule.title,
    action: kind === 'verify' ? rule.verify : rule.action,
    kind,
  }));

  for (const id of ['medicion', 'seguimiento', 'crm']) {
    if (out.length >= limit) break;
    if (out.some((p) => p.id === id)) continue;
    const r = RULES.find((x) => x.id === id)!;
    out.push({ id: r.id, area: r.area, title: `Mantén: ${lower(r.title)}`, action: r.action, kind: 'keep' });
  }
  return out;
}
