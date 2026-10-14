/**
 * Manejo accesible de formularios (Blueprint §9, §11):
 * validación de cliente, estados enviando / éxito / error, foco y mensajes con aria-live,
 * y conversión de analítica SOLO tras confirmación real del servidor.
 */
import { getAttribution, track, type ConversionEvent } from './analytics';

const CONVERSIONS: Record<string, ConversionEvent> = {
  contacto: 'contact_submit_success',
  conferencia: 'conference_inquiry_success',
  'builder-drops': 'builder_drops_signup_success',
  'diagnostico-reporte': 'report_requested',
  'diagnostico-revision': 'review_requested',
  'checklist-ia-reporte': 'report_requested',
  'checklist-ia-revision': 'review_requested',
};

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function messageFor(el: Field): string {
  const v = el.validity;
  if (v.valueMissing) {
    if (el instanceof HTMLInputElement && el.type === 'checkbox') return 'Este campo es obligatorio.';
    return el.tagName === 'SELECT' ? 'Elige una opción.' : 'Este campo es obligatorio.';
  }
  if (v.typeMismatch && el.type === 'email') return 'Escribe un correo válido, por ejemplo nombre@empresa.com.';
  if (v.tooShort) return `Escribe al menos ${(el as HTMLInputElement).minLength} caracteres.`;
  if (v.tooLong) return `Máximo ${(el as HTMLInputElement).maxLength} caracteres.`;
  return el.validationMessage;
}

function errorNode(form: HTMLFormElement, el: Field): HTMLElement | null {
  const id = el.getAttribute('aria-describedby')?.split(' ').find((x) => x.endsWith('-error'));
  return id ? form.querySelector<HTMLElement>(`#${CSS.escape(id)}`) : null;
}

function setFieldError(form: HTMLFormElement, el: Field, msg: string) {
  el.setAttribute('aria-invalid', msg ? 'true' : 'false');
  const node = errorNode(form, el);
  if (node) node.textContent = msg;
}

function fields(form: HTMLFormElement): Field[] {
  return Array.from(form.querySelectorAll<Field>('input, select, textarea')).filter(
    (el) => el.name && !el.matches(':disabled') && el.type !== 'hidden' && !el.closest('.hp'),
  );
}

function validate(form: HTMLFormElement): Field | null {
  let first: Field | null = null;
  for (const el of fields(form)) {
    const ok = el.checkValidity();
    setFieldError(form, el, ok ? '' : messageFor(el));
    if (!ok && !first) first = el;
  }
  return first;
}

function serialize(form: HTMLFormElement): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  const fd = new FormData(form);
  for (const [k, v] of fd.entries()) {
    const multi = form.querySelectorAll(`[name="${k}"][type="checkbox"]`).length > 1;
    if (multi) ((data[k] ??= []) as unknown[]).push(v);
    else data[k] = typeof v === 'string' ? v : '';
  }
  const consent = form.querySelector<HTMLInputElement>('[name="consentimiento"]');
  if (consent) data.consentimiento = consent.checked;
  for (const [k, v] of Object.entries(data)) if (v === '') delete data[k];
  data.website = (form.querySelector<HTMLInputElement>('[name="website"]')?.value ?? '');
  data.sourcePage = location.pathname;
  data.attribution = getAttribution();
  return data;
}

function setStatus(node: HTMLElement, state: 'success' | 'error' | 'info' | '', msg: string) {
  node.dataset.state = state;
  node.textContent = msg;
}

const ERRORS: Record<string, string> = {
  not_configured:
    'Este formulario todavía no está conectado, así que tu mensaje no se envió. Por favor inténtalo más adelante.',
  rate_limited: 'Recibimos varios envíos seguidos. Espera unos minutos e inténtalo de nuevo.',
  delivery_failed: 'No pudimos entregar tu mensaje por un problema técnico. Inténtalo de nuevo en unos minutos.',
  rejected: 'No pudimos procesar el envío. Recarga la página e inténtalo de nuevo.',
  validation: 'Revisa los campos marcados.',
};

function init(form: HTMLFormElement) {
  const status = form.querySelector<HTMLElement>('[data-form-status]')!;
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const label = button.innerHTML;
  const started = form.querySelector<HTMLInputElement>('[name="startedAt"]');
  if (started) started.value = String(Date.now());

  form.noValidate = true;

  // Limpia el error en cuanto el campo se corrige (mientras se escribe, no al perder el foco,
  // para evitar saltos de layout justo cuando se hace clic en el siguiente control).
  const revalidate = (e: Event) => {
    const el = e.target as Field;
    if (el.name && el.getAttribute('aria-invalid') === 'true' && el.checkValidity()) setFieldError(form, el, '');
  };
  form.addEventListener('input', revalidate);
  form.addEventListener('change', revalidate);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus(status, '', '');
    const invalid = validate(form);
    if (invalid) {
      setStatus(status, 'error', ERRORS.validation);
      invalid.focus();
      return;
    }

    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.textContent = 'Enviando…';
    form.setAttribute('aria-busy', 'true');

    const payload = serialize(form);
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean; dryRun?: boolean; error?: string; fieldErrors?: Record<string, string>;
      };

      if (res.ok && data.ok) {
        const msg = form.dataset.success ?? '¡Gracias! Recibí tu mensaje.';
        if (data.dryRun) {
          setStatus(status, 'info', `${msg} (Modo prueba: los datos no se enviaron a ningún servicio.)`);
        } else {
          setStatus(status, 'success', msg);
          const ev = CONVERSIONS[String(payload.formType)];
          if (ev) track(ev, { source: location.pathname, form: String(payload.formType) });
        }
        form.reset();
        if (started) started.value = String(Date.now());
        form.dispatchEvent(new Event('change'));
        status.focus();
        return;
      }

      if (data.fieldErrors) {
        let first: Field | null = null;
        for (const [name, msg] of Object.entries(data.fieldErrors)) {
          const el = form.querySelector<Field>(`[name="${CSS.escape(name)}"]`);
          if (el) { setFieldError(form, el, msg); first ??= el; }
        }
        setStatus(status, 'error', ERRORS.validation);
        first?.focus();
        return;
      }
      setStatus(status, 'error', ERRORS[data.error ?? ''] ?? ERRORS.delivery_failed);
      status.focus();
    } catch {
      setStatus(status, 'error', 'No hay conexión o el servidor no respondió. Revisa tu conexión e inténtalo de nuevo.');
      status.focus();
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      button.innerHTML = label;
      form.removeAttribute('aria-busy');
    }
  });
}

document.querySelectorAll<HTMLFormElement>('form[data-lead-form]').forEach(init);
