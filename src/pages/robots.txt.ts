import type { APIRoute } from 'astro';
import { SITE } from '../config/site.config';

// robots.txt dinámico: permite todo + apunta al sitemap.
// Los crawlers de IA (GPTBot, ClaudeBot, PerplexityBot) quedan PERMITIDOS
// a propósito: para GEO quieres que te lean y te citen.
const body = `User-agent: *
Allow: /

Sitemap: ${SITE.url}/sitemap-index.xml
`;

export const GET: APIRoute = () => new Response(body, { headers: { 'Content-Type': 'text/plain' } });
