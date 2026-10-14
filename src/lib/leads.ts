/**
 * Modelo Lead + validación de servidor (Blueprint §9–§11).
 * La validación de cliente (HTML5 + mensajes accesibles) refleja estas reglas,
 * pero la fuente de verdad es este esquema: nunca confiar en el navegador.
 */
import { z } from 'astro/zod';
import { QUALIFICATION, SPECIALTIES, type Answers } from './diagnostic/questions';
import { computeResult, isValidAnswers, leadScore, recommend } from './diagnostic/scoring';
import { LINK_ERRORS, normalizeLink, normalizeWhatsapp, type LinkKind } from './diagnostic/urls';

export const CONTACT_TYPES = {
  crecer: 'Necesito crecer o mejorar mi negocio.',
  lanzar: 'Quiero lanzar una empresa, producto o iniciativa.',
  conferencia: 'Quiero contratar una conferencia o workshop.',
  colaboracion: 'Tengo una propuesta de colaboración.',
  otro: 'Otro asunto.',
} as const;

export const EVENT_TYPES = {
  empresa: 'Evento o sesión interna de empresa',
  universidad: 'Universidad o institución educativa',
  comunidad: 'Comunidad o asociación',
  congreso: 'Congreso, foro o evento abierto',
  otro: 'Otro',
} as const;

export const MODALITIES = {
  presencial: 'Presencial',
  online: 'En línea',
  hibrido: 'Híbrido',
  por_definir: 'Por definir',
} as const;

export const CONFERENCE_TOPICS = {
  'construir-mas-rapido': 'La nueva ventaja competitiva: construir más rápido.',
  'donde-esta-la-oportunidad': '¿Dónde está la oportunidad?',
  'ia-recomiende-tu-negocio': 'Cómo hacer que la IA recomiende tu negocio.',
  'ai-for-business': 'AI for Business — workshop aplicado.',
  'ai-builder-workshop': 'AI Builder Workshop — experimentación orientada a prototipo.',
  personalizado: 'Experiencia personalizada / por definir',
} as const;

export const FORMAT_TYPES = {
  conferencia: 'Conferencia',
  workshop: 'Workshop práctico',
  ejecutiva: 'Sesión ejecutiva',
  personalizada: 'Experiencia personalizada',
} as const;

export const TRAINING_INTERESTS = {
  'ai-tools-lab': 'AI Tools Lab',
  'ai-builder-bootcamp': 'AI Builder Bootcamp',
  'business-building-workshop': 'Business Building Workshop',
} as const;

const keys = <T extends Record<string, string>>(o: T) => Object.keys(o) as [keyof T & string, ...(keyof T & string)[]];

const opt = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));
const name = z.string({ required_error: 'Escribe tu nombre.' }).trim().min(2, 'Escribe tu nombre.').max(100);
const email = z.string({ required_error: 'Escribe tu correo.' }).trim().toLowerCase().email('Escribe un correo válido.').max(160);
const consent = z.literal(true, { errorMap: () => ({ message: 'Necesitamos tu consentimiento para responderte.' }) });

const attribution = z
  .object({
    utm_source: opt(120),
    utm_medium: opt(120),
    utm_campaign: opt(120),
    utm_term: opt(120),
    utm_content: opt(120),
    landingPage: opt(300),
    referrer: opt(300),
  })
  .partial()
  .default({});

const meta = {
  /** Honeypot: los humanos no lo ven; debe llegar vacío. */
  website: z.string().max(0).optional(),
  /** Marca de tiempo de cuando se cargó el formulario (anti-bots). */
  startedAt: z.coerce.number().int().positive(),
  sourcePage: opt(300),
  attribution,
};

