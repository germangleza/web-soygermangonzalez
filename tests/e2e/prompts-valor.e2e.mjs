// Prueba E2E del recurso «3 prompts para vender beneficios» (375 / 768 / 1440 px).
// Uso: npm run build && (cd .vercel/output/static && python3 -m http.server 4329)   (en otra terminal)
//      PW=<ruta a playwright> node tests/e2e/prompts-valor.e2e.mjs <carpeta-capturas>
import { createRequire } from 'module';
import { readFileSync } from 'fs';
const { chromium } = createRequire(import.meta.url)(process.env.PW);
const OUT = process.argv[2]; const BASE = process.env.BASE ?? 'http://localhost:4329';
const URL_ = BASE + '/builder-lab/3-prompts-valor';

// Fuente de verdad de los prompts: el mismo archivo de datos que usa la página.
const src = readFileSync(new URL('../../src/data/prompts-valor.ts', import.meta.url), 'utf8');
const PROMPTS = [...src.matchAll(/content: `([\s\S]*?)`,/g)].map((m) => m[1]);

const R = []; const check = (n, c, x = '') => R.push(`${c ? 'PASS' : 'FAIL'}  ${n}${x ? ' — ' + x : ''}`);
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const spyEvents = () => { window.__ev = []; window.gtag = (_t, name, props) => window.__ev.push({ name, ...props }); };
const b = await chromium.launch();
check('datos: 3 prompts leídos de prompts-valor.ts', PROMPTS.length === 3);

// ---- A · 375 px (móvil), Clipboard API
{
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
  await ctx.addInitScript(spyEvents);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const resp = await p.goto(URL_ + '?utm_source=instagram&utm_medium=dm&utm_campaign=reel_meta_valor', { waitUntil: 'networkidle' });
  check('375: responde 200 en carga directa', resp.status() === 200);
  check('375: sin desbordamiento horizontal', (await overflow(p)) === 0);
  check('375: un solo H1 con el título exacto', (await p.$$eval('h1', (h) => h.map((x) => x.textContent.trim()))).join('|') === '3 prompts para vender beneficios, no características');
  check('375: no pide correo ni login', (await p.$$eval('main input, main form', (e) => e.length)) === 0);
  const shown = await p.$$eval('[data-cpc-text]', (els) => els.map((e) => e.textContent));
  check('375: los 3 prompts visibles coinciden con el documento', shown.length === 3 && shown.every((t, i) => t === PROMPTS[i]));
  await p.screenshot({ path: `${OUT}/375-top.png` });
  for (let i = 1; i <= 3; i++) {
    const btn = p.locator(`[data-cpc][data-number="${i}"] [data-cpc-copy]`);
    check(`375: botón ${i} dice «Copiar prompt ${i}»`, (await btn.textContent()).trim() === `Copiar prompt ${i}`);
    const box = await btn.boundingBox();
    check(`375: botón ${i} tamaño táctil ≥44px`, box.height >= 44, `${Math.round(box.height)}px`);
    await btn.click();
    const clip = await p.evaluate(() => navigator.clipboard.readText());
    check(`375: prompt ${i} copiado completo y con saltos de línea`, clip === PROMPTS[i - 1] && clip.includes('\n'));
    check(`375: prompt ${i} sin título/descripcion en el portapapeles`, !clip.includes('Descubre qué compra') && !clip.includes('```'));
    check(`375: feedback «¡Copiado!» ${i}`, (await btn.textContent()).includes('¡Copiado!'));
    check(`375: región aria-live anuncia ${i}`, (await p.textContent(`#prompt-${i}-status`)).includes('copiado'));
    if (i === 1) await p.screenshot({ path: `${OUT}/375-copiado.png` });
  }
  const ev = await p.evaluate(() => window.__ev);
  check('375: resource_view con resource_id', ev.some((e) => e.name === 'resource_view' && e.resource_id === '3-prompts-valor'));
  const copied = ev.filter((e) => e.name === 'prompt_copied');
  check('375: prompt_copied ×3 con prompt_number 1|2|3', copied.map((e) => e.prompt_number).join() === '1,2,3' && copied.every((e) => e.resource_id === '3-prompts-valor'));
  check('375: analítica sin el texto copiado', !JSON.stringify(ev).includes('estratega'));
  await p.waitForTimeout(2700);
  check('375: el botón vuelve a su texto', (await p.textContent('[data-cpc][data-number="1"] [data-cpc-copy]')).trim() === 'Copiar prompt 1');
  const links = await p.$$eval('main a[href]', (as) => as.map((a) => a.getAttribute('href')));
  const agenda = await p.$eval('a.btn[target=_blank]', (a) => ({ href: a.href, text: a.textContent }));
  check('375: CTA final «Agenda una llamada» al link de agenda', agenda.text.includes('Agenda una llamada') && agenda.href.startsWith('https://calendar.app.google/'));
  for (const href of [...new Set(links.filter((h) => h.startsWith('/') && !h.startsWith('/api')))]) {
    const r = await ctx.request.get(BASE + (href.split('#')[0] || '/'));
    check(`375: enlace real ${href}`, r.status() === 200, String(r.status()));
  }
  await p.screenshot({ path: `${OUT}/375-full.png`, fullPage: true });
  check('375: sin errores JS', errs.length === 0, errs.join(' | '));
  await ctx.close();
}

