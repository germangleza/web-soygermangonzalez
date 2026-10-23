/**
 * Funciones PURAS de puntuación y priorización (spec §5, §6, §8).
 * Se usan en el navegador (resultado inmediato) y en el servidor (que recalcula y no confía en el cliente).
 */
import { DIMENSIONS, DIMENSION_ORDER, QUESTIONS, effectiveAnswers, isSkipped, type Answers, type DimensionId, type Question } from './questions';

export const MAX_POINTS = QUESTIONS.length * 4; // 64
export const LOW_CONFIDENCE_UNKNOWNS = 5;

export interface DimensionScore {
  id: DimensionId;
  label: string;
  points: number;
  max: number;
  score: number; // 0–100
  unknown: number;
}

export interface Band { id: 'base' | 'inicial' | 'desarrollo' | 'solida'; label: string; min: number; max: number }

export const BANDS: Band[] = [
  { id: 'base', label: 'Base digital por construir', min: 0, max: 24 },
  { id: 'inicial', label: 'Presencia inicial', min: 25, max: 49 },
  { id: 'desarrollo', label: 'Presencia en desarrollo', min: 50, max: 74 },
  { id: 'solida', label: 'Base digital sólida', min: 75, max: 100 },
];

export interface DiagnosticResult {
  digitalScore: number;
  points: number;
  dimensions: DimensionScore[];
  unknownCount: number;
  unknownQuestions: Question['id'][];
  lowConfidence: boolean;
  band: Band;
  weakest: DimensionScore;
  complete: boolean;
}

const byId = new Map(QUESTIONS.map((q) => [q.id, q]));

/** Puntos de una respuesta (0 si no hay respuesta o la opción no existe). */
export function pointsFor(qid: Question['id'], answer: string | undefined): { points: number; unknown: boolean; valid: boolean } {
  const opt = byId.get(qid)?.options.find((o) => o.id === answer);
  return opt ? { points: opt.points, unknown: Boolean(opt.unknown), valid: true } : { points: 0, unknown: false, valid: false };
}

/** Valida que cada respuesta corresponda a una pregunta y opción existentes. */
export function isValidAnswers(input: unknown): input is Answers {
  if (!input || typeof input !== 'object') return false;
  return Object.entries(input as Record<string, unknown>).every(
    ([k, v]) => typeof v === 'string' && byId.has(k as Question['id']) && pointsFor(k as Question['id'], v).valid,
  );
}

export function bandFor(score: number): Band {
  return BANDS.find((b) => score >= b.min && score <= b.max) ?? BANDS[0];
}

export function computeResult(raw: Answers): DiagnosticResult {
  const answers = effectiveAnswers(raw);
  let total = 0;
  const unknownQuestions: Question['id'][] = [];
  const dims = new Map<DimensionId, DimensionScore>(
    DIMENSION_ORDER.map((id) => [id, { id, label: DIMENSIONS[id].label, points: 0, max: 0, score: 0, unknown: 0 }]),
  );

  for (const q of QUESTIONS) {
    const { points, unknown } = pointsFor(q.id, answers[q.id]);
    const d = dims.get(q.dimension)!;
    d.max += 4;
    d.points += points;
    total += points;
    if (unknown) { d.unknown++; unknownQuestions.push(q.id); }
  }

  const dimensions = DIMENSION_ORDER.map((id) => {
    const d = dims.get(id)!;
    return { ...d, score: Math.round((d.points / d.max) * 100) };
  });
  const digitalScore = Math.round((total / MAX_POINTS) * 100);
  // Menor puntuación; en empate gana el orden de fundamentos (DIMENSION_ORDER).
  const weakest = dimensions.reduce((min, d) => (d.score < min.score ? d : min), dimensions[0]);

  return {
    digitalScore,
    points: total,
    dimensions,
    unknownCount: unknownQuestions.length,
    unknownQuestions,
    lowConfidence: unknownQuestions.length >= LOW_CONFIDENCE_UNKNOWNS,
    band: bandFor(digitalScore),
    weakest,
    complete: QUESTIONS.every((q) => pointsFor(q.id, answers[q.id]).valid),
  };
}

