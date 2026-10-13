# Instrucciones para Claude Code

Este es un sitio Astro basado en un template estandarizado con SEO/GEO preconfigurado.

## Arquitectura

- **`src/config/site.config.ts`** — ÚNICO archivo de configuración. Nombre, dominio, contacto, redes, blog, analytics. Todo el sitio (SEO, schemas, sitemap, RSS, llms.txt) se alimenta de aquí. Cuando el usuario pida cambiar datos del sitio, edita este archivo.
- **`src/content/blog/`** — Posts en Markdown. Frontmatter validado con Zod en `src/content.config.ts`.
- **`src/components/SEO.astro`** — Meta tags centralizados. NO agregar meta tags sueltos en páginas.
- **`src/components/schema/`** — JSON-LD (Organization, Article, FAQ, Breadcrumb). Reutilizar estos componentes, no escribir JSON-LD inline.
- **`src/layouts/`** — BaseLayout (todas las páginas) y BlogPostLayout (posts).
- **`src/pages/robots.txt.ts` y `llms.txt.ts`** — Dinámicos, se regeneran en cada build. No crear versiones estáticas en /public.
- **`cliente.json`** (raíz) — Ficha del cliente: nombre, vertical, dominio, estatus, inicio, tipo. Metadata operativa, no alimenta el build.
- **`client-brief.md`** (raíz) — Brief del cliente: negocio, audiencia, posicionamiento, SEO (keywords objetivo, temas sí/no) y, en vertical salud, médicos revisores. Es la fuente de verdad para el contenido del sitio y del blog.

## Reglas para crear posts del blog

Frontmatter obligatorio:
```yaml
---
title: "Máximo 70 caracteres"
description: "Entre 50 y 160 caracteres — es lo que sale en Google"
pubDate: 2026-01-15
tags: ["opcional"]
---
```
- Usar `updatedDate` al actualizar posts existentes (no cambiar `pubDate`).
- `draft: true` para ocultar sin borrar.
- El slug de la URL = nombre del archivo.

## Flujo de trabajo

1. Antes de cualquier commit: `npm run build` — valida frontmatter y detecta errores.
2. Si el build falla por frontmatter, el error dice exactamente qué campo corregir.
3. El deploy es automático al hacer push a main (Vercel/Netlify/Cloudflare).

## Al configurar un proyecto nuevo desde este template

1. Editar `src/config/site.config.ts` completo (especialmente `url` con el dominio real).
2. Llenar `cliente.json` con los datos reales del cliente (sustituir todos los placeholders). El `dominio` debe coincidir con `url` de `site.config.ts`.
3. Llenar `client-brief.md` completo. Si la vertical es salud, la sección de médicos revisores es obligatoria antes de publicar contenido.
4. Ponerle al repo el topic `maguey-cliente` en GitHub (Settings → About → Topics, o `gh repo edit --add-topic maguey-cliente`).
5. Recordar al usuario sustituir: `public/favicon.svg`, `public/logo.png`, `public/og-default.png` (1200x630).
6. Verificar build antes del primer push.

## NO hacer

- No agregar `<title>` o meta tags directamente en páginas — usar props del BaseLayout.
- No hardcodear el nombre del sitio, dominio o datos de contacto — importar de `site.config.ts`.
- No crear robots.txt o sitemap estáticos — ya se generan solos.
