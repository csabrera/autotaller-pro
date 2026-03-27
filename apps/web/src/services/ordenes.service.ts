import { api } from './api';

export interface OrdenTrabajoItem {
  id: string;
  numeroOrden: string;
  estado: string;
  kilometrajeEntrada: number;
  fechaEntrada: string;
  fechaEstimada: string | null;
  fechaEntrega: string | null;
  notasCliente: string | null;
  notasInternas: string | null;
  diagnostico: string | null;
  costoTotal: string;
  vehiculo: { id: string; placa: string; anio: number; marca: { nombre: string }; modelo: { nombre: string }; color: { nombre: string } };
  cliente: { id: string; tipoCliente: string; nombres: string | null; apellidoPaterno: string | null; razonSocial: string | null; numeroDocumento: string };
  recepcionista: { id: string; nombres: string; apellidoPaterno: string };
  mecanicoAsignado: { id: string; nombres: string; apellidoPaterno: string } | null;
  sucursal: { id: string; nombre: string };
  servicios: { id: string; servicioNombre: string; servicioTipo: string; cantidad: number; precioUnitario: string; subtotal: string; estado: string; notas: string | null }[];
  repuestos: { id: string; repuestoNombre: string; cantidad: number; costoUnitario: string; subtotal: string }[];
  checklist: { id: string; item: string; marcado: boolean; notas: string | null }[];
  evidencias: { id: string; urlImagen: string; tipo: string; descripcion: string | null }[];
  historialEstados: { id: string; estadoAnterior: string; estadoNuevo: string; cambiadoEn: string; notas: string | null }[];
}

interface ListaOrdenesResponse {
  datos: OrdenTrabajoItem[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
  conteosPorEstado: Record<string, number>;
}

export function listarOrdenesAPI(pagina = 1, porPagina = 10, estado?: string, busqueda?: string) {
  const params = new URLSearchParams({ pagina: String(pagina), porPagina: String(porPagina) });
  if (estado) params.set('estado', estado);
  if (busqueda) params.set('busqueda', busqueda);
  return api.get<ListaOrdenesResponse>(`/ordenes-trabajo?${params}`);
}

export function obtenerOrdenAPI(id: string) {
  return api.get<OrdenTrabajoItem>(`/ordenes-trabajo/${id}`);
}

export function crearOrdenAPI(data: Record<string, unknown>) {
  return api.post<OrdenTrabajoItem>('/ordenes-trabajo', data);
}

export function cambiarEstadoAPI(id: string, estado: string, notas?: string) {
  return api.patch<OrdenTrabajoItem>(`/ordenes-trabajo/${id}/estado`, { estado, notas });
}

export function actualizarDiagnosticoAPI(id: string, diagnostico: string) {
  return api.patch<OrdenTrabajoItem>(`/ordenes-trabajo/${id}/diagnostico`, { diagnostico });
}

export function agregarServicioAPI(id: string, data: Record<string, unknown>) {
  return api.post(`/ordenes-trabajo/${id}/servicios`, data);
}

export function agregarRepuestoAPI(id: string, data: Record<string, unknown>) {
  return api.post(`/ordenes-trabajo/${id}/repuestos`, data);
}
