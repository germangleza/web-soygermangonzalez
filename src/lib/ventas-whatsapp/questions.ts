/**
 * Lead magnet «¿Cuántas ventas se te escapan entre WhatsApp y el seguimiento?» — preguntas y opciones.
 * 12 preguntas en 4 áreas de 3. Sí = 2 · Parcial = 1 · No = 0 · No sé = 0 (pendiente de verificar).
 * Se ejecuta con Life Agents AI (IA y automatización). No estima ventas perdidas en pesos: no inventar tasas.
 */
import { BASE_OPTIONS, type Option } from '../checklist-ia/questions';

export { BUSINESS_TYPES } from '../checklist-ia/questions';
export type { Option };

export type BlockId = 'respuesta' | 'seguimiento' | 'registro' | 'operacion';

export interface Question {
  id: `q${number}`;
  block: BlockId;
  text: string;
  hint: string;
}

export const BLOCKS: Record<BlockId, { label: string; short: string }> = {
  respuesta: { label: 'Respuesta', short: 'Respuesta' },
  seguimiento: { label: 'Seguimiento', short: 'Seguimiento' },
  registro: { label: 'Registro y medición', short: 'Registro' },
  operacion: { label: 'Operación diaria', short: 'Operación' },
};

export const BLOCK_ORDER: BlockId[] = ['respuesta', 'seguimiento', 'registro', 'operacion'];

export const OPTIONS: Option[] = BASE_OPTIONS;

export const QUESTIONS: Question[] = [
  { id: 'q1', block: 'respuesta', text: 'En horario laboral, ¿contestas los mensajes nuevos de WhatsApp en menos de 15 minutos?', hint: 'Piensa en un día normal, no en el mejor. Cuenta desde que llega el mensaje hasta la primera respuesta útil.' },
  { id: 'q2', block: 'respuesta', text: '¿Los mensajes que llegan de noche o en fin de semana reciben una respuesta útil?', hint: 'Útil = resuelve la duda o pide los datos para cotizar. «En breve te atendemos» no cuenta.' },
  { id: 'q3', block: 'respuesta', text: '¿Está claro quién contesta cada conversación, sin depender de quién vea el celular?', hint: 'Una persona responsable, turnos o una bandeja compartida donde se asignan las conversaciones.' },
  { id: 'q4', block: 'seguimiento', text: '¿Le das seguimiento en menos de 48 horas a quien pidió precio o cotización y no contestó?', hint: 'Un segundo mensaje con intención, no esperar a que el cliente vuelva solo.' },
  { id: 'q5', block: 'seguimiento', text: '¿Tienes una forma de retomar a quien dejó de contestar sin depender de la memoria de alguien?', hint: 'Recordatorios, etiquetas, listas o mensajes programados.' },
  { id: 'q6', block: 'seguimiento', text: '¿Las confirmaciones de citas, entregas o pagos salen solas, sin escribirlas a mano una por una?', hint: 'Recordatorios automáticos o plantillas que se envían a tiempo.' },
  { id: 'q7', block: 'registro', text: '¿Cada consulta queda registrada fuera del chat, con nombre, qué pidió y en qué etapa va?', hint: 'En un CRM, una hoja compartida o un sistema; no solo en el historial de WhatsApp.' },
  { id: 'q8', block: 'registro', text: '¿Sabes cuántas consultas te llegaron el mes pasado y cuántas terminaron en venta?', hint: 'Un número que puedas encontrar en menos de 10 minutos.' },
  { id: 'q9', block: 'registro', text: '¿Sabes de dónde llegó cada cliente: anuncios, redes, Google o recomendación?', hint: 'Que se pregunte o se registre en cada conversación nueva.' },
  { id: 'q10', block: 'operacion', text: '¿Las preguntas de siempre (precios, horarios, ubicación, disponibilidad) se contestan con información lista?', hint: 'Respuestas rápidas, catálogo o una base de información, sin redactar cada vez.' },
  { id: 'q11', block: 'operacion', text: '¿Envías una cotización o propuesta el mismo día en que te la piden?', hint: 'Con plantillas, lista de precios o un cotizador, no armándola desde cero.' },
  { id: 'q12', block: 'operacion', text: 'Si mañana falta quien atiende WhatsApp, ¿el historial y los pendientes se quedan en el negocio?', hint: 'Que las conversaciones no vivan en un celular personal.' },
];

export type Answers = Partial<Record<Question['id'], Option['id']>>;

/** Volumen semanal de mensajes o consultas (contexto del checklist y del formulario de agenda). */
export const VOLUMES = {
  'menos-20': 'Menos de 20 a la semana',
  '20-50': 'De 20 a 50 a la semana',
  '50-150': 'De 50 a 150 a la semana',
  'mas-150': 'Más de 150 a la semana',
  'no-se': 'No lo sé',
} as const;

/** Qué le gustaría resolver primero (formulario de agenda). */
export const FOCUS = {
  responder: 'Responder más rápido',
  seguimiento: 'Dar seguimiento',
  cotizar: 'Cotizar o agendar',
  ordenar: 'Ordenar a mis clientes',
} as const;
