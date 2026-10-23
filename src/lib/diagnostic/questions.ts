/**
 * Diagnóstico de Visibilidad Digital para Clínicas — preguntas y opciones (spec §5).
 * Datos separados de la UI: editar textos aquí no requiere tocar componentes.
 * Cada opción vale 0, 2 o 4 puntos. `unknown: true` = "No sé" (cuenta 0 y se marca para verificar).
 */

export type DimensionId = 'maps' | 'web' | 'reviews' | 'social' | 'ai' | 'contact';
export type Points = 0 | 2 | 4;

export interface Option {
  id: string;
  label: string;
  points: Points;
  unknown?: boolean;
}

export interface Question {
  id: `q${number}`;
  dimension: DimensionId;
  text: string;
  hint?: string;
  options: Option[];
  /** Se omite (y cuenta como su opción en 0) si otra pregunta tiene esa respuesta. Ej.: sin sitio web no se pregunta por el sitio. */
  skipIf?: { question: `q${number}`; answer: string };
}

export const DIMENSIONS: Record<DimensionId, { label: string; short: string }> = {
  maps: { label: 'Google Maps', short: 'Google Maps' },
  web: { label: 'Sitio web', short: 'Sitio web' },
  reviews: { label: 'Reseñas y reputación', short: 'Reseñas' },
  social: { label: 'Redes sociales y anuncios', short: 'Redes y anuncios' },
  ai: { label: 'Información pública para buscadores e IA', short: 'Información e IA' },
  contact: { label: 'Atención y seguimiento', short: 'Atención' },
};

/** Orden de desempate: fundamentos primero. */
export const DIMENSION_ORDER: DimensionId[] = ['maps', 'web', 'reviews', 'social', 'ai', 'contact'];

const NO_SE: Option = { id: 'no-se', label: 'No sé', points: 0, unknown: true };

