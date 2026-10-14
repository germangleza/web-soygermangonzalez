/**
 * Motion en todo el sitio (https://motion.dev, API vanilla — sin React).
 *
 * Principios:
 * - Mejora progresiva: sin JS el contenido se ve completo; nada se oculta en el HTML.
 * - Solo se preparan (ocultan) elementos que aún NO están en pantalla → sin parpadeos ni CLS.
 * - Solo se animan transform y opacity (GPU) → sin afectar el rendimiento.
 * - prefers-reduced-motion: no se ejecuta nada.
 */
import { animate, inView, scroll, stagger } from 'motion';

const EASE = [0.22, 1, 0.36, 1] as const; // ease-out suave, editorial
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Contenedores cuyos hijos aparecen en cascada. */
const GROUPS = '.grid, .steps, .talks, .vehicles, .lab__concepts, .crumbs ol';
/** Bloques que aparecen individualmente. */
const SINGLES = [
  '.section-heading', '.cta-banner', '.lab', '.drops', '.post-drops', '.paths-close',
  '.about__photo', '.story__photo', '.split > div', '.contact__aside', '.form',
  '.prose > *', '.post-figure', '.post-video', '.post-resources', '.site-footer__top',
].join(', ');

const prepared = new WeakSet<Element>();

function belowFold(el: Element): boolean {
  return el.getBoundingClientRect().top > window.innerHeight * 0.92;
}

function hide(el: HTMLElement, y = 28) {
  el.style.opacity = '0';
  el.style.transform = `translateY(${y}px)`;
  prepared.add(el);
}

function insidePrepared(el: Element): boolean {
  // [data-no-reveal]: zonas con su propia animación (p. ej. el diagnóstico) quedan fuera.
  if (el.closest('[data-no-reveal]')) return true;
  for (let p = el.parentElement; p; p = p.parentElement) if (prepared.has(p)) return true;
  return false;
}

function setupReveals() {
  // 1) Grupos con cascada (tarjetas, pasos del método, temas, etc.)
  document.querySelectorAll<HTMLElement>(GROUPS).forEach((group) => {
    const items = Array.from(group.children).filter(
      (c): c is HTMLElement => c instanceof HTMLElement && !c.hidden && belowFold(c) && !insidePrepared(c),
    );
    if (!items.length) return;
    items.forEach((el) => hide(el, 36));
    const stop = inView(
      group,
      () => {
        animate(items, { opacity: 1, y: 0 }, { duration: 0.8, ease: EASE, delay: stagger(0.08) });
        // Las imágenes del método se "acercan" al aparecer.
        const imgs = group.querySelectorAll<HTMLElement>('.step__media img');
        if (imgs.length) animate(imgs, { scale: [1.18, 1] }, { duration: 1.4, ease: EASE, delay: stagger(0.08) });
        stop();
      },
      { amount: 0.15 },
    );
  });

  // 2) Bloques individuales
  document.querySelectorAll<HTMLElement>(SINGLES).forEach((el) => {
    if (prepared.has(el) || insidePrepared(el) || !belowFold(el)) return;
    hide(el);
    inView(el, () => { animate(el, { opacity: 1, y: 0 }, { duration: 0.9, ease: EASE }); }, { amount: 0.2 });
  });
}

function setupHero() {
  const hero = document.querySelector<HTMLElement>('.hero');
  const img = hero?.querySelector<HTMLElement>('.hero__media img');
  if (!hero || !img) return;
  // Entrada: la imagen se asienta lentamente (el texto entra con CSS para no retrasar el LCP).
  animate(img, { scale: [1.12, 1.04] }, { duration: 2.2, ease: EASE });
  // Parallax ligado al scroll.
  scroll(animate(img, { y: [0, 90] }, { ease: 'linear' }), { target: hero, offset: ['start start', 'end start'] });
  const copy = hero.querySelector<HTMLElement>('.hero__copy');
  if (copy) scroll(animate(copy, { y: [0, -40], opacity: [1, 0.35] }, { ease: 'linear' }), { target: hero, offset: ['start start', 'end start'] });
}

function setupRings() {
  // Anillos decorativos de Builder Lab y cabeceras: deriva lenta con el scroll.
  document.querySelectorAll<HTMLElement>('.page-hero__rings, .lab__rings').forEach((ring) => {
    const target = ring.parentElement ?? ring;
    scroll(animate(ring, { y: [-30, 60], scale: [0.95, 1.08] }, { ease: 'linear' }), { target, offset: ['start end', 'end start'] });
  });
}

function setupHeader() {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;
  scroll((_: number, info: { y: { current: number } }) => {
    header.classList.toggle('is-scrolled', info.y.current > 12);
  });
}

function setupReadingProgress() {
  const bar = document.querySelector<HTMLElement>('[data-read-progress]');
  const article = document.querySelector<HTMLElement>('article');
  if (!bar || !article) return;
  scroll(animate(bar, { scaleX: [0, 1] }, { ease: 'linear' }), { target: article, offset: ['start start', 'end end'] });
}

function setupPress() {
  // Micro-interacción táctil en botones (complementa el hover de CSS).
  document.addEventListener('pointerdown', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('.btn, .filter__btn');
    if (!btn || btn.matches(':disabled')) return;
    animate(btn, { scale: [1, 0.97, 1] }, { duration: 0.28, ease: EASE });
  });
  // Filtro de Builder Lab: las tarjetas visibles reaparecen con cascada.
  document.querySelectorAll<HTMLElement>('[data-filter]').forEach((g) =>
    g.addEventListener('click', () => {
      requestAnimationFrame(() => {
        const list = document.querySelector(`[data-filter-target="${g.dataset.filter}"]`);
        const shown = list ? Array.from(list.children).filter((c) => !(c as HTMLElement).hidden) : [];
        if (shown.length) animate(shown, { opacity: [0, 1], y: [16, 0] }, { duration: 0.45, ease: EASE, delay: stagger(0.05) });
      });
    }),
  );
}

/** Al imprimir, todo visible. */
function revealAll() {
  document.querySelectorAll<HTMLElement>('[style*="opacity"]').forEach((el) => {
    if (prepared.has(el)) { el.style.opacity = '1'; el.style.transform = 'none'; }
  });
}

if (!REDUCED) {
  setupReveals();
  setupHero();
  setupRings();
  setupHeader();
  setupReadingProgress();
  setupPress();
  window.addEventListener('beforeprint', revealAll);
}