/* ------------------------------------------------------------------ Recomendaciones (spec §6) */

export interface Recommendation {
  id: string;
  title: string;
  why: string;
  firstAction: string;
  area: string;
  /** true si la regla se activó por respuestas "No sé": se presenta como algo a verificar. */
  needsVerification: boolean;
}

type RecTemplate = Omit<Recommendation, 'needsVerification'> & { triggers: Question['id'][] };

const area = (d: DimensionId) => DIMENSIONS[d].label;

/** Reglas en orden de prioridad: fundamentos → confianza → descubrimiento → conversión. */
const RULES: RecTemplate[] = [
  {
    id: 'sitio-propio', triggers: ['q4'], area: area('web'),
    title: 'Ten un sitio web propio, sencillo y bajo tu control',
    why: 'Es la fuente de información sobre tu clínica que tú controlas: servicios, especialistas, ubicación y forma de contacto. Google y los asistentes de IA se apoyan en fuentes públicas como esta.',
    firstAction: 'Define una página inicial con especialidades, profesionales, dirección, horarios y un botón claro para agendar o escribir por WhatsApp.',
  },
  {
    id: 'perfil-empresa', triggers: ['q1'], area: area('maps'),
    title: 'Verifica y administra tu Perfil de Empresa en Google',
    why: 'Es lo primero que muchas personas ven al buscar una clínica cerca. Sin acceso, no puedes corregir datos, responder reseñas ni actualizar horarios.',
    firstAction: 'Busca tu clínica en Google Maps y reclama o recupera el acceso a la ficha con una cuenta de la clínica.',
  },
  {
    id: 'info-local', triggers: ['q2'], area: area('maps'),
    title: 'Corrige y completa tu información local',
    why: 'Datos incompletos o desactualizados (horarios, teléfono, dirección) hacen que los pacientes duden o lleguen a información equivocada.',
    firstAction: 'Revisa horario, teléfono, dirección, categoría, servicios y fotos en tu ficha de Google y actualiza lo que no coincida con la realidad.',
  },
  {
    id: 'proceso-resenas', triggers: ['q7', 'q8'], area: area('reviews'),
    title: 'Crea un proceso ético para pedir reseñas',
    why: 'Las reseñas auténticas y recientes ayudan a que un paciente nuevo confíe en tu clínica. Pedirlas de forma constante, sin ofrecer incentivos, evita depender de la suerte.',
    firstAction: 'Prepara un enlace directo a tus reseñas de Google y define en qué momento de la atención se comparte, sin ofrecer descuentos ni regalos a cambio.',
  },
  {
    id: 'redes-contenido', triggers: ['q16'], area: area('reviews'),
    title: 'Crea contenido con una estrategia, no solo publicaciones',
    why: 'Las redes son donde muchos pacientes confirman si confían en tu clínica. Publicar sin objetivos ni constancia rara vez genera citas.',
    firstAction: 'Define 3 temas que resuelvan dudas reales de tus pacientes y un calendario simple (por ejemplo, 2 publicaciones por semana) con un llamado a agendar.',
  },
  {
    id: 'info-servicios', triggers: ['q5'], area: area('web'),
    title: 'Explica con claridad tus servicios y especialistas',
    why: 'Los pacientes eligen cuando entienden qué atiendes, quién los atiende y dónde. Esa misma claridad ayuda a buscadores y asistentes a describir tu clínica correctamente.',
    firstAction: 'Escribe una sección por especialidad o servicio principal y una ficha por profesional con su formación y cédula.',
  },
  {
    id: 'consistencia', triggers: ['q10', 'q12'], area: area('ai'),
    title: 'Haz consistente y verificable la información pública',
    why: 'Cuando el nombre, la dirección, los servicios o los horarios no coinciden entre tu web, Google y directorios, buscadores y asistentes de IA pueden mostrar datos contradictorios.',
    firstAction: 'Haz una lista de dónde aparece tu clínica (web, Google, directorios, redes) y unifica nombre, dirección, teléfono, horarios y servicios.',
  },
  {
    id: 'prueba-ia', triggers: ['q11'], area: area('ai'),
    title: 'Revisa qué dicen los asistentes de IA sobre tu clínica',
    why: 'Las respuestas de ChatGPT, Gemini u otros asistentes cambian según la pregunta y el momento. Revisarlas sirve para detectar información incorrecta, no como un posicionamiento estable.',
    firstAction: 'Haz 5 preguntas distintas (por ejemplo, "mejor clínica de [especialidad] en [ciudad]") en dos asistentes, anota qué fuentes citan y corrige la información equivocada en esas fuentes.',
  },
  {
    id: 'contacto-seguimiento', triggers: ['q13', 'q14', 'q15'], area: area('contact'),
    title: 'Facilita el contacto y da seguimiento a cada consulta',
    why: 'Una consulta que tarda en responderse o no recibe seguimiento suele terminar en otra clínica, aunque te hayan encontrado primero.',
    firstAction: 'Define quién responde las consultas digitales, una meta de tiempo de respuesta y un recordatorio para dar seguimiento a quien no agendó.',
  },
];

