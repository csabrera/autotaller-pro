import { api } from './api';

export interface NotificacionItem {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  enlace: string | null;
  creadoEn: string;
}

export function listarNotificacionesAPI(soloNoLeidas = false) {
  const params = soloNoLeidas ? '?soloNoLeidas=true' : '';
  return api.get<NotificacionItem[]>(`/notificaciones${params}`);
}

export function contarNoLeidasAPI() {
  return api.get<{ noLeidas: number }>('/notificaciones/count');
}

export function marcarLeidaAPI(id: string) {
  return api.patch<{ ok: boolean }>(`/notificaciones/${id}/leer`);
}

export function marcarTodasLeidasAPI() {
  return api.patch<{ ok: boolean }>('/notificaciones/leer-todas');
}
