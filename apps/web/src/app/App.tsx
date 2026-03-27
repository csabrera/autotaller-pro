import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useThemeStore } from '@/stores/theme.store';
import { useAuthStore } from '@/stores/auth.store';
import { MainLayout } from '@/components/layout/MainLayout';
import { Dashboard } from '@/routes/_auth/dashboard';
import { UsuariosPage } from '@/routes/_auth/usuarios';
import { ConfiguracionPage } from '@/routes/_auth/configuracion';
import { VehiculosClientesPage } from '@/routes/_auth/vehiculos';
import { OrdenesTrabajoPage } from '@/routes/_auth/ordenes-trabajo';
import { CrearOTPage } from '@/routes/_auth/ordenes-trabajo/CrearOTPage';
import { DetalleOTPage } from '@/routes/_auth/ordenes-trabajo/DetalleOTPage';
import { ServiciosPage } from '@/routes/_auth/servicios';
import { InventarioPage } from '@/routes/_auth/inventario';
import { FacturacionPage } from '@/routes/_auth/facturacion';
import { ReportesPage } from '@/routes/_auth/reportes';
import { AgendaPage } from '@/routes/_auth/agenda';
import { LoginPage } from '@/routes/login';
import { CambiarClavePage } from '@/routes/cambiar-clave';
import { PortalLogin } from '@/routes/portal/PortalLogin';
import { PortalLayout } from '@/routes/portal/PortalLayout';
import { PortalDashboard } from '@/routes/portal/PortalDashboard';
import { PortalVehiculos } from '@/routes/portal/PortalVehiculos';
import { PortalOrdenes } from '@/routes/portal/PortalOrdenes';
import { PortalFacturas } from '@/routes/portal/PortalFacturas';
import { PortalCitas } from '@/routes/portal/PortalCitas';
import { usePortalStore } from '@/stores/portal.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function RutaProtegida({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, usuario } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (usuario?.debeCambiarClave) {
    return <Navigate to="/cambiar-clave" replace />;
  }

  return <>{children}</>;
}

function RutaPortalProtegida({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = usePortalStore();
  if (!isAuthenticated) return <Navigate to="/portal/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuthStore();
  const portalAuth = usePortalStore((s) => s.isAuthenticated);

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/cambiar-clave" element={<CambiarClavePage />} />

      {/* Portal Cliente */}
      <Route path="/portal/login" element={portalAuth ? <Navigate to="/portal" replace /> : <PortalLogin />} />
      <Route element={<RutaPortalProtegida><PortalLayout /></RutaPortalProtegida>}>
        <Route path="/portal" element={<PortalDashboard />} />
        <Route path="/portal/vehiculos" element={<PortalVehiculos />} />
        <Route path="/portal/ordenes" element={<PortalOrdenes />} />
        <Route path="/portal/facturas" element={<PortalFacturas />} />
        <Route path="/portal/citas" element={<PortalCitas />} />
      </Route>

      {/* Rutas protegidas con layout admin */}
      <Route element={<RutaProtegida><MainLayout /></RutaProtegida>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/usuarios" element={<UsuariosPage />} />
        <Route path="/configuracion" element={<ConfiguracionPage />} />
        <Route path="/vehiculos" element={<VehiculosClientesPage />} />
        <Route path="/ordenes-trabajo" element={<OrdenesTrabajoPage />} />
        <Route path="/ordenes-trabajo/nueva" element={<CrearOTPage />} />
        <Route path="/ordenes-trabajo/:id" element={<DetalleOTPage />} />
        <Route path="/servicios" element={<ServiciosPage />} />
        <Route path="/inventario" element={<InventarioPage />} />
        <Route path="/facturacion" element={<FacturacionPage />} />
        <Route path="/reportes" element={<ReportesPage />} />
        <Route path="/agenda" element={<AgendaPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  const aplicarTema = useThemeStore((s) => s.aplicarTema);

  useEffect(() => {
    aplicarTema();
  }, [aplicarTema]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <Toaster position="top-right" richColors closeButton toastOptions={{ style: { fontFamily: 'var(--font-sans)' } }} />
    </QueryClientProvider>
  );
}
