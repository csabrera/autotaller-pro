import { ESTADO_OT, ESTADO_CITA, type EstadoOT, type EstadoCita } from '../types/enums.js';

export const TRANSICIONES_OT: Record<EstadoOT, EstadoOT[]> = {
  RECIBIDO: [ESTADO_OT.EN_PROCESO, ESTADO_OT.CANCELADO],
  EN_PROCESO: [ESTADO_OT.ENTREGADO, ESTADO_OT.CANCELADO],
  ENTREGADO: [],
  CANCELADO: [],
};

export const COLORES_ESTADO_OT: Record<EstadoOT, string> = {
  RECIBIDO: '#64748b',
  EN_PROCESO: '#f97316',
  ENTREGADO: '#10b981',
  CANCELADO: '#ef4444',
};

export const ETIQUETAS_ESTADO_OT: Record<EstadoOT, string> = {
  RECIBIDO: 'Recibido',
  EN_PROCESO: 'En Proceso',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

// === CITAS ===

export const TRANSICIONES_CITA: Record<EstadoCita, EstadoCita[]> = {
  PROGRAMADA: [ESTADO_CITA.CONFIRMADA, ESTADO_CITA.CANCELADA],
  CONFIRMADA: [ESTADO_CITA.EN_PROCESO, ESTADO_CITA.CANCELADA, ESTADO_CITA.NO_ASISTIO],
  EN_PROCESO: [ESTADO_CITA.COMPLETADA, ESTADO_CITA.CANCELADA],
  COMPLETADA: [],
  CANCELADA: [],
  NO_ASISTIO: [],
};

export const COLORES_ESTADO_CITA: Record<EstadoCita, { bg: string; text: string; dot: string }> = {
  PROGRAMADA: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  CONFIRMADA: { bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-500' },
  EN_PROCESO: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  COMPLETADA: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  CANCELADA: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  NO_ASISTIO: { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' },
};

export const ETIQUETAS_ESTADO_CITA: Record<EstadoCita, string> = {
  PROGRAMADA: 'Programada',
  CONFIRMADA: 'Confirmada',
  EN_PROCESO: 'En Proceso',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
  NO_ASISTIO: 'No Asistió',
};
