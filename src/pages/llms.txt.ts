import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../config/site.config';
import { POST_CATEGORIES } from '../content.config';
import { byNewest } from '../lib/posts';

/**
 * llms.txt — resumen estructurado del sitio para asistentes de IA (GEO).
 * Solo incluye contenido publicado. Se regenera en cada build.
 */
export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort(byNewest);
  const projects = (await getCollection('proyectos')).sort((a, b) => a.data.order - b.data.order);
  const u = (p: string) => `${SITE.url}${p}`;

  const body = `# ${SITE.name} — ${SITE.role}

> ${SITE.description}

Germán González es Business Builder: identifica oportunidades de crecimiento y construye la combinación de negocio, growth digital, tecnología y alianzas necesaria para aprovecharlas. Trabaja con empresas en operación que quieren crecer y con nuevas oportunidades de negocio. Método: Opportunity Building (Detect, Design, Activate, Build).

## Páginas principales
- [Inicio](${u('/')}): posicionamiento y forma de trabajo.
- [Qué hago](${u('/que-hago')}): growth digital, IA y automatización, Business Building, comercial y expansión, experiencias.
- [Proyectos](${u('/proyectos')}): ${projects.map((p) => p.data.name).join(', ')}.
- [Builder Lab](${u('/builder-lab')}): contenido, recursos, formación y comunidad sobre IA, tecnología y negocios.
- [Diagnóstico de Visibilidad Digital para Clínicas](${u('/diagnostico-clinicas')}): herramienta gratuita y orientativa de 15 preguntas (Google Maps, sitio web, reseñas, información pública e IA, contacto). No es una auditoría técnica ni garantiza aparecer en buscadores o asistentes de IA.
- [3 prompts para vender beneficios, no características](${u('/builder-lab/3-prompts-valor')}): recurso gratuito con 3 prompts de ChatGPT, en orden, para pasar de características a beneficios, propuesta de valor y mensajes comerciales.
- [¿La IA recomienda tu negocio?](${u('/ia-recomienda-tu-negocio')}): checklist gratuito de 10 verificaciones sobre preparación digital (web, Google Maps, reputación, buscadores e IA, conversión). Se basa en las respuestas del usuario; no audita sitios ni predice recomendaciones de IA.
- [Conferencias y workshops](${u('/builder-lab/conferencias')}): IA, innovación y oportunidades de negocio para empresas, universidades y eventos.
- [Sobre mí](${u('/sobre-mi')}): trayectoria.
- [Contacto](${u('/contacto')}): solicitudes comerciales, conferencias y colaboraciones.
${posts.length ? `
## Builder Lab — publicaciones
${posts.map((p) => `- [${p.data.title}](${u(`/builder-lab/${p.id}`)}) (${POST_CATEGORIES[p.data.category]}): ${p.data.description}`).join('\n')}
` : ''}`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
