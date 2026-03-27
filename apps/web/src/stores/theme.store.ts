import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  sidebar: string;
}

export const TEMAS_DISPONIBLES: Record<string, ThemeColors> = {
  naranja: { primary: '#f97316', primaryHover: '#ea580c', sidebar: '#0f172a' },
  azul: { primary: '#3b82f6', primaryHover: '#2563eb', sidebar: '#0f172a' },
  navy: { primary: '#1e40af', primaryHover: '#1e3a8a', sidebar: '#0f172a' },
  esmeralda: { primary: '#10b981', primaryHover: '#059669', sidebar: '#0f172a' },
};

interface ThemeState {
  temaActual: string;
  colores: ThemeColors;
  modoOscuro: boolean;
  setTema: (nombre: string) => void;
  toggleModoOscuro: () => void;
  aplicarTema: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      temaActual: 'naranja',
      colores: TEMAS_DISPONIBLES.naranja,
      modoOscuro: false,
      setTema: (nombre: string) => {
        const colores = TEMAS_DISPONIBLES[nombre] ?? TEMAS_DISPONIBLES.naranja;
        set({ temaActual: nombre, colores });
        get().aplicarTema();
      },
      toggleModoOscuro: () => {
        set((state) => ({ modoOscuro: !state.modoOscuro }));
        get().aplicarTema();
      },
      aplicarTema: () => {
        const { colores, modoOscuro } = get();
        const root = document.documentElement;
        root.style.setProperty('--theme-primary', colores.primary);
        root.style.setProperty('--theme-primary-hover', colores.primaryHover);
        root.style.setProperty('--theme-sidebar', colores.sidebar);
        root.classList.toggle('dark', modoOscuro);
      },
    }),
    {
      name: 'autotaller-theme',
      partialize: (state) => ({
        modoOscuro: state.modoOscuro,
      }),
    },
  ),
);
