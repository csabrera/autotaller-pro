import { Outlet, useNavigate } from 'react-router-dom';
import { Wrench, LogOut, Car, ClipboardList, FileText, Calendar, LayoutDashboard } from 'lucide-react';
import { usePortalStore } from '@/stores/portal.store';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Inicio', icon: LayoutDashboard, ruta: '/portal' },
  { label: 'Mis Vehículos', icon: Car, ruta: '/portal/vehiculos' },
  { label: 'Mis Órdenes', icon: ClipboardList, ruta: '/portal/ordenes' },
  { label: 'Mis Facturas', icon: FileText, ruta: '/portal/facturas' },
  { label: 'Mis Citas', icon: Calendar, ruta: '/portal/citas' },
];

function nombreCliente(c: { tipoCliente: string; nombres: string | null; apellidoPaterno: string | null; razonSocial: string | null }) {
  return c.tipoCliente === 'PERSONA' ? `${c.nombres} ${c.apellidoPaterno}` : c.razonSocial || '';
}

export function PortalLayout() {
  const { cliente, logout } = usePortalStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (!cliente) return null;

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-sm font-bold text-primary">AutoTaller</h1>
              <p className="text-[10px] text-text-muted">Portal Cliente</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-text">{nombreCliente(cliente)}</p>
              <p className="text-[11px] text-text-muted">{cliente.numeroDocumento}</p>
            </div>
            <button
              onClick={() => { logout(); navigate('/portal/login'); }}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-alt transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Salir
            </button>
          </div>
        </div>

        {/* Navegación */}
        <div className="max-w-5xl mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto pb-px">
            {NAV_ITEMS.map((item) => {
              const active = item.ruta === '/portal'
                ? location.pathname === '/portal'
                : location.pathname.startsWith(item.ruta);
              return (
                <Link
                  key={item.ruta}
                  to={item.ruta}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap -mb-px',
                    active
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-text-muted hover:text-text-secondary',
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
