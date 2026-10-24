# Pendientes de validación antes de producción

Nada de esta lista se inventó en el sitio: donde falta información, el elemento no se muestra o queda marcado como borrador.

## Datos y decisiones de Germán

- [x] **Dominio final:** `www.soygermangonzalez.com` (canónico; la raíz redirige a www en Vercel). DNS en GoDaddy: `A @ 216.198.79.1` y `CNAME www → e9615b126d3d5b1a.vercel-dns-017.com`.
- [ ] **Correo público de contacto** (`SITE.business.email`). Vacío = no se muestra.
- [ ] **Redes sociales** (`SITE.socials`). Vacías = no se muestran.
- [ ] **Licencia de Nimbus Sans** (Adobe Fonts u otra). Mientras tanto: Helvetica/Arial.
- [ ] **Colores finales de marca** (se usan los provisionales del Blueprint).
- [ ] **Favicon** provisional («G» + punto celeste) y **OG image** generada con el hero + logo.
- [ ] **Autorización de imágenes del deck** (hero, método, puente) y de la **fotografía personal**.
- [x] **URL de agenda** (`SITE.bookingUrl`): Google Calendar, visible en /contacto.

## Proyectos

- [ ] Ópticas Jarmar, Life Agents AI, Maguey Studio: casos en **borrador** con solo información del Blueprint. Completar *Qué se construyó*, *rol exacto*, *estado*, *evidencia* (si existe) y *aprendizajes*; luego `published: true`.
- [ ] Möbelcat, LN41.5 Travel, FlowFi: descripciones tomadas del **prototipo**, confirmar texto, estado y rol.
- [ ] Imágenes/logos autorizados de proyectos (`approvedMedia`).

## Copy de apoyo (no viene literal del Blueprint, validar)

- Qué hago: H2 «Estrategia, ejecución y aliados.» y su párrafo; textos cortos de cada paso del modelo comercial; descripción de la capacidad «Experiencias».
- Contacto: «Con tu respuesta preparo una primera conversación…».
- Conferencias: H2 «Temas.», «Se adapta a tu evento.», «Cuéntame sobre tu evento.».
- Sobre mí: tarjetas de cierre (proyectos / Builder Lab).
- Mensajes de confirmación de formularios.

## Integraciones

- [ ] **CRM / destino de leads** → `LEAD_WEBHOOK_URL`.
- [ ] **Plataforma de correo** para Builder Drops (doble opt-in recomendado) → `NEWSLETTER_WEBHOOK_URL`.
- [ ] **Analytics** (GA4 o Plausible) y alta en **Google Search Console**.
- [ ] **OAuth del CMS** (ver `docs/IMPLEMENTACION.md` §8).
- [ ] **Hosting**: el adaptador es Vercel; confirmar proyecto y dominio.

## Diagnóstico para clínicas

- [ ] **Destino de leads del diagnóstico** → `DIAGNOSTIC_WEBHOOK_URL` (CRM/automatización de Maguey Salud) y automatización que envíe el reporte por correo.
- [ ] **Aviso de privacidad de Maguey Studio Salud** y su razón social (los datos de las revisiones se comparten con Maguey).
- [ ] Validar copy de apoyo: textos de las recomendaciones, «Una persona del equipo revisa tu ficha de Google, tu sitio y tus redes…» y la descripción de Maguey Salud.
- [ ] Validar ponderaciones de `lead_score` (heurísticas en `src/lib/diagnostic/scoring.ts`).

## Checklist «¿Cuántas ventas se te escapan entre WhatsApp y el seguimiento?»

- [x] Validar las 12 preguntas, los 4 rangos y los textos de las 8 recomendaciones (`src/lib/ventas-whatsapp/`). Aprobados por Germán.
- [x] Mención de Life Agents AI en el resultado (nombre confirmado por Germán).
- [ ] Razón social de Life Agents AI para el aviso de privacidad.

## Checklist «¿La IA recomienda tu negocio?»

- [ ] **Destino de leads** → `AI_CHECKLIST_WEBHOOK_URL` (CRM) y automatización del correo con el resultado.
- [ ] Validar textos de las 7 recomendaciones y de «Una persona del equipo revisa tu caso…».
- [ ] Validar ponderaciones de `commercial_fit_score` (`src/lib/checklist-ia/scoring.ts`).
- [ ] Revisar periódicamente las 3 fuentes oficiales (consultadas en octubre de 2026) y actualizar la fecha.

## Legal

- [ ] **Aviso de privacidad**: es un borrador (LFPDPPP). Completar domicilio, correo ARCO, proveedores y analítica; revisión por abogado. Mientras tanto la página muestra un banner visible.

## Repositorio

- [ ] Agregar el topic `maguey-cliente` al repo en GitHub (Settings → About → Topics).

## Funnel diagnóstico / checklist → llamada (octubre 2026)

- [x] **Formspree** conectado: `https://formspree.io/f/xvkkpjlp` (`formspreeEndpoint` en `src/config/site.config.ts`).
- [ ] (Recomendado) En Formspree: activar notificación por correo y, si se quiere, la integración con Google Sheets o el CRM.
