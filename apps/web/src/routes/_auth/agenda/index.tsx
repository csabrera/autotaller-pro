import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Calendar, Eye, Clock, User, ChevronLeft, ChevronRight, CalendarDays, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { listarCitasAPI, cambiarEstadoCitaAPI, type CitaItem } from '@/services/agenda.service';
import { COLORES_ESTADO_CITA, ETIQUETAS_ESTADO_CITA, TRANSICIONES_CITA } from '@autotaller/shared';
import { ModalNuevaCita } from './ModalNuevaCita';

const ESTADOS_FILTRO = [
  { key: '', label: 'Todas' },
  { key: 'PROGRAMADA', label: 'Programada' },
  { key: 'CONFIRMADA', label: 'Confirmada' },
  { key: 'EN_PROCESO', label: 'En Proceso' },
  { key: 'COMPLETADA', label: 'Completada' },
  { key: 'CANCELADA', label: 'Cancelada' },
  { key: 'NO_ASISTIO', label: 'No Asistió' },
];

function nombreCliente(c: CitaItem['cliente']) {
  return c.tipoCliente === 'PERSONA'
    ? `${c.nombres} ${c.apellidoPaterno}`
    : c.razonSocial || '';
}

function formatFecha(fechaStr: string) {
  return new Date(fechaStr).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatHora(fechaStr: string) {
  return new Date(fechaStr).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

export function AgendaPage() {
  const queryClient = useQueryClient();
  const [pagina, setPagina] = useState(1);
  const [estado, setEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [busquedaInput, setBusquedaInput] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [citaEditar, setCitaEditar] = useState<CitaItem | null>(null);
  const [citaDetalle, setCitaDetalle] = useState<CitaItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['citas', pagina, estado, busqueda],
    queryFn: () => listarCitasAPI(pagina, 10, estado || undefined, busqueda || undefined),
  });

  useEffect(() => {
    const timer = setTimeout(() => { setBusqueda(busquedaInput); setPagina(1); }, 400);
    return () => clearTimeout(timer);
  }, [busquedaInput]);

  const conteos = data?.conteosPorEstado || {};
  const totalCitas = Object.values(conteos).reduce((a, b) => a + b, 0);

  async function handleCambiarEstado(cita: CitaItem, nuevoEstado: string) {
    try {
      await cambiarEstadoCitaAPI(cita.id, nuevoEstado);
      toast.success(`Cita ${cita.numeroCita} actualizada a ${ETIQUETAS_ESTADO_CITA[nuevoEstado as keyof typeof ETIQUETAS_ESTADO_CITA] || nuevoEstado}`);
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      setCitaDetalle(null);
    } catch (err: any) {
      toast.error(err.message || 'No se pudo cambiar el estado');
    }
  }

  function handleEditar(cita: CitaItem) {
    setCitaEditar(cita);
    setModalAbierto(true);
    setCitaDetalle(null);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text">Agenda & Citas</h2>
          <p className="text-sm text-text-muted mt-0.5">Programar y gestionar citas del taller</p>
        </div>
        <button
          onClick={() => { setCitaEditar(null); setModalAbierto(true); }}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" /> Nueva Cita
        </button>
      </div>

      {/* Filtros por estado + Búsqueda */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {ESTADOS_FILTRO.map((e) => {
            const conteo = e.key ? (conteos[e.key] || 0) : totalCitas;
            const activo = estado === e.key;
            return (
              <button
                key={e.key}
                onClick={() => { setEstado(e.key); setPagina(1); }}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                  activo
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface text-text-secondary border border-border hover:border-primary hover:text-primary',
                )}
              >
                {e.label}
                <span className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold min-w-[20px] text-center',
                  activo ? 'bg-white/20 text-white' : 'bg-surface-alt text-text-muted',
                )}>
                  {conteo}
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            value={busquedaInput}
            onChange={(e) => setBusquedaInput(e.target.value)}
            placeholder="Buscar por N° cita, cliente o placa..."
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-text-muted"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-xl bg-surface shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-alt">
                <th className="px-5 py-3 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border w-12">#</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">N° Cita</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Fecha / Hora</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Cliente</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Vehículo</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Servicio</th>
                <th className="px-5 py-3 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Estado</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Mecánico</th>
                <th className="px-5 py-3 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="px-5 py-16 text-center"><div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></td></tr>
              ) : data?.datos.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <Calendar className="mx-auto h-8 w-8 text-text-muted mb-2" />
                    <p className="text-sm font-medium text-text-secondary">No se encontraron citas</p>
                    <p className="text-xs text-text-muted mt-1">Programe una nueva cita para comenzar</p>
                  </td>
                </tr>
              ) : (
                data?.datos.map((cita, idx) => {
                  const colores = COLORES_ESTADO_CITA[cita.estado as keyof typeof COLORES_ESTADO_CITA];
                  return (
                    <tr
                      key={cita.id}
                      className="border-b border-border-light hover:bg-hover transition-colors cursor-pointer"
                      onClick={() => setCitaDetalle(cita)}
                    >
                      <td className="px-5 py-3 text-center text-xs font-medium text-text-muted">{(pagina - 1) * 10 + idx + 1}</td>
                      <td className="px-5 py-3">
                        <span className="font-bold text-primary text-sm">{cita.numeroCita}</span>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-text text-sm">{formatFecha(cita.fechaProgramada)}</p>
                        <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatHora(cita.fechaProgramada)} ({cita.duracionMinutos} min)
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-text text-sm">{nombreCliente(cita.cliente)}</p>
                        <p className="text-xs text-text-muted">{cita.cliente.telefono}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-text text-sm">{cita.vehiculo.placa}</p>
                        <p className="text-xs text-text-muted mt-0.5">{cita.vehiculo.marca.nombre} {cita.vehiculo.modelo.nombre}</p>
                      </td>
                      <td className="px-5 py-3 text-sm text-text-secondary">
                        {cita.servicio?.nombre || <span className="text-text-muted">-</span>}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {colores && (
                          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold', colores.bg, colores.text)}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', colores.dot)} />
                            {ETIQUETAS_ESTADO_CITA[cita.estado as keyof typeof ETIQUETAS_ESTADO_CITA] || cita.estado}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-sm text-text-secondary">
                        {cita.mecanico ? `${cita.mecanico.nombres} ${cita.mecanico.apellidoPaterno}` : <span className="text-text-muted">Sin asignar</span>}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); setCitaDetalle(cita); }}
                          className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors mx-auto"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden lg:inline">Ver detalle</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación profesional */}
        {data && (
          <div className="flex items-center justify-between border-t border-border bg-surface-alt/30 px-5 py-3">
            <p className="text-xs text-text-muted">
              Mostrando <span className="font-semibold text-text-secondary">{data.datos.length > 0 ? (data.pagina - 1) * data.porPagina + 1 : 0}</span> a <span className="font-semibold text-text-secondary">{Math.min(data.pagina * data.porPagina, data.total)}</span> de <span className="font-semibold text-text">{data.total}</span> registros
            </p>
            {data.totalPaginas > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPagina(Math.max(1, pagina - 1))}
                  disabled={pagina === 1}
                  className="flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-medium text-text-secondary hover:bg-surface-alt disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                </button>
                {Array.from({ length: data.totalPaginas }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPagina(p)}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors',
                      p === data.pagina ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-surface-alt',
                    )}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPagina(Math.min(data.totalPaginas, pagina + 1))}
                  disabled={pagina === data.totalPaginas}
                  className="flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-medium text-text-secondary hover:bg-surface-alt disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal detalle de cita */}
      {citaDetalle && (
        <ModalDetalleCita
          cita={citaDetalle}
          onCerrar={() => setCitaDetalle(null)}
          onCambiarEstado={handleCambiarEstado}
          onEditar={handleEditar}
        />
      )}

      {/* Modal nueva/editar cita */}
      <ModalNuevaCita
        abierto={modalAbierto}
        onCerrar={() => { setModalAbierto(false); setCitaEditar(null); }}
        citaEditar={citaEditar}
      />
    </div>
  );
}

