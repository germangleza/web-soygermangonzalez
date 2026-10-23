/**
 * Analítica y atribución (Blueprint §11).
 * - track() envía eventos a GA4 (gtag) y/o Plausible SOLO si están configurados.
 * - Las conversiones se disparan únicamente tras una confirmación real del servidor.
 * - captureAttribution() guarda UTM y página de entrada (first touch) en sessionStorage
 *   para adjuntarlos al Lead.
 */

export type ConversionEvent =
  | 'contact_submit_success'
  | 'conference_inquiry_success'
  | 'builder_drops_signup_success'
  | 'event_signup_success'
  | 'resource_download'
  // Diagnóstico de clínicas (meeting_booked, proposal_sent y customer_won solo con integración real de CRM)
  | 'diagnostic_started'
  | 'diagnostic_completed'
  | 'report_requested'
  | 'review_requested'
  // Checklist «¿La IA recomienda tu negocio?» (qualified_lead, meeting_booked y customer_won se registran en el CRM)
  | 'checklist_view'
  | 'checklist_start'
  | 'checklist_complete'
  // Recursos de Builder Lab (nunca se envía el texto copiado ni datos personales)
  | 'resource_view'
  | 'prompt_copied'
  // Landing /llamada: clic hacia el calendario (la cita confirmada se mide en el calendario/CRM)
  | 'booking_click'
  // Landing /llamada2: clic a «Prefiero escribirte» (WhatsApp)
  | 'whatsapp_click'
  // Formulario corto antes de agendar (diagnóstico / checklist)
  | 'booking_form_submit';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    plausible?: (event: string, opts?: { props?: Record<string, string> }) => void;
  }
}

const KEY = 'gg_attribution';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

export type Attribution = Partial<Record<(typeof UTM_KEYS)[number], string>> & {
  landingPage?: string;
  referrer?: string;
};

export function captureAttribution(): void {
  try {
    const params = new URLSearchParams(location.search);
    const hasUtm = UTM_KEYS.some((k) => params.has(k));
    if (sessionStorage.getItem(KEY) && !hasUtm) return;
    const data: Attribution = { landingPage: location.pathname };
    if (document.referrer && !document.referrer.startsWith(location.origin)) data.referrer = document.referrer;
    for (const k of UTM_KEYS) {
      const v = params.get(k);
      if (v) data[k] = v.slice(0, 120);
    }
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* almacenamiento no disponible: se ignora */
  }
}

export function getAttribution(): Attribution {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? '{}') as Attribution;
  } catch {
    return {};
  }
}

export function track(event: ConversionEvent, props: Record<string, string> = {}): void {
  try {
    window.gtag?.('event', event, props);
    window.plausible?.(event, { props });
  } catch {
    /* nunca romper la UX por analítica */
  }
}
