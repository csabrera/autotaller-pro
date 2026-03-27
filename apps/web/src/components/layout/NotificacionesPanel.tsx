import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Calendar, Wrench, Package, DollarSign, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  contarNoLeidasAPI,
  listarNotificacionesAPI,
  marcarLeidaAPI,
  marcarTodasLeidasAPI,
  type NotificacionItem,
} from '@/services/notificaciones.service';

function tiempoRelativo(fechaStr: string) {
  const ahora = Date.now();
  const fecha = new Date(fechaStr).getTime();
  const diff = ahora - fecha;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const horas = Math.floor(mins / 60);
  if (horas < 24) return `hace ${horas}h`;
  const dias = Math.floor(horas / 24);
  if (dias < 7) return `hace ${dias}d`;
  return new Date(fechaStr).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
}

function iconoNotificacion(titulo: string) {
  const t = titulo.toLowerCase();
  if (t.includes('cita')) return Calendar;
  if (t.includes('ot') || t.includes('orden')) return Wrench;
  if (t.includes('stock')) return Package;
  if (t.includes('factura') || t.includes('pago')) return DollarSign;
  return Info;
}

const ENLACE_RUTAS: Record<string, string> = {
  'detalle-ot': '/ordenes-trabajo',
  'agenda': '/agenda',
  'inventario': '/inventario',
  'facturacion': '/facturacion',
};

export function NotificacionesPanel() {
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Polling cada 30 segundos para el count
  const { data: countData } = useQuery({
    queryKey: ['notificaciones', 'count'],
    queryFn: contarNoLeidasAPI,
    refetchInterval: 30_000,
  });

  // Cargar lista solo cuando se abre el panel
  const { data: notificaciones, isLoading } = useQuery({
    queryKey: ['notificaciones', 'lista'],
    queryFn: () => listarNotificacionesAPI(),
    enabled: abierto,
  });

  const noLeidas = countData?.noLeidas || 0;

  // Click fuera cierra el panel
  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    if (abierto) document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, [abierto]);

  async function handleMarcarLeida(notif: NotificacionItem) {
    if (!notif.leida) {
      await marcarLeidaAPI(notif.id);
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
    }
    // Navegar si tiene enlace
    if (notif.enlace) {
      const [tipo, id] = notif.enlace.split(':');
      const rutaBase = ENLACE_RUTAS[tipo];
      if (rutaBase) {
        navigate(id ? `${rutaBase}/${id}` : rutaBase);
      }
    }
    setAbierto(false);
  }

  async function handleMarcarTodas() {
    await marcarTodasLeidasAPI();
    queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
  }

  return (
    <div ref={panelRef} className="relative">
      {/* Campana */}
      <button
        onClick={() => setAbierto(!abierto)}
        className="relative text-text-muted hover:text-text-secondary transition-colors"
      >
        <Bell className="h-5 w-5" />
        {noLeidas > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[9px] font-bold text-white">
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
      </button>

      {/* Panel dropdown */}
      {abierto && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-surface shadow-xl z-50">
          {/* Header del panel */}
          <div className="flex items-center justify-between border-b border-border-light px-4 py-3">
            <h4 className="text-sm font-bold text-text">Notificaciones</h4>
            {noLeidas > 0 && (
              <button
                onClick={handleMarcarTodas}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover font-medium transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar todas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : !notificaciones || notificaciones.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="mx-auto h-6 w-6 text-text-muted mb-2" />
                <p className="text-xs text-text-secondary">No tienes notificaciones</p>
              </div>
            ) : (
              notificaciones.slice(0, 15).map((notif) => {
                const Icono = iconoNotificacion(notif.titulo);
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleMarcarLeida(notif)}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-alt border-b border-border-light last:border-0',
                      !notif.leida && 'bg-primary/3',
                    )}
                  >
                    <div className={cn(
                      'mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full',
                      !notif.leida ? 'bg-primary/10 text-primary' : 'bg-surface-alt text-text-muted',
                    )}>
                      <Icono className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn('text-xs truncate', !notif.leida ? 'font-bold text-text' : 'font-medium text-text-secondary')}>
                          {notif.titulo}
                        </p>
                        {!notif.leida && (
                          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-2">{notif.mensaje}</p>
                      <p className="text-[10px] text-text-muted mt-1">{tiempoRelativo(notif.creadoEn)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
