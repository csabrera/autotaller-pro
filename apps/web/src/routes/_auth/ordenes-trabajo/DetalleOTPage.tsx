import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, Car, Wrench, FileText, Clock, Plus,
  ChevronRight, Check, X, Package, Eye, MapPin, DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  obtenerOrdenAPI, cambiarEstadoAPI, actualizarDiagnosticoAPI,
  agregarServicioAPI, agregarRepuestoAPI, type OrdenTrabajoItem,
} from '@/services/ordenes.service';
import { COLORES_ESTADO_OT, ETIQUETAS_ESTADO_OT, TRANSICIONES_OT } from '@autotaller/shared';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SearchSelect } from '@/components/forms/SearchSelect';

const ESTADOS_STEPPER = ['RECIBIDO', 'EN_PROCESO', 'ENTREGADO'];

export function DetalleOTPage() {
  const { id: ordenId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [modalCambioEstado, setModalCambioEstado] = useState<string | null>(null);
  const [notasCambio, setNotasCambio] = useState('');
  const [modalServicio, setModalServicio] = useState(false);
  const [modalRepuesto, setModalRepuesto] = useState(false);
  const [modalVerServicios, setModalVerServicios] = useState(false);
  const [modalVerRepuestos, setModalVerRepuestos] = useState(false);
  const [modalVerHistorial, setModalVerHistorial] = useState(false);
  const [diagnosticoEdit, setDiagnosticoEdit] = useState<string | null>(null);

  const { data: orden, isLoading } = useQuery({
    queryKey: ['orden', ordenId],
    queryFn: () => obtenerOrdenAPI(ordenId),
  });

  const cambiarEstado = useMutation({
    mutationFn: ({ estado, notas }: { estado: string; notas?: string }) =>
      cambiarEstadoAPI(ordenId, estado, notas),
    onSuccess: (result) => {
      toast.success(`Estado actualizado a: ${ETIQUETAS_ESTADO_OT[result.estado as keyof typeof ETIQUETAS_ESTADO_OT]}`);
      queryClient.invalidateQueries({ queryKey: ['orden', ordenId] });
      setModalCambioEstado(null);
      setNotasCambio('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const guardarDiagnostico = useMutation({
    mutationFn: (diagnostico: string) => actualizarDiagnosticoAPI(ordenId, diagnostico),
    onSuccess: () => {
      toast.success('Diagnóstico guardado correctamente');
      queryClient.invalidateQueries({ queryKey: ['orden', ordenId] });
      setDiagnosticoEdit(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const agregarServicio = useMutation({
    mutationFn: (data: Record<string, unknown>) => agregarServicioAPI(ordenId, data),
    onSuccess: () => {
      toast.success('Servicio agregado correctamente');
      queryClient.invalidateQueries({ queryKey: ['orden', ordenId] });
      setModalServicio(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const agregarRepuesto = useMutation({
    mutationFn: (data: Record<string, unknown>) => agregarRepuestoAPI(ordenId, data),
    onSuccess: () => {
      toast.success('Repuesto agregado correctamente');
      queryClient.invalidateQueries({ queryKey: ['orden', ordenId] });
      setModalRepuesto(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading || !orden) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" /></div>;
  }

  const nombreCliente = orden.cliente.tipoCliente === 'PERSONA'
    ? `${orden.cliente.nombres} ${orden.cliente.apellidoPaterno}`
    : orden.cliente.razonSocial;

  const transicionesPermitidas = TRANSICIONES_OT[orden.estado as keyof typeof TRANSICIONES_OT] || [];
  const estadoIndex = ESTADOS_STEPPER.indexOf(orden.estado);
  const esFinalizada = orden.estado === 'ENTREGADO' || orden.estado === 'CANCELADO';
  const totalServicios = orden.servicios.reduce((s, sv) => s + Number(sv.subtotal), 0);
  const totalRepuestos = orden.repuestos.reduce((s, r) => s + Number(r.subtotal), 0);

  return (
    <div>
      {/* Header compacto */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/ordenes-trabajo')} className="rounded-lg border border-border p-2 hover:bg-surface-alt">
            <ArrowLeft className="h-5 w-5 text-text-secondary" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-text">{orden.numeroOrden}</h2>
              <span
                className="rounded-full px-3 py-1 text-xs font-bold text-white"
                style={{ backgroundColor: COLORES_ESTADO_OT[orden.estado as keyof typeof COLORES_ESTADO_OT] }}
              >
                {ETIQUETAS_ESTADO_OT[orden.estado as keyof typeof ETIQUETAS_ESTADO_OT]}
              </span>
            </div>
            <p className="text-sm text-text-secondary mt-0.5">
              <span className="font-semibold">{orden.vehiculo.placa}</span> — {orden.vehiculo.marca.nombre} {orden.vehiculo.modelo.nombre} {orden.vehiculo.anio}
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary border border-primary/20">
          <MapPin className="h-3.5 w-3.5" /> {orden.sucursal.nombre}
        </span>
      </div>

      {/* Stepper */}
      <div className="mb-5 flex items-center gap-2 rounded-xl bg-surface p-4 shadow-sm border border-border-light">
        {ESTADOS_STEPPER.map((est, i) => {
          const completado = i < estadoIndex;
          const actual = est === orden.estado;
          const color = COLORES_ESTADO_OT[est as keyof typeof COLORES_ESTADO_OT];
          return (
            <div key={est} className="flex items-center flex-1">
              <div className={cn(
                'flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap w-full',
                actual ? 'text-white shadow-md' : completado ? 'bg-success/10 text-success' : 'bg-surface-alt text-text-muted',
              )} style={actual ? { backgroundColor: color } : undefined}>
                {completado && <Check className="h-4 w-4" />}
                {ETIQUETAS_ESTADO_OT[est as keyof typeof ETIQUETAS_ESTADO_OT]}
              </div>
              {i < ESTADOS_STEPPER.length - 1 && <ChevronRight className="mx-1 h-5 w-5 text-text-muted flex-shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* Contenido principal - todo en una vista */}
      <div className="grid gap-4 lg:grid-cols-4">
        {/* Info Cliente */}
        <div className="rounded-xl bg-surface p-4 shadow-sm border border-border-light">
          <h3 className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider mb-2"><User className="h-4 w-4" /> Cliente</h3>
          <p className="font-bold text-text">{nombreCliente}</p>
          <p className="text-sm text-text">{orden.cliente.tipoCliente} | {orden.cliente.numeroDocumento}</p>
        </div>

        {/* Info Vehículo */}
        <div className="rounded-xl bg-surface p-4 shadow-sm border border-border-light">
          <h3 className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider mb-2"><Car className="h-4 w-4" /> Vehículo</h3>
          <p className="font-bold text-text">{orden.vehiculo.placa}</p>
          <p className="text-sm text-text">{orden.vehiculo.marca.nombre} {orden.vehiculo.modelo.nombre} {orden.vehiculo.anio} | {orden.vehiculo.color.nombre}</p>
          <p className="text-sm text-text">KM: <span className="font-bold">{orden.kilometrajeEntrada.toLocaleString()}</span></p>
        </div>

        {/* Info Detalles */}
        <div className="rounded-xl bg-surface p-4 shadow-sm border border-border-light">
          <h3 className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider mb-2"><FileText className="h-4 w-4" /> Detalles</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-text-secondary">Ingreso:</span><span className="text-text font-semibold">{new Date(orden.fechaEntrada).toLocaleDateString('es-PE')}</span></div>
            {orden.fechaEstimada && <div className="flex justify-between"><span className="text-text-secondary">Entrega:</span><span className="text-text font-semibold">{new Date(orden.fechaEstimada).toLocaleString('es-PE')}</span></div>}
            <div className="flex justify-between"><span className="text-text-secondary">Recep.:</span><span className="text-text font-semibold">{orden.recepcionista.nombres.split(' ')[0]} {orden.recepcionista.apellidoPaterno}</span></div>
          </div>
        </div>

        {/* Total */}
        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 p-4">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">TOTAL</p>
          <p className="text-2xl font-black text-primary">S/ {Number(orden.costoTotal).toFixed(2)}</p>
          <div className="mt-1 flex gap-3 text-xs text-text font-medium">
            <span>Serv: S/ {totalServicios.toFixed(2)}</span>
            <span>Rep: S/ {totalRepuestos.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Motivo de ingreso */}
      {orden.notasCliente && (
        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
          <p className="text-xs font-bold text-amber-700 uppercase mb-1">Motivo de ingreso</p>
          <p className="text-sm text-amber-900">{orden.notasCliente}</p>
        </div>
      )}

      {/* Diagnóstico */}
      <div className="mt-4 rounded-xl bg-surface p-5 shadow-sm border border-border-light">
        <div className="flex items-center justify-between mb-3">
          <h3 className="flex items-center gap-2 text-base font-bold text-text">
            <FileText className="h-5 w-5 text-primary" /> Diagnóstico
          </h3>
          {diagnosticoEdit === null && !esFinalizada && (
            <button onClick={() => setDiagnosticoEdit(orden.diagnostico || '')} className="text-sm font-semibold text-primary hover:underline">
              {orden.diagnostico ? 'Editar' : '+ Agregar'}
            </button>
          )}
        </div>
        {diagnosticoEdit !== null ? (
          <div>
            <textarea value={diagnosticoEdit} onChange={(e) => setDiagnosticoEdit(e.target.value)} rows={3} placeholder="Describa los hallazgos del diagnóstico..."
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            <div className="mt-2 flex gap-2 justify-end">
              <button onClick={() => setDiagnosticoEdit(null)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary">Cancelar</button>
              <button onClick={() => guardarDiagnostico.mutate(diagnosticoEdit)} disabled={guardarDiagnostico.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50">Guardar</button>
            </div>
          </div>
        ) : (
          <p className={cn('text-sm leading-relaxed', orden.diagnostico ? 'text-text whitespace-pre-wrap' : 'text-text-muted italic')}>
            {orden.diagnostico || 'Sin diagnóstico registrado aún'}
          </p>
        )}
      </div>

      {/* Fila de acciones: Servicios, Repuestos, Historial, Estado */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Servicios */}
        <div className="rounded-xl bg-surface p-4 shadow-sm border border-border-light">
          <div className="flex items-center justify-between mb-2">
            <h3 className="flex items-center gap-2 text-sm font-bold text-text">
              <Wrench className="h-4 w-4 text-primary" /> Servicios
            </h3>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">{orden.servicios.length}</span>
          </div>
          <p className="text-xl font-black text-text mb-3">S/ {totalServicios.toFixed(2)}</p>
          <div className="flex gap-2">
            <button onClick={() => setModalVerServicios(true)} className={cn('rounded-lg bg-surface-alt py-2.5 text-sm font-bold text-white hover:bg-hover flex items-center justify-center gap-1.5 transition-colors', esFinalizada ? 'w-full' : 'flex-1')}>
              <Eye className="h-4 w-4" /> Ver todos
            </button>
            {!esFinalizada && (
              <button onClick={() => setModalServicio(true)} className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary-hover flex items-center justify-center gap-1.5 transition-colors">
                <Plus className="h-4 w-4" /> Agregar
              </button>
            )}
          </div>
        </div>

        {/* Repuestos */}
        <div className="rounded-xl bg-surface p-4 shadow-sm border border-border-light">
          <div className="flex items-center justify-between mb-2">
            <h3 className="flex items-center gap-2 text-sm font-bold text-text">
              <Package className="h-4 w-4 text-primary" /> Repuestos
            </h3>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">{orden.repuestos.length}</span>
          </div>
          <p className="text-xl font-black text-text mb-3">S/ {totalRepuestos.toFixed(2)}</p>
          <div className="flex gap-2">
            <button onClick={() => setModalVerRepuestos(true)} className={cn('rounded-lg bg-surface-alt py-2.5 text-sm font-bold text-white hover:bg-hover flex items-center justify-center gap-1.5 transition-colors', esFinalizada ? 'w-full' : 'flex-1')}>
              <Eye className="h-4 w-4" /> Ver todos
            </button>
            {!esFinalizada && (
              <button onClick={() => setModalRepuesto(true)} className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary-hover flex items-center justify-center gap-1.5 transition-colors">
                <Plus className="h-4 w-4" /> Agregar
              </button>
            )}
          </div>
        </div>

        {/* Historial */}
        <div className="rounded-xl bg-surface p-4 shadow-sm border border-border-light">
          <div className="flex items-center justify-between mb-2">
            <h3 className="flex items-center gap-2 text-sm font-bold text-text">
              <Clock className="h-4 w-4 text-primary" /> Historial
            </h3>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">{orden.historialEstados.length}</span>
          </div>
          <p className="text-sm text-text mb-3">Registro de cambios de estado</p>
          <button onClick={() => setModalVerHistorial(true)} className="w-full rounded-lg bg-surface-alt py-2.5 text-sm font-bold text-white hover:bg-hover flex items-center justify-center gap-1.5 transition-colors">
            <Clock className="h-4 w-4" /> Ver historial completo
          </button>
        </div>

        {/* Cambiar Estado */}
        {transicionesPermitidas.length > 0 ? (
          <div className="rounded-xl bg-surface p-4 shadow-sm border border-border-light">
            <h3 className="text-sm font-bold text-text mb-3">Acciones</h3>
            <div className="space-y-2">
              {transicionesPermitidas.filter(e => e !== 'CANCELADO').map((est) => (
                <button key={est} onClick={() => setModalCambioEstado(est)}
                  className="flex w-full items-center justify-between rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-hover transition-colors shadow-sm">
                  Avanzar a: {ETIQUETAS_ESTADO_OT[est as keyof typeof ETIQUETAS_ESTADO_OT]}
                  <ChevronRight className="h-5 w-5" />
                </button>
              ))}
              {transicionesPermitidas.includes('CANCELADO') && (
                <button onClick={() => setModalCambioEstado('CANCELADO')}
                  className="flex w-full items-center justify-between rounded-lg border-2 border-error/40 px-4 py-2.5 text-sm font-bold text-error hover:bg-error/5 transition-colors">
                  Cancelar Orden <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-success/10 border-2 border-success/30 p-5 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-success/20 p-3 mb-2">
              <Check className="h-8 w-8 text-success" />
            </div>
            <p className="text-base font-black text-success">{orden.estado === 'CANCELADO' ? 'Orden Cancelada' : 'Orden Finalizada'}</p>
            {orden.fechaEntrega && <p className="text-sm font-semibold text-text mt-1">{new Date(orden.fechaEntrega).toLocaleString('es-PE')}</p>}
            {orden.estado === 'ENTREGADO' && Number(orden.costoTotal) > 0 && (
              <button
                onClick={() => {
                  import('@/services/facturacion.service').then(({ generarFacturaDesdeOTAPI }) => {
                    const tipo = orden.cliente.tipoCliente === 'EMPRESA' ? 'FACTURA' : 'BOLETA DE VENTA';
                    generarFacturaDesdeOTAPI(orden.id, tipo)
                      .then((f) => toast.success(`Factura ${f.numeroFactura} generada correctamente`))
                      .catch((err) => toast.error(err instanceof Error ? err.message : 'Error al generar factura'));
                  });
                }}
                className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-hover transition-colors"
              >
                <DollarSign className="inline h-4 w-4 mr-1" /> Generar Factura
              </button>
            )}
          </div>
        )}
      </div>

      {/* Checklist inline si existe */}
      {orden.checklist.length > 0 && (
        <div className="mt-4 rounded-xl bg-surface p-4 shadow-sm border border-border-light">
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Checklist de Recepción</h3>
          <div className="flex flex-wrap gap-2">
            {orden.checklist.map((c) => (
              <span key={c.id} className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium', c.marcado ? 'bg-success/10 text-success' : 'bg-surface-alt text-text-muted')}>
                {c.marcado ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} {c.item}
                {c.notas && <span className="text-text-muted ml-1">({c.notas})</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* === MODALES === */}

      {/* Modal ver servicios */}
      {modalVerServicios && (
        <ListaModal titulo="Servicios" onClose={() => setModalVerServicios(false)}>
          {orden.servicios.length === 0 ? <p className="text-sm text-text-muted italic py-4 text-center">Sin servicios registrados</p> : (
            <div className="space-y-2">
              {orden.servicios.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg bg-surface-alt p-4">
                  <div>
                    <p className="font-semibold text-text">{s.servicioNombre}</p>
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', s.servicioTipo === 'PREVENTIVO' ? 'bg-info/15 text-info' : 'bg-error/15 text-error')}>{s.servicioTipo}</span>
                    {s.notas && <p className="text-xs text-text-secondary mt-1">{s.notas}</p>}
                  </div>
                  <p className="font-bold text-text">S/ {Number(s.subtotal).toFixed(2)}</p>
                </div>
              ))}
              <div className="flex justify-end pt-3 border-t border-border">
                <p className="font-bold text-text">Total: S/ {totalServicios.toFixed(2)}</p>
              </div>
            </div>
          )}
        </ListaModal>
      )}

      {/* Modal ver repuestos */}
      {modalVerRepuestos && (
        <ListaModal titulo="Repuestos" onClose={() => setModalVerRepuestos(false)}>
          {orden.repuestos.length === 0 ? <p className="text-sm text-text-muted italic py-4 text-center">Sin repuestos registrados</p> : (
            <div className="space-y-2">
              {orden.repuestos.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg bg-surface-alt p-4">
                  <div>
                    <p className="font-semibold text-text">{r.repuestoNombre}</p>
                    <p className="text-sm text-text-secondary">Cant: {r.cantidad} × S/ {Number(r.costoUnitario).toFixed(2)}</p>
                  </div>
                  <p className="font-bold text-text">S/ {Number(r.subtotal).toFixed(2)}</p>
                </div>
              ))}
              <div className="flex justify-end pt-3 border-t border-border">
                <p className="font-bold text-text">Total: S/ {totalRepuestos.toFixed(2)}</p>
              </div>
            </div>
          )}
        </ListaModal>
      )}

      {/* Modal ver historial */}
      {modalVerHistorial && (
        <ListaModal titulo="Historial de Estados" onClose={() => setModalVerHistorial(false)}>
          <div className="space-y-3">
            {orden.historialEstados.map((h) => (
              <div key={h.id} className="flex items-start gap-3 rounded-lg bg-surface-alt p-4">
                <div className="mt-1 h-3 w-3 rounded-full bg-primary flex-shrink-0" />
                <div>
                  <p className="text-sm text-text">
                    {h.estadoAnterior ? <><span className="font-medium">{ETIQUETAS_ESTADO_OT[h.estadoAnterior as keyof typeof ETIQUETAS_ESTADO_OT] || h.estadoAnterior}</span> → </> : null}
                    <span className="font-bold text-primary">{ETIQUETAS_ESTADO_OT[h.estadoNuevo as keyof typeof ETIQUETAS_ESTADO_OT] || h.estadoNuevo}</span>
                  </p>
                  {h.notas && <p className="text-sm text-text-secondary mt-0.5">{h.notas}</p>}
                  <p className="text-xs text-text-muted mt-0.5">{new Date(h.cambiadoEn).toLocaleString('es-PE')}</p>
                </div>
              </div>
            ))}
          </div>
        </ListaModal>
      )}

      {modalCambioEstado && (
        <ConfirmDialog
          titulo={modalCambioEstado === 'CANCELADO' ? '¿Cancelar esta orden de trabajo?' : `¿Avanzar a "${ETIQUETAS_ESTADO_OT[modalCambioEstado as keyof typeof ETIQUETAS_ESTADO_OT]}"?`}
          mensaje={modalCambioEstado === 'CANCELADO' ? 'Esta acción no se puede deshacer.' : `La orden pasará de "${ETIQUETAS_ESTADO_OT[orden.estado as keyof typeof ETIQUETAS_ESTADO_OT]}" a "${ETIQUETAS_ESTADO_OT[modalCambioEstado as keyof typeof ETIQUETAS_ESTADO_OT]}".`}
          textoConfirmar={modalCambioEstado === 'CANCELADO' ? 'Cancelar Orden' : 'Confirmar'}
          variante={modalCambioEstado === 'CANCELADO' ? 'danger' : 'warning'}
          cargando={cambiarEstado.isPending}
          onConfirm={() => cambiarEstado.mutate({ estado: modalCambioEstado, notas: notasCambio || undefined })}
          onCancel={() => { setModalCambioEstado(null); setNotasCambio(''); }}
        />
      )}

      {modalServicio && <AgregarServicioModal onClose={() => setModalServicio(false)} onAgregar={(data) => agregarServicio.mutate(data)} cargando={agregarServicio.isPending} />}
      {modalRepuesto && <AgregarRepuestoModal onClose={() => setModalRepuesto(false)} onAgregar={(data) => agregarRepuesto.mutate(data)} cargando={agregarRepuesto.isPending} />}
    </div>
  );
}

// === Modal genérico para listas ===
function ListaModal({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-xl bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-text">{titulo}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// === Modal Agregar Servicio ===
function AgregarServicioModal({ onClose, onAgregar, cargando }: { onClose: () => void; onAgregar: (data: Record<string, unknown>) => void; cargando: boolean }) {
  const [servicios, setServicios] = useState<{ id: string; nombre: string; tipoServicio: string; precioBase: string; categoria: { nombre: string } }[]>([]);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [servicioId, setServicioId] = useState('');
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('');
  const [precio, setPrecio] = useState('');
  const [notas, setNotas] = useState('');

  useEffect(() => {
    import('@/services/servicios.service').then(({ listarServiciosActivosAPI }) => {
      listarServiciosActivosAPI().then(setServicios);
    });
  }, []);

  const seleccionarServicio = (id: string) => {
    setServicioId(id);
    const s = servicios.find((sv) => sv.id === id);
    if (s) {
      setNombre(s.nombre);
      setTipo(s.tipoServicio);
      setPrecio(Number(s.precioBase).toFixed(2));
    }
  };

  const serviciosFiltrados = filtroTipo
    ? servicios.filter((s) => s.tipoServicio === filtroTipo)
    : servicios;

  const opciones = serviciosFiltrados.map((s) => ({
    value: s.id,
    label: `${s.nombre} — S/ ${Number(s.precioBase).toFixed(2)}`,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicioId) { toast.error('Seleccione un servicio del catálogo'); return; }
    onAgregar({ servicioNombre: nombre, servicioTipo: tipo, precioUnitario: Number(precio), notas: notas || undefined });
  };

  const ic = 'w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-xl bg-surface p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-bold text-text">Agregar Servicio</h3>

        {/* Filtro por tipo */}
        <div className="mb-4 flex gap-2">
          {[{ key: '', label: 'Todos' }, { key: 'PREVENTIVO', label: 'Preventivo' }, { key: 'CORRECTIVO', label: 'Correctivo' }].map((f) => (
            <button key={f.key} type="button" onClick={() => { setFiltroTipo(f.key); setServicioId(''); setNombre(''); }}
              className={cn('rounded-full px-4 py-1.5 text-xs font-bold transition-colors',
                filtroTipo === f.key ? 'bg-primary text-white' : 'bg-surface-alt text-text-secondary hover:bg-surface-alt')}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <SearchSelect
            label="Buscar servicio"
            required
            options={opciones}
            value={servicioId}
            onChange={seleccionarServicio}
            placeholder="Escriba para buscar..."
          />

          {servicioId && (
            <div className="rounded-lg bg-success/5 border border-success/20 p-4">
              <p className="text-sm font-bold text-text">{nombre}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={cn('rounded-full px-3 py-1 text-xs font-bold', tipo === 'PREVENTIVO' ? 'bg-info/15 text-info' : 'bg-error/15 text-error')}>{tipo}</span>
                <span className="text-base font-black text-text">S/ {precio}</span>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-text">Notas (opcional)</label>
            <input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Observaciones adicionales..." maxLength={200} className={ic} />
          </div>
        </div>
        <div className="mt-5 flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text-secondary">Cancelar</button>
          <button type="submit" disabled={cargando || !servicioId} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50">{cargando ? 'Agregando...' : 'Agregar Servicio'}</button>
        </div>
      </form>
    </div>
  );
}

// === Modal Agregar Repuesto ===
function AgregarRepuestoModal({ onClose, onAgregar, cargando }: { onClose: () => void; onAgregar: (data: Record<string, unknown>) => void; cargando: boolean }) {
  const [repuestos, setRepuestos] = useState<{ id: string; codigo: string; nombre: string; precioVenta: string; stockActual: number; stockMinimo: number }[]>([]);
  const [repuestoId, setRepuestoId] = useState('');
  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [costo, setCosto] = useState('');
  const [stockDisponible, setStockDisponible] = useState<number | null>(null);

  useEffect(() => {
    import('@/services/inventario.service').then(({ listarRepuestosAPI }) => {
      listarRepuestosAPI(1, 200).then((res) => setRepuestos(res.datos));
    });
  }, []);

  const seleccionarRepuesto = (id: string) => {
    setRepuestoId(id);
    const r = repuestos.find((rp) => rp.id === id);
    if (r) {
      setNombre(r.nombre);
      setCosto(Number(r.precioVenta).toFixed(2));
      setStockDisponible(r.stockActual);
    }
  };

  const opciones = repuestos.map((r) => {
    const stockBajo = r.stockActual <= r.stockMinimo;
    return {
      value: r.id,
      label: `${r.nombre} — S/ ${Number(r.precioVenta).toFixed(2)}${stockBajo ? ' ⚠️ Stock bajo' : ''}`,
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repuestoId) { toast.error('Seleccione un repuesto del inventario'); return; }
    if (!cantidad || Number(cantidad) <= 0) { toast.error('Ingrese una cantidad válida'); return; }
    if (stockDisponible !== null && Number(cantidad) > stockDisponible) {
      toast.error(`Stock insuficiente. Disponible: ${stockDisponible}`);
      return;
    }
    onAgregar({ repuestoNombre: nombre, cantidad: Number(cantidad), costoUnitario: Number(costo) });
  };

  const ic = 'w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-xl bg-surface p-6 shadow-xl">
        <h3 className="mb-3 text-lg font-bold text-text">Agregar Repuesto</h3>
        <div className="mb-4 flex items-center gap-4 rounded-lg bg-surface-alt border border-border px-4 py-2.5 text-xs">
          <span className="font-semibold text-text-secondary">Leyenda de stock:</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-success"></span> Disponible</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-warning"></span> Bajo (menos de 5)</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-error"></span> Crítico (0)</span>
        </div>
        <div className="space-y-4">
          <SearchSelect
            label="Buscar repuesto"
            required
            options={opciones}
            value={repuestoId}
            onChange={seleccionarRepuesto}
            placeholder="Escriba nombre del repuesto..."
          />

          {repuestoId && (
            <div className="rounded-lg bg-success/5 border border-success/20 p-4">
              <p className="text-sm font-bold text-text">{nombre}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-base font-black text-text">S/ {costo}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-text-secondary">Stock:</span>
                  {stockDisponible !== null && stockDisponible === 0 ? (
                    <span className="flex items-center gap-1 rounded-full bg-error/10 border border-error/20 px-2.5 py-0.5 text-xs font-bold text-error">
                      <span className="h-2 w-2 rounded-full bg-error"></span> Sin stock
                    </span>
                  ) : stockDisponible !== null && stockDisponible <= 5 ? (
                    <span className="flex items-center gap-1 rounded-full bg-warning/10 border border-warning/20 px-2.5 py-0.5 text-xs font-bold text-warning">
                      <span className="h-2 w-2 rounded-full bg-warning"></span> {stockDisponible} unidades — Stock bajo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-bold text-success">
                      <span className="h-2 w-2 rounded-full bg-success"></span> {stockDisponible} unidades
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {repuestoId && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text">Cantidad *</label>
              <input value={cantidad} onChange={(e) => setCantidad(e.target.value.replace(/\D/g, ''))} placeholder="1" inputMode="numeric" className={ic} />
              {stockDisponible !== null && Number(cantidad) > stockDisponible && (
                <p className="mt-1 text-xs text-error font-bold">No puede superar el stock disponible ({stockDisponible})</p>
              )}
              {stockDisponible !== null && Number(cantidad) > 0 && Number(cantidad) <= stockDisponible && (
                <p className="mt-1 text-xs text-text-secondary">Subtotal: <span className="font-bold text-text">S/ {(Number(cantidad) * Number(costo)).toFixed(2)}</span></p>
              )}
            </div>
          )}
        </div>
        <div className="mt-5 flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text-secondary">Cancelar</button>
          <button type="submit" disabled={cargando || !repuestoId} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50">{cargando ? 'Agregando...' : 'Agregar Repuesto'}</button>
        </div>
      </form>
    </div>
  );
}
