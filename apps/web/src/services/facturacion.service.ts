import { api } from './api';

export interface FacturaItem {
  id: string;
  numeroFactura: string;
  ordenTrabajoId: string;
  tipoDocumento: string;
  subtotal: string;
  tasaImpuesto: string;
  montoImpuesto: string;
  descuento: string;
  total: string;
  estado: string;
  emitidaEn: string | null;
  creadoEn: string;
  cliente: { id: string; tipoCliente: string; nombres: string | null; apellidoPaterno: string | null; razonSocial: string | null; numeroDocumento: string };
  pagos: { id: string; monto: string; referencia: string | null; pagadoEn: string; metodoPago: { nombre: string } }[];
}

interface ListaResponse { datos: FacturaItem[]; total: number; pagina: number; porPagina: number; totalPaginas: number; }

export const listarFacturasAPI = (pagina = 1, porPagina = 10, estado?: string, busqueda?: string) => {
  const p = new URLSearchParams({ pagina: String(pagina), porPagina: String(porPagina) });
  if (estado) p.set('estado', estado);
  if (busqueda) p.set('busqueda', busqueda);
  return api.get<ListaResponse>(`/facturas?${p}`);
};

export const obtenerFacturaAPI = (id: string) => api.get<FacturaItem>(`/facturas/${id}`);
export const generarFacturaDesdeOTAPI = (otId: string, tipoDocumento: string) => api.post<FacturaItem>(`/facturas/desde-ot/${otId}`, { tipoDocumento });
export const registrarPagoAPI = (facturaId: string, data: { metodoPagoId: string; monto: number; referencia?: string }) => api.post(`/facturas/${facturaId}/pago`, data);
export const anularFacturaAPI = (id: string) => api.patch(`/facturas/${id}/anular`);
