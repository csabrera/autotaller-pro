// === TIPOS DE DOCUMENTO ===
export const TIPO_DOCUMENTO = {
  DNI: 'DNI',
  PASAPORTE: 'PASAPORTE',
  CE: 'CE',
  RUC: 'RUC',
} as const;

export type TipoDocumento = (typeof TIPO_DOCUMENTO)[keyof typeof TIPO_DOCUMENTO];

// === TIPO DE CLIENTE ===
export const TIPO_CLIENTE = {
  PERSONA: 'PERSONA',
  EMPRESA: 'EMPRESA',
} as const;

export type TipoCliente = (typeof TIPO_CLIENTE)[keyof typeof TIPO_CLIENTE];

// === ESTADOS DE ORDEN DE TRABAJO ===
export const ESTADO_OT = {
  RECIBIDO: 'RECIBIDO',
  EN_PROCESO: 'EN_PROCESO',
  ENTREGADO: 'ENTREGADO',
  CANCELADO: 'CANCELADO',
} as const;

export type EstadoOT = (typeof ESTADO_OT)[keyof typeof ESTADO_OT];

// === ESTADOS DE SERVICIO EN OT ===
export const ESTADO_SERVICIO_OT = {
  PENDIENTE: 'PENDIENTE',
  EN_PROCESO: 'EN_PROCESO',
  TERMINADO: 'TERMINADO',
} as const;

export type EstadoServicioOT = (typeof ESTADO_SERVICIO_OT)[keyof typeof ESTADO_SERVICIO_OT];

// === TIPO DE SERVICIO ===
export const TIPO_SERVICIO = {
  PREVENTIVO: 'PREVENTIVO',
  CORRECTIVO: 'CORRECTIVO',
} as const;

export type TipoServicio = (typeof TIPO_SERVICIO)[keyof typeof TIPO_SERVICIO];

// === ESTADOS DE COTIZACION ===
export const ESTADO_COTIZACION = {
  BORRADOR: 'BORRADOR',
  ENVIADA: 'ENVIADA',
  APROBADA: 'APROBADA',
  RECHAZADA: 'RECHAZADA',
  VENCIDA: 'VENCIDA',
} as const;

export type EstadoCotizacion = (typeof ESTADO_COTIZACION)[keyof typeof ESTADO_COTIZACION];

// === ESTADOS DE FACTURA ===
export const ESTADO_FACTURA = {
  BORRADOR: 'BORRADOR',
  EMITIDA: 'EMITIDA',
  PAGADA: 'PAGADA',
  PARCIAL: 'PARCIAL',
  ANULADA: 'ANULADA',
} as const;

export type EstadoFactura = (typeof ESTADO_FACTURA)[keyof typeof ESTADO_FACTURA];

// === ESTADOS DE ORDEN DE COMPRA ===
export const ESTADO_ORDEN_COMPRA = {
  BORRADOR: 'BORRADOR',
  ENVIADA: 'ENVIADA',
  PARCIAL: 'PARCIAL',
  RECIBIDA: 'RECIBIDA',
  CANCELADA: 'CANCELADA',
} as const;

export type EstadoOrdenCompra = (typeof ESTADO_ORDEN_COMPRA)[keyof typeof ESTADO_ORDEN_COMPRA];

// === TIPO DE MOVIMIENTO DE STOCK ===
export const TIPO_MOVIMIENTO_STOCK = {
  ENTRADA: 'ENTRADA',
  SALIDA: 'SALIDA',
  AJUSTE: 'AJUSTE',
} as const;

export type TipoMovimientoStock = (typeof TIPO_MOVIMIENTO_STOCK)[keyof typeof TIPO_MOVIMIENTO_STOCK];

// === ESTADOS DE CITA ===
export const ESTADO_CITA = {
  PROGRAMADA: 'PROGRAMADA',
  CONFIRMADA: 'CONFIRMADA',
  EN_PROCESO: 'EN_PROCESO',
  COMPLETADA: 'COMPLETADA',
  CANCELADA: 'CANCELADA',
  NO_ASISTIO: 'NO_ASISTIO',
} as const;

export type EstadoCita = (typeof ESTADO_CITA)[keyof typeof ESTADO_CITA];

// === TIPO DE NOTIFICACION ===
export const TIPO_NOTIFICACION = {
  SISTEMA: 'SISTEMA',
  CORREO: 'CORREO',
  SMS: 'SMS',
} as const;

export type TipoNotificacion = (typeof TIPO_NOTIFICACION)[keyof typeof TIPO_NOTIFICACION];

// === TIPO DE EVIDENCIA ===
export const TIPO_EVIDENCIA = {
  ANTES: 'ANTES',
  DURANTE: 'DURANTE',
  DESPUES: 'DESPUES',
} as const;

export type TipoEvidencia = (typeof TIPO_EVIDENCIA)[keyof typeof TIPO_EVIDENCIA];
