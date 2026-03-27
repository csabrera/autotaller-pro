import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Wrench, ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { listarOrdenesAPI, type OrdenTrabajoItem } from '@/services/ordenes.service';
import { COLORES_ESTADO_OT, ETIQUETAS_ESTADO_OT } from '@autotaller/shared';

const ESTADOS_FILTRO = [
  { key: '', label: 'Todas', icon: ClipboardList },
  { key: 'RECIBIDO', label: 'Recibido', icon: Wrench },
  { key: 'EN_PROCESO', label: 'En Proceso', icon: Wrench },
  { key: 'ENTREGADO', label: 'Entregado', icon: Wrench },
  { key: 'CANCELADO', label: 'Cancelado', icon: Wrench },
];

function nombreCliente(c: OrdenTrabajoItem['cliente']) {
  return c.tipoCliente === 'PERSONA'
    ? `${c.nombres} ${c.apellidoPaterno}`
    : c.razonSocial || '';
}

export function OrdenesTrabajoPage() {
  const navigate = useNavigate();
  const [pagina, setPagina] = useState(1);
  const [estado, setEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [busquedaInput, setBusquedaInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['ordenes', pagina, estado, busqueda],
    queryFn: () => listarOrdenesAPI(pagina, 10, estado || undefined, busqueda || undefined),
  });

  useEffect(() => {
    const timer = setTimeout(() => { setBusqueda(busquedaInput); setPagina(1); }, 400);
    return () => clearTimeout(timer);
  }, [busquedaInput]);

  const conteos = data?.conteosPorEstado || {};
  const totalOrdenes = Object.values(conteos).reduce((a, b) => a + b, 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text">Órdenes de Trabajo</h2>
          <p className="text-sm text-text-muted mt-0.5">Gestión de servicios y mantenimiento de vehículos</p>
        </div>
        <button
          onClick={() => navigate('/ordenes-trabajo/nueva')}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" /> Nueva Orden
        </button>
      </div>

      {/* Filtros por estado + Búsqueda */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {ESTADOS_FILTRO.map((e) => {
            const conteo = e.key ? (conteos[e.key] || 0) : totalOrdenes;
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
            placeholder="Buscar por N° orden, cliente o placa..."
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
                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">N° Orden</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Vehículo</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Cliente</th>
                <th className="px-5 py-3 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Estado</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Mecánico</th>
                <th className="px-5 py-3 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Ingreso</th>
                <th className="px-5 py-3 text-right text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Total</th>
                <th className="px-5 py-3 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="px-5 py-16 text-center"><div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></td></tr>
              ) : data?.datos.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <Wrench className="mx-auto h-8 w-8 text-text-muted mb-2" />
                    <p className="text-sm font-medium text-text-secondary">No se encontraron órdenes de trabajo</p>
                    <p className="text-xs text-text-muted mt-1">Cree una nueva orden para comenzar</p>
                  </td>
                </tr>
              ) : (
                data?.datos.map((ot, idx) => (
                  <tr
                    key={ot.id}
                    className="border-b border-border-light hover:bg-hover transition-colors cursor-pointer"
                    onClick={(e) => { const url = `/ordenes-trabajo/${ot.id}`; e.ctrlKey || e.metaKey ? window.open(url, '_blank') : navigate(url); }}
                  >
                    <td className="px-5 py-3 text-center text-xs font-medium text-text-muted">{(pagina - 1) * 10 + idx + 1}</td>
                    <td className="px-5 py-3">
                      <span className="font-bold text-primary text-sm">{ot.numeroOrden}</span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-text text-sm">{ot.vehiculo.placa}</p>
                      <p className="text-xs text-text-muted mt-0.5">{ot.vehiculo.marca.nombre} {ot.vehiculo.modelo.nombre} {ot.vehiculo.anio}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-text text-sm">{nombreCliente(ot.cliente)}</p>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className="inline-block rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm"
                        style={{ backgroundColor: COLORES_ESTADO_OT[ot.estado as keyof typeof COLORES_ESTADO_OT] || '#64748b' }}
                      >
                        {ETIQUETAS_ESTADO_OT[ot.estado as keyof typeof ETIQUETAS_ESTADO_OT] || ot.estado}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-text-secondary">
                      {ot.mecanicoAsignado ? `${ot.mecanicoAsignado.nombres} ${ot.mecanicoAsignado.apellidoPaterno}` : <span className="text-text-muted">Sin asignar</span>}
                    </td>
                    <td className="px-5 py-3 text-center text-sm text-text-secondary">
                      {new Date(ot.fechaEntrada).toLocaleDateString('es-PE')}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-bold text-text text-sm">S/ {Number(ot.costoTotal).toFixed(2)}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/ordenes-trabajo/${ot.id}`); }}
                        className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors mx-auto"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span className="hidden lg:inline">Ver detalle</span>
                      </button>
                    </td>
                  </tr>
                ))
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
                      p === data.pagina
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-text-secondary hover:bg-surface-alt',
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
    </div>
  );
}
