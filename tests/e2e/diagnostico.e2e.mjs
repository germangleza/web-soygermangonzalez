// Prueba E2E del Diagnóstico de clínicas (375/768/1440 px).
// Uso: FORMS_DRY_RUN=true npm run dev  (en otra terminal)
//      PW=<ruta a playwright> node tests/e2e/diagnostico.e2e.mjs <carpeta-capturas>
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)(process.env.PW);
const OUT = process.argv[2];
const BASE = 'http://localhost:4321';
const results = [];
const check = (name, cond, extra = '') => results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const b = await chromium.launch();

// Respuestas del escenario A → esperado: 40/100, Presencia inicial, débil = Sitio web, 2 "No sé".
const A = { q1: 'completa', q2: 'parcial', q3: 'nunca', q4: 'no', q5: 'no-se', q6: 'mejoras', q7: 'ocasional', q8: 'no', q9: 'a-veces', q10: 'parcial', q11: 'no-se', q12: 'parcial', q13: 'facil', q14: 'mismo-dia', q15: 'manual' };

// ---------------- Móvil 375 px
{
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const reqs = []; p.on('request', (r) => r.url().includes('/api/lead') && reqs.push(JSON.parse(r.postData())));
  const resps = []; p.on('response', async (r) => r.url().includes('/api/lead') && resps.push({ status: r.status(), body: await r.json() }));
  await p.goto(BASE + '/diagnostico-clinicas?utm_source=instagram&utm_medium=social&utm_campaign=reel-ia&utm_content=video1', { waitUntil: 'networkidle' });
  check('375: página carga sin desbordamiento', (await overflow(p)) === 0);
  check('375: formularios ocultos antes del resultado', !(await p.isVisible('#form-dx-reporte')));
  check('375: aclaración de no-garantía visible', (await p.textContent('.dx-hero__note')).includes('ni garantiza aparecer o ser recomendado'));
  await p.click('[data-dx-start]');
  await p.screenshot({ path: `${OUT}/375-pregunta.png` });
  await p.click('[data-dx-next]');
  check('375: no avanza sin responder y muestra error', (await p.textContent('[data-dx-error]')).includes('Elige una opción') && (await p.textContent('[data-dx-count]')).startsWith('Pregunta 1'));
  const ids = Object.keys(A);
  for (let i = 0; i < ids.length; i++) {
    await p.click(`input[name="${ids[i]}"][value="${A[ids[i]]}"]`);
    if (i === 3) { // probar Atrás
      await p.click('[data-dx-back]');
      check('375: Atrás regresa a la pregunta anterior', (await p.textContent('[data-dx-count]')).startsWith('Pregunta 3'));
      await p.click('[data-dx-next]');
    }
    await p.click('[data-dx-next]');
    await p.waitForTimeout(60);
  }
  await p.waitForSelector('[data-dx-result-section]:not([hidden])');
  const headline = await p.textContent('[data-dx-headline]');
  check('375: puntuación global correcta (40/100)', headline === 'Tu clínica obtuvo 40/100', headline);
  check('375: rango "Presencia inicial"', (await p.textContent('[data-dx-band]')) === 'Presencia inicial');
  check('375: principal oportunidad = Sitio web', (await p.textContent('[data-dx-weakest]')) === 'Tu principal oportunidad está en Sitio web.');
  const dims = await p.$$eval('[data-dx-dims] .dims__row', (r) => r.map((x) => x.textContent));
  check('375: puntuación por dimensión', JSON.stringify(dims) === JSON.stringify(['Google Maps50/100', 'Sitio web17/100', 'Reseñas y reputación33/100', 'Información pública para buscadores e IA33/100', 'Contacto y seguimiento67/100']), dims.join(' | '));
  const recs = await p.$$eval('[data-dx-recs] h4', (h) => h.map((x) => x.textContent));
  check('375: 3 recomendaciones basadas en respuestas', recs.length === 3 && /sitio web propio/i.test(recs[0]) && /reseñas/i.test(recs[1]) && /servicios y especialistas/i.test(recs[2]), recs.join(' | '));
  check('375: recomendación por "No sé" marcada "Primero verifica"', (await p.$$eval('.rec', (r) => r.map((x) => !!x.querySelector('.rec__verify')))).join() === 'false,false,true');
  check('375: aviso de "No sé" (2 preguntas)', (await p.textContent('[data-dx-unknown]')).includes('2 preguntas'));
  check('375: rango actual marcado con texto, no solo color', (await p.textContent('.scale li.is-current')).includes('Tu rango'));
  check('375: resultado sin pedir email (formularios visibles después)', await p.isVisible('#form-dx-reporte'));
  check('375: CTA Maguey Salud con UTMs', (await p.getAttribute('[data-dx-maguey]', 'href')) === 'https://www.magueystudio.mx/salud?utm_source=soygermangonzalez&utm_medium=referral&utm_campaign=diagnostico-clinicas&utm_content=resultado');
  check('375: sin desbordamiento en el resultado', (await overflow(p)) === 0);
  await p.waitForTimeout(1500); await p.screenshot({ path: `${OUT}/375-resultado.png`, fullPage: true });

  // Persistencia en sesión
  await p.reload({ waitUntil: 'networkidle' });
  check('375: al recargar conserva el resultado', (await p.textContent('[data-dx-headline]')) === 'Tu clínica obtuvo 40/100' && (await p.isVisible('[data-dx-result-section]')));

  // ---- Formulario A: reporte
  await p.fill('#dxr-instagram_url', 'https://facebook.com/x');
  await p.fill('#dxr-email', 'dra@clinica.mx');
  await p.check('#dxr-consentimiento');
  await p.click('#form-dx-reporte button[type=submit]');
  check('375: reporte valida Instagram inválido en el cliente', (await p.textContent('#dxr-instagram_url-error')).includes('Instagram') && reqs.length === 0);
  await p.fill('#dxr-instagram_url', '@clinica.sonrisa');
  await p.fill('#dxr-website_url', 'clinicasonrisa.mx');
  await p.locator('#dxr-website_url').blur();
  check('375: normaliza dominio al salir del campo', (await p.inputValue('#dxr-website_url')) === 'https://clinicasonrisa.mx');
  await p.waitForTimeout(2600);
  await p.click('#form-dx-reporte button[type=submit]');
  await p.waitForFunction(() => document.querySelector('#form-dx-reporte [data-form-status]')?.textContent);
  const r1 = reqs.at(-1);
  check('375: reporte envía respuestas + UTMs + datos opcionales', JSON.parse(r1.answers).q4 === 'no' && r1.attribution.utm_campaign === 'reel-ia' && r1.instagram_url === 'https://www.instagram.com/clinica.sonrisa' && !('marketing_consent' in r1), JSON.stringify({ ig: r1.instagram_url, web: r1.website_url }));
  check('375: confirmación solo tras respuesta del servidor', resps.at(-1).status === 200 && (await p.getAttribute('#form-dx-reporte [data-form-status]', 'data-state')) === 'info', JSON.stringify(resps.at(-1).body));
  await p.screenshot({ path: `${OUT}/375-reporte-enviado.png` });

  // ---- Formulario B: revisión
  await p.click('#form-dx-revision button[type=submit]');
  const invalid = await p.$$eval('#form-dx-revision [aria-invalid=true]', (e) => e.map((x) => x.name));
  check('375: revisión exige nombre, email, clínica, ciudad, tipo, reto, calificación y consentimiento', ['full_name', 'email', 'clinic_name', 'city', 'specialty', 'challenge', 'role', 'priority', 'start', 'authorizer', 'investment', 'consentimiento'].every((n) => invalid.includes(n)), invalid.join(','));
  check('375: redes extra ocultas hasta "Agregar otra red"', !(await p.isVisible('#dxv-tiktok_url')));
  await p.click('#form-dx-revision [data-add-links]');
  check('375: "Agregar otra red" muestra TikTok/LinkedIn/WhatsApp', await p.isVisible('#dxv-tiktok_url') && await p.isVisible('#dxv-business_whatsapp'));
  await p.fill('#dxv-full_name', 'Dra. Ana Pérez');
  await p.fill('#dxv-email', 'ana@clinicasonrisa.mx');
  await p.fill('#dxv-clinic_name', 'Clínica Sonrisa');
  await p.fill('#dxv-city', 'Monterrey, N.L.');
  await p.selectOption('#dxv-specialty', 'odontologia');
  await p.fill('#dxv-challenge', 'Queremos que más pacientes nuevos nos encuentren en Google.');
  for (const [k, v] of [['role', 'propietario'], ['priority', 'google-ia'], ['start', 'este-mes'], ['authorizer', 'yo'], ['investment', 'evaluando']]) await p.selectOption(`#dxv-${k}`, v);
  await p.check('#form-dx-revision [data-no-website]');
  check('375: "No tengo sitio web" deshabilita el campo', await p.isDisabled('#dxv-website_url'));
  await p.fill('#dxv-google_business_url', 'https://maps.app.goo.gl/AbC123');
  await p.fill('#dxv-tiktok_url', '@clinicasonrisa');
  await p.fill('#dxv-business_whatsapp', '+52 81 1234 5678');
  await p.check('#dxv-consentimiento');
  await p.click('#form-dx-revision button[type=submit]');
  await p.waitForFunction(() => document.querySelector('#form-dx-revision [data-form-status]')?.textContent);
  const r2 = reqs.at(-1);
  check('375: revisión envía calificación, no_website y enlaces', r2.formType === 'diagnostico-revision' && r2.no_website === 'true' && !('website_url' in r2) && r2.role === 'propietario' && r2.google_business_url.includes('goo.gl'));
  check('375: revisión confirmada por el servidor', resps.at(-1).status === 200, JSON.stringify(resps.at(-1).body));
  check('375: "No tengo web" pasa el sitio propio a prioridad 1', /sitio web propio/i.test(await p.textContent('[data-dx-recs] h4')));
  check('375: sin desbordamiento con formularios abiertos', (await overflow(p)) === 0);
  await p.waitForTimeout(800); await p.screenshot({ path: `${OUT}/375-formularios.png`, fullPage: true });

  // Reiniciar
  await p.click('[data-dx-restart]');
  check('375: Reiniciar vuelve a la pregunta 1 sin respuestas', (await p.textContent('[data-dx-count]')).startsWith('Pregunta 1') && (await p.$$eval('#dx-quiz input:checked', (e) => e.length)) === 0 && !(await p.isVisible('[data-dx-result-section]')));
  check('375: sin errores JS', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// ---------------- Tablet 768 px: overflow + escenario "todo No sé"
{
  const p = await b.newPage({ viewport: { width: 768, height: 1024 } });
  await p.goto(BASE + '/diagnostico-clinicas', { waitUntil: 'networkidle' });
  check('768: sin desbordamiento en el cuestionario', (await overflow(p)) === 0);
  for (let i = 1; i <= 15; i++) { await p.click(`#dx-quiz input[name="q${i}"][value^="no-se"]`); await p.click('[data-dx-next]'); }
  await p.waitForSelector('[data-dx-result-section]:not([hidden])');
  check('768: 15 "No sé" → 0/100 y aviso de verificación', (await p.textContent('[data-dx-headline]')) === 'Tu clínica obtuvo 0/100' && (await p.textContent('[data-dx-weakest]')).startsWith('Varios aspectos requieren verificación'));
  check('768: todas las recomendaciones piden verificar', (await p.$$eval('.rec__verify', (e) => e.length)) === 3);
  check('768: sin desbordamiento en resultado', (await overflow(p)) === 0);
  await p.screenshot({ path: `${OUT}/768-resultado.png`, fullPage: true });
  await p.close();
}

// ---------------- Escritorio 1440 px, solo teclado: todo en la mejor opción → 100
{
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(BASE + '/diagnostico-clinicas', { waitUntil: 'networkidle' });
  await p.focus('#dx-quiz input[name="q1"]');
  for (let i = 1; i <= 15; i++) {
    await p.focus(`#dx-quiz input[name="q${i}"]`);
    await p.keyboard.press('Space');
    await p.keyboard.press('Enter');
    await p.waitForTimeout(50);
  }
  await p.waitForSelector('[data-dx-result-section]:not([hidden])');
  check('1440: completo solo con teclado → 100/100 "Base digital sólida"', (await p.textContent('[data-dx-headline]')) === 'Tu clínica obtuvo 100/100' && (await p.textContent('[data-dx-band]')) === 'Base digital sólida');
  check('1440: foco en el título del resultado', (await p.evaluate(() => document.activeElement?.id)) === 'dx-result-title');
  const recs = await p.$$eval('[data-dx-recs] h4', (h) => h.map((x) => x.textContent));
  check('1440: sin déficits → recomendaciones de mejora continua', recs.length === 3, recs.join(' | '));
  check('1440: sin desbordamiento', (await overflow(p)) === 0);
  await p.waitForTimeout(1500); await p.screenshot({ path: `${OUT}/1440-resultado.png`, fullPage: true });
  // CTAs y navegación
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  check('Home: CTA "Evalúa la presencia digital de tu clínica"', (await p.locator('a[href="/diagnostico-clinicas"]', { hasText: 'Evalúa la presencia digital de tu clínica' }).count()) === 1);
  await p.goto(BASE + '/que-hago', { waitUntil: 'networkidle' });
  check('Qué hago: CTA al diagnóstico', (await p.locator('a[href="/diagnostico-clinicas"]', { hasText: 'Evalúa la presencia digital' }).count()) === 1);
  await p.goto(BASE + '/builder-lab', { waitUntil: 'networkidle' });
  check('Builder Lab: tarjeta del diagnóstico', (await p.locator('a[href="/diagnostico-clinicas"]').count()) >= 1);
  await p.goto(BASE + '/builder-lab/diagnostico-clinicas', { waitUntil: 'networkidle' });
  check('/builder-lab/diagnostico-clinicas redirige', p.url().endsWith('/diagnostico-clinicas'), p.url());
  await p.close();
}
await b.close();
console.log(results.join('\n'));
console.log(`\n${results.filter((r) => r.startsWith('PASS')).length}/${results.length} PASS`);
