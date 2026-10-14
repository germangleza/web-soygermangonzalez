// Exporta cada lámina de carrusel.html a PNG 1080×1350.
// Uso: PW=<ruta a playwright> node docs/carrusel/conectar-claude-meta-ads/render.mjs
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
const { chromium } = createRequire(import.meta.url)(process.env.PW ?? 'playwright');
const dir = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 1500 }, deviceScaleFactor: 1 });
await p.goto('file://' + path.join(dir, 'carrusel.html'));
await p.evaluate(() => document.fonts.ready);
for (let i = 1; i <= 7; i++) await p.locator(`#s${i}`).screenshot({ path: path.join(dir, `slide-${i}.png`) });
await b.close();
console.log('7 láminas exportadas');