export const QUESTIONS: Question[] = [
  // — Google Maps
  {
    id: 'q1', dimension: 'maps',
    text: '¿Tu clínica tiene una ficha de Google Maps que administras?',
    options: [
      { id: 'completa', label: 'Sí, completa y verificada', points: 4 },
      { id: 'incompleta', label: 'Existe, pero está incompleta', points: 2 },
      { id: 'sin-acceso', label: 'Existe, pero no tengo acceso', points: 0 },
      { id: 'no-existe', label: 'No tenemos ficha en Google Maps', points: 0 },
      NO_SE,
    ],
  },
  {
    id: 'q2', dimension: 'maps', skipIf: { question: 'q1', answer: 'no-existe' },
    text: '¿La información de tu clínica en Google Maps está completa y actualizada?',
    hint: 'Horarios, teléfono, dirección, servicios, fotos.',
    options: [
      { id: 'completa', label: 'Sí, completa y actualizada', points: 4 },
      { id: 'parcial', label: 'Parcialmente', points: 2 },
      { id: 'faltan', label: 'Faltan datos o hay datos viejos', points: 0 },
      NO_SE,
    ],
  },
  {
    id: 'q3', dimension: 'maps', skipIf: { question: 'q1', answer: 'no-existe' },
    text: '¿Has revisado cómo apareces al buscar tu especialidad en tu ciudad?',
    options: [
      { id: 'periodico', label: 'Sí, periódicamente', points: 4 },
      { id: 'alguna-vez', label: 'Alguna vez', points: 2 },
      { id: 'nunca', label: 'Nunca', points: 0 },
      NO_SE,
    ],
  },
  // — Sitio web
  {
    id: 'q4', dimension: 'web',
    text: '¿Tu clínica tiene sitio web propio?',
    options: [
      { id: 'propio', label: 'Sí, propio y lo controlamos', points: 4 },
      { id: 'tercero', label: 'Una página en una plataforma o de un tercero', points: 2 },
      { id: 'no', label: 'No tenemos sitio web', points: 0 },
      NO_SE,
    ],
  },
  {
    id: 'q5', dimension: 'web', skipIf: { question: 'q4', answer: 'no' },
    text: '¿Tu sitio explica claramente especialidades, servicios, ubicación y profesionales?',
    options: [
      { id: 'si', label: 'Sí, todo está claro', points: 4 },
      { id: 'parcial', label: 'Parcialmente', points: 2 },
      { id: 'no', label: 'No', points: 0 },
      NO_SE,
    ],
  },
  {
    id: 'q6', dimension: 'web', skipIf: { question: 'q4', answer: 'no' },
    text: '¿Funciona bien en celular y permite contactar fácilmente?',
    options: [
      { id: 'comprobado', label: 'Sí, lo hemos comprobado', points: 4 },
      { id: 'mejoras', label: 'Funciona, pero necesita mejoras', points: 2 },
      { id: 'no', label: 'No', points: 0 },
      NO_SE,
    ],
  },
  // — Reseñas y reputación
  {
    id: 'q7', dimension: 'reviews',
    text: '¿Tu clínica recibe reseñas auténticas en Google?',
    options: [
      { id: 'constante', label: 'Sí, constantemente', points: 4 },
      { id: 'ocasional', label: 'Ocasionalmente', points: 2 },
      { id: 'casi-nunca', label: 'Casi nunca', points: 0 },
      NO_SE,
    ],
  },
  {
    id: 'q8', dimension: 'reviews',
    text: '¿Tienen un proceso para solicitar reseñas, sin incentivos indebidos?',
    options: [
      { id: 'si', label: 'Sí, un proceso definido', points: 4 },
      { id: 'informal', label: 'De manera informal', points: 2 },
      { id: 'no', label: 'No', points: 0 },
      NO_SE,
    ],
  },
  {
    id: 'q9', dimension: 'reviews',
    text: '¿Revisan y responden las reseñas de forma apropiada?',
    options: [
      { id: 'frecuente', label: 'Sí, frecuentemente', points: 4 },
      { id: 'a-veces', label: 'A veces', points: 2 },
      { id: 'no', label: 'No', points: 0 },
      NO_SE,
    ],
  },
  {
    id: 'q16', dimension: 'social',
    text: '¿Tu clínica tiene redes sociales activas y crea contenido con una estrategia?',
    hint: 'Por ejemplo: calendario de publicaciones, temas definidos, objetivos claros.',
    options: [
      { id: 'estrategia', label: 'Sí, publicamos con estrategia y constancia', points: 4 },
      { id: 'sin-estrategia', label: 'Tenemos redes, pero publicamos sin estrategia', points: 2 },
      { id: 'no', label: 'No tenemos redes o casi no publicamos', points: 0 },
      NO_SE,
    ],
  },
  {
    id: 'q17', dimension: 'social',
    text: '¿Hacen anuncios pagados (Meta, Google u otros) para atraer pacientes?',
    options: [
      { id: 'medidos', label: 'Sí, y medimos cuántos pacientes llegan', points: 4 },
      { id: 'sin-medir', label: 'Sí, pero sin medir resultados o solo a veces', points: 2 },
      { id: 'no', label: 'No hacemos anuncios', points: 0 },
      NO_SE,
    ],
  },
  // — Información pública e IA
  {
    id: 'q10', dimension: 'ai',
    text: '¿Existe información pública clara y actualizada sobre tus servicios, especialistas y ubicación?',
    options: [
      { id: 'si', label: 'Sí', points: 4 },
      { id: 'parcial', label: 'Parcialmente', points: 2 },
      { id: 'no', label: 'No', points: 0 },
      NO_SE,
    ],
  },
  {
    id: 'q11', dimension: 'ai',
    text: '¿Has comprobado qué información dan los asistentes de IA (como ChatGPT o Gemini) sobre tu clínica?',
    options: [
      { id: 'varias', label: 'Sí, con varias pruebas', points: 4 },
      { id: 'superficial', label: 'Una prueba superficial', points: 2 },
      { id: 'no', label: 'No', points: 0 },
      NO_SE,
    ],
  },
  {
    id: 'q12', dimension: 'ai',
    text: '¿La información es coherente entre tu web, Google y los directorios?',
    hint: 'Nombre, dirección, teléfono, horarios y servicios.',
    options: [
      { id: 'si', label: 'Sí', points: 4 },
      { id: 'parcial', label: 'Parcialmente', points: 2 },
      { id: 'no', label: 'No', points: 0 },
      NO_SE,
    ],
  },
  // — Atención y seguimiento
  {
    id: 'q14', dimension: 'contact',
    text: '¿Cuánto tardan normalmente en responder los mensajes que reciben?',
    options: [
      { id: 'menos-15', label: 'Menos de 15 minutos', points: 4 },
      { id: 'mismo-dia', label: 'El mismo día', points: 2 },
      { id: 'mas', label: 'Más de un día', points: 0 },
      { id: 'no-se-mide', label: 'No lo medimos / no sé', points: 0, unknown: true },
    ],
  },
  {
    id: 'q15', dimension: 'contact',
    text: '¿Tienen un proceso de seguimiento para las consultas que no se convierten en cita?',
    options: [
      { id: 'definido', label: 'Sí, definido y medible', points: 4 },
      { id: 'manual', label: 'Manual o parcial', points: 2 },
      { id: 'no', label: 'No', points: 0 },
      NO_SE,
    ],
  },
];

