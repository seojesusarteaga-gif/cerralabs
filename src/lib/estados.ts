/**
 * Estados del embudo, en orden de avance.
 *
 * Deben coincidir con el enum `Estado` de prisma/schema.prisma. Se declaran
 * aquí además de en el esquema para que el panel pueda recorrerlos y validarlos
 * sin depender del cliente generado de Prisma.
 */
export const ESTADOS = [
  'NUEVO',
  'CONTACTADO',
  'LLAMADA_AGENDADA',
  'PROPUESTA',
  'CERRADO',
  'DESCARTADO',
] as const;

export type EstadoLead = (typeof ESTADOS)[number];

export const ESTADO_ETIQUETA: Record<EstadoLead, string> = {
  NUEVO: 'Nuevo',
  CONTACTADO: 'Contactado',
  LLAMADA_AGENDADA: 'Llamada agendada',
  PROPUESTA: 'Propuesta',
  CERRADO: 'Cerrado',
  DESCARTADO: 'Descartado',
};

export function esEstado(v: unknown): v is EstadoLead {
  return typeof v === 'string' && (ESTADOS as readonly string[]).includes(v);
}
