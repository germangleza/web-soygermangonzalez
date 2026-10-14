/**
 * Normalización y validación de URLs y perfiles (spec §4).
 * Las URLs son texto NO confiable: solo se validan y normalizan; el servidor nunca las visita (sin riesgo SSRF).
 * No se inventan perfiles: un "@usuario" solo se convierte en URL de la red indicada por el campo.
 */

export type LinkKind = 'website' | 'google_business' | 'instagram' | 'facebook' | 'tiktok' | 'linkedin';

const MAX = 300;
const HANDLE = /^@?([A-Za-z0-9._-]{1,60})$/;

const HOSTS: Record<Exclude<LinkKind, 'website'>, RegExp> = {
  google_business: /(^|\.)(google\.[a-z.]{2,8}|goo\.gl|g\.page|g\.co)$/i,
  instagram: /(^|\.)instagram\.com$/i,
  facebook: /(^|\.)(facebook\.com|fb\.com|fb\.me)$/i,
  tiktok: /(^|\.)tiktok\.com$/i,
  linkedin: /(^|\.)linkedin\.com$/i,
};

const HANDLE_BASE: Partial<Record<LinkKind, (h: string) => string>> = {
  instagram: (h) => `https://www.instagram.com/${h}`,
  facebook: (h) => `https://www.facebook.com/${h}`,
  tiktok: (h) => `https://www.tiktok.com/@${h}`,
};

export const LINK_ERRORS: Record<LinkKind, string> = {
  website: 'Escribe un dominio o URL válido, por ejemplo miclinica.com.',
  google_business: 'Pega el enlace de tu ficha de Google Maps (empieza con maps.app.goo.gl o google.com/maps).',
  instagram: 'Escribe tu usuario (@miclinica) o el enlace de Instagram.',
  facebook: 'Escribe tu usuario o el enlace de tu página de Facebook.',
  tiktok: 'Escribe tu usuario (@miclinica) o el enlace de TikTok.',
  linkedin: 'Pega el enlace de LinkedIn (linkedin.com/...).',
};

function parseHttpUrl(raw: string): URL | null {
  const withProto = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withProto);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    if (u.username || u.password) return null;
    if (!u.hostname.includes('.') || /^[\d.]+$/.test(u.hostname) || u.hostname.startsWith('[')) return null;
    if (!/^[a-z0-9.-]+$/i.test(u.hostname)) return null;
    return u;
  } catch {
    return null;
  }
}

/**
 * Devuelve la URL normalizada, '' si el valor está vacío, o null si es inválido.
 */
export function normalizeLink(kind: LinkKind, value: string | undefined | null): string | null {
  const raw = (value ?? '').trim();
  if (!raw) return '';
  if (raw.length > MAX || /\s/.test(raw)) return null;

  const toHandle = HANDLE_BASE[kind];
  const handle = raw.match(HANDLE);
  if (toHandle && handle && !raw.includes('.')) return toHandle(handle[1]);
  if (toHandle && handle && raw.startsWith('@')) return toHandle(handle[1]);

  const u = parseHttpUrl(raw);
  if (!u) return null;
  if (kind !== 'website' && !HOSTS[kind].test(u.hostname)) return null;
  if (kind === 'google_business' && /(^|\.)google\./i.test(u.hostname) && !/\/maps|\/search|cid=|business/i.test(u.pathname + u.search)) return null;
  u.protocol = 'https:';
  u.hash = '';
  return u.toString().replace(/\/$/, '');
}

/** WhatsApp comercial: dígitos con lada opcional (+52...). */
export function normalizeWhatsapp(value: string | undefined | null): string | null {
  const raw = (value ?? '').trim();
  if (!raw) return '';
  const digits = raw.replace(/[\s().-]/g, '');
  return /^\+?\d{8,15}$/.test(digits) ? digits : null;
}
