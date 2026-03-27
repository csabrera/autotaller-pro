import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  colapsado: boolean;
  mobileAbierto: boolean;
  toggle: () => void;
  setColapsado: (v: boolean) => void;
  toggleMobile: () => void;
  cerrarMobile: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      colapsado: false,
      mobileAbierto: false,
      toggle: () => set((s) => ({ colapsado: !s.colapsado })),
      setColapsado: (v) => set({ colapsado: v }),
      toggleMobile: () => set((s) => ({ mobileAbierto: !s.mobileAbierto })),
      cerrarMobile: () => set({ mobileAbierto: false }),
    }),
    {
      name: 'autotaller-sidebar',
      partialize: (state) => ({ colapsado: state.colapsado }),
    },
  ),
);
