// E2E del funnel «diagnóstico/checklist → agendar llamada» (375 y 1440 px).
// Uso: npm run build && (cd .vercel/output/static && python3 -m http.server 4329)   (en otra terminal)
//      PW=<ruta a playwright> node tests/e2e/funnel-agenda.e2e.mjs <carpeta-capturas>
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)(process.env.PW);
const OUT = process.argv[2]; const BASE = process.env.BASE ?? 'http://localhost:4329';
const FS = 'https://formspree.io/f/prueba';
const R = []; const check = (n, c, x = '') => R.push(`${c ? 'PASS' : 'FAIL'}  ${n}${x ? ' — ' + x : ''}`);
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const b = await chromium.launch();

async function run({ path, kind, w, h, answerQuiz, tipoEsperado }) {
  const tag = `${kind}-${w}`;
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const sent = []; let slow = false;
  await ctx.route(FS, async (route) => { sent.push(JSON.parse(route.request().postData())); if (slow) await new Promise((r) => setTimeout(r, 6000)); await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
  await ctx.route('https://calendar.app.google/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>Calendario</h1>' }));
  await p.goto(BASE + path + '?utm_source=instagram&utm_medium=dm&utm_campaign=ia', { waitUntil: 'networkidle' });
  await answerQuiz(p);
  check(`${tag}: sin botón de imprimir/PDF`, (await p.locator('text=Imprimir o guardar en PDF').count()) === 0);
  check(`${tag}: sin formulario de reporte por correo`, (await p.locator('text=Envíame mi').count()) === 0);
  const cta = p.locator('[data-dx-book], [data-ck-book]');
  check(`${tag}: CTA «Agendar una llamada» visible tras el resultado`, (await cta.isVisible()) && (await cta.textContent()).includes('Agendar una llamada'));
  await cta.click(); await p.waitForTimeout(600);
  check(`${tag}: el CTA lleva al formulario`, await p.isVisible('#agendar [data-agenda-form]'));
  const labels = await p.$$eval('#agendar [data-agenda-form] label[for], #agendar [data-agenda-form] legend', (l) => l.map((x) => x.textContent.replace(/\s+/g, ' ').trim()));
  check(`${tag}: orden WhatsApp → nombre → tipo → rol → revisar primero`, labels[0].startsWith('WhatsApp') && labels[1].startsWith('Nombre de') && labels[2].startsWith('Tipo de') && labels[3].includes('rol') && labels[4].includes('revisar primero'), labels.join(' | '));
  const chips = await p.$$eval('#agendar input[name=enfoque]', (i) => i.map((x) => x.parentElement.textContent.trim()));
  check(`${tag}: 4 opciones de enfoque`, chips.length === 4 && chips[0] === 'Estoy en cero' && chips[3] === 'Solo estoy explorando', chips.join(' | '));
  if (tipoEsperado) check(`${tag}: tipo de negocio precargado del checklist`, (await p.inputValue('#agenda-negocio-tipo')) === tipoEsperado);
  await p.screenshot({ path: `${OUT}/${tag}-form.png`, fullPage: false });

  // Validación
  await p.$eval('[data-agenda-form]', (f, fs) => { f.dataset.endpoint = fs; }, FS);
  await p.click('[data-agenda-submit]');
  const inv = await p.$$eval('[data-agenda-form] [aria-invalid=true]', (e) => e.map((x) => x.name));
  check(`${tag}: no avanza vacío y marca errores`, inv.includes('whatsapp') && inv.includes('negocio') && sent.length === 0 && p.url().includes(path), inv.join(','));
  check(`${tag}: pide elegir enfoque`, (await p.textContent('[data-agenda-focus-error]')).includes('Elige'));
  await p.fill('[data-agenda-form] [name=whatsapp]', '664 12');
  await p.click('[data-agenda-submit]');
  check(`${tag}: WhatsApp de menos de 10 dígitos no pasa`, (await p.textContent(`#agenda-${kind}-whatsapp-error`)).includes('10 dígitos'));

  // Envío correcto → Formspree + calendario
  await p.fill('[data-agenda-form] [name=whatsapp]', '664 123 4567');
  await p.fill('[data-agenda-form] [name=negocio]', 'Prueba S.A.');
  await p.selectOption('[data-agenda-form] [name=tipo]', { index: 1 });
  await p.selectOption('[data-agenda-form] [name=rol]', 'propietario');
  await p.click('[data-agenda-form] input[name=enfoque][value=presencia]');
  await Promise.all([p.waitForURL('https://calendar.app.google/**'), p.click('[data-agenda-submit]')]);
  const d = sent.at(-1) ?? {};
  check(`${tag}: envía a Formspree los 5 datos + resultado + UTMs`, d.whatsapp === '664 123 4567' && d.negocio === 'Prueba S.A.' && d.rol === 'propietario' && d.enfoque === 'presencia' && d.enfoque_texto === 'Presencia digital' && /\/100/.test(d.resultado) && d.utm_campaign === 'ia' && d.origen, JSON.stringify(d));
  check(`${tag}: no envía el honeypot`, !('_gotcha' in d));
  check(`${tag}: abre el calendario de Google`, p.url().startsWith('https://calendar.app.google/'));

  // Formspree lento → el calendario se abre igual (≤ 3 s)
  slow = true;
  await p.goto(BASE + path, { waitUntil: 'networkidle' });
  await p.evaluate(() => sessionStorage.clear());
  await p.reload({ waitUntil: 'networkidle' });
  await answerQuiz(p);
  await p.$eval('[data-agenda-form]', (f, fs) => { f.dataset.endpoint = fs; }, FS);
  await p.fill('[data-agenda-form] [name=whatsapp]', '6641234567'); await p.fill('[data-agenda-form] [name=negocio]', 'Lenta');
  await p.selectOption('[data-agenda-form] [name=tipo]', { index: 1 }); await p.selectOption('[data-agenda-form] [name=rol]', 'otro');
  await p.click('[data-agenda-form] input[name=enfoque][value=explorando]');
  const t0 = Date.now();
  await Promise.all([p.waitForURL('https://calendar.app.google/**', { timeout: 8000 }), p.click('[data-agenda-submit]')]);
  check(`${tag}: si Formspree tarda, abre el calendario en ≤ 4 s`, Date.now() - t0 < 4000, `${Date.now() - t0} ms`);
  check(`${tag}: sin errores JS`, errs.length === 0, errs.join(' | '));
  await ctx.close();
}

