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
- [ ] **URL de agenda** para Opportunity Session (`SITE.bookingUrl`). Vacía = el formulario es el fallback.

## Proyectos

- [ ] Ópticas Jarmar, Life Agent, Maguey Studio: casos en **borrador** con solo información del Blueprint. Completar *Qué se construyó*, *rol exacto*, *estado*, *evidencia* (si existe) y *aprendizajes*; luego `published: true`.
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

## Legal

- [ ] **Aviso de privacidad**: es un borrador (LFPDPPP). Completar domicilio, correo ARCO, proveedores y analítica; revisión por abogado. Mientras tanto la página muestra un banner visible.

## Repositorio

- [ ] Agregar el topic `maguey-cliente` al repo en GitHub (Settings → About → Topics).
