import { api } from './api';

export interface RepuestoItem {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  stockActual: number;
  stockMinimo: number;
  stockMaximo: number;
  costoPromedio: string;
  precioVenta: string;
  ubicacion: string | null;
  activo: boolean;
  categoria: { id: string; nombre: string };
  unidad: { id: string; nombre: string };
}

interface ListaResponse { datos: RepuestoItem[]; total: number; pagina: number; porPagina: number; totalPaginas: number; totalStockBajo: number; }

export const listarRepuestosAPI = (pagina = 1, porPagina = 10, busqueda?: string, stockBajo?: boolean) => {
  const p = new URLSearchParams({ pagina: String(pagina), porPagina: String(porPagina) });
  if (busqueda) p.set('busqueda', busqueda);
  if (stockBajo) p.set('stockBajo', 'true');
  return api.get<ListaResponse>(`/repuestos?${p}`);
};

export const crearRepuestoAPI = (data: Record<string, unknown>) => api.post<RepuestoItem>('/repuestos', data);
export const registrarMovimientoAPI = (id: string, tipo: string, cantidad: number, referencia: string) =>
  api.post(`/repuestos/${id}/movimiento`, { tipo, cantidad, referencia });
