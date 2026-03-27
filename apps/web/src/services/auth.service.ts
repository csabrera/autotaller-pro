import { api } from './api';

interface LoginResponse {
  token: string;
  refreshToken: string;
  usuario: {
    id: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    correo: string | null;
    rol: string;
    sucursalId: string;
    sucursalNombre: string;
    debeCambiarClave: boolean;
  };
}

interface CambiarClaveResponse {
  mensaje: string;
  token: string;
  refreshToken: string;
}

export function loginAPI(numeroDocumento: string, clave: string) {
  return api.post<LoginResponse>('/auth/login', { numeroDocumento, clave });
}

export function cambiarClaveAPI(nuevaClave: string, confirmarClave: string) {
  return api.post<CambiarClaveResponse>('/auth/cambiar-clave', { nuevaClave, confirmarClave });
}

export function obtenerPerfilAPI() {
  return api.get<LoginResponse['usuario']>('/auth/perfil');
}
