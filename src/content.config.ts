import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Colecciones con frontmatter TIPADO Y VALIDADO (Blueprint §10).
 * Si falta un campo obligatorio, el build falla y dice exactamente qué corregir.
 * Todas se editan desde /admin (Decap CMS) o directamente en Markdown.
 */

const seo = z
  .object({
    title: z.string().max(70).optional(),
    description: z.string().min(50).max(160).optional(),
  })
  .optional();

/** Categorías editoriales de Builder Lab (filtros de la biblioteca). */
export const POST_CATEGORIES = {
  'ia-herramientas': 'IA y herramientas',
  'negocios-growth': 'Negocios y Growth',
  'build-in-public': 'Build in Public',
  'tecnologia-fintech': 'Tecnología y fintech',
} as const;
type PostCategory = keyof typeof POST_CATEGORIES;
const postCategoryKeys = Object.keys(POST_CATEGORIES) as [PostCategory, ...PostCategory[]];

/**
 * Post de Builder Lab → /builder-lab/[slug]
 * El slug = nombre del archivo. No usar "recursos", "conferencias" ni "eventos" como nombre.
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(70, 'Máx 70 caracteres para SEO'),
      description: z.string().min(50).max(160, 'Description entre 50-160 caracteres'),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      /** Fecha de la última revisión de herramientas/enlaces (Blueprint §12). */
      reviewedDate: z.coerce.date().optional(),
      category: z.enum(postCategoryKeys),
      author: z.string().optional(),
      heroImage: image().optional(),
      heroImageAlt: z.string().optional(),
      videoUrl: z.string().url().optional(),
      tags: z.array(z.string()).default([]),
      resources: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
      ctaType: z.enum(['builder-drops', 'contacto', 'conferencias']).default('builder-drops'),
      /** Desempate entre posts del mismo día: menor = aparece primero. */
      order: z.number().default(100),
      draft: z.boolean().default(false),
      seo,
    }),
});

/** Proyecto → tarjeta en /proyectos y, si tiene caso, /proyectos/[slug]. */
const proyectos = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/proyectos' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      industry: z.string(),
      shortDescription: z.string().max(200),
      /** Estado verificable. Vacío = no se muestra. */
      status: z.string().optional(),
      /** Rol exacto de Germán. Vacío = no se muestra. */
      germanRole: z.string().optional(),
      order: z.number().default(100),
      featured: z.boolean().default(false),
      /** true = tiene página de caso (/proyectos/[slug]) con contenido en el cuerpo. */
      hasCase: z.boolean().default(false),
      /** false = el caso solo se ve en desarrollo/preview, nunca en producción. */
      published: z.boolean().default(false),
      website: z.string().url().optional(),
      approvedMedia: z.array(z.object({ src: image(), alt: z.string() })).default([]),
      seo,
    }),
});

/** Recurso descargable o enlace → /builder-lab/recursos (solo si hay recursos reales). */
const recursos = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/recursos' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(200),
    category: z.enum(['ai-toolkit', 'prompts-workflows', 'business-building-templates']),
    fileOrUrl: z.string(),
    requiresEmail: z.boolean().default(false),
    updatedAt: z.coerce.date(),
    published: z.boolean().default(false),
  }),
});

/** Evento → /builder-lab/eventos/[slug]. Solo eventos reales con published: true. */
const eventos = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/eventos' }),
  schema: z.object({
    name: z.string(),
    description: z.string().max(200),
    status: z.enum(['proposed', 'scheduled', 'sold_out', 'past']),
    type: z.enum(['workshop', 'lab', 'bootcamp', 'conferencia', 'encuentro']),
    date: z.coerce.date().optional(),
    timeZone: z.string().default('America/Mexico_City'),
    locationOrOnline: z.string().optional(),
    seats: z.number().optional(),
    price: z.string().optional(),
    signupUrl: z.string().url().optional(),
    published: z.boolean().default(false),
  }),
});

export const collections = { blog, proyectos, recursos, eventos };
