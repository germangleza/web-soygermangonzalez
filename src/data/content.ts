/**
 * Copy estructurado del Blueprint V3. Editar aquí cambia todas las secciones que lo usan.
 * Mantener los textos aprobados; cualquier cambio de copy debe validarse con Germán.
 */
import detect from '../assets/method/detect.png';
import design from '../assets/method/design.png';
import activate from '../assets/method/activate.png';
import build from '../assets/method/build.png';

/** H04 — Mi método: método + modelo de trabajo en un solo flujo (sesión → plan → sprint → mensual). */
export const METHOD = [
  { num: '01', key: 'DETECTAR', tag: 'Sesión de oportunidades', text: 'Sin costo. Conozco tu negocio: en qué estás, qué te preocupa y dónde estás atorado.', image: detect, alt: 'Lupa sobre una roca: detectar la oportunidad' },
  { num: '02', key: 'DISEÑAR', tag: 'Plan y propuesta', text: 'Priorizamos las acciones que más pueden mover tus ventas y definimos el sprint: entregables, tiempos y forma de trabajo.', image: design, alt: 'Plano arquitectónico de una casa: diseñar el plan' },
  { num: '03', key: 'CONSTRUIR', tag: 'Sprint de 2 a 4 semanas', text: 'Activo al equipo correcto. Construimos, medimos y ajustamos.', image: activate, alt: 'Bloques de distintos materiales ensamblándose: construir' },
  { num: '04', key: 'CRECER', tag: 'Cada mes', text: 'Definimos prioridades, ejecutamos y medimos, para que el crecimiento no dependa de un proyecto aislado.', image: build, alt: 'Casa terminada e iluminada: crecer' },
];

/** Home — Con quién lo construyes (estrategia + empresas de ejecución). */
export const HOME_TEAM = [
  { name: 'Germán González', area: 'Estrategia y crecimiento comercial', items: ['Diagnóstico y prioridades', 'Sistemas comerciales: ventas, seguimiento y pricing', 'Nuevas líneas, canales y alianzas'] },
  { name: 'Maguey Studio', url: 'https://www.magueystudio.mx', area: 'Marketing y growth', items: ['Posicionamiento y contenido', 'Campañas y adquisición de clientes', 'Sitios web que convierten'] },
  { name: 'Life Agents AI', url: 'https://lifeagent.mx', area: 'IA y automatización', items: ['Agentes de IA en WhatsApp', 'Integración con CRM', 'Automatización de procesos'] },
];

/** BL04 — Colecciones de recursos. */
export const RESOURCE_COLLECTIONS = {
  'ai-toolkit': { title: 'AI Toolkit', text: 'Herramientas de IA que uso y para qué sirven.' },
  'prompts-workflows': { title: 'Prompts y workflows', text: 'Prompts y flujos de trabajo listos para adaptar.' },
  'business-building-templates': { title: 'Business Building Templates', text: 'Plantillas y frameworks para aterrizar oportunidades.' },
} as const;

/** BL05 — Formación. Estados según Blueprint: no prometer fechas. */
export const TRAINING = [
  { name: 'AI Tools Lab', status: 'Propuesto · fechas por anunciar', text: 'Sesión práctica de herramientas de IA.' },
  { name: 'AI Builder Bootcamp', status: 'En desarrollo', text: 'Programa para pasar de una necesidad a un prototipo o automatización.' },
  { name: 'Business Building Workshop', status: 'En desarrollo', text: 'Identificar y validar oportunidades.' },
];

/** §7 — Experiencias de conferencias. */
export const TALKS = [
  { title: 'La nueva ventaja competitiva: construir más rápido.', kind: 'Conferencia' },
  { title: '¿Dónde está la oportunidad?', kind: 'Conferencia' },
  { title: 'Cómo hacer que la IA recomiende tu negocio.', kind: 'Conferencia' },
  { title: 'AI for Business', kind: 'Workshop aplicado' },
  { title: 'AI Builder Workshop', kind: 'Experimentación orientada a prototipo' },
];

export const TALK_FORMATS = ['Conferencia', 'Workshop práctico', 'Sesión ejecutiva', 'Experiencia personalizada'];

/** Home — Punto de partida: los problemas típicos de un negocio en marcha (situaciones, no clientes). */
export const HOME_START = {
  kicker: 'Negocio en marcha',
  title: 'Quiero crecer con lo que ya tengo.',
  signals: [
    'Tienes clientes, pero dependes de recomendaciones y no de un sistema.',
    'Inviertes en anuncios o redes y no sabes qué está funcionando.',
    'Tu sitio web no genera contactos.',
    'Tu equipo pierde tiempo en tareas que podrían automatizarse.',
    'Quieres abrir una nueva línea, canal o alianza.',
  ],
  cta: { label: 'Quiero hacer crecer mi negocio', href: '/llamada' },
};

/** Home — Dónde más trabajo (en este orden). */
export const SECTORS = [
  { title: 'Clínicas y salud', text: 'Más pacientes: presencia digital, reputación y atención por WhatsApp.', link: { label: 'Evalúa la presencia digital de tu clínica', href: '/diagnostico-clinicas' } },
  { title: 'Negocios B2B', text: 'Empresas que venden a otras empresas y necesitan un sistema comercial que escale.' },
  { title: 'Tecnología', text: 'Startups y empresas de software que necesitan posicionarse, conseguir clientes y ordenar su proceso comercial.' },
  { title: 'Negocios familiares', text: 'Empresas con historia que quieren modernizarse, profesionalizar su operación y crecer.' },
];
/** Home — Preguntas frecuentes (respuestas de Germán). Alimentan también el schema FAQPage. */
export const SERVICE_FAQS = [
  { question: '¿Cómo cobras?', answer: 'Arrancamos con un sprint: acciones y entregables definidos desde el inicio; se cobra por sprint. Después, muchos clientes pasan a una iguala mensual recurrente para seguir ejecutando y midiendo cada mes.' },
  { question: '¿Cuánto dura un proyecto?', answer: 'Normalmente de 2 a 4 semanas por sprint. Si hace falta, se encadenan sprints según lo que vayamos aprendiendo.' },
  { question: '¿Puedo trabajar contigo de forma continua?', answer: 'Sí, es el objetivo de muchos clientes. Después del primer sprint pasamos a un esquema mensual: cada mes definimos prioridades, ejecutamos y medimos resultados.' },
  { question: '¿Trabajas con negocios fuera de tu ciudad?', answer: 'Sí. Trabajo con negocios en cualquier parte de México.' },
  { question: '¿Qué pasa en la Sesión de oportunidades? ¿Tiene costo?', answer: 'Es una conversación para conocer tu negocio: en qué estás, qué te preocupa y dónde estás atorado. A partir de ahí identificamos qué acciones podrían ayudarte. Por lanzamiento, no tiene costo.' },
];


/** Builder Lab — Lanzar un negocio nuevo por etapas (Construir y Lanzar: sprints; Crecer: mensual). */
export const LAUNCH_STAGES = [
  { title: 'Construir', time: 'Sprint de 2 a 4 semanas', lead: 'Definimos el negocio.', text: 'Modelo de negocio, posicionamiento, cliente ideal y estrategia de salida al mercado.' },
  { title: 'Lanzar', time: 'Sprint de 2 a 4 semanas', lead: 'Lo sacamos al mercado.', text: 'Playbook comercial, página web, estrategia de redes y lo necesario para empezar a vender.' },
  { title: 'Crecer', time: 'Mensual', lead: 'Lo hacemos crecer.', text: 'Campañas, contenido y optimización con base en lo que funciona.' },
];
