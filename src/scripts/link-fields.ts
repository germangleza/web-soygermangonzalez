/**
 * Campos de sitio web, Google Maps y redes (Diagnóstico de clínicas y checklist de IA):
 * validación accesible, normalización al salir del campo, "No tengo sitio web" y "Agregar otra red".
 */
import { LINK_ERRORS, normalizeLink, normalizeWhatsapp, type LinkKind } from '../lib/diagnostic/urls';

const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(sel));

/* ---------------------------------------------------------------- Campos de enlaces */
function validateLink(input: HTMLInputElement) {
  const kind = input.dataset.linkKind as LinkKind | 'whatsapp';
  const v = input.value.trim();
  if (!v) return input.setCustomValidity('');
  const n = kind === 'whatsapp' ? normalizeWhatsapp(v) : normalizeLink(kind, v);
  input.setCustomValidity(n === null ? (kind === 'whatsapp' ? 'Escribe un número de 10 dígitos, con lada si es posible.' : LINK_ERRORS[kind]) : '');
}

$$<HTMLInputElement>('[data-link-kind]').forEach((input) => {
  input.addEventListener('input', () => validateLink(input));
  input.addEventListener('blur', () => {
    validateLink(input);
    const kind = input.dataset.linkKind as LinkKind | 'whatsapp';
    if (kind !== 'whatsapp' && input.validity.valid && input.value.trim()) input.value = normalizeLink(kind, input.value) || input.value;
  });
});

$$<HTMLInputElement>('[data-no-website]').forEach((check) => {
  const web = check.closest('.links__web')?.querySelector<HTMLInputElement>('[data-link-kind="website"]');
  check.addEventListener('change', () => {
    if (!web) return;
    web.disabled = check.checked;
    if (check.checked) { web.value = ''; web.setCustomValidity(''); web.setAttribute('aria-invalid', 'false'); }
  });
});

$$<HTMLButtonElement>('[data-add-links]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const more = btn.parentElement?.querySelector<HTMLElement>('[data-more-links]');
    if (!more) return;
    more.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    btn.hidden = true;
    more.querySelector<HTMLInputElement>('input')?.focus();
  });
});

// Tras un envío exitoso forms.ts hace form.reset(): re-habilita el campo de sitio web.
$$<HTMLFormElement>('form[data-lead-form]').forEach((f) =>
  f.addEventListener('reset', () => setTimeout(() => {
    f.querySelectorAll<HTMLInputElement>('[data-link-kind="website"]').forEach((w) => (w.disabled = false));
  })),
);
