---
title: "Post de ejemplo: cómo escribir en este blog"
description: "Este es un post de ejemplo. Duplícalo, cambia el frontmatter y escribe en Markdown. El sitio se actualiza solo al hacer push."
pubDate: 2026-01-15
tags: ["ejemplo", "tutorial"]
draft: false
---

## Cómo funciona

1. Crea un archivo `.md` en `src/content/blog/`
2. Llena el frontmatter (título, description, fecha)
3. Escribe en Markdown normal
4. Haz `git push` → el sitio, sitemap, RSS y llms.txt se actualizan solos

## Reglas del frontmatter

- `title`: máximo 70 caracteres (límite SEO, el build te avisa si te pasas)
- `description`: entre 50 y 160 caracteres (es lo que sale en Google)
- `draft: true` oculta el post sin borrarlo
- `updatedDate`: agrégalo cuando actualices un post viejo (Google lo premia)
