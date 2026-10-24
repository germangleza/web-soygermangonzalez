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

## 12. Diagnóstico de Visibilidad Digital para Clínicas (`/diagnostico-clinicas`)

Recurso de Builder Lab (también en `/builder-lab/diagnostico-clinicas`, que redirige). CTA en Home, Qué hago, Builder Lab y footer.

| Pieza | Archivo |
|---|---|
| Preguntas, opciones, especialidades y calificación comercial (datos tipados) | `src/lib/diagnostic/questions.ts` |
| Puntuación, rangos, recomendaciones y `lead_score` (funciones puras) | `src/lib/diagnostic/scoring.ts` |
| Normalización/validación de URLs y redes (sin fetch del servidor → sin SSRF) | `src/lib/diagnostic/urls.ts` |
| Validación de servidor y registro `DiagnosticLead` | `src/lib/leads.ts` (`diagnostico-reporte`, `diagnostico-revision`) |
| UI | `src/components/diagnostic/*`, `src/scripts/diagnostic.ts`, `src/pages/diagnostico-clinicas.astro` |
| Pruebas | `tests/diagnostic.test.ts` (`npm test`) |

**Flujo:** cuestionario anónimo → resultado inmediato (puntuación global y por área, rango, «No sé» marcado como pendiente, 3 recomendaciones) → dos acciones separadas: *Enviar mi reporte* (solo email obligatorio; marketing opcional en casilla aparte) y *Solicitar revisión personalizada* (datos de la clínica + calificación comercial interna).

**Integración (reutiliza `/api/lead`):** el servidor **recalcula** la puntuación con las respuestas (no confía en el cliente) y envía el `DiagnosticLead` a `DIAGNOSTIC_WEBHOOK_URL` (o `LEAD_WEBHOOK_URL` si no existe). Campos clave para el CRM:

- `requested_report` / `requested_review` / `maguey_salud_review` / `priority_contact` → identifican quién pidió evaluación comercial con Maguey Studio Salud.
- `lead_score`, `lead_segment` (A ≥75, B 50–74, C <50), `lead_score_breakdown` → solo en revisiones; nunca se muestran al visitante.
- `dedupe_key` (= email) → el CRM debe hacer *upsert* por email y conservar el historial e UTMs.
- `top_recommendations` (título, área, por qué, primera acción) → contenido listo para el correo del reporte.

**Pendiente de conectar (no existe aún en el proyecto):** CRM y plataforma de correo. La automatización que reciba el webhook debe (1) crear/actualizar el contacto, (2) enviar el reporte cuando `requested_report = true` y (3) notificar al equipo de Maguey cuando `requested_review = true`. Los eventos `meeting_booked`, `proposal_sent` y `customer_won` solo se registrarán cuando exista esa integración real.

**Analítica:** `diagnostic_started`, `diagnostic_completed` (con puntuación, sin PII), `report_requested`, `review_requested` (solo tras respuesta `ok` del servidor).

## 13. Checklist «¿La IA recomienda tu negocio?» (`/ia-recomienda-tu-negocio`)

Lead magnet v2.0, recurso de Builder Lab (también `/builder-lab/ia-recomienda-tu-negocio`, que redirige). Reutiliza el endpoint `/api/lead`, los formularios, la validación de enlaces (`src/scripts/link-fields.ts`, compartido con el diagnóstico de clínicas) y la analítica.

| Pieza | Archivo |
|---|---|
| Preguntas, bloques, tipos de negocio, calificación comercial y fuentes | `src/lib/checklist-ia/questions.ts` |
| `digital_readiness_score`, regla de No aplica, top 3 y `commercial_fit_score` (puras) | `src/lib/checklist-ia/scoring.ts` |
| Validación de servidor y `ChecklistLead` | `src/lib/leads.ts` (`checklist-ia-reporte`, `checklist-ia-revision`) |
| UI (QuizStepper, QuestionCard, ScoreSummary, ReportForm, ReviewForm) | `src/components/checklist-ia/*`, `src/scripts/checklist-ia.ts` |
| Pruebas | `tests/checklist-ia.test.ts`, `tests/e2e/checklist-ia.e2e.mjs` |

