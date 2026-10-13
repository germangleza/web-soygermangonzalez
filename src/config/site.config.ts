/**
 * ⚙️ CONFIGURACIÓN CENTRAL DEL SITIO
 * Este es EL ÚNICO archivo que necesitas editar al iniciar un proyecto nuevo.
 * Todo el sitio (SEO, schema, sitemap, RSS, llms.txt) se alimenta de aquí.
 */

export const SITE = {
  // === Básicos ===
  name: 'Mi Empresa',                        // Nombre de la marca/negocio
  url: 'https://ejemplo.com',                // Dominio final SIN slash al final
  title: 'Mi Empresa — Lo que hacemos en una frase',
  description: 'Descripción del sitio en 150-160 caracteres. Aparece en Google y redes.',
  locale: 'es_MX',                           // es_MX, es_ES, en_US...
  lang: 'es',

  // === Marca ===
  logo: '/logo.png',                         // Ruta en /public
  ogImage: '/og-default.png',                // Imagen por defecto para compartir (1200x630)
  themeColor: '#0f172a',

  // === Contacto / Negocio (para schema LocalBusiness) ===
  business: {
    type: 'Organization' as const,           // 'Organization' | 'LocalBusiness'
    legalName: 'Mi Empresa S.A. de C.V.',
    email: 'hola@ejemplo.com',
    phone: '+52 55 0000 0000',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'MX',
    },
    geo: { lat: 0, lng: 0 },                 // Solo si es LocalBusiness
    openingHours: [] as string[],            // Ej: ['Mo-Fr 09:00-18:00', 'Sa 09:00-14:00']
  },

  // === Redes sociales (para schema sameAs y footer) ===
  socials: {
    twitter: '',                             // handle sin @, ej: 'miempresa'
    instagram: '',
    facebook: '',
    linkedin: '',
    youtube: '',
    tiktok: '',
  },

  // === Blog ===
  blog: {
    title: 'Blog',
    description: 'Artículos y novedades.',
    postsPerPage: 10,
    defaultAuthor: 'Equipo Editorial',
  },

  // === Analytics (opcional, deja vacío si no usas) ===
  analytics: {
    plausibleDomain: '',                     // ej: 'ejemplo.com'
    googleAnalyticsId: '',                   // ej: 'G-XXXXXXX'
  },
} as const;

export type SiteConfig = typeof SITE;

/** URLs sociales completas derivadas del config */
export function socialUrls(): string[] {
  const s = SITE.socials;
  return [
    s.twitter && `https://twitter.com/${s.twitter}`,
    s.instagram && `https://instagram.com/${s.instagram}`,
    s.facebook && `https://facebook.com/${s.facebook}`,
    s.linkedin && `https://linkedin.com/company/${s.linkedin}`,
    s.youtube && `https://youtube.com/@${s.youtube}`,
    s.tiktok && `https://tiktok.com/@${s.tiktok}`,
  ].filter(Boolean) as string[];
}