export const contactSchema = z.object({
  formType: z.literal('contacto'),
  tipo: z.enum(keys(CONTACT_TYPES), { errorMap: () => ({ message: 'Elige un tipo de solicitud.' }) }),
  nombre: name,
  email,
  empresa: opt(150),
  reto: z.string({ required_error: 'Cuéntame tu reto.' }).trim().min(10, 'Cuéntame un poco más (mínimo 10 caracteres).').max(4000),
  plazos: opt(200),
  // Condicionales para eventos
  eventoFecha: opt(60),
  eventoModalidad: z.enum(keys(MODALITIES)).optional(),
  eventoAsistentes: opt(40),
  eventoOrganizacion: opt(150),
  consentimiento: consent,
  ...meta,
});

export const conferenceSchema = z.object({
  formType: z.literal('conferencia'),
  nombre: name,
  organizacion: z.string({ required_error: 'Escribe el nombre de la organización.' }).trim().min(2, 'Escribe el nombre de la organización.').max(150),
  email,
  tipoEvento: z.enum(keys(EVENT_TYPES), { errorMap: () => ({ message: 'Elige el tipo de evento.' }) }),
  formato: z.enum(keys(FORMAT_TYPES)).optional(),
  tema: z.enum(keys(CONFERENCE_TOPICS), { errorMap: () => ({ message: 'Elige un tema.' }) }),
  fecha: opt(60),
  ciudad: opt(120),
  modalidad: z.enum(keys(MODALITIES)).optional(),
  asistentes: opt(40),
  objetivo: z.string({ required_error: 'Describe el objetivo del evento.' }).trim().min(10, 'Describe brevemente el objetivo (mínimo 10 caracteres).').max(3000),
  presupuesto: opt(120),
  consentimiento: consent,
  ...meta,
});

export const newsletterSchema = z.object({
  formType: z.literal('builder-drops'),
  email,
  nombre: opt(100),
  intereses: z.array(z.enum(keys(TRAINING_INTERESTS))).max(5).optional(),
  consentimiento: consent,
  ...meta,
});

/* ------------------------------------------------ Diagnóstico de Visibilidad Digital para Clínicas */

const link = (kind: LinkKind) =>
  z
    .string()
    .optional()
    .transform((v, ctx) => {
      const n = normalizeLink(kind, v);
      if (n === null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: LINK_ERRORS[kind] });
        return z.NEVER;
      }
      return n || undefined;
    });

const whatsapp = z
  .string()
  .optional()
  .transform((v, ctx) => {
    const n = normalizeWhatsapp(v);
    if (n === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Escribe un número de 10 dígitos, con lada si es posible.' });
      return z.NEVER;
    }
    return n || undefined;
  });

/** Respuestas del cuestionario: JSON {q1: opción, …}. Debe estar completo y ser válido. */
const answers = z
  .string()
  .max(2000)
  .transform((v, ctx) => {
    try {
      const parsed: unknown = JSON.parse(v);
      if (isValidAnswers(parsed) && computeResult(parsed).complete) return parsed as Answers;
    } catch { /* inválido */ }
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Completa el diagnóstico antes de enviar.' });
    return z.NEVER;
  });

const flag = z.union([z.literal('true'), z.literal(true)]).optional().transform((v) => v !== undefined);

const clinicLinks = {
  city: opt(120),
  specialty: z.enum(keys(SPECIALTIES)).optional(),
  website_url: link('website'),
  no_website: flag,
  google_business_url: link('google_business'),
  instagram_url: link('instagram'),
  facebook_url: link('facebook'),
  tiktok_url: link('tiktok'),
  linkedin_url: link('linkedin'),
  business_whatsapp: whatsapp,
};

/** CTA A: "Envíame mi reporte". Email requerido; el resto opcional. Marketing es un check aparte y opcional. */
export const diagnosticReportSchema = z.object({
  formType: z.literal('diagnostico-reporte'),
  answers,
  email,
  full_name: opt(100),
  clinic_name: opt(150),
  ...clinicLinks,
  marketing_consent: flag,
  consentimiento: consent,
  ...meta,
});

const qual = <K extends keyof typeof QUALIFICATION>(k: K, msg: string) =>
  z.enum(keys(QUALIFICATION[k].options as Record<string, string>), { errorMap: () => ({ message: msg }) });

