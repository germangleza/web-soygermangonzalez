/**
 * Copy estructurado del Blueprint V3. Editar aquí cambia todas las secciones que lo usan.
 * Mantener los textos aprobados; cualquier cambio de copy debe validarse con Germán.
 */
import detect from '../assets/method/detect.png';
import design from '../assets/method/design.png';
import activate from '../assets/method/activate.png';
import build from '../assets/method/build.png';

/** H03 — Capacidades (home). */
export const CAPABILITIES = [
  { title: 'Crecimiento digital', text: 'Posicionamiento, campañas, contenido, sitios web, adquisición y conversión.' },
  { title: 'IA y automatización', text: 'Agentes, WhatsApp, CRM, integraciones y procesos conectados a la operación.' },
  { title: 'Nuevos negocios y productos', text: 'Validación, modelo de negocio, oferta, go-to-market y lanzamiento.' },
  { title: 'Sistemas comerciales', text: 'Ventas, funnels, seguimiento, pricing, métricas y experiencia comercial.' },
  { title: 'Alianzas y nuevos canales', text: 'Partnerships, distribución y expansión.' },
];

/** H04 — Método Opportunity Building (no fusionar con Build → Launch → Growth). */
export const METHOD = [
  { num: '01', key: 'DETECTAR', text: 'Identifico dónde existe una oportunidad.', image: detect, alt: 'Lupa sobre una roca: detectar la oportunidad' },
  { num: '02', key: 'DISEÑAR', text: 'Diseño cómo capturarla.', image: design, alt: 'Plano arquitectónico de una casa: diseñar cómo capturarla' },
  { num: '03', key: 'ACTIVAR', text: 'Activo personas, tecnología y capacidades.', image: activate, alt: 'Bloques de distintos materiales ensamblándose: activar capacidades' },
  { num: '04', key: 'CONSTRUIR', text: 'Construimos, medimos y ajustamos.', image: build, alt: 'Casa terminada e iluminada: construir' },
];

/** Home — Con quién lo construyes (estrategia + empresas de ejecución). */
export const HOME_TEAM = [
  { name: 'Germán González', area: 'Estrategia y dirección', items: ['Diagnóstico y priorización de oportunidades', 'Nuevas líneas, productos y canales: validación, oferta y lanzamiento', 'Sistemas comerciales: ventas, funnels, pricing y seguimiento'] },
  { name: 'Maguey Studio', url: 'https://www.magueystudio.mx', area: 'Marketing y growth', items: ['Posicionamiento y contenido', 'Campañas y adquisición de clientes', 'Sitios web que convierten'] },
  { name: 'Life Agents AI', url: 'https://lifeagent.mx', area: 'IA y automatización', items: ['Agentes de IA y atención por WhatsApp', 'Integración con CRM', 'Automatización de procesos de la operación'] },
];

