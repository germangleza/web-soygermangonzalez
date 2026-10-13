# 🚀 Astro Template — Genérico (SEO + GEO listo)

Template base para cualquier sitio: landing + blog + SEO técnico completo preconfigurado.

## ¿Qué incluye?

| Feature | Cómo funciona |
|---|---|
| **SEO completo** | Componente `<SEO />` central: title, meta, canonical, Open Graph, Twitter Cards |
| **Schema.org (JSON-LD)** | Organization/LocalBusiness, WebSite, Article, FAQ, Breadcrumbs |
| **Sitemap** | Autogenerado en cada build (`/sitemap-index.xml`) |
| **robots.txt** | Dinámico, con crawlers de IA permitidos (GEO) |
| **llms.txt** | Autogenerado para que ChatGPT/Claude/Perplexity te citen |
| **Blog** | Content Collections tipadas: escribes `.md`, push, y todo se actualiza |
| **RSS** | Autogenerado en `/rss.xml` |
| **CI** | GitHub Action que valida el build en cada push |

## Setup de un proyecto nuevo (5 minutos)

1. **Usa este template**: botón "Use this template" en GitHub → nuevo repo
2. **Clona e instala**:
   ```bash
   git clone <tu-repo> && cd <tu-repo>
   npm install
   ```
3. **Edita UN solo archivo**: `src/config/site.config.ts` (nombre, dominio, redes, contacto). Todo el sitio se alimenta de ahí.
4. **Sustituye assets**: `public/favicon.svg`, `public/logo.png`, `public/og-default.png` (1200x630)
5. **Deploy**: conecta el repo a Vercel / Netlify / Cloudflare Pages. Detectan Astro solos.

```bash
npm run dev      # desarrollo local
npm run build    # build de producción (valida frontmatter del blog)
npm run check    # type-check
```

## Escribir en el blog

Crea un archivo en `src/content/blog/mi-post.md`:

```markdown
---
title: "Título (máx 70 chars)"
description: "Descripción para Google (50-160 chars)"
pubDate: 2026-07-23
tags: ["tag1"]
---

Contenido en Markdown...
```

Push → el post, sitemap, RSS y llms.txt se actualizan automáticamente. Si el frontmatter está mal, **el build falla y te dice exactamente qué corregir**.

## Estructura

```
src/
├── config/site.config.ts    ← EL archivo que editas por proyecto
├── components/
│   ├── SEO.astro            ← Meta tags centralizados
│   └── schema/              ← JSON-LD (Organization, Article, FAQ...)
├── layouts/
│   ├── BaseLayout.astro     ← HTML base + SEO + schemas globales
│   └── BlogPostLayout.astro ← Layout de posts con Article schema
├── content/blog/            ← Tus posts en Markdown
└── pages/                   ← Rutas (incluye robots.txt y llms.txt dinámicos)
```

## Checklist antes de lanzar

- [ ] `site.config.ts` completo (sobre todo `url` con el dominio real)
- [ ] `og-default.png` de 1200x630 en `/public`
- [ ] Verificar schema en [Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Dar de alta el dominio en Google Search Console + enviar sitemap
