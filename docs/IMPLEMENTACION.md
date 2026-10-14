# Implementación — Sitio Germán González · Business Builder

Fuente de requisitos: *Website Blueprint V3*. Referencia visual: *Prototipo Web Responsive V3*.

## 1. Análisis del repositorio

| Elemento | Estado inicial | Decisión |
|---|---|---|
| Stack | Astro 5 + MDX + sitemap + RSS (template con SEO/GEO) | **Se conserva.** Astro genera HTML estático (SSG) → velocidad y SEO. El Blueprint pide conservar el stack existente. |
| SEO | `SEO.astro`, schemas JSON-LD, robots/llms.txt dinámicos | Se conserva y extiende: `fullTitle` por ruta, `Person` (en vez de `Organization`), `Event` solo para eventos reales, breadcrumbs visibles. |
| Blog | `src/content/blog` → `/blog` | Se mantiene la colección y se sirve en **`/builder-lab/[slug]`**. `/blog` redirige a `/builder-lab`. |
| Assets | Imágenes del deck, logos y foto subidos a `/public` | Movidos a `src/assets/` para optimización automática (WebP, `srcset`, dimensiones reservadas). |
| Formularios / hosting | No existían | Endpoint serverless `/api/lead` con adaptador de **Vercel** (cambiar de proveedor = cambiar 1 línea del adaptador). |

## 2. Arquitectura

```
src/
├── config/site.config.ts      ← datos del sitio, navegación, redes, analytics, fuentes
├── data/content.ts            ← copy estructurado del Blueprint (capacidades, método, formación…)
├── content/                   ← CMS (Markdown validado con Zod en content.config.ts)
│   ├── blog/                  → /builder-lab/[slug]
│   ├── proyectos/             → /proyectos y /proyectos/[slug]
│   ├── recursos/              → /builder-lab/recursos (solo con recursos reales)
│   └── eventos/               → /builder-lab/eventos/[slug] (solo eventos reales)
├── components/
│   ├── layout/   SiteHeader (incluye MobileNav), SiteFooter
│   ├── sections/ HomeHero, TwoPaths, CapabilityGrid, MethodSteps, FeaturedProjects, BuilderLabTeaser, AboutTeaser
│   ├── ui/       SectionHeading, PageHero, CTABanner, StatusLabel, Breadcrumbs, ProjectCard, PostCard,
│   │             ResourceCard, EventCard, CategoryFilter, DraftBanner
│   ├── forms/    ContactForm, SpeakerInquiryForm, NewsletterSignup, Field, Consent, FormMeta
│   └── schema/   Person, WebSite, Article, Breadcrumb, Event, FAQ
├── lib/          leads.ts (modelo Lead + validación servidor), drafts.ts, format.ts
├── scripts/      forms.ts (estados accesibles), analytics.ts (eventos + UTM)
├── pages/        rutas reales (ver §3) + api/lead.ts
└── styles/global.css           ← tokens de diseño (colores, tipografía, espaciado)
```

Business Building y Builder Lab comparten los mismos componentes y estilos; Builder Lab solo cambia el acento (verde lima) mediante props (`variant="lab"`, `lime`).

## 3. Rutas

| Ruta | Estado |
|---|---|
| `/` | ✅ H01–H09 completos |
| `/que-hago` | ✅ |
| `/proyectos` | ✅ 6 proyectos (tarjetas) |
| `/proyectos/[slug]` | ✅ plantilla; los 3 casos actuales son **borradores** (solo visibles en dev/preview, `noindex`) |
| `/builder-lab` | ✅ BL01–BL09 |
| `/builder-lab/[slug]` | ✅ plantilla; hay 1 post de **EJEMPLO** con `draft: true` |
| `/builder-lab/recursos` | ✅ `noindex` y fuera del sitemap mientras no haya recursos reales |
| `/builder-lab/eventos/[slug]` | ✅ plantilla; no se genera ninguna página hasta que exista un evento real |
| `/builder-lab/conferencias` | ✅ con formulario especializado |
| `/sobre-mi`, `/contacto` | ✅ |
| `/aviso-de-privacidad` | ⚠️ borrador, requiere revisión legal |
| `/admin` | CMS (Decap), `noindex` |

## 4. Borradores y contenido de ejemplo

- `npm run dev` muestra borradores con un banner coral **BORRADOR / EJEMPLO** y `noindex`.
- En un deploy de *preview* se ven definiendo `PUBLIC_SHOW_DRAFTS=true`.
- En producción **nunca** se generan: no entran a sitemap, RSS ni `llms.txt`.
- Temas tentativos de Builder Lab y colecciones de recursos se muestran como **«En preparación»**, sin enlace.

## 5. Formularios y leads

Un solo endpoint `POST /api/lead` para `contacto`, `conferencia` y `builder-drops`:

- Validación en cliente (HTML5 + mensajes accesibles) y en servidor (Zod, `src/lib/leads.ts`).
- Antispam: honeypot, tiempo mínimo de llenado, verificación de `Origin`, límite de tamaño.
- Rate limiting: 5 envíos / 10 min por IP y formulario (memoria de la función; para un límite global usar Vercel Firewall o Upstash).
- Entrega: `POST` JSON del **Lead** (modelo §10 del Blueprint, incl. UTM y `privacyConsentAt`) al webhook configurado.
- Sin webhook configurado responde `503` y el formulario muestra un error: **nunca aparenta completarse**.