const clinicQuiz = async (p) => {
  await p.click('[data-dx-start]');
  for (let i = 0; i < 16 && !(await p.isVisible('[data-dx-result-section]')); i++) { await p.click('.quiz__step:not([hidden]) input[type=radio] >> nth=0'); await p.click('[data-dx-next]'); }
  await p.waitForSelector('[data-dx-result-section]:not([hidden])');
  check('clinica: muestra resultado', (await p.textContent('[data-dx-headline]')).includes('/100'));
};
const checklistQuiz = async (p) => {
  await p.selectOption('#ck-business_type', 'retail'); await p.click('[data-ck-next]');
  for (let s = 0; s < 5; s++) {
    for (const fs of await p.$$('.stepper__step:not([hidden]) fieldset')) await (await fs.$('input[type=radio]')).click();
    await p.click('[data-ck-next]');
  }
  await p.waitForSelector('[data-ck-result-section]:not([hidden])');
};

// Agendar directo desde el hero, sin hacer la evaluación
for (const [path, kind] of [['/diagnostico-clinicas', 'clinica'], ['/ia-recomienda-tu-negocio', 'negocio']]) {
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 } }); const p = await ctx.newPage();
  await ctx.route('https://calendar.app.google/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: 'ok' }));
  await p.goto(BASE + path, { waitUntil: 'networkidle' });
  check(`${kind}: formulario de agenda visible desde el inicio`, await p.isVisible('#agendar [data-agenda-form]'));
  await p.click('.actions a[href="#agendar"]'); await p.waitForTimeout(600);
  const inView = await p.$eval('#agendar', (el) => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; });
  check(`${kind}: «Prefiero agendar una llamada» lleva al formulario`, inView);
  await p.fill('[data-agenda-form] [name=whatsapp]', '6641234567'); await p.fill('[data-agenda-form] [name=negocio]', 'Directo');
  await p.selectOption('[data-agenda-form] [name=tipo]', { index: 1 }); await p.selectOption('[data-agenda-form] [name=rol]', 'propietario');
  await p.click('[data-agenda-form] input[name=enfoque][value=cero]');
  await Promise.all([p.waitForURL('https://calendar.app.google/**'), p.click('[data-agenda-submit]')]);
  check(`${kind}: agenda sin evaluación y abre el calendario`, p.url().startsWith('https://calendar.app.google/'));
  if (kind === 'clinica') await p.screenshot({ path: `${OUT}/directo.png` });
  await ctx.close();
}

// Sin sitio web: se omiten las preguntas del sitio
{
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(BASE + '/diagnostico-clinicas', { waitUntil: 'networkidle' });
  await p.click('[data-dx-start]');
  const seen = [];
  for (let i = 0; i < 16 && !(await p.isVisible('[data-dx-result-section]')); i++) {
    const name = await p.$eval('.quiz__step:not([hidden]) input[type=radio]', (x) => x.name); seen.push(name);
    if (name === 'q4') { await p.click('.quiz__step:not([hidden]) input[value=no]'); }
    else await p.click('.quiz__step:not([hidden]) input[type=radio] >> nth=0');
    await p.click('[data-dx-next]');
    if (name === 'q4') check('sin web: contador ajustado', (await p.textContent('[data-dx-count]')).startsWith('Pregunta 5 de 14'), await p.textContent('[data-dx-count]'));
  }
  check('sin web: no pregunta q5 ni q6', !seen.includes('q5') && !seen.includes('q6'), seen.join(','));
  check('sin web: pregunta por redes sociales (q16)', seen.includes('q16'));
  check('sin web: llega al resultado', await p.isVisible('[data-dx-result-section]'));
  const recs = await p.$$eval('[data-dx-recs] h4', (h) => h.map((x) => x.textContent));
  check('sin web: primera prioridad es tener sitio propio', recs[0]?.includes('sitio web propio'), recs.join(' | '));
  await p.close();
}

for (const [w, h] of [[375, 812], [1440, 900]]) {
  await run({ path: '/diagnostico-clinicas', kind: 'clinica', w, h, answerQuiz: clinicQuiz });
  await run({ path: '/ia-recomienda-tu-negocio', kind: 'negocio', w, h, answerQuiz: checklistQuiz, tipoEsperado: 'retail' });
}
{
  const p = await b.newPage({ viewport: { width: 375, height: 812 } });
  for (const path of ['/diagnostico-clinicas', '/ia-recomienda-tu-negocio']) { await p.goto(BASE + path, { waitUntil: 'networkidle' }); check(`375 ${path}: sin desbordamiento`, (await overflow(p)) === 0); }
}
await b.close();
console.log(R.join('\n'));
const fails = R.filter((r) => r.startsWith('FAIL')).length;
console.log(`\n${R.length - fails}/${R.length} PASS`);
process.exit(fails ? 1 : 0);
