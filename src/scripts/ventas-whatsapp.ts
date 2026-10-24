/**
 * Checklist «¿Cuántas ventas se te escapan entre WhatsApp y el seguimiento?» — lógica del navegador.
 * Misma interfaz que el checklist de IA (QuizStepper + ScoreSummary). Resultado inmediato sin pedir datos de contacto.
 * Se guarda el avance en sessionStorage (respuestas y contexto).
 */
import { animate, stagger } from 'motion';
import { QUESTIONS, type Answers } from '../lib/ventas-whatsapp/questions';
import { computeResult, topPriorities } from '../lib/ventas-whatsapp/scoring';
import { track } from './analytics';

const STORE = 'gg_wa_v1';
const SOURCE = 'ventas-por-whatsapp';
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));

const quiz = $<HTMLFormElement>('#ck-quiz');
const quizSection = $('[data-ck-quiz-section]');
const resultSection = $('[data-ck-result-section]');

track('checklist_view', { source: SOURCE });

if (quiz && quizSection && resultSection) {
  document.documentElement.classList.add('js-ck');
  const steps = $$<HTMLElement>('.stepper__step', quiz);
  const back = $<HTMLButtonElement>('[data-ck-back]', quiz)!;
  const next = $<HTMLButtonElement>('[data-ck-next]', quiz)!;
  const error = $('[data-ck-error]', quiz)!;
  const live = $('[data-ck-live]', quiz)!;
  const count = $('[data-ck-count]', quiz)!;
  const bar = $('[data-ck-bar]', quiz)!;
  const fill = $('[data-ck-fill]', quiz)!;
  const bizSel = $<HTMLSelectElement>('#ck-business_type', quiz)!;
  const volSel = $<HTMLSelectElement>('#ck-volumen', quiz)!;
  let step = 0;
  let started = false;

  const answers = (): Answers => {
    const a: Answers = {};
    for (const q of QUESTIONS) {
      const v = $<HTMLInputElement>(`input[name="${q.id}"]:checked`, quiz)?.value;
      if (v) a[q.id] = v as Answers[typeof q.id];
    }
    return a;
  };
  const save = () => {
    try { sessionStorage.setItem(STORE, JSON.stringify({ answers: answers(), ctx: { business_type: bizSel.value, volumen: volSel.value }, step })); } catch { /* */ }
  };
  const startOnce = () => { if (!started) { started = true; track('checklist_start', { source: SOURCE }); } };

  function show(i: number, focus = true) {
    step = Math.max(0, Math.min(steps.length - 1, i));
    steps.forEach((s, idx) => (s.hidden = idx !== step));
    count.textContent = `Paso ${step + 1} de ${steps.length} · ${steps[step].dataset.label}`;
    bar.setAttribute('aria-valuenow', String(step + 1));
    fill.style.width = `${((step + 1) / steps.length) * 100}%`;
    back.disabled = step === 0;
    next.textContent = step === 0 ? `Empezar las ${QUESTIONS.length} preguntas →` : step === steps.length - 1 ? 'Ver mi resultado' : 'Siguiente →';
    error.textContent = '';
    live.textContent = count.textContent;
    if (focus) {
      $<HTMLElement>('.stepper__title', steps[step])?.focus({ preventScroll: true });
      quiz!.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
      if (!REDUCED) animate(steps[step], { opacity: [0, 1], x: [24, 0] }, { duration: 0.35, ease: [0.22, 1, 0.36, 1] });
    }
    save();
  }

  function invalidInStep(): HTMLElement | null {
    if (step === 0) {
      if (!bizSel.value) { error.textContent = 'Elige el tipo de negocio para continuar.'; return bizSel; }
      if (!volSel.value) { error.textContent = 'Elige cuántos mensajes o consultas te llegan (puedes elegir "No lo sé").'; return volSel; }
      return null;
    }
    const missing = $$<HTMLFieldSetElement>('fieldset', steps[step]).find((fs) => !fs.querySelector('input:checked'));
    if (missing) {
      error.textContent = 'Responde las tres preguntas para continuar (puedes elegir "No sé").';
      return missing.querySelector<HTMLInputElement>('input');
    }
    return null;
  }

  function renderResult(scroll = true) {
    const a = answers();
    const r = computeResult(a);
    const pri = topPriorities(a);

    $('[data-ck-score]')!.textContent = String(r.score);
    $<HTMLElement>('.ck-res__ring')!.style.setProperty('--p', String(r.score));
    $('[data-ck-headline]')!.textContent = `Atención y seguimiento: ${r.score}/100`;
    $('[data-ck-band]')!.textContent = r.band.label;
    $$('[data-band]').forEach((li) => li.classList.toggle('is-current', li.dataset.band === r.band.id));

    const note = $('[data-ck-unverified]')!;
    note.hidden = r.unverifiedCount === 0;
    note.replaceChildren();
    if (r.unverifiedCount) {
      const s = document.createElement('strong');
      s.textContent = `${r.unverifiedCount} ${r.unverifiedCount === 1 ? 'respuesta pendiente' : 'respuestas pendientes'} de verificar`;
      const t = document.createElement('span');
      t.textContent = 'Respondiste "No sé": cuenta como 0 de forma provisional, pero no significa que exista una falla. Verifícalo antes de tomar decisiones.';
      note.append(s, t);
    }

    $('[data-ck-dims]')!.replaceChildren(...r.blocks.map((b) => {
      const li = document.createElement('li');
      const row = document.createElement('div'); row.className = 'r';
      const n = document.createElement('span'); n.textContent = b.label;
      const v = document.createElement('span'); v.textContent = `${b.score ?? 0}/100`;
      row.append(n, v);
      const t = document.createElement('div'); t.className = 't'; t.setAttribute('aria-hidden', 'true');
      const f = document.createElement('span'); f.className = `f${r.weakest?.id === b.id ? ' f--weak' : ''}`; f.style.width = `${b.score ?? 0}%`; t.append(f);
      li.append(row, t);
      const notes: string[] = [];
      if (r.weakest?.id === b.id && r.score < 100) notes.push('Mayor oportunidad');
      if (b.unverified) notes.push(`${b.unverified} por verificar`);
      if (notes.length) { const s = document.createElement('span'); s.className = 'n'; s.textContent = notes.join(' · '); li.append(s); }
      return li;
    }));
    $('[data-ck-weight]')!.textContent = 'Cada área pesa 25% del puntaje.';

    $('[data-ck-priorities]')!.replaceChildren(...pri.map((p, i) => {
      const li = document.createElement('li'); li.className = 'card p';
      const tag = document.createElement('span'); tag.className = `tag tag--${p.kind}`;
      tag.textContent = p.kind === 'gap' ? 'Oportunidad según tus respuestas' : p.kind === 'verify' ? 'Primero verifica' : 'Mantener';
      const k = document.createElement('span'); k.className = 'card__kicker'; k.style.margin = '.75rem 0 0'; k.textContent = `Prioridad ${i + 1} · ${p.area}`;
      const h = document.createElement('h4'); h.textContent = p.title;
      const d = document.createElement('p'); d.textContent = p.action;
      li.append(tag, k, h, d);
      return li;
    }));

    // Formulario de agenda: resumen del resultado y volumen ya elegido en el checklist.
    const resumen = `${r.score}/100 · ${r.band.label}${r.weakest ? ` · oportunidad: ${r.weakest.label}` : ''} · prioridades: ${pri.map((p) => p.title).join(' / ')}`;
    $$<HTMLInputElement>('[data-agenda-result]').forEach((i) => { i.value = resumen; i.defaultValue = resumen; });
    const vol = $<HTMLSelectElement>('#agenda-atencion-volumen');
    if (vol && !vol.value && volSel.value) vol.value = volSel.value;

    quizSection!.hidden = true;
    resultSection!.hidden = false;
    if (scroll) {
      resultSection!.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
      $<HTMLElement>('#ck-result-title')!.focus({ preventScroll: true });
      if (!REDUCED) {
        animate($$('.ck-dims .f'), { scaleX: [0, 1] }, { duration: 0.9, ease: [0.22, 1, 0.36, 1] });
        animate($$('.ck-pri__list .p'), { opacity: [0, 1], y: [20, 0] }, { duration: 0.6, delay: stagger(0.08, { startDelay: 0.15 }) });
      }
    }
    return r;
  }

  quiz.addEventListener('change', (e) => {
    if ((e.target as HTMLInputElement).type === 'radio') startOnce();
    error.textContent = '';
    save();
  });

  quiz.addEventListener('submit', (e) => {
    e.preventDefault();
    const bad = invalidInStep();
    if (bad) { bad.focus(); return; }
    if (step === 0) startOnce();
    if (step < steps.length - 1) return show(step + 1);
    const r = renderResult();
    track('checklist_complete', { source: SOURCE, score: String(r.score), band: r.band.id, unverified: String(r.unverifiedCount), volumen: volSel.value });
    save();
  });

  back.addEventListener('click', () => show(step - 1));

  $$('[data-ck-start]').forEach((b) => b.addEventListener('click', () => requestAnimationFrame(() => {
    $<HTMLElement>('.stepper__title', steps[step])?.focus({ preventScroll: true });
  })));

  $('[data-ck-restart]')?.addEventListener('click', () => {
    quiz.reset();
    try { sessionStorage.removeItem(STORE); } catch { /* */ }
    resultSection.hidden = true;
    quizSection.hidden = false;
    show(0);
  });

  // Restaurar avance de la sesión
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORE) ?? 'null') as { answers?: Answers; ctx?: Record<string, string>; step?: number } | null;
    if (saved?.ctx) { bizSel.value = saved.ctx.business_type ?? ''; volSel.value = saved.ctx.volumen ?? ''; }
    for (const [qid, v] of Object.entries(saved?.answers ?? {})) {
      const input = $<HTMLInputElement>(`input[name="${qid}"][value="${CSS.escape(String(v))}"]`, quiz);
      if (input) input.checked = true;
    }
    started = Object.keys(saved?.answers ?? {}).length > 0;
    show(saved?.step ?? 0, false);
    if (computeResult(answers()).complete && saved?.step === steps.length - 1 && bizSel.value) renderResult(false);
  } catch {
    show(0, false);
  }
}
