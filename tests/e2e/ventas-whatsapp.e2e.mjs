// E2E del checklist «ventas por WhatsApp» → agendar llamada (375 y 1440 px).
// Uso: npm run build && (cd .vercel/output/static && python3 -m http.server 4329)   (en otra terminal)
//      PW=<ruta a playwright> node tests/e2e/ventas-whatsapp.e2e.mjs <carpeta-capturas>
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)(process.env.PW);
const OUT = process.argv[2]; const BASE = process.env.BASE ?? 'http://localhost:4329';
const FS = 'https://formspree.io/f/prueba';
const R = []; const check = (n, c, x = '') => R.push(`${c ? 'PASS' : 'FAIL'}  ${n}${x ? ' — ' + x : ''}`);
const b = await chromium.launch();

for (const [w, h] of [[375, 812], [1440, 900]]) {
  const tag = `wa-${w}`;
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const sent = [];
  await ctx.route(FS, async (route) => { sent.push(JSON.parse(route.request().postData())); await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
  await ctx.route('https://calendar.app.google/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>Calendario</h1>' }));
  await p.goto(BASE + '/ventas-por-whatsapp?utm_source=instagram&utm_medium=dm&utm_campaign=whatsapp', { waitUntil: 'networkidle' });

  // Paso 0: contexto obligatorio
  await p.click('[data-ck-next]');
  check(`${tag}: no avanza sin tipo de negocio`, (await p.textContent('[data-ck-error]')).includes('tipo de negocio'));
  await p.selectOption('#ck-business_type', 'servicios-profesionales');
  await p.click('[data-ck-next]');
  check(`${tag}: no avanza sin volumen`, (await p.textContent('[data-ck-error]')).includes('mensajes o consultas'));
  await p.selectOption('#ck-volumen', '50-150');
  check(`${tag}: botón dice 12 preguntas`, (await p.textContent('[data-ck-next]')).includes('12 preguntas'));
  await p.click('[data-ck-next]');

  // 4 áreas de 3 preguntas: seguimiento en No, el resto en Sí
  const steps = await p.$$eval('.stepper__step', (s) => s.length);
  check(`${tag}: 5 pasos (contexto + 4 áreas)`, steps === 5);
  for (let s = 1; s < steps; s++) {
    await p.click('[data-ck-next]');
    check(`${tag}: paso ${s} pide responder las tres`, (await p.textContent('[data-ck-error]')).includes('tres preguntas'));
    const ids = await p.$$eval(`.stepper__step[data-step="${s}"] fieldset input[value=si]`, (i) => i.map((x) => x.name));
    for (const id of ids) await p.check(`input[name=${id}][value=${['q4', 'q5', 'q6'].includes(id) ? 'no' : 'si'}]`);
    await p.click('[data-ck-next]');
  }
  await p.waitForSelector('[data-ck-result-section]:not([hidden])');
  check(`${tag}: resultado 75/100`, (await p.textContent('[data-ck-headline]')).includes('75/100'));
  const pri = await p.$$eval('[data-ck-priorities] h4', (h) => h.map((x) => x.textContent));
  check(`${tag}: primera prioridad = seguimiento`, pri[0] === 'Da seguimiento a cada cotización', pri.join(' | '));
  check(`${tag}: menciona Life Agent`, (await p.textContent('.ck-next')).includes('Life Agent'));
  await p.screenshot({ path: `${OUT}/${tag}-resultado.png`, fullPage: false });

  // Formulario: solo 3 datos
  await p.click('[data-ck-book]'); await p.waitForTimeout(1500); // termina el scroll suave
  const labels = await p.$$eval('#agendar [data-agenda-form] label[for], #agendar [data-agenda-form] legend', (l) => l.map((x) => x.textContent.replace(/\s+/g, ' ').trim()));
  check(`${tag}: WhatsApp → nombre → mensajes → resolver primero`, labels.length === 4 && labels[0].startsWith('WhatsApp') && labels[1].startsWith('Nombre del negocio') && labels[2].includes('mensajes o consultas') && labels[3].includes('resolver primero'), labels.join(' | '));
  check(`${tag}: sin tipo ni rol`, (await p.$$('#agendar [name=tipo], #agendar [name=rol]')).length === 0);
  check(`${tag}: volumen precargado del checklist`, (await p.inputValue('#agenda-atencion-volumen')) === '50-150');
  await p.$eval('[data-agenda-form]', (f, fs) => { f.dataset.endpoint = fs; }, FS);
  await p.click('[data-agenda-submit]');
  check(`${tag}: no avanza vacío`, sent.length === 0 && (await p.textContent('[data-agenda-focus-error]')).includes('Elige'));
  check(`${tag}: pide WhatsApp`, (await p.$$eval('[data-agenda-form] [aria-invalid=true]', (e) => e.map((x) => x.name))).includes('whatsapp'));
  await p.fill('[data-agenda-form] [name=whatsapp]', '664 123 4567');
  await p.fill('[data-agenda-form] [name=negocio]', 'Prueba S.A.');
  await p.click('[data-agenda-form] input[name=enfoque][value=seguimiento]'); // clic real: atrapa saltos de layout
  await p.screenshot({ path: `${OUT}/${tag}-form.png`, fullPage: false });
  await p.click('[data-agenda-submit]');
  await p.waitForFunction(() => location.hostname === 'calendar.app.google', null, { timeout: 8000 }).catch(() => {});
  const d = sent[0] ?? {};
  check(`${tag}: Formspree con origen, 4 datos, resultado y UTM`, d.origen === 'ventas-por-whatsapp' && d.negocio === 'Prueba S.A.' && d.volumen === '50-150'
    && d.volumen_texto === 'De 50 a 150 a la semana' && d.enfoque_texto === 'Dar seguimiento' && d.resultado?.startsWith('75/100') && d.utm_campaign === 'whatsapp'
    && d.whatsapp === '664 123 4567' && !('tipo_texto' in d) && !('rol_texto' in d), JSON.stringify(d));
  check(`${tag}: abre el calendario`, p.url().startsWith('https://calendar.app.google/'));
  check(`${tag}: sin errores JS`, errs.length === 0, errs.join(' | '));

  if (w === 375) {
    const q = await ctx.newPage();
    await q.goto(BASE + '/ventas-por-whatsapp', { waitUntil: 'networkidle' });
    check('375: sin desbordamiento', (await q.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 0);
  }
  await ctx.close();
}
await b.close();
console.log(R.join('\n'));
console.log(`\n${R.filter((r) => r.startsWith('PASS')).length}/${R.length} PASS`);
process.exit(R.some((r) => r.startsWith('FAIL')) ? 1 : 0);
