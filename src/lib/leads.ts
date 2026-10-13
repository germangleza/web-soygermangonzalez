/**
 * Modelo Lead + validación de servidor (Blueprint §9–§11).
 * La validación de cliente (HTML5 + mensajes accesibles) refleja estas reglas,
 * pero la fuente de verdad es este esquema: nunca confiar en el navegador.
 */
import { z } from 'astro/zod';

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

export const leadSchema = z.discriminatedUnion('formType', [contactSchema, conferenceSchema, newsletterSchema]);
export type LeadInput = z.infer<typeof leadSchema>;

/** Registro normalizado que se entrega al CRM / plataforma de correo (modelo Lead §10). */
export interface Lead {
  type: LeadInput['formType'];
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

export function toLead(input: LeadInput): Lead {
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
