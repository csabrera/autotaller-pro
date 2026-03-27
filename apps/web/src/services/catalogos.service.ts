import { api } from './api';

export interface CatalogoItem {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  orden: number;
  pais?: string;
  marca?: { id: string; nombre: string };
  sucursal?: { id: string; nombre: string };
  marcaId?: string;
  sucursalId?: string;
}

export function listarCatalogoAPI(catalogo: string, filtro?: { activo?: string; busqueda?: string }) {
  const params = new URLSearchParams();
  if (filtro?.activo) params.set('activo', filtro.activo);
  if (filtro?.busqueda) params.set('busqueda', filtro.busqueda);
  const query = params.toString();
  return api.get<CatalogoItem[]>(`/catalogos/${catalogo}${query ? `?${query}` : ''}`);
}

export function crearCatalogoItemAPI(catalogo: string, data: Record<string, unknown>) {
  return api.post<CatalogoItem>(`/catalogos/${catalogo}`, data);
}

export function actualizarCatalogoItemAPI(catalogo: string, id: string, data: Record<string, unknown>) {
  return api.put<CatalogoItem>(`/catalogos/${catalogo}/${id}`, data);
}

export function toggleActivoCatalogoAPI(catalogo: string, id: string) {
  return api.patch<CatalogoItem>(`/catalogos/${catalogo}/${id}/toggle-activo`);
}