/** BL02 — Conceptos internos de Builder Lab. */
export const LAB_CONCEPTS = [
  { title: 'Explora', icon: '↗', text: 'Herramientas de IA, tecnología, crypto, fintech, oportunidades, tendencias y análisis de negocio.' },
  { title: 'Aprende', icon: '✧', text: 'Workshops, laboratorios en vivo, cursos y recursos prácticos.' },
  { title: 'Conecta', icon: '◎', text: 'Encuentros, colaboración y comunidad en formación.' },
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

/** Qué hago — Puntos de partida en detalle (situaciones típicas, no clientes). */
export const ENTRY_PATHS = [
  {
    id: 'operacion',
    interes: 'problema',
    kicker: 'Negocio en marcha',
    title: 'Quiero crecer con lo que ya tengo.',
    signals: [
      'Tienes clientes, pero dependes de recomendaciones y no de un sistema.',
      'Inviertes en anuncios o redes y no sabes qué está funcionando.',
      'Tu sitio web no genera contactos.',
      'Tu equipo pierde tiempo en tareas que podrían automatizarse.',
      'Quieres abrir una nueva línea, canal o alianza.',
    ],
    activates: ['Growth digital', 'IA y automatización', 'Comercial y expansión'],
    cta: { label: 'Quiero hacer crecer mi negocio', href: '/contacto?interes=crecer' },
  },
  {
    id: 'nuevos',
    interes: 'oportunidad',
    kicker: 'Negocio nuevo',
    title: 'Quiero lanzar algo.',
    signals: [
      'Tienes una idea y quieres validarla antes de invertir de más.',
      'No tienes claro para quién es ni cómo venderla.',
      'Necesitas una marca, una oferta y un primer canal de venta.',
      'Quieres salir al mercado rápido y medir antes de crecer.',
    ],
    activates: ['Business Building', 'Growth digital'],
    cta: { label: 'Quiero lanzar una oportunidad', href: '/contacto?interes=lanzar' },
  },
];

/** Qué hago — Capacidades en detalle con quién las ejecuta. No son paquetes fijos. */
export const SERVICE_GROUPS = [
  { title: 'Growth digital', text: 'Posicionamiento, campañas, contenido, sitios web, adquisición y conversión.', who: 'Maguey Studio', whoUrl: 'https://www.magueystudio.mx' },
  { title: 'IA y automatización', text: 'Agentes, WhatsApp, CRM, integraciones y procesos conectados a la operación.', who: 'Life Agents AI', whoUrl: 'https://lifeagent.mx' },
  { title: 'Business Building', text: 'Validación, modelo de negocio, oferta, go-to-market y lanzamiento.', who: 'Germán González' },
  { title: 'Comercial y expansión', text: 'Ventas, funnels, seguimiento, pricing, métricas, alianzas y nuevos canales.', who: 'Germán González + socios' },
  { title: 'Experiencias', text: 'Conferencias, workshops y sesiones prácticas para equipos y organizaciones.', who: 'Germán González', href: '/builder-lab/conferencias' },
];

/** Qué hago — Modelo de trabajo. */
export const COMMERCIAL_MODEL = [
  { step: 'Opportunity Session', text: 'Conozco tu negocio: en qué estás, qué te preocupa y dónde estás atorado. Sin costo por lanzamiento.' },
  { step: 'Opportunity Map', text: 'Identificamos y priorizamos las acciones que pueden ayudarte, cuando el alcance lo requiere.', optional: true },
  { step: 'Build Proposal', text: 'Definimos el sprint: acciones, entregables y forma de trabajo.' },
  { step: 'Primer sprint', text: 'Construimos, medimos y ajustamos en 2 a 4 semanas.' },
];

/** Qué hago — Sectores donde más trabajo. */
export const SECTORS = [
  { title: 'Negocios B2B', text: 'Mi especialidad: empresas que venden a otras empresas y necesitan un sistema comercial que escale.', featured: true },
  { title: 'Negocios familiares', text: 'Empresas con historia que quieren modernizarse, profesionalizar su operación y crecer.' },
  { title: 'Clínicas y salud', text: 'Presencia digital, reputación y contacto con pacientes.', link: { label: 'Evalúa la presencia digital de tu clínica', href: '/diagnostico-clinicas' } },
];

/** Qué hago — Preguntas frecuentes (respuestas de Germán). Alimentan también el schema FAQPage. */
export const SERVICE_FAQS = [
  { question: '¿Cómo cobras?', answer: 'Arrancamos con un sprint: acciones y entregables definidos desde el inicio; se cobra por sprint. Después, muchos clientes pasan a una iguala mensual recurrente para seguir ejecutando y midiendo cada mes.' },
  { question: '¿Cuánto dura un proyecto?', answer: 'Normalmente de 2 a 4 semanas por sprint. Si hace falta, se encadenan sprints según lo que vayamos aprendiendo.' },
  { question: '¿Puedo trabajar contigo de forma continua?', answer: 'Sí, es el objetivo de muchos clientes. Después del primer sprint pasamos a un esquema mensual: cada mes definimos prioridades, ejecutamos y medimos resultados.' },
  { question: '¿Trabajas con negocios fuera de tu ciudad?', answer: 'Sí. Trabajo con negocios en cualquier parte de México.' },
  { question: '¿Qué pasa en la Opportunity Session? ¿Tiene costo?', answer: 'Es una conversación para conocer tu negocio: en qué estás, qué te preocupa y dónde estás atorado. A partir de ahí identificamos qué acciones podrían ayudarte. Por lanzamiento, no tiene costo.' },
];


/** Builder Lab — Lanzar un negocio nuevo por etapas (Construir y Lanzar: sprints; Crecer: mensual). */
export const LAUNCH_STAGES = [
  { title: 'Construir', time: 'Sprint de 2 a 4 semanas', lead: 'Definimos el negocio.', text: 'Modelo de negocio, posicionamiento, cliente ideal y estrategia de salida al mercado.' },
  { title: 'Lanzar', time: 'Sprint de 2 a 4 semanas', lead: 'Lo sacamos al mercado.', text: 'Playbook comercial, página web, estrategia de redes y lo necesario para empezar a vender.' },
  { title: 'Crecer', time: 'Mensual', lead: 'Lo hacemos crecer.', text: 'Campañas, contenido y optimización con base en lo que funciona.' },
];