### Variables de entorno (solo servidor)

| Variable | Uso |
|---|---|
| `LEAD_WEBHOOK_URL` | Destino de leads de contacto y conferencias (CRM, Make, Zapier, n8n, HubSpot…). |
| `NEWSLETTER_WEBHOOK_URL` | Destino de suscripciones a Builder Drops (si se omite usa `LEAD_WEBHOOK_URL`). |
| `LEAD_WEBHOOK_SECRET` | Se envía como cabecera `X-Webhook-Secret` para que el destino verifique el origen. |
| `FORMS_DRY_RUN` | `true` = modo prueba: valida y responde OK sin enviar nada (la UI lo indica). |
| `PUBLIC_SHOW_DRAFTS` | `true` solo en previews para revisar borradores. |

Copia `.env.example` a `.env` para desarrollo local.

## 6. Analítica

- GA4 o Plausible se activan llenando `analytics` en `site.config.ts`; vacío = no se carga nada.
- Eventos: `contact_submit_success`, `conference_inquiry_success`, `builder_drops_signup_success` (solo tras respuesta `ok` real del servidor, nunca en modo prueba), `resource_download` (clic en descarga real).
- `event_signup_success` debe dispararse desde la confirmación de la plataforma de registro (Fase 3), no al hacer clic.
- UTM y página de entrada se guardan en `sessionStorage` y viajan con cada Lead.

## 7. Tipografía

- **Manrope** (párrafos): licencia OFL, autoalojada vía `@fontsource-variable/manrope` (sin peticiones a Google).
- **Nimbus Sans** (títulos): fuente comercial, **no incluida**. Si se licencia en Adobe Fonts, pega el ID del kit en `SITE.fonts.adobeKitId` y se carga sola. Mientras tanto se usa el fallback Helvetica Neue / Helvetica / Arial (mismas métricas de la familia grotesca).

## 8. CMS (Decap)

`/admin` edita publicaciones, proyectos, recursos y eventos; cada guardado es un commit/PR en GitHub y Vercel redepliega. Para activarlo:

1. Crear una OAuth App en GitHub (Settings → Developer settings).
2. Desplegar un proveedor OAuth para Decap (p. ej. `decap-proxy` en Cloudflare Workers o un endpoint en Vercel) y poner su URL en `base_url` de `public/admin/config.yml`.
3. Dar acceso de escritura al repositorio a quien vaya a editar.

## 9. Fases

| Fase | Alcance | Estado |
|---|---|---|
| **MVP** | Home, Qué hago, Proyectos, Builder Lab (presentación + suscripción), Sobre mí, Contacto, aviso de privacidad, SEO inicial, responsive | ✅ Implementado. Falta conectar webhooks, validar contenidos y legal. |
| **Fase 2** | CMS, artículos, recursos, conferencias con formulario, Builder Drops automatizado, medición y UTMs | ✅ Infraestructura lista (CMS, colecciones, formulario de conferencias, eventos de analítica, UTM). Falta: OAuth del CMS, plataforma de correo, contenido real. |
| **Fase 3** | Eventos programados, registros, cursos y pagos | 🟡 Plantilla de evento + schema `Event` listos; registro/pagos solo cuando haya oferta, fecha y condiciones. |

## 10. Calidad

- `npm run check` (TypeScript) y `npm run build` sin errores.
- Sin overflow horizontal a 360, 390, 768, 1024 y 1440 px.
- Navegación por teclado, *skip link*, `aria-current`, menú móvil con `aria-expanded` y cierre con Esc, foco visible, `prefers-reduced-motion`.
- Imágenes WebP responsivas con dimensiones reservadas; hero con `fetchpriority="high"`; resto `lazy`.

## 11. Motion (animaciones)

Librería [Motion](https://motion.dev) v12 (API vanilla, sin React) en `src/scripts/motion.ts`, cargada en todas las páginas desde `BaseLayout`:

- **Aparición al hacer scroll** de encabezados, tarjetas, pasos del método, paneles y contenido de artículos; las rejillas aparecen en cascada.
- **Hero**: entrada del texto en CSS (no retrasa el LCP), imagen con asentamiento lento y parallax ligado al scroll.
- **Anillos de Builder Lab** con deriva al hacer scroll; **header** que se compacta y gana sombra al bajar.
- **Barra de progreso de lectura** en publicaciones; respuesta táctil en botones; cascada al usar el filtro de Builder Lab.
- **Transiciones entre páginas** con View Transitions (CSS, navegadores compatibles).

Reglas: solo `transform`/`opacity`; solo se ocultan elementos fuera de pantalla (sin parpadeos ni CLS); sin JS todo se ve; con `prefers-reduced-motion` no se ejecuta ninguna animación. Para excluir un bloque, quítalo de los selectores `GROUPS`/`SINGLES` del script.
