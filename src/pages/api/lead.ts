/**
 * POST /api/lead — endpoint único para Contacto, Conferencias y Builder Drops.
 *
 * Seguridad (Blueprint §9, §11):
 * - Validación de servidor con Zod (lib/leads.ts).
 * - Antispam: honeypot + tiempo mínimo de llenado + verificación de origen.
 * - Rate limiting por IP (best-effort en memoria; ver docs/IMPLEMENTACION.md para uno distribuido).
 * - Secretos solo en servidor (astro:env). Nunca se exponen al cliente.
 *
 * Entrega: POST JSON al webhook configurado (CRM, Make, Zapier, n8n, HubSpot, etc.).
 * Si no hay webhook configurado responde 503 y el formulario NO aparenta completarse.
 */
import type { APIRoute } from 'astro';
import { getSecret } from 'astro:env/server';
import { leadSchema, toLead } from '../../lib/leads';

export const prerender = false;

const MIN_FILL_MS = 2500;
const MAX_BODY_BYTES = 20_000;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;
const hits = new Map<string, number[]>();

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_MAX;
}

function webhookFor(type: string): string | undefined {
  if (type === 'builder-drops') return getSecret('NEWSLETTER_WEBHOOK_URL') || getSecret('LEAD_WEBHOOK_URL');
  // Diagnóstico de clínicas → CRM / automatización de Maguey Studio Salud (si se define), si no, el CRM general.
  if (type.startsWith('diagnostico-')) return getSecret('DIAGNOSTIC_WEBHOOK_URL') || getSecret('LEAD_WEBHOOK_URL');
  return getSecret('LEAD_WEBHOOK_URL');
}

export const POST: APIRoute = async ({ request, clientAddress, url }) => {
  // Origen: solo aceptar envíos desde el propio sitio.
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== url.host) return json(403, { ok: false, error: 'forbidden' });

  if (!request.headers.get('content-type')?.includes('application/json')) {
    return json(415, { ok: false, error: 'unsupported_media_type' });
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json(413, { ok: false, error: 'too_large' });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, { ok: false, error: 'invalid_json' });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || clientAddress || 'unknown';
  const type = (body as { formType?: string })?.formType ?? 'unknown';
  if (rateLimited(`${ip}:${type}`)) return json(429, { ok: false, error: 'rate_limited' });

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    // Honeypot o bot: respuesta genérica sin detalles.
    const issues = parsed.error.issues;
    if (issues.some((i) => i.path[0] === 'website' || i.path[0] === 'startedAt')) {
      return json(400, { ok: false, error: 'rejected' });
    }
    const fieldErrors: Record<string, string> = {};
    for (const i of issues) {
      const k = String(i.path[0] ?? 'form');
      fieldErrors[k] ??= i.message;
    }
    return json(422, { ok: false, error: 'validation', fieldErrors });
  }

  const input = parsed.data;
  if (Date.now() - input.startedAt < MIN_FILL_MS) return json(400, { ok: false, error: 'rejected' });

  const lead = toLead(input);

  if (getSecret('FORMS_DRY_RUN') === 'true') {
    // Nunca registrar PII: solo tipo y métricas agregadas.
    const summary = 'digital_score' in lead
      ? { type: lead.type, digital_score: lead.digital_score, unknown_count: lead.unknown_count, lead_segment: lead.lead_segment }
      : { type: lead.type };
    console.info('[lead:dry-run]', JSON.stringify(summary));
    return json(200, { ok: true, dryRun: true });
  }

  const target = webhookFor(lead.type);
  if (!target) return json(503, { ok: false, error: 'not_configured' });

  try {
    const secret = getSecret('LEAD_WEBHOOK_SECRET');
    const res = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(secret ? { 'X-Webhook-Secret': secret } : {}) },
      body: JSON.stringify(lead),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error('[lead] webhook respondió', res.status);
      return json(502, { ok: false, error: 'delivery_failed' });
    }
  } catch (err) {
    console.error('[lead] error de entrega', err);
    return json(502, { ok: false, error: 'delivery_failed' });
  }

  return json(200, { ok: true });
};

export const ALL: APIRoute = () => json(405, { ok: false, error: 'method_not_allowed' });
