import { useQuery } from '@tanstack/react-query';
import { Car, ClipboardList, FileText, Calendar, ArrowRight, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePortalStore } from '@/stores/portal.store';
import { resumenPortalAPI, vehiculosPortalAPI, citasPortalAPI } from '@/services/portal.service';
import { cn } from '@/lib/utils';
import { COLORES_ESTADO_CITA, ETIQUETAS_ESTADO_CITA } from '@autotaller/shared';

const ESTADO_OT: Record<string, { bg: string; text: string; label: string }> = {
  RECIBIDO: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Recibido' },
  EN_PROCESO: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'En Proceso' },
  ENTREGADO: { bg: 'bg-green-100', text: 'text-green-700', label: 'Entregado' },
  CANCELADO: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelado' },
};

function nombreCliente(c: { tipoCliente: string; nombres: string | null; apellidoPaterno: string | null; razonSocial: string | null }) {
  return c.tipoCliente === 'PERSONA' ? `${c.nombres} ${c.apellidoPaterno}` : c.razonSocial || '';
}

export function PortalDashboard() {
  const cliente = usePortalStore((s) => s.cliente);
  if (!cliente) return null;

  const { data: resumen } = useQuery({
    queryKey: ['portal-resumen', cliente.id],
    queryFn: () => resumenPortalAPI(cliente.id),
  });

  const { data: vehiculos } = useQuery({
    queryKey: ['portal-vehiculos', cliente.id],
    queryFn: () => vehiculosPortalAPI(cliente.id),
  });

  const { data: citas } = useQuery({
    queryKey: ['portal-citas', cliente.id],
    queryFn: () => citasPortalAPI(cliente.id),
  });

  const citasProximas = (citas || []).filter((c) => ['PROGRAMADA', 'CONFIRMADA'].includes(c.estado)).slice(0, 3);

  return (
    <div>
      {/* Saludo */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text">
          Hola, {nombreCliente(cliente)}
        </h2>
        <p className="text-sm text-text-muted mt-0.5">Aquí puedes consultar el estado de tus vehículos y servicios</p>
      </div>

      {/* KPIs */}
      {resumen && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard icon={Car} label="Vehículos" value={resumen.vehiculos} color="border-primary" />
          <KPICard icon={ClipboardList} label="OTs abiertas" value={resumen.otAbiertas} color="border-warning" />
          <KPICard icon={FileText} label="Facturas pendientes" value={resumen.facturasPendientes} color="border-error" />
          <KPICard icon={Calendar} label="Citas próximas" value={resumen.citasProximas} color="border-info" />
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Mis vehículos */}
        <div className="rounded-xl bg-surface border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <Car className="h-4 w-4 text-primary" /> Mis Vehículos
            </h3>
            <Link to="/portal/vehiculos" className="text-xs text-primary font-semibold hover:text-primary-hover flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {!vehiculos || vehiculos.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">No tienes vehículos registrados</p>
          ) : (
            <div className="space-y-2">
              {vehiculos.slice(0, 3).map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-lg border border-border-light p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Car className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">{v.placa}</p>
                      <p className="text-xs text-text-muted">{v.marca.nombre} {v.modelo.nombre} {v.anio}</p>
                    </div>
                  </div>
                  {v.otAbierta ? (
                    <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-bold', ESTADO_OT[v.otAbierta.estado]?.bg, ESTADO_OT[v.otAbierta.estado]?.text)}>
                      {ESTADO_OT[v.otAbierta.estado]?.label || v.otAbierta.estado}
                    </span>
                  ) : (
                    <span className="text-xs text-text-muted">Sin OT</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Próximas citas */}
        <div className="rounded-xl bg-surface border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Próximas Citas
            </h3>
            <Link to="/portal/citas" className="text-xs text-primary font-semibold hover:text-primary-hover flex items-center gap-1">
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {citasProximas.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-text-muted mb-3">No tienes citas programadas</p>
              <Link to="/portal/citas" className="text-sm font-semibold text-primary hover:text-primary-hover">
                + Agendar nueva cita
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {citasProximas.map((c) => {
                const fecha = new Date(c.fechaProgramada);
                const colores = COLORES_ESTADO_CITA[c.estado as keyof typeof COLORES_ESTADO_CITA];
                return (
                  <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border-light p-3">
                    <div className="text-center flex-shrink-0">
                      <p className="text-sm font-bold text-primary">{fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}</p>
                      <p className="text-xs text-text-muted">{fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">{c.servicio?.nombre || 'Servicio general'}</p>
                      <p className="text-xs text-text-muted">{c.vehiculo.placa} — {c.vehiculo.marca.nombre} {c.vehiculo.modelo.nombre}</p>
                    </div>
                    {colores && (
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold flex-shrink-0', colores.bg, colores.text)}>
                        {ETIQUETAS_ESTADO_CITA[c.estado as keyof typeof ETIQUETAS_ESTADO_CITA]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl bg-surface border border-border p-4 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-text-muted font-medium">{label}</p>
          <p className="mt-1 text-2xl font-black text-text">{value}</p>
        </div>
        <Icon className="h-5 w-5 text-text-muted" />
      </div>
    </div>
  );
}
