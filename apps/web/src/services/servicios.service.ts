import { api } from './api';

export interface ServicioItem {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipoServicio: string;
  precioBase: string;
  horasEstimadas: string | null;
  intervaloKm: number | null;
  intervaloMeses: number | null;
  activo: boolean;
  categoria: { id: string; nombre: string };
  especialidad: { id: string; nombre: string } | null;
}

interface ListaResponse { datos: ServicioItem[]; total: number; pagina: number; porPagina: number; totalPaginas: number; }

export const listarServiciosAPI = (pagina = 1, porPagina = 10, busqueda?: string, tipo?: string) => {
  const p = new URLSearchParams({ pagina: String(pagina), porPagina: String(porPagina) });
  if (busqueda) p.set('busqueda', busqueda);
  if (tipo) p.set('tipo', tipo);
  return api.get<ListaResponse>(`/servicios?${p}`);
};

export const listarServiciosActivosAPI = () => api.get<ServicioItem[]>('/servicios/activos');
export const crearServicioAPI = (data: Record<string, unknown>) => api.post<ServicioItem>('/servicios', data);
export const actualizarServicioAPI = (id: string, data: Record<string, unknown>) => api.put<ServicioItem>(`/servicios/${id}`, data);
export const toggleActivoServicioAPI = (id: string) => api.patch<ServicioItem>(`/servicios/${id}/toggle-activo`);
