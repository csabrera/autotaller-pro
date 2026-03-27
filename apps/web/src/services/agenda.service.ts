import { api } from './api';

export interface CitaItem {
  id: string;
  numeroCita: string;
  estado: string;
  fechaProgramada: string;
  duracionMinutos: number;
  notas: string | null;
  cliente: {
    id: string;
    tipoCliente: string;
    nombres: string | null;
    apellidoPaterno: string | null;
    razonSocial: string | null;
    numeroDocumento: string;
    telefono: string;
  };
  vehiculo: {
    id: string;
    placa: string;
    anio: number;
    marca: { nombre: string };
    modelo: { nombre: string };
    color: { nombre: string };
  };
  servicio: { id: string; nombre: string } | null;
  mecanico: { id: string; nombres: string; apellidoPaterno: string } | null;
  sucursal: { id: string; nombre: string };
  creadoPor: { id: string; nombres: string; apellidoPaterno: string };
}

interface ListaCitasResponse {
  datos: CitaItem[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
  conteosPorEstado: Record<string, number>;
}

interface DisponibilidadResponse {
  disponible: boolean;
  conflictos: { tipo: string; mensaje: string }[];
}

export function listarCitasAPI(
  pagina = 1, porPagina = 10, estado?: string, busqueda?: string,
  fechaDesde?: string, fechaHasta?: string, mecanicoId?: string,
) {
  const params = new URLSearchParams({ pagina: String(pagina), porPagina: String(porPagina) });
  if (estado) params.set('estado', estado);
  if (busqueda) params.set('busqueda', busqueda);
  if (fechaDesde) params.set('fechaDesde', fechaDesde);
  if (fechaHasta) params.set('fechaHasta', fechaHasta);
  if (mecanicoId) params.set('mecanicoId', mecanicoId);
  return api.get<ListaCitasResponse>(`/agenda?${params}`);
}

export function obtenerCitaAPI(id: string) {
  return api.get<CitaItem>(`/agenda/${id}`);
}

export function crearCitaAPI(data: Record<string, unknown>) {
  return api.post<CitaItem>('/agenda', data);
}

export function actualizarCitaAPI(id: string, data: Record<string, unknown>) {
  return api.put<CitaItem>(`/agenda/${id}`, data);
}

export function cambiarEstadoCitaAPI(id: string, estado: string) {
  return api.patch<CitaItem>(`/agenda/${id}/estado`, { estado });
}

export function citasDelDiaAPI(fecha?: string) {
  const params = fecha ? `?fecha=${fecha}` : '';
  return api.get<CitaItem[]>(`/agenda/hoy${params}`);
}

export function verificarDisponibilidadAPI(
  fechaProgramada: string, duracionMinutos: number, mecanicoId?: string,
) {
  const params = new URLSearchParams({ fechaProgramada, duracionMinutos: String(duracionMinutos) });
  if (mecanicoId) params.set('mecanicoId', mecanicoId);
  return api.get<DisponibilidadResponse>(`/agenda/disponibilidad?${params}`);
}
