// Prueba E2E del checklist «¿La IA recomienda tu negocio?» (375/768/1440 px).
// Uso: FORMS_DRY_RUN=true npm run dev  (en otra terminal)
//      PW=<ruta a playwright> node tests/e2e/checklist-ia.e2e.mjs <carpeta-capturas>
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)(process.env.PW);
const OUT = process.argv[2]; const BASE = 'http://localhost:4321';
const R = []; const check = (n, c, x = '') => R.push(`${c ? 'PASS' : 'FAIL'}  ${n}${x ? ' — ' + x : ''}`);
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const spyEvents = () => { window.__ev = []; window.gtag = (_t, name, props) => window.__ev.push(name); };
const answer = async (p, map) => { for (const [q, v] of Object.entries(map)) await p.click(`#ck-quiz input[name="${q}"][value="${v}"]`); };
const b = await chromium.launch();

// ---- A · 375 px, retail, respuestas mixtas
{
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(spyEvents);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const reqs = []; p.on('request', (r) => r.url().includes('/api/lead') && reqs.push(JSON.parse(r.postData())));
  const res = []; p.on('response', async (r) => r.url().includes('/api/lead') && res.push({ s: r.status(), b: await r.json() }));
  await p.goto(BASE + '/ia-recomienda-tu-negocio?utm_source=instagram&utm_medium=social&utm_campaign=comenta-ia', { waitUntil: 'networkidle' });
  check('375: carga sin desbordamiento', (await overflow(p)) === 0);
  check('375: aclaración visible (no audita ni predice)', (await p.textContent('.ck-hero__note')).includes('No audita automáticamente'));
  check('375: no pide correo para comenzar', (await p.$$eval('#ck-quiz input[type=email]', (e) => e.length)) === 0);
  await p.click('[data-ck-start]');
  await p.screenshot({ path: `${OUT}/375-contexto.png` });
  await p.click('[data-ck-next]');
  check('375: exige tipo de negocio', (await p.textContent('[data-ck-error]')).includes('tipo de negocio'));
  await p.selectOption('#ck-business_type', 'retail'); await p.fill('#ck-city', 'Monterrey'); await p.fill('#ck-website_url', 'minegocio.mx');
  await p.click('[data-ck-next]');
  check('375: bloque A con 2 preguntas', (await p.$$eval('.stepper__step:not([hidden]) fieldset', (f) => f.length)) === 2 && (await p.textContent('[data-ck-count]')).includes('Paso 2 de 6'));
  check('375: "No aplica" solo en Q3–Q4', (await p.$$eval('#ck-quiz input[value=na]', (e) => e.map((x) => x.name).join())) === 'q3,q4');
  await p.click('#ck-quiz input[name=q1][value=si]'); await p.click('[data-ck-next]');
  check('375: no avanza con una pregunta sin responder', (await p.textContent('[data-ck-error]')).includes('Responde las dos'));
  await answer(p, { q2: 'parcial' }); await p.screenshot({ path: `${OUT}/375-bloque.png` }); await p.click('[data-ck-next]');
  await answer(p, { q3: 'no', q4: 'no-se' }); await p.click('[data-ck-next]');
  await answer(p, { q5: 'si', q6: 'parcial' });
  await p.click('[data-ck-back]');
  check('375: Atrás conserva respuestas para editar', (await p.isChecked('#ck-quiz input[name=q3][value=no]')) && (await p.textContent('[data-ck-count]')).includes('Paso 3'));
  await p.click('#ck-quiz input[name=q4][value=no-se]'); await p.click('[data-ck-next]'); await p.click('[data-ck-next]');
  await answer(p, { q7: 'no-se', q8: 'no' }); await p.click('[data-ck-next]');
  await answer(p, { q9: 'si', q10: 'parcial' }); await p.click('[data-ck-next]');
  await p.waitForSelector('[data-ck-result-section]:not([hidden])');
  check('375: puntaje correcto 45/100', (await p.textContent('[data-ck-headline]')) === 'Preparación digital: 45/100');
  check('375: banda "Presencia inicial"', (await p.textContent('[data-ck-band]')) === 'Presencia inicial');
  check('375: "Basado en tus respuestas, no verificado automáticamente"', (await p.textContent('.ck-res__basis')).includes('no verificado automáticamente'));
  const dims = await p.$$eval('[data-ck-dims] .r', (r) => r.map((x) => x.textContent));
  check('375: dimensiones', dims.join('|') === 'Web e información propia75/100|Google Maps y visibilidad local0/100|Reputación y contenido confiable75/100|Descubrimiento en buscadores e IA0/100|Conversión y mejora75/100', dims.join(' | '));
  check('375: 2 respuestas pendientes de verificar', (await p.textContent('[data-ck-unverified]')).includes('2 respuestas pendientes'));
  const pri = await p.$$eval('[data-ck-priorities] h4', (h) => h.map((x) => x.textContent));
  check('375: top 3 por dependencia y severidad', pri.join('|') === 'Reclama y revisa tu Perfil de Empresa en Google|Comprueba cómo te encuentran buscadores e IA|Ten una página clara de tu negocio', pri.join(' | '));
  check('375: no salud → Opportunity Session, sin Maguey Salud', (await p.isVisible('[data-ck-session]')) && !(await p.isVisible('[data-ck-maguey-salud]')));
  check('375: sin desbordamiento en resultado', (await overflow(p)) === 0);
  await p.waitForTimeout(1500); await p.screenshot({ path: `${OUT}/375-resultado.png`, fullPage: true });

  // Reporte
  check('375: web del contexto precargada en el reporte', (await p.inputValue('#ckr-website_url')).includes('minegocio.mx'));
  check('375: casillas de privacidad y marketing sin premarcar', !(await p.isChecked('#ckr-consentimiento')) && !(await p.isChecked('#form-ck-reporte [name=marketing_consent]')));
  await p.click('#form-ck-reporte [data-add-links]');
  await p.fill('#ckr-linkedin_url', 'linkedin');
  await p.fill('#ckr-email', 'ana@minegocio.mx'); await p.check('#ckr-consentimiento');
  await p.click('#form-ck-reporte button[type=submit]');
  check('375: valida LinkedIn inválido sin enviar', (await p.textContent('#ckr-linkedin_url-error')).includes('LinkedIn') && reqs.length === 0);
  await p.fill('#ckr-linkedin_url', 'https://www.linkedin.com/company/minegocio');
  await p.fill('#ckr-other_url', 'directorio.com/minegocio');
  await p.waitForTimeout(2600);
  await p.click('#form-ck-reporte button[type=submit]');
  await p.waitForFunction(() => document.querySelector('#form-ck-reporte [data-form-status]')?.textContent);
  const r1 = reqs.at(-1);
  check('375: reporte envía respuestas, contexto, enlaces y UTMs; sin marketing', r1.business_type === 'retail' && r1.city === 'Monterrey' && JSON.parse(r1.answers).q8 === 'no' && r1.attribution.utm_campaign === 'comenta-ia' && !('marketing_consent' in r1) && r1.other_url === 'https://directorio.com/minegocio', JSON.stringify({ web: r1.website_url, other: r1.other_url }));
  check('375: confirmación solo tras respuesta del servidor', res.at(-1).s === 200 && (await p.getAttribute('#form-ck-reporte [data-form-status]', 'data-state')) === 'info');

  // Revisión
  await p.click('#form-ck-revision button[type=submit]');
  const inv = await p.$$eval('#form-ck-revision [aria-invalid=true]', (e) => [...new Set(e.map((x) => x.name))]);
  check('375: revisión exige nombre, email, empresa, calificación, contacto y privacidad', ['full_name', 'email', 'company', 'objective', 'role', 'start', 'budget', 'wants_contact', 'consentimiento'].every((n) => inv.includes(n)), inv.join(','));
  check('375: tipo de negocio precargado del contexto', (await p.inputValue('#ckv-business_type')) === 'retail');
  await p.fill('#ckv-full_name', 'Ana López'); await p.fill('#ckv-email', 'ana@minegocio.mx'); await p.fill('#ckv-company', 'Mi Negocio');
  for (const [k, v] of [['objective', 'leads'], ['role', 'dueno'], ['start', '1-3-meses'], ['budget', 'propuesta']]) await p.selectOption(`#ckv-${k}`, v);
  await p.check('#form-ck-revision input[name=wants_contact][value=si]'); await p.check('#ckv-consentimiento');
  await p.click('#form-ck-revision button[type=submit]');
  await p.waitForFunction(() => document.querySelector('#form-ck-revision [data-form-status]')?.textContent);
  check('375: revisión aceptada por el servidor', res.at(-1).s === 200, JSON.stringify(res.at(-1).b));
  check('375: sin desbordamiento con formularios', (await overflow(p)) === 0);
  await p.waitForTimeout(800); await p.screenshot({ path: `${OUT}/375-formularios.png`, fullPage: true });
  const ev = await p.evaluate(() => window.__ev);
  check('375: eventos checklist_view → start → complete', ['checklist_view', 'checklist_start', 'checklist_complete'].every((e) => ev.includes(e)), ev.join(','));
  check('375: en modo prueba NO se registran conversiones (report/review_requested)', !ev.includes('report_requested') && !ev.includes('review_requested'));
  check('375: sin errores JS', errs.length === 0, errs.join('|'));
  await ctx.close();
}