export type Answers = Partial<Record<Question['id'], string>>;

/** true si la pregunta se omite por otra respuesta (p. ej. sin sitio web no se pregunta por el sitio). */
export function isSkipped(q: Question, answers: Answers): boolean {
  return Boolean(q.skipIf && answers[q.skipIf.question] === q.skipIf.answer);
}

/** Respuestas efectivas: las preguntas omitidas cuentan como su opción en 0 (no como "No sé"). */
export function effectiveAnswers(answers: Answers): Answers {
  const out: Answers = { ...answers };
  for (const q of QUESTIONS) {
    if (isSkipped(q, answers)) out[q.id] = q.options.find((o) => o.points === 0 && !o.unknown)!.id;
  }
  return out;
}

export const SPECIALTIES = {
  odontologia: 'Odontología',
  'medicina-general': 'Medicina general',
  dermatologia: 'Dermatología',
  oftalmologia: 'Oftalmología / Óptica',
  estetica: 'Estética',
  psicologia: 'Psicología',
  otra: 'Otra',
} as const;

/** Calificación comercial interna (spec §8). No se muestra al visitante como puntuación. */
export const QUALIFICATION = {
  role: {
    label: '¿Cuál es tu rol en la clínica?',
    options: { propietario: 'Propietario o socio', direccion: 'Dirección o administración', medico: 'Médico o especialista', marketing: 'Marketing', otro: 'Otro' },
  },
  priority: {
    label: '¿Qué te gustaría mejorar primero?',
    options: { 'google-ia': 'Presencia en Google e IA', web: 'Sitio web', resenas: 'Reseñas', contenido: 'Contenido', citas: 'Citas y seguimiento', marca: 'Marca', explorando: 'Solo estoy explorando' },
  },
  start: {
    label: '¿Cuándo te gustaría comenzar?',
    options: { 'este-mes': 'Este mes', '1-3-meses': 'En 1 a 3 meses', 'mas-adelante': 'Más adelante', 'no-se': 'Aún no lo sé' },
  },
  authorizer: {
    label: '¿Quién autoriza la inversión?',
    options: { yo: 'Yo', socios: 'Mis socios o un comité', otro: 'Otra persona', 'no-definido': 'Aún no está definido' },
  },
  investment: {
    label: '¿Cómo está la decisión de inversión?',
    options: { asignado: 'Ya hay presupuesto asignado', evaluando: 'Lo estamos evaluando', cotizacion: 'Necesito una cotización para decidir', 'no-por-ahora': 'No por ahora' },
  },
} as const;

export type QualificationKey = keyof typeof QUALIFICATION;