/** CTA B: "Quiero que revisen mi clínica" → evaluación comercial con Maguey Studio Salud. */
export const diagnosticReviewSchema = z.object({
  formType: z.literal('diagnostico-revision'),
  answers,
  full_name: z.string({ required_error: 'Escribe tu nombre.' }).trim().min(2, 'Escribe tu nombre.').max(100),
  email,
  clinic_name: z.string({ required_error: 'Escribe el nombre de la clínica.' }).trim().min(2, 'Escribe el nombre de la clínica.').max(150),
  ...clinicLinks,
  city: z.string({ required_error: 'Escribe la ciudad.' }).trim().min(2, 'Escribe la ciudad.').max(120),
  specialty: z.enum(keys(SPECIALTIES), { errorMap: () => ({ message: 'Elige el tipo de clínica.' }) }),
  challenge: z.string({ required_error: 'Cuéntanos brevemente el reto.' }).trim().min(10, 'Cuéntanos un poco más (mínimo 10 caracteres).').max(2000),
  role: qual('role', 'Elige tu rol.'),
  priority: qual('priority', 'Elige una prioridad.'),
  start: qual('start', 'Elige cuándo te gustaría comenzar.'),
  authorizer: qual('authorizer', 'Elige quién autoriza la inversión.'),
  investment: qual('investment', 'Elige una opción.'),
  marketing_consent: flag,
  consentimiento: consent,
  ...meta,
});

export const leadSchema = z.discriminatedUnion('formType', [
  contactSchema,
  conferenceSchema,
  newsletterSchema,
  diagnosticReportSchema,
  diagnosticReviewSchema,
]);
export type LeadInput = z.infer<typeof leadSchema>;

/** Registro normalizado que se entrega al CRM / plataforma de correo (modelo Lead §10). */
export interface Lead {
  type: 'contacto' | 'conferencia' | 'builder-drops';
  subtype?: string;
  name?: string;
  email: string;
  organization?: string;
  details?: string;
  eventDate?: string;
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
  privacyConsentAt: string;
  createdAt: string;
  fields: Record<string, unknown>;
}

/** Registro del diagnóstico (spec §9). Plano y en snake_case para mapearlo directo al CRM. */
export interface DiagnosticLead {
  type: 'diagnostico-reporte' | 'diagnostico-revision';
  business_unit: 'maguey-salud';
  /** Clave para evitar duplicados: el CRM debe hacer upsert por email y conservar el historial. */
  dedupe_key: string;
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
  full_name?: string;
  email: string;
  clinic_name?: string;
  city?: string;
  specialty?: string;
  website_url?: string;
  no_website: boolean;
  google_business_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  tiktok_url?: string;
  linkedin_url?: string;
  business_whatsapp?: string;
  challenge?: string;
  answers: Answers;
  scores_by_dimension: Record<string, number>;
  digital_score: number;
  digital_band: string;
  weakest_dimension: string;
  unknown_count: number;
  unknown_questions: string[];
  top_recommendations: { title: string; area: string; first_action: string; why: string; needs_verification: boolean }[];
  requested_report: boolean;
  requested_review: boolean;
  /** true = pidió evaluación comercial con Maguey Studio Salud (notificar al equipo). */
  maguey_salud_review: boolean;
  /** Solicitud expresa de contacto: prevalece sobre lead_score. */
  priority_contact: boolean;
  marketing_consent: boolean;
  qualification?: { role: string; priority: string; start: string; authorizer: string; investment: string };
  lead_score?: number;
  lead_segment?: 'A' | 'B' | 'C';
  lead_score_breakdown?: Record<string, number>;
  privacy_consent_at: string;
  created_at: string;
}

