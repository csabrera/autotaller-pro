import { useQuery } from '@tanstack/react-query';
import { Car, Gauge, Fuel, Wrench } from 'lucide-react';
import { usePortalStore } from '@/stores/portal.store';
import { vehiculosPortalAPI } from '@/services/portal.service';
import { cn } from '@/lib/utils';

const ESTADO_OT: Record<string, { bg: string; text: string; label: string }> = {
  RECIBIDO: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Recibido' },
  EN_PROCESO: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'En Proceso' },
};

export function PortalVehiculos() {
  const cliente = usePortalStore((s) => s.cliente);
  const { data: vehiculos, isLoading } = useQuery({
    queryKey: ['portal-vehiculos', cliente?.id],
    queryFn: () => vehiculosPortalAPI(cliente!.id),
    enabled: !!cliente,
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text">Mis Vehículos</h2>
        <p className="text-sm text-text-muted mt-0.5">Estado actual de tus vehículos en el taller</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
      ) : !vehiculos || vehiculos.length === 0 ? (
        <div className="rounded-xl bg-surface border border-border p-12 text-center">
          <Car className="mx-auto h-10 w-10 text-text-muted mb-3" />
          <p className="text-sm text-text-secondary">No tienes vehículos registrados en el taller</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {vehiculos.map((v) => (
            <div key={v.id} className="rounded-xl bg-surface border border-border p-5 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Car className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-primary">{v.placa}</p>
                    <p className="text-sm text-text-secondary">{v.marca.nombre} {v.modelo.nombre} {v.anio}</p>
                  </div>
                </div>
                <span className="rounded-full bg-surface-alt px-2.5 py-0.5 text-xs font-semibold text-text-secondary">{v.color.nombre}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Gauge className="h-3.5 w-3.5" />
                  {v.kilometrajeActual.toLocaleString()} km
                </div>
                {v.combustible && (
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <Fuel className="h-3.5 w-3.5" />
                    {v.combustible.nombre}
                  </div>
                )}
              </div>

              {/* Estado OT */}
              {v.otAbierta ? (
                <div className={cn('rounded-lg p-3 mt-2', ESTADO_OT[v.otAbierta.estado]?.bg || 'bg-surface-alt')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-text-secondary" />
                      <div>
                        <p className={cn('text-xs font-bold', ESTADO_OT[v.otAbierta.estado]?.text || 'text-text')}>{ESTADO_OT[v.otAbierta.estado]?.label || v.otAbierta.estado}</p>
                        <p className="text-[11px] text-text-muted">{v.otAbierta.numeroOrden}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-text-muted">Desde {new Date(v.otAbierta.fechaEntrada).toLocaleDateString('es-PE')}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-text-muted mt-2 text-center">Sin orden activa</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
