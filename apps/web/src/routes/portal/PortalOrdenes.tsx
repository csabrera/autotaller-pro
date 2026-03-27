import { useQuery } from '@tanstack/react-query';
import { ClipboardList } from 'lucide-react';
import { usePortalStore } from '@/stores/portal.store';
import { ordenesPortalAPI } from '@/services/portal.service';
import { cn } from '@/lib/utils';
import { COLORES_ESTADO_OT, ETIQUETAS_ESTADO_OT } from '@autotaller/shared';

export function PortalOrdenes() {
  const cliente = usePortalStore((s) => s.cliente);
  const { data: ordenes, isLoading } = useQuery({
    queryKey: ['portal-ordenes', cliente?.id],
    queryFn: () => ordenesPortalAPI(cliente!.id),
    enabled: !!cliente,
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text">Historial de Servicios</h2>
        <p className="text-sm text-text-muted mt-0.5">Todas las órdenes de trabajo de tus vehículos</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
      ) : !ordenes || ordenes.length === 0 ? (
        <div className="rounded-xl bg-surface border border-border p-12 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-text-muted mb-3" />
          <p className="text-sm text-text-secondary">Aún no tienes órdenes de trabajo registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ordenes.map((ot, idx) => {
            const totalServicios = ot.servicios.reduce((s, sv) => s + Number(sv.subtotal), 0);
            const totalRepuestos = ot.repuestos.reduce((s, r) => s + Number(r.subtotal), 0);
            return (
              <div key={ot.id} className="rounded-xl bg-surface border border-border p-5 hover:border-primary/20 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">#{idx + 1}</span>
                      <span className="font-bold text-primary">{ot.numeroOrden}</span>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
                        style={{ backgroundColor: COLORES_ESTADO_OT[ot.estado as keyof typeof COLORES_ESTADO_OT] || '#64748b' }}
                      >
                        {ETIQUETAS_ESTADO_OT[ot.estado as keyof typeof ETIQUETAS_ESTADO_OT] || ot.estado}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary mt-1">{ot.vehiculo.placa} — {ot.vehiculo.marca.nombre} {ot.vehiculo.modelo.nombre}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-text">S/ {Number(ot.costoTotal).toFixed(2)}</p>
                    <p className="text-xs text-text-muted">{new Date(ot.fechaEntrada).toLocaleDateString('es-PE')}</p>
                  </div>
                </div>

                {(ot.servicios.length > 0 || ot.repuestos.length > 0) && (
                  <div className="border-t border-border-light pt-3 grid grid-cols-2 gap-4">
                    {ot.servicios.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold text-text-muted uppercase mb-1">Servicios</p>
                        {ot.servicios.map((s, i) => (
                          <p key={i} className="text-xs text-text-secondary">{s.servicioNombre} — S/ {Number(s.subtotal).toFixed(2)}</p>
                        ))}
                      </div>
                    )}
                    {ot.repuestos.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold text-text-muted uppercase mb-1">Repuestos</p>
                        {ot.repuestos.map((r, i) => (
                          <p key={i} className="text-xs text-text-secondary">{r.repuestoNombre} — S/ {Number(r.subtotal).toFixed(2)}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