/** Recomendación de mejora continua por dimensión, cuando no hay respuestas en 0. */
const OPTIMIZE: Record<DimensionId, Omit<RecTemplate, 'triggers'>> = {
  maps: {
    id: 'optimizar-maps', area: area('maps'), title: 'Mantén tu ficha de Google al día',
    why: 'Tu ficha ya tiene una buena base; mantenerla actualizada evita que la información envejezca.',
    firstAction: 'Agenda una revisión mensual de horarios, fotos, servicios y publicaciones de tu ficha.',
  },
  web: {
    id: 'optimizar-web', area: area('web'), title: 'Mide cómo usan tu sitio los pacientes',
    why: 'Con una base sólida, el siguiente paso es saber qué páginas llevan a contactos reales.',
    firstAction: 'Configura la medición de clics a WhatsApp, llamadas y formularios para identificar qué páginas generan citas.',
  },
  reviews: {
    id: 'optimizar-resenas', area: area('reviews'), title: 'Usa tus reseñas para mejorar la atención',
    why: 'Las reseñas también muestran qué valoran tus pacientes y qué les molesta.',
    firstAction: 'Revisa una vez al mes los temas que se repiten en tus reseñas y comparte los hallazgos con tu equipo.',
  },
  ai: {
    id: 'optimizar-ia', area: area('ai'), title: 'Revisa periódicamente tu información pública',
    why: 'Directorios, buscadores y asistentes cambian con el tiempo; una revisión periódica detecta errores antes que tus pacientes.',
    firstAction: 'Repite cada trimestre una revisión de cómo aparece tu clínica en buscadores, directorios y asistentes de IA.',
  },
  contact: {
    id: 'optimizar-contacto', area: area('contact'), title: 'Mide tu tiempo de respuesta y tus citas',
    why: 'Medir cuántas consultas se convierten en cita permite mejorar con datos, no con intuición.',
    firstAction: 'Registra cada semana cuántas consultas llegan, cuántas se responden a tiempo y cuántas terminan en cita.',
  },
};

export interface RecommendationContext {
  /** El visitante indicó explícitamente que no tiene sitio web. */
  noWebsite?: boolean;
}

