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
  { num: '01', key: 'DETECT', text: 'Identifico dónde existe una oportunidad.', image: detect, alt: 'Lupa sobre una roca: detectar la oportunidad' },
  { num: '02', key: 'DESIGN', text: 'Diseño cómo capturarla.', image: design, alt: 'Plano arquitectónico de una casa: diseñar cómo capturarla' },
  { num: '03', key: 'ACTIVATE', text: 'Activo personas, tecnología y capacidades.', image: activate, alt: 'Bloques de distintos materiales ensamblándose: activar capacidades' },
  { num: '04', key: 'BUILD', text: 'Construimos, medimos y ajustamos.', image: build, alt: 'Casa terminada e iluminada: construir' },
];

/** BL02 — Conceptos internos de Builder Lab. */
export const LAB_CONCEPTS = [
  { title: 'Explora', icon: '↗', text: 'Herramientas de IA, tecnología, crypto, fintech, oportunidades, tendencias y análisis de negocio.' },
  { title: 'Aprende', icon: '✧', text: 'Workshops, laboratorios en vivo, cursos y recursos prácticos.' },
  { title: 'Conecta', icon: '◎', text: 'Encuentros, colaboración y comunidad en formación.' },
];

/** BL03 — Temas en preparación. NO son publicaciones: se muestran como "En preparación". */
export const PLANNED_POSTS = [
  { title: 'Conectar Claude a Meta Ads', category: 'ia-herramientas' },
  { title: 'Tres fugas antes de invertir en publicidad', category: 'negocios-growth' },
  { title: 'De idea a nueva línea de negocio', category: 'build-in-public' },
  { title: 'Bitcoin y oportunidades fintech', category: 'tecnologia-fintech' },
] as const;

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

/** §4 — Capacidades agrupadas (Qué hago). No son paquetes fijos. */
export const SERVICE_GROUPS = [
  { title: 'Growth digital', text: 'Posicionamiento, campañas, contenido, sitios web, adquisición y conversión.' },
  { title: 'IA y automatización', text: 'Agentes, WhatsApp, CRM, integraciones y procesos conectados a la operación.' },
  { title: 'Business Building', text: 'Validación, modelo de negocio, oferta, go-to-market y lanzamiento.' },
  { title: 'Comercial y expansión', text: 'Ventas, funnels, seguimiento, pricing, métricas, alianzas y nuevos canales.' },
  { title: 'Experiencias', text: 'Conferencias, workshops y sesiones prácticas para equipos y organizaciones.' },
];

/** §4 — Modelo comercial. */
export const COMMERCIAL_MODEL = [
  { step: 'Opportunity Session', text: 'Entendemos el reto, el negocio y el resultado que necesita moverse.' },
  { step: 'Opportunity Map', text: 'Priorizamos las oportunidades, cuando el alcance lo requiere.', optional: true },
  { step: 'Build Proposal', text: 'Definimos alcance, entregables y forma de trabajo.' },
  { step: 'Execution', text: 'Construimos, medimos y ajustamos.' },
];

/** Principio 5 — Capacidades y vehículos de ejecución. */
export const VEHICLES = [
  { name: 'Germán González', role: 'Estrategia y dirección' },
  { name: 'Maguey', role: 'Growth digital, web y marketing' },
  { name: 'Life Agent', role: 'IA y automatización' },
  { name: 'Partners externos', role: 'Según la oportunidad' },
];
