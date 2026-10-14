/**
 * Genera un carrusel desde docs/carrusel/<slug>/contenido.json:
 *   - slide-1.png … slide-N.png (1080×1350) para publicar
 *   - carrusel.pdf con texto real (vectorial) para importar a Canva y editar
 *
 * Uso:  npm run carrusel -- <slug>
 * Requiere Playwright con Chromium (local: `npx playwright install chromium`).
 */
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';
import path from 'path';
import { renderCarrusel } from './plantilla.mjs';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const slug = process.argv[2];
if (!slug) { console.error('Uso: npm run carrusel -- <slug>   (carpeta en docs/carrusel/)'); process.exit(1); }

const dir = path.resolve(here, '../../docs/carrusel', slug);
const file = path.join(dir, 'contenido.json');
if (!fs.existsSync(file)) { console.error(`No existe ${path.relative(process.cwd(), file)}`); process.exit(1); }
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const html = renderCarrusel(data, (f) => {
  const abs = path.resolve(dir, f);
  if (!fs.existsSync(abs)) throw new Error(`No encuentro el fondo "${f}" en ${path.relative(process.cwd(), dir)}`);
  return pathToFileURL(abs).href;
});
const preview = path.join(here, '.preview.html');
fs.writeFileSync(preview, html);

let pw;
try { pw = require(process.env.PW ?? 'playwright'); } catch {
  console.error('Falta Playwright. Instala con: npm i -D playwright && npx playwright install chromium'); process.exit(1);
}
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 1500 } });
await page.goto(pathToFileURL(preview).href);
await page.evaluate(() => document.fonts.ready);
for (const f of fs.readdirSync(dir)) if (/^slide-\d+\.png$/.test(f)) fs.unlinkSync(path.join(dir, f));
const n = data.laminas.length;
for (let i = 1; i <= n; i++) await page.locator(`#s${i}`).screenshot({ path: path.join(dir, `slide-${i}.png`) });
await page.emulateMedia({ media: 'print' });
await page.pdf({ path: path.join(dir, 'carrusel.pdf'), width: '1080px', height: '1350px', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
await browser.close();
console.log(`✓ ${n} láminas PNG + carrusel.pdf en docs/carrusel/${slug}/`);