// ---- B · 768 px, salud 100% en línea (Maps No aplica)
{
  const p = await b.newPage({ viewport: { width: 768, height: 1024 } });
  await p.goto(BASE + '/ia-recomienda-tu-negocio', { waitUntil: 'networkidle' });
  await p.selectOption('#ck-business_type', 'salud'); await p.click('[data-ck-next]');
  const A = { q1: 'si', q2: 'si', q3: 'na', q4: 'na', q5: 'si', q6: 'si', q7: 'si', q8: 'si', q9: 'si', q10: 'no' };
  const ids = Object.keys(A);
  for (let i = 0; i < 10; i += 2) { await answer(p, { [ids[i]]: A[ids[i]], [ids[i + 1]]: A[ids[i + 1]] }); await p.click('[data-ck-next]'); }
  await p.waitForSelector('[data-ck-result-section]:not([hidden])');
  check('768: Maps "No aplica" → 88/100 sobre 8 preguntas', (await p.textContent('[data-ck-headline]')) === 'Preparación digital: 88/100');
  check('768: Maps aparece como "No aplica", no como cero', (await p.textContent('[data-ck-dims]')).includes('No aplica') && (await p.textContent('[data-ck-weight]')).includes('4 dimensiones aplicables'));
  check('768: sin prioridades de Maps', !(await p.textContent('[data-ck-priorities]')).includes('Perfil de Empresa'));
  check('768: salud → "Conocer Maguey Salud" con UTMs', (await p.isVisible('[data-ck-maguey-salud]')) && (await p.getAttribute('[data-ck-maguey-salud]', 'href')).includes('magueystudio.mx/salud?utm_source=soygermangonzalez'));
  check('768: sin desbordamiento', (await overflow(p)) === 0);
  await p.waitForTimeout(1500); await p.screenshot({ path: `${OUT}/768-resultado.png`, fullPage: true });
  await p.close();
}

