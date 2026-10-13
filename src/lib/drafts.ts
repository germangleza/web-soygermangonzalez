/**
 * Visibilidad de borradores.
 * - En desarrollo (`npm run dev`) siempre se muestran, con banner de BORRADOR y noindex.
 * - En un deploy de preview, define PUBLIC_SHOW_DRAFTS=true para revisarlos.
 * - En producción NUNCA se muestran (Blueprint §10: nada ficticio indexable).
 */
export const SHOW_DRAFTS = import.meta.env.DEV || import.meta.env.PUBLIC_SHOW_DRAFTS === 'true';
