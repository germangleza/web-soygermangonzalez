/**
 * Copia texto al portapapeles conservando saltos de línea.
 * 1) Clipboard API (requiere HTTPS/localhost y gesto del usuario).
 * 2) Fallback: <textarea> temporal + execCommand('copy') para navegadores sin la API.
 * Devuelve false si ninguna vía funcionó (la UI debe ofrecer selección manual).
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* sigue al fallback */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '-9999px';
    ta.style.fontSize = '16px'; // evita el zoom de iOS
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

/** Selecciona el contenido de un elemento para que el usuario lo copie manualmente. */
export function selectContents(el: Element): void {
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}
