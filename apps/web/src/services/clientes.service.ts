import { api } from './api';

export interface ClienteItem {
  id: string;
  tipoCliente: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string | null;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  razonSocial: string | null;
  nombreComercial: string | null;
  contactoNombres: string | null;
  contactoApellidoPaterno: string | null;
  contactoApellidoMaterno: string | null;
  contactoCargo: string | null;
  contactoTelefono: string | null;
  telefono: string;
  direccion: string;
  correo: string | null;
  activo: boolean;
  nombreCompleto: string;
  vehiculos: VehiculoItem[];
}

export interface VehiculoItem {
  id: string;
  placa: string;
  anio: number;
  kilometrajeActual: number;
  marca: { id: string; nombre: string };
  modelo: { id: string; nombre: string };
  color: { id: string; nombre: string };
  combustible?: { id: string; nombre: string };
  transmision?: { id: string; nombre: string } | null;
  tipoVehiculo?: { id: string; nombre: string } | null;
}

interface ListaClientesResponse {
  datos: ClienteItem[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

export function listarClientesAPI(pagina = 1, porPagina = 10, busqueda?: string) {
  const params = new URLSearchParams({ pagina: String(pagina), porPagina: String(porPagina) });
  if (busqueda) params.set('busqueda', busqueda);
  return api.get<ListaClientesResponse>(`/clientes?${params}`);
}

export function buscarClienteRapidoAPI(q: string) {
  return api.get<ClienteItem[]>(`/clientes/buscar?q=${encodeURIComponent(q)}`);
}

export function crearClienteAPI(data: Record<string, unknown>) {
  return api.post<ClienteItem>('/clientes', data);
}

export function crearVehiculoAPI(data: Record<string, unknown>) {
  return api.post<VehiculoItem>('/vehiculos', data);
}

export function listarVehiculosClienteAPI(clienteId: string) {
  return api.get<VehiculoItem[]>(`/vehiculos/cliente/${clienteId}`);
}

export function toggleActivoClienteAPI(id: string) {
  return api.patch<{ id: string; activo: boolean }>(`/clientes/${id}/toggle-activo`);
}
