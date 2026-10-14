/**
 * Lead magnet «¿La IA recomienda tu negocio?» v2.0 — preguntas y opciones.
 * Sí = 2 · Parcial = 1 · No = 0 · No sé = 0 (pendiente de verificar) · No aplica = excluida (solo Q3 y Q4).
 */

export type BlockId = 'web' | 'maps' | 'trust' | 'discovery' | 'conversion';

export interface Option {
  id: 'si' | 'parcial' | 'no' | 'no-se' | 'na';
  label: string;
  points: 0 | 1 | 2 | null; // null = No aplica (fuera del denominador)
  unverified?: boolean;
}

export interface Question {
  id: `q${number}`;
  block: BlockId;
  text: string;
  hint: string;
  allowNA?: boolean;
}

export const BLOCKS: Record<BlockId, { label: string; short: string }> = {
  web: { label: 'Web e información propia', short: 'Web' },
  maps: { label: 'Google Maps y visibilidad local', short: 'Google Maps' },
  trust: { label: 'Reputación y contenido confiable', short: 'Reputación' },
  discovery: { label: 'Descubrimiento en buscadores e IA', short: 'Buscadores e IA' },
  conversion: { label: 'Conversión y mejora', short: 'Conversión' },
};

export const BLOCK_ORDER: BlockId[] = ['web', 'maps', 'trust', 'discovery', 'conversion'];

export const BASE_OPTIONS: Option[] = [
  { id: 'si', label: 'Sí', points: 2 },
  { id: 'parcial', label: 'Parcial', points: 1 },
  { id: 'no', label: 'No', points: 0 },
  { id: 'no-se', label: 'No sé', points: 0, unverified: true },
];
export const NA_OPTION: Option = { id: 'na', label: 'No aplica: mi negocio es 100% en línea, sin atención local', points: null };

export const QUESTIONS: Question[] = [
  { id: 'q1', block: 'web', text: '¿Tu negocio tiene un sitio web propio, público y fácil de usar desde celular?', hint: 'Dominio propio, páginas accesibles y buena experiencia en móvil.' },
  { id: 'q2', block: 'web', text: '¿Tu web explica claramente qué vendes, a quién atiendes y cómo contactarte?', hint: 'Productos o servicios, ubicación si aplica y formas de contacto.' },
  { id: 'q3', block: 'maps', allowNA: true, text: 'Si recibes clientes en una ubicación o área de servicio, ¿administras tu Perfil de Empresa en Google (ficha de Maps)?', hint: 'Que exista, que tengas acceso y que esté verificada cuando aplique. Si atiendes en un local o un área de servicio, responde aunque aún no tengas ficha.' },
  { id: 'q4', block: 'maps', allowNA: true, text: '¿Tu ficha de Google Maps tiene datos completos y consistentes con tu web?', hint: 'Categoría, horarios, dirección o área de servicio, teléfono, fotos y enlaces, según aplique.' },
  { id: 'q5', block: 'trust', text: '¿Tienes reseñas, testimonios o evidencia auténtica de tu experiencia?', hint: 'Reseñas reales, trabajos, casos o acreditaciones, según tu industria.' },
  { id: 'q6', block: 'trust', text: '¿Tu sitio responde las preguntas que tus clientes hacen antes de comprarte?', hint: 'Servicios, procesos, dudas frecuentes y contenido útil actualizado.' },
  { id: 'q7', block: 'discovery', text: '¿Has comprobado que Google puede encontrar e indexar tus páginas importantes?', hint: 'Por ejemplo, con Google Search Console u otra comprobación técnica.' },
  { id: 'q8', block: 'discovery', text: '¿Has probado consultas reales en ChatGPT, Gemini o Perplexity y verificado si la información que muestran es correcta?', hint: 'Varias consultas, en distintas fechas, revisando las fuentes. Las respuestas cambian: no asumas que son consistentes.' },
  { id: 'q9', block: 'conversion', text: '¿Una persona puede contactar, cotizar, reservar o comprar fácilmente desde tu web o Google Maps?', hint: 'Enlaces, botones y medios de contacto que funcionan.' },
  { id: 'q10', block: 'conversion', text: '¿Revisas periódicamente resultados y actualizas tus perfiles, web y contenidos?', hint: 'Métricas básicas, cambios y corrección de errores.' },
];

export function optionsFor(q: Question): Option[] {
  return q.allowNA ? [...BASE_OPTIONS, NA_OPTION] : BASE_OPTIONS;
}

export type Answers = Partial<Record<Question['id'], Option['id']>>;

export const BUSINESS_TYPES = {
  salud: 'Salud (clínica, consultorio, especialista)',
  'servicios-profesionales': 'Servicios profesionales',
  retail: 'Retail / e-commerce',
  restaurantes: 'Restaurantes / hospitalidad',
  inmobiliario: 'Inmobiliario',
  otros: 'Otro',
} as const;

/** Calificación comercial (opcional, tras el resultado). commercial_fit_score es distinto del puntaje digital. */
export const COMMERCIAL = {
  objective: {
    label: '¿Cuál es tu principal objetivo?',
    options: { visibilidad: 'Visibilidad', web: 'Sitio web', reputacion: 'Reputación', contenidos: 'Contenidos', leads: 'Más prospectos (leads)', conversiones: 'Más conversiones', automatizacion: 'Automatización', explorar: 'Solo explorar' },
  },
  role: {
    label: '¿Cuál es tu función?',
    options: { dueno: 'Dueño o socio', director: 'Director', marketing: 'Marketing', colaborador: 'Colaborador', otro: 'Otro' },
  },
  start: {
    label: '¿Cuándo deseas comenzar?',
    options: { 'este-mes': 'Este mes', '1-3-meses': 'En 1 a 3 meses', despues: 'Después', explorando: 'Solo estoy explorando' },
  },
  budget: {
    label: '¿Hay presupuesto para mejorarlo?',
    options: { si: 'Sí', evaluando: 'Lo estamos evaluando', propuesta: 'Necesito una propuesta', 'no-por-ahora': 'No por ahora' },
  },
} as const;

/** Fuentes oficiales de los criterios técnicos (consultadas en octubre de 2026). */
export const SOURCES = [
  { label: 'OpenAI — Publishers and Developers FAQ', url: 'https://help.openai.com/en/articles/12627856' },
  { label: 'OpenAI — Overview of OpenAI Crawlers', url: 'https://developers.openai.com/api/docs/bots' },
  { label: 'Google Search Central — AI features and your website', url: 'https://developers.google.com/search/docs/appearance/ai-features' },
];
export const SOURCES_CHECKED = 'octubre de 2026';
