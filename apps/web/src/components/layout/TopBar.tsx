import { useLocation } from 'react-router-dom';
import { Menu, Moon, Sun, ChevronDown } from 'lucide-react';
import { useSidebarStore } from '@/stores/sidebar.store';
import { useThemeStore } from '@/stores/theme.store';
import { useAuthStore } from '@/stores/auth.store';
import { RelojCentral } from './RelojCentral';
import { NotificacionesPanel } from './NotificacionesPanel';

const BREADCRUMBS: Record<string, string> = {
  '/': 'Dashboard',
  '/usuarios': 'Usuarios',
  '/configuracion': 'Configuración',
  '/vehiculos': 'Vehículos & Clientes',
  '/ordenes-trabajo': 'Órdenes de Trabajo',
  '/ordenes-trabajo/nueva': 'Nueva Orden',
  '/servicios': 'Servicios & Catálogo',
  '/inventario': 'Inventario',
  '/facturacion': 'Facturación',
  '/reportes': 'Reportes',
  '/agenda': 'Agenda & Citas',
};

function getBreadcrumb(pathname: string): string {
  if (BREADCRUMBS[pathname]) return BREADCRUMBS[pathname];
  if (pathname.startsWith('/ordenes-trabajo/')) return 'Detalle OT';
  return 'Dashboard';
}

export function TopBar() {
  const { toggle, toggleMobile } = useSidebarStore();
  const { modoOscuro, toggleModoOscuro } = useThemeStore();
  const usuario = useAuthStore((s) => s.usuario);
  const location = useLocation();

  const breadcrumb = getBreadcrumb(location.pathname);

  const iniciales = usuario
    ? `${usuario.nombres[0]}${usuario.apellidoPaterno[0]}`.toUpperCase()
    : '??';

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4">
      {/* Izquierda */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (window.innerWidth < 768) {
              toggleMobile();
            } else {
              toggle();
            }
          }}
          className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white hover:bg-primary-hover transition-colors"
        >
          <Menu className="h-4 w-4" />
        </button>
        <nav className="hidden text-xs text-text-muted sm:block">
          {breadcrumb}
        </nav>
      </div>

      {/* Centro */}
      <RelojCentral />

      {/* Derecha */}
      <div className="flex items-center gap-4">
        {/* Notificaciones */}
        <NotificacionesPanel />

        {/* Modo oscuro */}
        <button onClick={toggleModoOscuro} className="text-text-muted hover:text-text-secondary transition-colors">
          {modoOscuro ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Perfil */}
        <button className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
            {iniciales}
          </div>
          <div className="hidden text-left md:block">
            <p className="text-xs font-semibold text-text">
              {usuario ? `${usuario.nombres.split(' ')[0]} ${usuario.apellidoPaterno}` : 'Usuario'}
            </p>
            <p className="text-[10px] text-text-muted">{usuario?.rol ?? 'Sin rol'}</p>
          </div>
          <ChevronDown className="hidden h-3 w-3 text-text-muted md:block" />
        </button>
      </div>
    </header>
  );
}
