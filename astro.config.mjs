import { defineConfig, envField } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import vercel from '@astrojs/vercel';
import { SITE } from './src/config/site.config.ts';

// Páginas que nunca deben ir al sitemap (noindex o utilitarias).
const SITEMAP_EXCLUDE = ['/404', '/builder-lab/recursos'];

export default defineConfig({
  site: SITE.url,
  // Sitio estático (SSG) + una función serverless para /api/lead.
  output: 'static',
  adapter: vercel(),
  integrations: [
    sitemap({
      filter: (page) => !SITEMAP_EXCLUDE.some((p) => new URL(page).pathname.replace(/\/$/, '') === p),
    }),
    mdx(),
  ],
  devToolbar: { enabled: false },
  trailingSlash: 'never',
  build: { format: 'file' },
  redirects: {
    '/blog': '/builder-lab',
    '/builder-lab/diagnostico-clinicas': '/diagnostico-clinicas',
    '/builder-lab/ia-recomienda-tu-negocio': '/ia-recomienda-tu-negocio',
  },
  image: { responsiveStyles: false },
  env: {
    schema: {
      // Webhook que recibe los leads (CRM, Make, Zapier, n8n, HubSpot…). Solo servidor.
      LEAD_WEBHOOK_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Webhook de la plataforma de correo para Builder Drops (si se omite usa LEAD_WEBHOOK_URL).
      NEWSLETTER_WEBHOOK_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Webhook del Diagnóstico de clínicas (CRM/automatización de Maguey Salud). Si falta usa LEAD_WEBHOOK_URL.
      DIAGNOSTIC_WEBHOOK_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Webhook del checklist «¿La IA recomienda tu negocio?». Si falta usa LEAD_WEBHOOK_URL.
      AI_CHECKLIST_WEBHOOK_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Secreto opcional enviado como cabecera X-Webhook-Secret.
      LEAD_WEBHOOK_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
      // 'true' = modo prueba: valida y registra en consola, no envía a ningún servicio.
      FORMS_DRY_RUN: envField.string({ context: 'server', access: 'secret', optional: true }),
      // 'true' en previews para revisar borradores (nunca en producción).
      PUBLIC_SHOW_DRAFTS: envField.string({ context: 'client', access: 'public', optional: true }),
    },
  },
});