- **Puntaje:** Sí 2 · Parcial 1 · No 0 · No sé 0 (pendiente de verificar). `score = round(puntos válidos / (2 × preguntas válidas) × 100)`. Solo Q3–Q4 admiten «No aplica» (negocio 100% en línea): se excluyen del denominador y Maps se muestra como «No aplica».
- **Prioridades:** oportunidades confirmadas (No antes que Parcial) en orden de dependencia web → Maps → confianza/contenido → buscadores e IA → conversión/mejora; luego «Verifica…» para los «No sé»; si todo es Sí, acciones de mantenimiento.
- **Dos puntajes separados:** `digital_readiness_score` (visible) y `commercial_fit_score` (interno, solo en revisiones; A ≥75, B 50–74, C <50; `qualified_lead` = quiere contacto y segmento A/B).
- **Enrutamiento:** `lead_interest = health` si el negocio es de salud → CTA «Conocer Maguey Salud»; otros sectores → revisión de Maguey Studio u Opportunity Session.
- **Destino:** `AI_CHECKLIST_WEBHOOK_URL` (o `LEAD_WEBHOOK_URL`). Privacidad obligatoria y marketing opcional, ambos sin premarcar; pedir el reporte no implica marketing.
- **Eventos:** `checklist_view`, `checklist_start`, `checklist_complete`, `report_requested`, `review_requested` (solo con respuesta real del servidor). `qualified_lead`, `meeting_booked` y `customer_won` se registran en el CRM.

## 14. Recurso «3 prompts para vender beneficios, no características»

- Ruta: `/builder-lab/3-prompts-valor`, publicación MDX en «Lo que estoy explorando» (`src/content/blog/3-prompts-valor.mdx`, contenido en `src/components/ui/PromptsValor.astro`). La URL anterior `/builder-lab/recursos/3-prompts-valor` redirige aquí. Sin registro; CTA final «Agenda una llamada» (`ctaType: agenda` → `SITE.bookingUrl`).
- Copy y prompts: `src/data/prompts-valor.ts` (única fuente: lo que se ve es lo que se copia).
- Componente reutilizable: `src/components/ui/CopyPromptCard.astro` + `src/scripts/copy-text.ts` (Clipboard API → fallback `execCommand` → selección manual con mensaje visible; estado en `aria-live`).
- Analítica (solo si GA4/Plausible están configurados): `resource_view` y `prompt_copied` con `resource_id=3-prompts-valor` y `prompt_number`; nunca se envía el texto copiado.
- Link para el DM del Reel (palabra VALOR): `https://www.soygermangonzalez.com/builder-lab/3-prompts-valor?utm_source=instagram&utm_medium=dm&utm_campaign=reel_meta_valor`
- Prueba E2E: `tests/e2e/prompts-valor.e2e.mjs`.

## 15. Checklist «¿Cuántas ventas se te escapan entre WhatsApp y el seguimiento?» (`/ventas-por-whatsapp`)

Lead magnet de IA y automatización (ejecución: Life Agents AI). Recurso de Builder Lab (también `/builder-lab/ventas-por-whatsapp`, que redirige). Mismo flujo y componentes que el checklist de IA: checklist → resultado → formulario corto → calendario.

| Pieza | Archivo |
|---|---|
| 12 preguntas en 4 áreas (Respuesta, Seguimiento, Registro y medición, Operación diaria), volúmenes y enfoques | `src/lib/ventas-whatsapp/questions.ts` |
| Puntaje, rangos y top 3 (puras) | `src/lib/ventas-whatsapp/scoring.ts` |
| UI | `QuizStepper`, `QuestionCard` y `ScoreSummary` de `src/components/checklist-ia/` (con props), `src/scripts/ventas-whatsapp.ts` |
| Pruebas | `tests/ventas-whatsapp.test.ts` |

- **Puntaje:** Sí 2 · Parcial 1 · No 0 · No sé 0 (pendiente de verificar); cada área pesa 25%. No calcula ventas perdidas en pesos (no hay tasas de pérdida verificables).
- **Prioridades:** No antes que Parcial, en orden contestar → que no dependa de un celular → seguimiento → CRM → respuestas listas → cotización → recordatorios → medición; luego «Verifica…»; si todo es Sí, mantener.
- **Agenda:** `AgendaForm kind="atencion"`: WhatsApp (para ligar el registro con la cita), nombre del negocio, mensajes o consultas que llegan y qué resolver primero. Mismo Formspree (`SITE.formspreeEndpoint`) con `origen = ventas-por-whatsapp`, `volumen_texto`, `enfoque_texto`, `resultado` y UTM.
- **Eventos:** `checklist_view`, `checklist_start`, `checklist_complete` con `source = ventas-por-whatsapp`; `booking_form_submit` con `source` y `kind = atencion`.