// =============================================
// Modal detalle de cita (inline)
// =============================================

function ModalDetalleCita({ cita, onCerrar, onCambiarEstado, onEditar }: {
  cita: CitaItem;
  onCerrar: () => void;
  onCambiarEstado: (cita: CitaItem, estado: string) => void;
  onEditar: (cita: CitaItem) => void;
}) {
  const colores = COLORES_ESTADO_CITA[cita.estado as keyof typeof COLORES_ESTADO_CITA];
  const transiciones = TRANSICIONES_CITA[cita.estado as keyof typeof TRANSICIONES_CITA] || [];
  const puedeEditar = ['PROGRAMADA', 'CONFIRMADA'].includes(cita.estado);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-overlay" onClick={onCerrar} />
      <div className="relative w-full max-w-md rounded-xl bg-surface shadow-xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-text">{cita.numeroCita}</h3>
            {colores && (
              <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold mt-1', colores.bg, colores.text)}>
                <span className={cn('h-1.5 w-1.5 rounded-full', colores.dot)} />
                {ETIQUETAS_ESTADO_CITA[cita.estado as keyof typeof ETIQUETAS_ESTADO_CITA]}
              </span>
            )}
          </div>
          <button onClick={onCerrar} className="text-text-muted hover:text-text-secondary">
            <span className="text-xl">&times;</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Info principal */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-text-muted mt-0.5" />
              <div>
                <p className="text-xs text-text-muted">Fecha y hora</p>
                <p className="text-sm font-semibold text-text">{formatFecha(cita.fechaProgramada)}</p>
                <p className="text-sm text-text-secondary">{formatHora(cita.fechaProgramada)} ({cita.duracionMinutos} min)</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-text-muted mt-0.5" />
              <div>
                <p className="text-xs text-text-muted">Cliente</p>
                <p className="text-sm font-semibold text-text">{nombreCliente(cita.cliente)}</p>
                <p className="text-xs text-text-muted">{cita.cliente.telefono}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-text-muted">Vehículo</p>
              <p className="text-sm font-semibold text-text">{cita.vehiculo.placa}</p>
              <p className="text-xs text-text-muted">{cita.vehiculo.marca.nombre} {cita.vehiculo.modelo.nombre} {cita.vehiculo.anio}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Servicio</p>
              <p className="text-sm text-text">{cita.servicio?.nombre || 'No especificado'}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-text-muted">Mecánico</p>
            <p className="text-sm text-text">
              {cita.mecanico ? `${cita.mecanico.nombres} ${cita.mecanico.apellidoPaterno}` : 'Sin asignar'}
            </p>
          </div>

          {cita.notas && (
            <div className="rounded-lg bg-surface-alt p-3">
              <p className="text-xs text-text-muted mb-1">Notas</p>
              <p className="text-sm text-text">{cita.notas}</p>
            </div>
          )}

          {/* Acciones de estado */}
          {transiciones.length > 0 && (
            <div className="border-t border-border pt-4">
              <p className="text-xs font-medium text-text-muted mb-2">Cambiar estado:</p>
              <div className="flex flex-wrap gap-2">
                {transiciones.map((est) => {
                  const c = COLORES_ESTADO_CITA[est as keyof typeof COLORES_ESTADO_CITA];
                  return (
                    <button
                      key={est}
                      onClick={() => onCambiarEstado(cita, est)}
                      className={cn('rounded-lg px-4 py-2 text-xs font-bold transition-colors', c?.bg, c?.text, 'hover:opacity-80')}
                    >
                      {ETIQUETAS_ESTADO_CITA[est as keyof typeof ETIQUETAS_ESTADO_CITA]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Botón editar */}
          {puedeEditar && (
            <div className="flex justify-end pt-2">
              <button
                onClick={() => onEditar(cita)}
                className="flex items-center gap-1.5 rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar Cita
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
