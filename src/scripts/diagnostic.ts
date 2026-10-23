/**
 * Diagnóstico de Visibilidad Digital para Clínicas — lógica del navegador.
 * El resultado se calcula y se muestra SIN pedir datos (spec §0, §7). Las respuestas (sin PII)
 * se guardan en sessionStorage para no perder el avance al recargar.
 */
import { animate, stagger } from 'motion';
import { DIMENSIONS, QUESTIONS, isSkipped, type Answers } from '../lib/diagnostic/questions';
import { computeResult, recommend } from '../lib/diagnostic/scoring';
import { track } from './analytics';
import './link-fields';

const STORE = 'gg_dx_v1';
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(sel));

const quiz = $<HTMLFormElement>('#dx-quiz');
const quizSection = $('[data-dx-quiz-section]');
const resultSection = $('[data-dx-result-section]');

if (quiz && quizSection && resultSection) {
  document.documentElement.classList.add('js-quiz');
  const steps = $$<HTMLFieldSetElement>('.quiz__step', quiz);
  const back = $<HTMLButtonElement>('[data-dx-back]', quiz)!;
  const next = $<HTMLButtonElement>('[data-dx-next]', quiz)!;
  const error = $('[data-dx-error]', quiz)!;
  const live = $('[data-dx-live]', quiz)!;
  const count = $('[data-dx-count]', quiz)!;
  const bar = $('[data-dx-bar]', quiz)!;
  const fill = $('[data-dx-fill]', quiz)!;
  let step = 0;
  let started = false;

  const answers = (): Answers => {
    const a: Answers = {};
    for (const q of QUESTIONS) {
      const v = $<HTMLInputElement>(`input[name="${q.id}"]:checked`, quiz)?.value;
      if (v) a[q.id] = v;
    }
    return a;
  };

  const save = () => {
    try { sessionStorage.setItem(STORE, JSON.stringify({ answers: answers(), step })); } catch { /* sin almacenamiento */ }
  };

  // Preguntas activas: sin sitio web se omiten las del sitio (q5, q6).
  const active = () => { const a = answers(); return QUESTIONS.map((q, i) => (isSkipped(q, a) ? -1 : i)).filter((i) => i >= 0); };
  const nextIndex = (from: number) => active().find((i) => i > from) ?? -1;
  const prevIndex = (from: number) => [...active()].reverse().find((i) => i < from) ?? 0;

  function show(i: number, focus = true) {
    step = Math.max(0, Math.min(steps.length - 1, i));
    if (!active().includes(step)) step = nextIndex(step) >= 0 ? nextIndex(step) : prevIndex(step);
    steps.forEach((s, idx) => (s.hidden = idx !== step));
    const q = QUESTIONS[step];
    const list = active();
    const pos = list.indexOf(step) + 1;
    count.textContent = `Pregunta ${pos} de ${list.length} · ${DIMENSIONS[q.dimension].short}`;
    bar.setAttribute('aria-valuemax', String(list.length));
    bar.setAttribute('aria-valuenow', String(pos));
    fill.style.width = `${(pos / list.length) * 100}%`;
    back.disabled = pos === 1;
    next.textContent = nextIndex(step) < 0 ? 'Ver mi resultado' : 'Siguiente →';
    error.textContent = '';
    live.textContent = `Pregunta ${pos} de ${list.length}`;
    if (focus) {
      $<HTMLElement>('legend', steps[step])?.focus({ preventScroll: true });
      if (!REDUCED) animate(steps[step], { opacity: [0, 1], x: [24, 0] }, { duration: 0.35, ease: [0.22, 1, 0.36, 1] });
    }
    save();
  }

  function startOnce() {
    if (started) return;
    started = true;
    track('diagnostic_started', { source: location.pathname });
  }

  /* -------------------------------------------------------------- Resultado */
  function renderResult(scroll = true) {
    const a = answers();
    const noWebsite = $$<HTMLInputElement>('[data-no-website]').some((c) => c.checked);
    const r = computeResult(a);
    const recs = recommend(a, r, { noWebsite });
    const json = JSON.stringify(a);

    // Respuestas para los formularios (defaultValue sobrevive a form.reset()).
    $$<HTMLInputElement>('[data-dx-answers]').forEach((i) => { i.value = json; i.defaultValue = json; });
    const resumen = `${r.digitalScore}/100 · ${r.band.label} · oportunidad: ${r.weakest.label}`;
    $$<HTMLInputElement>('[data-agenda-result]').forEach((i) => { i.value = resumen; i.defaultValue = resumen; });

    $('[data-dx-score]')!.textContent = String(r.digitalScore);
    $<HTMLElement>('.result__score')!.style.setProperty('--p', String(r.digitalScore));
    $('[data-dx-headline]')!.textContent = `Tu clínica obtuvo ${r.digitalScore}/100`;
    $('[data-dx-band]')!.textContent = r.band.label;
    $('[data-dx-weakest]')!.textContent = r.lowConfidence
      ? `Varios aspectos requieren verificación. Con lo que sabemos, tu principal oportunidad parece estar en ${r.weakest.label}.`
      : `Tu principal oportunidad está en ${r.weakest.label}.`;
    $$('[data-band]').forEach((li) => li.classList.toggle('is-current', li.dataset.band === r.band.id));

    const notice = $('[data-dx-unknown]')!;
    notice.hidden = r.unknownCount === 0;
    notice.replaceChildren();
    if (r.unknownCount) {
      const strong = document.createElement('strong');
      strong.textContent = r.lowConfidence ? 'Varios aspectos requieren verificación' : 'Algunas respuestas están pendientes de verificar';
      const p = document.createElement('span');
      p.textContent = `Respondiste "No sé" en ${r.unknownCount} ${r.unknownCount === 1 ? 'pregunta' : 'preguntas'}. Cuentan como 0 para priorizar, pero no significa que no existan: conviene revisarlas antes de tomar decisiones.`;
      notice.append(strong, p);
    }

    const dims = $('[data-dx-dims]')!;
    dims.replaceChildren(...r.dimensions.map((d) => {
      const li = document.createElement('li');
      const row = document.createElement('div'); row.className = 'dims__row';
      const name = document.createElement('span'); name.textContent = d.label;
      const val = document.createElement('span'); val.textContent = `${d.score}/100`;
      row.append(name, val);
      const track = document.createElement('div'); track.className = 'dims__track'; track.setAttribute('aria-hidden', 'true');
      const f = document.createElement('span');
      f.className = `dims__fill${d.id === r.weakest.id ? ' dims__fill--weak' : ''}`;
      f.style.width = `${d.score}%`;
      track.append(f);
      li.append(row, track);
      const notes: string[] = [];
      if (d.id === r.weakest.id) notes.push('Principal oportunidad');
      if (d.unknown) notes.push(`${d.unknown} por verificar`);
      if (notes.length) { const n = document.createElement('span'); n.className = 'dims__note'; n.textContent = notes.join(' · '); li.append(n); }
      return li;
    }));

    const list = $('[data-dx-recs]')!;
    list.replaceChildren(...recs.map((rec, i) => {
      const li = document.createElement('li');
      li.className = 'card rec';
      const top = document.createElement('div'); top.className = 'rec__top';
      const k = document.createElement('span'); k.className = 'card__kicker'; k.style.margin = '0';
      k.textContent = `Prioridad ${i + 1} · ${rec.area}`;
      top.append(k);
      if (rec.needsVerification) { const v = document.createElement('span'); v.className = 'rec__verify'; v.textContent = 'Primero verifica'; top.append(v); }
      const h = document.createElement('h4'); h.textContent = rec.title;
      const dl = document.createElement('dl');
      for (const [t, d] of [['Por qué importa', rec.why], ['Primera acción', rec.needsVerification ? `Verifica tu situación actual. Después: ${rec.firstAction.charAt(0).toLowerCase()}${rec.firstAction.slice(1)}` : rec.firstAction]] as const) {
        const dt = document.createElement('dt'); dt.textContent = t;
        const dd = document.createElement('dd'); dd.textContent = d;
        dl.append(dt, dd);
      }
      li.append(top, h, dl);
      return li;
    }));

    quizSection!.hidden = true;
    resultSection!.hidden = false;
    if (scroll) {
      resultSection!.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
      $<HTMLElement>('#dx-result-title')!.focus({ preventScroll: true });
      if (!REDUCED) {
        animate($$('.dims__fill'), { scaleX: [0, 1] }, { duration: 0.9, ease: [0.22, 1, 0.36, 1] });
        animate($$('.rec'), { opacity: [0, 1], y: [20, 0] }, { duration: 0.6, delay: stagger(0.08, { startDelay: 0.15 }) });
      }
    }
    return r;
  }

  /* -------------------------------------------------------------- Navegación */
  quiz.addEventListener('change', (e) => {
    if ((e.target as HTMLInputElement).type === 'radio') { startOnce(); error.textContent = ''; save(); }
  });

  quiz.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = QUESTIONS[step];
    if (!$(`input[name="${q.id}"]:checked`, quiz)) {
      error.textContent = 'Elige una opción para continuar (puedes responder "No sé").';
      $<HTMLInputElement>(`input[name="${q.id}"]`, steps[step])?.focus();
      return;
    }
    if (nextIndex(step) >= 0) return show(nextIndex(step));
    const r = renderResult();
    track('diagnostic_completed', { score: String(r.digitalScore), band: r.band.id, unknown: String(r.unknownCount) });
    save();
  });

  back.addEventListener('click', () => show(prevIndex(step)));

  $$('[data-dx-start]').forEach((b) =>
    b.addEventListener('click', () => {
      startOnce();
      requestAnimationFrame(() => $<HTMLElement>('legend', steps[step])?.focus({ preventScroll: true }));
    }),
  );

  $('[data-dx-restart]')?.addEventListener('click', () => {
    quiz.reset();
    try { sessionStorage.removeItem(STORE); } catch { /* */ }
    resultSection.hidden = true;
    quizSection.hidden = false;
    quizSection.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
    show(0);
  });

  // "No tengo sitio web" puede cambiar la prioridad 1: recalcula sin mover el scroll.
  $$<HTMLInputElement>('[data-no-website]').forEach((c) =>
    c.addEventListener('change', () => { if (!resultSection.hidden) renderResult(false); }),
  );

  /* -------------------------------------------------------------- Restaurar sesión */
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORE) ?? 'null') as { answers?: Answers; step?: number } | null;
    if (saved?.answers) {
      for (const [qid, v] of Object.entries(saved.answers)) {
        const input = $<HTMLInputElement>(`input[name="${qid}"][value="${CSS.escape(String(v))}"]`, quiz);
        if (input) input.checked = true;
      }
      started = Object.keys(saved.answers).length > 0;
    }
    show(saved?.step ?? 0, false);
    if (computeResult(answers()).complete && saved?.step === steps.length - 1) renderResult(false);
  } catch {
    show(0, false);
  }
}
