/**
 * Landing «Agenda una llamada» (/llamada): destino del link en bio, los DMs y los botones del sitio.
 * El calendario sale de SITE.bookingUrl. No prometer resultados ni inventar casos.
 */

export const CALL_PATH = '/llamada';

export const CALL_FOR = [
  'Tienes un negocio en marcha y quieres vender más: más clientes, mejores campañas o una web que convierta.',
  'Llegan consultas, pero sientes que se pierden entre la respuesta, el seguimiento y la cotización.',
  'Quieres usar IA o automatizar procesos y no sabes por dónde empezar.',
  'Estás por lanzar un negocio, producto o nueva línea y quieres aterrizarlo.',
];

export const CALL_NOT_FOR = [
  'Buscas asesoría financiera o de inversión.',
  'Solo necesitas una pieza suelta al menor precio, sin estrategia detrás.',
  'Quieres resultados garantizados sin revisar cómo funciona hoy tu negocio.',
];

export const CALL_STEPS = [
  { title: 'Me cuentas tu negocio', text: 'Qué vendes, a quién, cómo llegan hoy tus clientes y qué te preocupa.' },
  { title: 'Detectamos dónde está la oportunidad', text: 'Revisamos juntos dónde se están perdiendo ventas o qué conviene construir.' },
  { title: 'Te llevas acciones concretas', text: 'Sales con 2 o 3 prioridades claras, trabajemos juntos o no.' },
];

export const CALL_PREP = [
  { q: '¿A qué se dedica tu negocio?', hint: 'Giro, ciudad y a quién le vendes.' },
  { q: '¿Qué quieres resolver o lograr?', hint: 'Más clientes, responder más rápido, lanzar algo nuevo…' },
  { q: '¿Cómo consigues clientes hoy?', hint: 'Recomendaciones, redes, Ads, Google Maps, ventas directas.' },
];

export const CALL_FAQS = [
  {
    question: '¿La llamada tiene costo?',
    answer: 'No. Es una sesión sin costo para entender tu negocio y ver si hay una oportunidad clara de crecimiento.',
  },
  {
    question: '¿Es una llamada de ventas?',
    answer: 'Es una conversación para entender tu reto. Si tiene sentido trabajar juntos, te propongo cómo; si no, te llevas las prioridades que detectamos.',
  },
  {
    question: '¿Qué pasa después de la llamada?',
    answer: 'Si hay fit, te comparto una propuesta para un primer sprint de 2 a 4 semanas con acciones y entregables definidos. Muchos clientes después pasan a un esquema mensual.',
  },
  {
    question: '¿Trabajas con negocios fuera de mi ciudad?',
    answer: 'Sí. Trabajo con negocios en cualquier parte de México.',
  },
  {
    question: '¿Quién ejecuta el trabajo?',
    answer: 'Yo dirijo la estrategia. La ejecución la hacen equipos especializados: Maguey Studio en marketing y growth, y Life Agents AI en IA y automatización.',
  },
];
