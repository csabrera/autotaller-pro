import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { usePortalStore } from '@/stores/portal.store';
import { facturasPortalAPI } from '@/services/portal.service';
import { cn } from '@/lib/utils';

const COLORES: Record<string, string> = {
  EMITIDA: 'bg-info/15 text-info',
  PARCIAL: 'bg-warning/15 text-warning',
  PAGADA: 'bg-success/15 text-success',
  ANULADA: 'bg-error/15 text-error',
};

export function PortalFacturas() {
  const cliente = usePortalStore((s) => s.cliente);
  const { data: facturas, isLoading } = useQuery({
    queryKey: ['portal-facturas', cliente?.id],
    queryFn: () => facturasPortalAPI(cliente!.id),
    enabled: !!cliente,
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text">Mis Facturas</h2>
        <p className="text-sm text-text-muted mt-0.5">Facturas y pagos registrados</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
      ) : !facturas || facturas.length === 0 ? (
        <div className="rounded-xl bg-surface border border-border p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-text-muted mb-3" />
          <p className="text-sm text-text-secondary">No tienes facturas registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {facturas.map((f, idx) => {
            const totalPagado = f.pagos.reduce((s, p) => s + Number(p.monto), 0);
            const pendiente = Number(f.total) - totalPagado;
            return (
              <div key={f.id} className={cn('rounded-xl bg-surface border border-border p-5', f.estado === 'ANULADA' && 'opacity-50')}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">#{idx + 1}</span>
                      <span className="font-bold text-primary">{f.numeroFactura}</span>
                      <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-bold', COLORES[f.estado] || 'bg-surface-alt text-text-secondary')}>
                        {f.estado}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      {f.tipoDocumento} — {f.emitidaEn ? new Date(f.emitidaEn).toLocaleDateString('es-PE') : 'Sin emitir'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-text">S/ {Number(f.total).toFixed(2)}</p>
                    {pendiente > 0 && f.estado !== 'ANULADA' && (
                      <p className="text-xs text-error font-semibold">Pendiente: S/ {pendiente.toFixed(2)}</p>
                    )}
                  </div>
                </div>

                {f.pagos.length > 0 && (
                  <div className="border-t border-border-light pt-2 mt-2">
                    <p className="text-[11px] font-semibold text-text-muted uppercase mb-1">Pagos</p>
                    {f.pagos.map((p) => (
                      <div key={p.id} className="flex justify-between text-xs text-text-secondary py-0.5">
                        <span>{p.metodoPago.nombre} — {new Date(p.pagadoEn).toLocaleDateString('es-PE')}</span>
                        <span className="font-semibold text-success">S/ {Number(p.monto).toFixed(2)}</span>
                      </div>
                    ))}
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