/** Tres recomendaciones basadas en las respuestas (spec §6). */
export function recommend(raw: Answers, result: DiagnosticResult = computeResult(raw), ctx: RecommendationContext = {}, limit = 3): Recommendation[] {
  const answers = effectiveAnswers(raw);
  const skipped = new Set(QUESTIONS.filter((q) => isSkipped(q, raw)).map((q) => q.id));
  // Sin web: las mejoras del sitio no aplican; va primero «tener sitio propio».
  if (raw.q4 === 'no') ctx = { ...ctx, noWebsite: true };
  const zero = (q: Question['id']) => !skipped.has(q) && pointsFor(q, answers[q]).points === 0;
  const isUnknown = (q: Question['id']) => pointsFor(q, answers[q]).unknown;

  const picked: Recommendation[] = [];
  const add = (t: Omit<RecTemplate, 'triggers'>, needsVerification: boolean) => {
    if (picked.length < limit && !picked.some((p) => p.id === t.id)) picked.push({ ...t, needsVerification });
  };

  // Sin web declarada → el sitio propio va primero, antes de cualquier técnica avanzada.
  if (ctx.noWebsite) add(RULES[0], false);

  for (const rule of RULES) {
    const fired = rule.triggers.filter(zero);
    if (fired.length) add(rule, fired.every(isUnknown));
  }

  // Sin suficientes déficits en 0: priorizar dimensiones con menor puntuación.
  if (picked.length < limit) {
    const sorted = [...result.dimensions].sort(
      (a, b) => a.score - b.score || DIMENSION_ORDER.indexOf(a.id) - DIMENSION_ORDER.indexOf(b.id),
    );
    // Sin sitio web no tiene sentido «medir cómo usan tu sitio».
    for (const d of sorted) if (!(ctx.noWebsite && d.id === 'web')) add(OPTIMIZE[d.id], false);
  }
  return picked;
}

/* ------------------------------------------------------------------ Calificación comercial (spec §8) */

export interface QualificationInput {
  role?: string;
  priority?: string;
  start?: string;
  authorizer?: string;
  investment?: string;
}

export interface LeadDataSignals {
  hasWebsite?: boolean;
  noWebsite?: boolean;
  hasGoogleBusiness?: boolean;
  hasSocial?: boolean;
  hasCity?: boolean;
}

const ROLE: Record<string, number> = { propietario: 15, direccion: 12, medico: 8, marketing: 6, otro: 3 };
const AUTH: Record<string, number> = { yo: 10, socios: 6, otro: 3, 'no-definido': 0 };
const START: Record<string, number> = { 'este-mes': 20, '1-3-meses': 14, 'mas-adelante': 6, 'no-se': 3 };
const INVEST: Record<string, number> = { asignado: 20, evaluando: 12, cotizacion: 10, 'no-por-ahora': 0 };

/**
 * lead_score 0–100 = decisión 25 + necesidad 25 + horizonte 20 + disposición 20 + datos 10.
 * Heurística revisable, no probabilidad de venta. Uso interno: nunca se muestra al visitante.
 */
export function leadScore(q: QualificationInput, digitalScore: number, data: LeadDataSignals): { score: number; segment: 'A' | 'B' | 'C'; breakdown: Record<string, number> } {
  const decision = (ROLE[q.role ?? ''] ?? 0) + (AUTH[q.authorizer ?? ''] ?? 0);
  const priorityPts = q.priority && q.priority !== 'explorando' ? 10 : 0;
  const need = priorityPts + Math.round(((100 - Math.max(0, Math.min(100, digitalScore))) / 100) * 15);
  const horizon = START[q.start ?? ''] ?? 0;
  const disposition = INVEST[q.investment ?? ''] ?? 0;
  const dataPts = Math.min(
    10,
    (data.hasWebsite || data.noWebsite ? 2 : 0) + (data.hasGoogleBusiness ? 4 : 0) + (data.hasSocial ? 2 : 0) + (data.hasCity ? 2 : 0),
  );
  const score = Math.max(0, Math.min(100, decision + need + horizon + disposition + dataPts));
  const segment = score >= 75 ? 'A' : score >= 50 ? 'B' : 'C';
  return { score, segment, breakdown: { decision, need, horizon, disposition, data: dataPts } };
}
