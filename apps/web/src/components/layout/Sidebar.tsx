import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, Car, Wrench, Settings2, Calendar,
  Package, DollarSign, BarChart3, Users, Cog, X, LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/stores/sidebar.store';
import { useAuthStore } from '@/stores/auth.store';

interface MenuItem {
  label: string;
  icon: React.ElementType;
  ruta: string | null;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const MENU_GROUPS: MenuGroup[] = [
  {
    title: '',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, ruta: '/' },
    ],
  },
  {
    title: 'Operaciones',
    items: [
      { label: 'Vehículos & Clientes', icon: Car, ruta: '/vehiculos' },
      { label: 'Órdenes de Trabajo', icon: Wrench, ruta: '/ordenes-trabajo' },
      { label: 'Servicios & Catálogo', icon: Settings2, ruta: '/servicios' },
      { label: 'Agenda & Citas', icon: Calendar, ruta: '/agenda' },
    ],
  },
  {
    title: 'Almacén',
    items: [
      { label: 'Inventario', icon: Package, ruta: '/inventario' },
    ],
  },
  {
    title: 'Finanzas',
    items: [
      { label: 'Facturación', icon: DollarSign, ruta: '/facturacion' },
      { label: 'Reportes', icon: BarChart3, ruta: '/reportes' },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { label: 'Usuarios', icon: Users, ruta: '/usuarios' },
      { label: 'Configuración', icon: Cog, ruta: '/configuracion' },
    ],
  },
];

export function Sidebar() {
  const { colapsado, mobileAbierto, cerrarMobile } = useSidebarStore();
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();

  function isActive(ruta: string | null) {
    if (!ruta) return false;
    if (ruta === '/') return location.pathname === '/';
    return location.pathname.startsWith(ruta);
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4">
        <Wrench className="h-6 w-6 text-primary" />
        {!colapsado && (
          <div>
            <h1 className="text-sm font-bold text-primary">AutoTaller</h1>
            <p className="text-[10px] text-slate-500">Sede Principal</p>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {MENU_GROUPS.map((group) => (
          <div key={group.title || 'main'} className="mb-2">
            {group.title && !colapsado && (
              <p className="mb-1 px-2 pt-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {group.title}
              </p>
            )}
            {group.items.map((item) => {
              const active = isActive(item.ruta);
              const disabled = item.ruta === null;

              if (disabled) {
                return (
                  <span
                    key={item.label}
                    title={colapsado ? item.label : undefined}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-slate-600 cursor-not-allowed',
                      colapsado && 'justify-center px-2',
                    )}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!colapsado && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        <span className="text-[9px] text-slate-600">Pronto</span>
                      </>
                    )}
                  </span>
                );
              }

              return (
                <Link
                  key={item.label}
                  to={item.ruta!}
                  onClick={cerrarMobile}
                  title={colapsado ? item.label : undefined}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs transition-colors text-left',
                    active
                      ? 'border-l-3 border-primary bg-primary/15 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white',
                    colapsado && 'justify-center px-2',
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!colapsado && <span className="flex-1">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Cerrar sesión */}
      <div className="border-t border-white/10 px-2 py-3">
        <button
          onClick={() => {
            logout();
            navigate('/login');
            cerrarMobile();
          }}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-slate-400 hover:bg-white/5 hover:text-white transition-colors',
            colapsado && 'justify-center px-2',
          )}
        >
          <LogOut className="h-4 w-4" />
          {!colapsado && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden h-screen flex-shrink-0 bg-sidebar text-white transition-all duration-300 md:block',
          colapsado ? 'w-16' : 'w-56',
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileAbierto && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={cerrarMobile} />
          <aside className="relative h-full w-64 bg-sidebar text-white">
            <button
              onClick={cerrarMobile}
              className="absolute right-3 top-3 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
