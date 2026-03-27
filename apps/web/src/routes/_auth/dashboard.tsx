import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Car, Wrench, DollarSign, Package, Users, TrendingUp, TrendingDown, Eye, Calendar, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import { COLORES_ESTADO_OT, ETIQUETAS_ESTADO_OT, COLORES_ESTADO_CITA, ETIQUETAS_ESTADO_CITA } from '@autotaller/shared';
import { citasDelDiaAPI, type CitaItem } from '@/services/agenda.service';

interface DashboardData {
  kpis: {
    vehiculosEnTaller: number;
    otAbiertas: number;
    ingresosMes: number;
    variacionIngresos: number;
    stockBajo: number;
    totalClientes: number;
    totalVehiculos: number;
  };
  conteoEstados: Record<string, number>;
  otRecientes: { id: string; numeroOrden: string; estado: string; placa: string; marca: string; modelo: string; cliente: string; costoTotal: number; fechaEntrada: string }[];
  serviciosTop: { nombre: string; cantidad: number }[];
}

function KPICard({ titulo, valor, subtitulo, subtituloColor, icon: Icon, borderColor }: {
  titulo: string; valor: string; subtitulo: string; subtituloColor: string; icon: React.ElementType; borderColor: string;
}) {
  return (
    <div className={`rounded-xl bg-surface p-5 shadow-sm border-l-4 ${borderColor}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary font-medium">{titulo}</p>
          <p className="mt-1 text-3xl font-black text-text">{valor}</p>
          <p className={`mt-1 text-sm font-semibold ${subtituloColor}`}>{subtitulo}</p>
        </div>
        <div className="rounded-lg bg-surface-alt p-2.5">
          <Icon className="h-6 w-6 text-text-muted" />
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardData>('/dashboard'),
    refetchInterval: 30000,
  });

  const { data: citasHoy } = useQuery({
    queryKey: ['citas-hoy'],
    queryFn: () => citasDelDiaAPI(),
    refetchInterval: 60000,
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
      </div>
    );
  }

  const { kpis, conteoEstados, otRecientes, serviciosTop } = data;
  const variacionIcon = kpis.variacionIngresos >= 0 ? TrendingUp : TrendingDown;
  const variacionColor = kpis.variacionIngresos >= 0 ? 'text-success' : 'text-error';

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text">Dashboard</h2>
        <p className="text-sm text-text-secondary mt-0.5">Resumen general del taller</p>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard
          titulo="Vehículos en taller"
          valor={String(kpis.vehiculosEnTaller)}
          subtitulo={`${kpis.otAbiertas} OT abiertas`}
          subtituloColor="text-primary"
          icon={Car}
          borderColor="border-primary"
        />
        <KPICard
          titulo="Ingresos del mes"
          valor={`S/ ${kpis.ingresosMes.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
          subtitulo={`${kpis.variacionIngresos >= 0 ? '↑' : '↓'} ${Math.abs(kpis.variacionIngresos)}% vs mes anterior`}
          subtituloColor={variacionColor}
          icon={DollarSign}
          borderColor="border-success"
        />
        <KPICard
          titulo="Clientes registrados"
          valor={String(kpis.totalClientes)}
          subtitulo={`${kpis.totalVehiculos} vehículos`}
          subtituloColor="text-info"
          icon={Users}
          borderColor="border-info"
        />
        <KPICard
          titulo="Stock bajo"
          valor={String(kpis.stockBajo)}
          subtitulo={kpis.stockBajo > 0 ? 'Repuestos críticos' : 'Todo en orden'}
          subtituloColor={kpis.stockBajo > 0 ? 'text-error' : 'text-success'}
          icon={Package}
          borderColor={kpis.stockBajo > 0 ? 'border-error' : 'border-success'}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* OT Recientes */}
        <div className="rounded-xl bg-surface p-5 shadow-sm lg:col-span-2">
          <h3 className="mb-4 text-base font-bold text-text">Órdenes de Trabajo Recientes</h3>
          {otRecientes.length === 0 ? (
            <p className="py-4 text-sm text-text-muted text-center">No hay órdenes registradas</p>
          ) : (
            <div className="space-y-1">
              {otRecientes.map((ot) => (
                <div key={ot.id} className="flex items-center justify-between border-b border-border-light py-3 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-primary">{ot.numeroOrden}</span>
                    <div>
                      <p className="text-sm font-medium text-text">{ot.placa} — {ot.marca} {ot.modelo}</p>
                      <p className="text-xs text-text-secondary">{ot.cliente}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-text">S/ {ot.costoTotal.toFixed(2)}</span>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                      style={{ backgroundColor: COLORES_ESTADO_OT[ot.estado as keyof typeof COLORES_ESTADO_OT] || '#64748b' }}
                    >
                      {ETIQUETAS_ESTADO_OT[ot.estado as keyof typeof ETIQUETAS_ESTADO_OT] || ot.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar derecho */}
        <div className="space-y-4">
          {/* Citas de Hoy */}
          <div className="rounded-xl bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Citas de Hoy
                {citasHoy && citasHoy.length > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{citasHoy.length}</span>
                )}
              </h3>
            </div>
            {!citasHoy || citasHoy.length === 0 ? (
              <p className="py-3 text-sm text-text-muted text-center">No hay citas programadas para hoy</p>
            ) : (
              <div className="space-y-1">
                {citasHoy.slice(0, 5).map((cita) => {
                  const hora = new Date(cita.fechaProgramada).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
                  const clienteNombre = cita.cliente.tipoCliente === 'PERSONA'
                    ? `${cita.cliente.nombres} ${cita.cliente.apellidoPaterno}`
                    : cita.cliente.razonSocial;
                  const colores = COLORES_ESTADO_CITA[cita.estado as keyof typeof COLORES_ESTADO_CITA];
                  return (
                    <div key={cita.id} className="flex items-center gap-3 rounded-lg border border-border-light px-3 py-2.5 hover:bg-surface-alt transition-colors">
                      <div className="text-center flex-shrink-0">
                        <p className="text-sm font-bold text-primary">{hora}</p>
                        <p className="text-[10px] text-text-muted">{cita.duracionMinutos} min</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">{cita.servicio?.nombre || 'Servicio general'}</p>
                        <p className="text-xs text-text-secondary truncate">{clienteNombre} — {cita.vehiculo.placa}</p>
                      </div>
                      {colores && (
                        <span className={cn('flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold', colores.bg, colores.text)}>
                          {ETIQUETAS_ESTADO_CITA[cita.estado as keyof typeof ETIQUETAS_ESTADO_CITA]?.slice(0, 4)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <button
              onClick={() => navigate('/agenda')}
              className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors"
            >
              Ver agenda completa <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {/* Estado de OTs */}
          <div className="rounded-xl bg-surface p-5 shadow-sm">
            <h3 className="mb-3 text-base font-bold text-text">Estado de Órdenes</h3>
            <div className="space-y-2">
              {Object.entries(conteoEstados).map(([estado, cantidad]) => (
                <div key={estado} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORES_ESTADO_OT[estado as keyof typeof COLORES_ESTADO_OT] || '#64748b' }} />
                    <span className="text-sm text-text">{ETIQUETAS_ESTADO_OT[estado as keyof typeof ETIQUETAS_ESTADO_OT] || estado}</span>
                  </div>
                  <span className="text-sm font-bold text-text">{cantidad}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Servicios más solicitados */}
          <div className="rounded-xl bg-surface p-5 shadow-sm">
            <h3 className="mb-3 text-base font-bold text-text">Servicios Top</h3>
            {serviciosTop.length === 0 ? (
              <p className="text-sm text-text-muted">Sin datos aún</p>
            ) : (
              <div className="space-y-2">
                {serviciosTop.map((s, i) => (
                  <div key={s.nombre} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                      <span className="text-sm text-text truncate max-w-[180px]">{s.nombre}</span>
                    </div>
                    <span className="text-sm font-bold text-text">{s.cantidad}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