// ---- B · Fallback sin Clipboard API (execCommand) + teclado
{
  const ctx = await b.newContext({ viewport: { width: 768, height: 1024 } });
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    window.__copied = [];
    document.execCommand = (cmd) => { if (cmd === 'copy') window.__copied.push(document.activeElement?.value ?? String(window.getSelection())); return true; };
  });
  const p = await ctx.newPage();
  await p.goto(URL_, { waitUntil: 'networkidle' });
  check('768: sin desbordamiento horizontal', (await overflow(p)) === 0);
  await p.focus('[data-cpc][data-number="2"] [data-cpc-copy]');
  const ring = await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  check('768: foco visible en el botón', ring !== 'none', ring);
  await p.keyboard.press('Enter');
  const got = await p.evaluate(() => window.__copied);
  check('768: fallback copia el prompt 2 exacto con teclado', got.length === 1 && got[0] === PROMPTS[1]);
  check('768: feedback tras fallback', (await p.textContent('[data-cpc][data-number="2"] [data-cpc-copy]')).includes('¡Copiado!'));
  await ctx.close();
}

// ---- C · Error: ninguna vía funciona → mensaje visible y texto seleccionado
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    document.execCommand = () => false;
  });
  const p = await ctx.newPage();
  await p.goto(URL_, { waitUntil: 'networkidle' });
  await p.click('[data-cpc][data-number="3"] [data-cpc-copy]');
  check('1440: error visible con alternativa manual', (await p.textContent('#prompt-3-status')).includes('cópialo manualmente'));
  check('1440: texto seleccionado para copiar a mano', (await p.evaluate(() => String(window.getSelection()))) === PROMPTS[2]);
  await p.screenshot({ path: `${OUT}/1440-full.png`, fullPage: true });
  await ctx.close();
}

// ---- D · Aparece en «Lo que estoy explorando» y la URL anterior redirige
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(BASE + '/builder-lab', { waitUntil: 'networkidle' });
  check('/builder-lab: tarjeta en «Lo que estoy explorando»', (await p.locator('#explora a[href="/builder-lab/3-prompts-valor"]').count()) > 0);
  // La redirección la sirve Vercel (no el servidor estático local): se valida en la config generada.
  const cfg = JSON.parse(readFileSync(new URL('../../.vercel/output/config.json', import.meta.url), 'utf8'));
  check('URL anterior redirige 301 al recurso', cfg.routes.some((r) => r.src === '^/builder-lab/recursos/3-prompts-valor$' && r.status === 301 && r.headers?.Location === '/builder-lab/3-prompts-valor'));
  await ctx.close();
}

await b.close();
console.log(R.join('\n'));
const fails = R.filter((r) => r.startsWith('FAIL')).length;
console.log(`\n${R.length - fails}/${R.length} PASS`);
process.exit(fails ? 1 : 0);
