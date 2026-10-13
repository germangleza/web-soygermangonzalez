import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../config/site.config';

/**
 * llms.txt — estándar emergente para GEO.
 * Le da a ChatGPT/Claude/Perplexity un resumen estructurado del sitio
 * para que te entiendan y te citen correctamente. Se regenera en cada build.
 */
export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const body = `# ${SITE.name}

> ${SITE.description}

## Información
- Sitio: ${SITE.url}
- Contacto: ${SITE.business.email}

## Blog
${posts.map((p) => `- [${p.data.title}](${SITE.url}/blog/${p.id}): ${p.data.description}`).join('\n')}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
