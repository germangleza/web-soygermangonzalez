/**
 * Formulario corto antes de agendar (diagnóstico de clínicas, checklist de IA y checklist de ventas por WhatsApp).
 * Se envía a Formspree (SITE.formspreeEndpoint) y después abre el calendario (SITE.bookingUrl).
 */
import { SPECIALTIES } from '../lib/diagnostic/questions';
import { BUSINESS_TYPES } from '../lib/checklist-ia/questions';
import { FOCUS, VOLUMES } from '../lib/ventas-whatsapp/questions';

export type AgendaKind = 'clinica' | 'negocio' | 'atencion';

export const AGENDA_FORM = {
  clinica: {
    nameLabel: 'Nombre de la clínica',
    typeLabel: 'Tipo de clínica',
    types: SPECIALTIES as Record<string, string>,
    roleLabel: '¿Cuál es tu rol en la clínica?',
    roles: { propietario: 'Propietario o socio', direccion: 'Dirección o administración', medico: 'Médico o especialista', marketing: 'Marketing', otro: 'Otro' },
    focus: { cero: 'Estoy en cero', presencia: 'Presencia digital', clientes: 'Recibir más pacientes', explorando: 'Solo estoy explorando' },
  },
  negocio: {
    nameLabel: 'Nombre del negocio',
    typeLabel: 'Tipo de negocio',
    types: BUSINESS_TYPES as Record<string, string>,
    roleLabel: '¿Cuál es tu rol en el negocio?',
    roles: { propietario: 'Dueño o socio', direccion: 'Dirección o gerencia', marketing: 'Marketing o ventas', otro: 'Otro' },
    focus: { cero: 'Estoy en cero', presencia: 'Presencia digital', clientes: 'Recibir más clientes', explorando: 'Solo estoy explorando' },
  },
  // Checklist de ventas por WhatsApp: WhatsApp (para ligar con la cita) + 3 datos.
  atencion: {
    nameLabel: 'Nombre del negocio',
    volumeLabel: '¿Cuántos mensajes o consultas te llegan?',
    volumes: VOLUMES as Record<string, string>,
    focusLabel: '¿Qué te gustaría resolver primero?',
    focus: FOCUS as Record<string, string>,
  },
} as const;
