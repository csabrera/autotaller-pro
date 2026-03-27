import { api } from './api';

export interface UsuarioListItem {
  id: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  tipoDocumento: string;
  numeroDocumento: string;
  telefono: string;
  direccion: string;
  correo: string | null;
  rol: string;
  rolId: string;
  sucursal: string;
  sucursalId: string;
  activo: boolean;
  debeCambiarClave: boolean;
  creadoEn: string;
}

interface ListaUsuariosResponse {
  datos: UsuarioListItem[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

interface RolItem {
  id: string;
  nombre: string;
  descripcion: string;
}

interface SucursalItem {
  id: string;
  nombre: string;
  direccion: string;
}

export function listarUsuariosAPI(pagina = 1, porPagina = 10, busqueda?: string) {
  const params = new URLSearchParams({ pagina: String(pagina), porPagina: String(porPagina) });
  if (busqueda) params.set('busqueda', busqueda);
  return api.get<ListaUsuariosResponse>(`/usuarios?${params}`);
}

export function obtenerUsuarioAPI(id: string) {
  return api.get<UsuarioListItem>(`/usuarios/${id}`);
}

export function crearUsuarioAPI(data: Record<string, unknown>) {
  return api.post<{ id: string; claveTemporal: string }>('/usuarios', data);
}

export function actualizarUsuarioAPI(id: string, data: Record<string, unknown>) {
  return api.put(`/usuarios/${id}`, data);
}

export function toggleActivoUsuarioAPI(id: string) {
  return api.post<{ id: string; activo: boolean }>(`/usuarios/${id}/toggle-activo`, {});
}

export function resetearClaveAPI(id: string) {
  return api.post<{ claveTemporal: string }>(`/usuarios/${id}/resetear-clave`, {});
}

export function listarRolesAPI() {
  return api.get<RolItem[]>('/roles');
}

export function listarSucursalesAPI() {
  return api.get<SucursalItem[]>('/sucursales');
}