// ---- C · 1440 px solo teclado, todo Sí
{
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(BASE + '/ia-recomienda-tu-negocio', { waitUntil: 'networkidle' });
  await p.focus('#ck-business_type'); await p.keyboard.press('ArrowDown'); await p.selectOption('#ck-business_type', 'servicios-profesionales');
  await p.focus('#ck-city'); await p.keyboard.type('Puebla'); await p.keyboard.press('Enter');
  for (let i = 1; i <= 10; i++) {
    await p.focus(`#ck-quiz input[name="q${i}"][value="si"]`); await p.keyboard.press('Space');
    if (i % 2 === 0) { await p.keyboard.press('Enter'); await p.waitForTimeout(60); }
  }
  await p.waitForSelector('[data-ck-result-section]:not([hidden])');
  check('1440: solo teclado → 100/100 "Base digital sólida"', (await p.textContent('[data-ck-headline]')) === 'Preparación digital: 100/100' && (await p.textContent('[data-ck-band]')) === 'Base digital sólida');
  check('1440: foco en el título del resultado', (await p.evaluate(() => document.activeElement?.id)) === 'ck-result-title');
  check('1440: todo Sí → 3 acciones "Mantener"', (await p.$$eval('.tag--keep', (e) => e.length)) === 3);
  await p.click('[data-ck-restart]');
  check('1440: Volver a empezar limpia respuestas', (await p.$$eval('#ck-quiz input:checked', (e) => e.length)) === 0 && (await p.textContent('[data-ck-count]')).includes('Paso 1'));
  await p.goto(BASE + '/builder-lab', { waitUntil: 'networkidle' });
  check('Builder Lab enlaza al checklist', (await p.locator('a[href="/ia-recomienda-tu-negocio"]').count()) >= 1);
  await p.goto(BASE + '/builder-lab/ia-recomienda-tu-negocio', { waitUntil: 'networkidle' });
  check('/builder-lab/ia-recomienda-tu-negocio redirige', p.url().endsWith('/ia-recomienda-tu-negocio'));
  await p.close();
}
await b.close();
console.log(R.join('\n')); console.log(`\n${R.filter((r) => r.startsWith('PASS')).length}/${R.length} PASS`);
