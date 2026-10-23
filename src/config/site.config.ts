/**
 * ⚙️ CONFIGURACIÓN CENTRAL DEL SITIO
 * Todo el sitio (SEO, schema, sitemap, RSS, llms.txt, navegación) se alimenta de aquí.
 *
 * Valores marcados con PENDIENTE requieren confirmación de Germán antes de producción
 * (ver docs/REVISION.md).
 */

export const SITE = {
  // === Básicos ===
  name: 'Germán González',
  // Dominio canónico: www (en Vercel el dominio raíz redirige 308 a www).
  url: 'https://www.soygermangonzalez.com',
  title: 'Germán González | Business Builder, Growth e IA',
  description:
    'Germán González, Business Builder. Identifico oportunidades y construyo la combinación de negocio, growth digital, tecnología y alianzas para aprovecharlas.',
  tagline: 'Construyo oportunidades de crecimiento.',
  role: 'Business Builder',
  locale: 'es_MX',
  lang: 'es',

  // === Marca ===
  logo: '/logo.png',
  ogImage: '/og-default.jpg',
  themeColor: '#07192B',

  // === Persona (schema Person). Solo datos confirmados en el Blueprint. ===
  person: {
    name: 'Germán González',
    jobTitle: 'Business Builder',
    alumniOf: 'Tecnológico de Monterrey',
    knowsAbout: [
      'Business Building',
      'Growth digital',
      'Inteligencia artificial aplicada',
      'Automatización',
      'Nuevos negocios',
      'Sistemas comerciales',
    ],
  },

  // === Contacto público ===
  business: {
    // PENDIENTE: correo público de contacto. Vacío = no se muestra en ningún lado.
    email: '',
  },

  // === Redes sociales (solo cuando se confirmen; vacío = no se muestran) ===
  socials: {
    linkedin: '', // URL completa, ej: 'https://www.linkedin.com/in/...'
    instagram: '',
    youtube: '',
    tiktok: '',
    x: '',
  },

  // === Navegación principal ===
  nav: [
    { label: 'Inicio', href: '/' },
    { label: 'Qué hago', href: '/que-hago' },
    { label: 'Proyectos', href: '/proyectos' },
    { label: 'Builder Lab', href: '/builder-lab' },
    { label: 'Sobre mí', href: '/sobre-mi' },
  ],
  navCta: { label: 'Hablemos de tu negocio', href: '/contacto' },

  // === Builder Lab (publicaciones) ===
  blog: {
    title: 'Builder Lab',
    description: 'Herramientas, experimentos y aprendizajes sobre IA, tecnología, negocios y nuevas oportunidades.',
    basePath: '/builder-lab',
    defaultAuthor: 'Germán González',
  },

  // === Tipografía ===
  fonts: {
    // Nimbus Sans es comercial. Si se licencia vía Adobe Fonts, pega aquí el ID del kit
    // (ej. 'abc1234') y se cargará automáticamente. Vacío = fallback Helvetica/Arial.
    adobeKitId: '',
  },

  // === Agenda de Opportunity Session (vacío = el formulario de contacto es el fallback) ===
  bookingUrl: 'https://calendar.app.google/8mMLAzjTQtG9xRRt7',
  // URL para incrustar la agenda en /llamada. Google Calendar → tu página de reservas → Compartir →
  // «Insertar en sitio web» (En línea): copia el src del <iframe>, termina en ?gv=true.
  // Vacío = /llamada muestra una tarjeta con botón que abre bookingUrl.
  bookingEmbedUrl: '',
  // Formspree para el formulario corto antes de agendar (diagnóstico y checklist). Ej. 'https://formspree.io/f/abcdwxyz'.
  // Vacío = no se envían los datos, pero el botón abre el calendario igual.
  formspreeEndpoint: '',

  // === Analytics (vacío = no se carga nada) ===
  analytics: {
    plausibleDomain: '',
    googleAnalyticsId: '', // 'G-XXXXXXX'
  },
} as const;

export type SiteConfig = typeof SITE;

/** URLs sociales configuradas (para schema sameAs y footer). */
export function socialLinks(): { label: string; url: string }[] {
  const labels: Record<string, string> = {
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    youtube: 'YouTube',
    tiktok: 'TikTok',
    x: 'X',
  };
  return Object.entries(SITE.socials)
    .filter(([, url]) => Boolean(url))
    .map(([key, url]) => ({ label: labels[key] ?? key, url }));
}

/** URLs sociales para schema sameAs. */
export function socialUrls(): string[] {
  return socialLinks().map((s) => s.url);
}
