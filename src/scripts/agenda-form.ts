/**
 * Formulario corto antes de agendar: valida, envía a Formspree (máx. 2.5 s, sin bloquear) y abre el calendario.
 * Nunca se queda el usuario sin cita por un fallo del envío.
 */
import { getAttribution, track } from './analytics';

const TIMEOUT_MS = 2500;

document.querySelectorAll<HTMLFormElement>('[data-agenda-form]').forEach((form) => {
  const status = form.querySelector<HTMLElement>('[data-agenda-status]')!;
  const btn = form.querySelector<HTMLButtonElement>('[data-agenda-submit]')!;
  const focusError = form.querySelector<HTMLElement>('[data-agenda-focus-error]')!;

  const setError = (el: HTMLInputElement | HTMLSelectElement, msg: string) => {
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    const err = document.getElementById(`${el.id}-error`);
    if (err) err.textContent = msg;
  };

  function validate(): HTMLElement | null {
    let first: HTMLElement | null = null;
    form.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input[name="whatsapp"], input[name="negocio"], select').forEach((el) => {
      let msg = '';
      if (!el.value.trim()) msg = 'Este dato es necesario.';
      else if (el.name === 'whatsapp' && el.value.replace(/\D/g, '').length < 10) msg = 'Escribe un WhatsApp de al menos 10 dígitos.';
      setError(el, msg);
      if (msg && !first) first = el;
    });
    const focus = form.querySelector<HTMLInputElement>('input[name="enfoque"]:checked');
    focusError.textContent = focus ? '' : 'Elige una opción.';
    if (!focus && !first) first = form.querySelector<HTMLInputElement>('input[name="enfoque"]');
    return first;
  }

  form.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name === 'enfoque') focusError.textContent = '';
    else if (t.getAttribute('aria-invalid') === 'true') validate();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { endpoint, booking, source, kind } = form.dataset;
    const bad = validate();
    if (bad) { bad.focus(); return; }
    btn.disabled = true;
    status.textContent = 'Abriendo el calendario…';

    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    if (data._gotcha) return; // bot
    delete data._gotcha;
    const label = (name: string) => form.querySelector<HTMLSelectElement>(`select[name="${name}"]`)?.selectedOptions[0]?.text ?? '';
    const payload = {
      ...data,
      tipo_texto: label('tipo'),
      rol_texto: label('rol'),
      enfoque_texto: form.querySelector<HTMLInputElement>('input[name="enfoque"]:checked')?.parentElement?.textContent?.trim() ?? '',
      origen: source,
      _subject: `Nueva llamada agendándose · ${data.negocio} (${source})`,
      ...getAttribution(),
    };

    track('booking_form_submit', { source: source ?? '', kind: kind ?? '', enfoque: data.enfoque ?? '' });
    if (endpoint) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
      try {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
          signal: ctrl.signal,
          keepalive: true,
        });
      } catch {
        /* sin conexión o lento: se abre el calendario igual */
      } finally {
        clearTimeout(timer);
      }
    }
    window.location.href = booking ?? '/llamada';
  });
});