function toDiagnosticLead(
  input: z.infer<typeof diagnosticReportSchema> | z.infer<typeof diagnosticReviewSchema>,
): DiagnosticLead {
  const now = new Date().toISOString();
  const a = input.attribution;
  const result = computeResult(input.answers);
  const recs = recommend(input.answers, result, { noWebsite: input.no_website });
  const review = input.formType === 'diagnostico-revision';
  const lead: DiagnosticLead = {
    type: input.formType,
    business_unit: 'maguey-salud',
    dedupe_key: input.email,
    source: input.sourcePage ?? a.landingPage,
    utm_source: a.utm_source,
    utm_medium: a.utm_medium,
    utm_campaign: a.utm_campaign,
    utm_term: a.utm_term,
    utm_content: a.utm_content,
    referrer: a.referrer,
    full_name: input.full_name,
    email: input.email,
    clinic_name: input.clinic_name,
    city: input.city,
    specialty: input.specialty,
    website_url: input.no_website ? undefined : input.website_url,
    no_website: input.no_website,
    google_business_url: input.google_business_url,
    instagram_url: input.instagram_url,
    facebook_url: input.facebook_url,
    tiktok_url: input.tiktok_url,
    linkedin_url: input.linkedin_url,
    business_whatsapp: input.business_whatsapp,
    answers: input.answers,
    scores_by_dimension: Object.fromEntries(result.dimensions.map((d) => [d.id, d.score])),
    digital_score: result.digitalScore,
    digital_band: result.band.label,
    weakest_dimension: result.weakest.label,
    unknown_count: result.unknownCount,
    unknown_questions: result.unknownQuestions,
    top_recommendations: recs.map((r) => ({ title: r.title, area: r.area, first_action: r.firstAction, why: r.why, needs_verification: r.needsVerification })),
    requested_report: !review,
    requested_review: review,
    maguey_salud_review: review,
    priority_contact: review,
    marketing_consent: input.marketing_consent,
    privacy_consent_at: now,
    created_at: now,
  };
  if (input.formType === 'diagnostico-revision') {
    const { role, priority, start, authorizer, investment } = input;
    const ls = leadScore({ role, priority, start, authorizer, investment }, result.digitalScore, {
      hasWebsite: Boolean(input.website_url),
      noWebsite: input.no_website,
      hasGoogleBusiness: Boolean(input.google_business_url),
      hasSocial: Boolean(input.instagram_url || input.facebook_url || input.tiktok_url || input.linkedin_url),
      hasCity: Boolean(input.city),
    });
    lead.challenge = input.challenge;
    lead.qualification = { role, priority, start, authorizer, investment };
    lead.lead_score = ls.score;
    lead.lead_segment = ls.segment;
    lead.lead_score_breakdown = ls.breakdown;
  }
  return lead;
}

export function toLead(input: LeadInput): Lead | DiagnosticLead {
  if (input.formType === 'diagnostico-reporte' || input.formType === 'diagnostico-revision') return toDiagnosticLead(input);
  const now = new Date().toISOString();
  const { website: _hp, startedAt: _t, attribution: a, sourcePage, consentimiento: _c, formType, ...fields } = input;
  const base = {
    type: formType,
    email: input.email,
    source: sourcePage ?? a.landingPage,
    utm_source: a.utm_source,
    utm_medium: a.utm_medium,
    utm_campaign: a.utm_campaign,
    utm_term: a.utm_term,
    utm_content: a.utm_content,
    referrer: a.referrer,
    privacyConsentAt: now,
    createdAt: now,
    fields,
  };
  switch (input.formType) {
    case 'contacto':
      return {
        ...base,
        subtype: input.tipo,
        name: input.nombre,
        organization: input.eventoOrganizacion ?? input.empresa,
        details: input.reto,
        eventDate: input.eventoFecha,
      };
    case 'conferencia':
      return {
        ...base,
        subtype: input.tema,
        name: input.nombre,
        organization: input.organizacion,
        details: input.objetivo,
        eventDate: input.fecha,
      };
    case 'builder-drops':
      return { ...base, name: input.nombre };
  }
}
