import { api } from './api';

export interface PortalCliente {
  id: string;
  tipoCliente: string;
  nombres: string | null;
  apellidoPaterno: string | null;
  razonSocial: string | null;
  telefono: string;
  correo: string | null;
  numeroDocumento: string;
  vehiculos: PortalVehiculo[];
}

export interface PortalVehiculo {
  id: string;
  placa: string;
  anio: number;
  kilometrajeActual: number;
  marca: { nombre: string };
  modelo: { nombre: string };
  color: { nombre: string };
  combustible?: { nombre: string };
  transmision?: { nombre: string } | null;
  otAbierta?: { id: string; numeroOrden: string; estado: string; fechaEntrada: string } | null;
}

export interface PortalResumen {
  vehiculos: number;
  otAbiertas: number;
  facturasPendientes: number;
  citasProximas: number;
}

export interface PortalOT {
  id: string;
  numeroOrden: string;
  estado: string;
  costoTotal: string;
  fechaEntrada: string;
  fechaEntrega: string | null;
  vehiculo: { placa: string; marca: { nombre: string }; modelo: { nombre: string } };
  servicios: { servicioNombre: string; subtotal: string }[];
  repuestos: { repuestoNombre: string; subtotal: string }[];
  sucursal: { nombre: string };
}

export interface PortalFactura {
  id: string;
  numeroFactura: string;
  tipoDocumento: string;
  total: string;
  estado: string;
  emitidaEn: string | null;
  pagos: { id: string; monto: string; pagadoEn: string; metodoPago: { nombre: string } }[];
}

export interface PortalCita {
  id: string;
  numeroCita: string;
  estado: string;
  fechaProgramada: string;
  duracionMinutos: number;
  notas: string | null;
  vehiculo: { placa: string; marca: { nombre: string }; modelo: { nombre: string } };
  servicio: { nombre: string } | null;
  mecanico: { nombres: string; apellidoPaterno: string } | null;
  sucursal: { nombre: string };
}

export function loginPortalAPI(numeroDocumento: string, telefono: string) {
  return api.post<{ cliente: PortalCliente }>('/portal/login', { numeroDocumento, telefono });
}

export function resumenPortalAPI(clienteId: string) {
  return api.get<PortalResumen>(`/portal/${clienteId}/resumen`);
}

export function vehiculosPortalAPI(clienteId: string) {
  return api.get<PortalVehiculo[]>(`/portal/${clienteId}/vehiculos`);
}

export function ordenesPortalAPI(clienteId: string) {
  return api.get<PortalOT[]>(`/portal/${clienteId}/ordenes`);
}

export function facturasPortalAPI(clienteId: string) {
  return api.get<PortalFactura[]>(`/portal/${clienteId}/facturas`);
}

export function citasPortalAPI(clienteId: string) {
  return api.get<PortalCita[]>(`/portal/${clienteId}/citas`);
}

export function agendarCitaPortalAPI(clienteId: string, data: Record<string, unknown>) {
  return api.post<PortalCita>(`/portal/${clienteId}/citas`, data);
}
