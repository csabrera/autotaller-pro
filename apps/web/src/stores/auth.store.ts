import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Usuario {
  id: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  correo: string | null;
  rol: string;
  sucursalId: string;
  debeCambiarClave: boolean;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  usuario: Usuario | null;
  isAuthenticated: boolean;
  setAuth: (token: string, refreshToken: string, usuario: Usuario) => void;
  logout: () => void;
  actualizarUsuario: (data: Partial<Usuario>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      usuario: null,
      isAuthenticated: false,
      setAuth: (token, refreshToken, usuario) =>
        set({ token, refreshToken, usuario, isAuthenticated: true }),
      logout: () =>
        set({ token: null, refreshToken: null, usuario: null, isAuthenticated: false }),
      actualizarUsuario: (data) =>
        set((state) => ({
          usuario: state.usuario ? { ...state.usuario, ...data } : null,
        })),
    }),
    { name: 'autotaller-auth' },
  ),
);
