import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PortalCliente } from '@/services/portal.service';

interface PortalState {
  cliente: PortalCliente | null;
  isAuthenticated: boolean;
  setCliente: (cliente: PortalCliente) => void;
  logout: () => void;
}

export const usePortalStore = create<PortalState>()(
  persist(
    (set) => ({
      cliente: null,
      isAuthenticated: false,
      setCliente: (cliente) => set({ cliente, isAuthenticated: true }),
      logout: () => set({ cliente: null, isAuthenticated: false }),
    }),
    { name: 'autotaller-portal' },
  ),
);
