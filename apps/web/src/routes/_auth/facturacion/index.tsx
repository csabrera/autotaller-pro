import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, DollarSign, Eye, CreditCard, X, ChevronLeft, ChevronRight, FileText, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { listarFacturasAPI, registrarPagoAPI, anularFacturaAPI, type FacturaItem } from '@/services/facturacion.service';
import { listarCatalogoAPI } from '@/services/catalogos.service';
import { SearchSelect } from '@/components/forms/SearchSelect';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

const ESTADOS_FACTURA = [
  { key: '', label: 'Todas' },
  { key: 'EMITIDA', label: 'Emitida' },
  { key: 'PARCIAL', label: 'Parcial' },
  { key: 'PAGADA', label: 'Pagada' },
  { key: 'ANULADA', label: 'Anulada' },
];

const COLORES_ESTADO: Record<string, string> = {
  BORRADOR: 'bg-surface-alt text-text-secondary',
  EMITIDA: 'bg-info/15 text-info',
  PARCIAL: 'bg-warning/15 text-warning',
  PAGADA: 'bg-success/15 text-success',
  ANULADA: 'bg-error/15 text-error',
};

function nombreCliente(c: FacturaItem['cliente']) {
  return c.tipoCliente === 'PERSONA' ? `${c.nombres} ${c.apellidoPaterno}` : c.razonSocial || '';
}

export function FacturacionPage() {
  const [pagina, setPagina] = useState(1);
  const [estado, setEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [busquedaInput, setBusquedaInput] = useState('');
  const [modalPago, setModalPago] = useState<FacturaItem | null>(null);
  const [modalDetalle, setModalDetalle] = useState<FacturaItem | null>(null);
  const [anulando, setAnulando] = useState<FacturaItem | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['facturas', pagina, estado, busqueda],
    queryFn: () => listarFacturasAPI(pagina, 10, estado || undefined, busqueda || undefined),
  });

  const anular = useMutation({
    mutationFn: anularFacturaAPI,
    onSuccess: () => { toast.success('Factura anulada'); queryClient.invalidateQueries({ queryKey: ['facturas'] }); setAnulando(null); },
    onError: (e: Error) => { toast.error(e.message); setAnulando(null); },
  });

  useEffect(() => {
    const timer = setTimeout(() => { setBusqueda(busquedaInput); setPagina(1); }, 400);
    return () => clearTimeout(timer);
  }, [busquedaInput]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text">Facturación</h2>
          <p className="text-sm text-text-muted mt-0.5">Gestión de facturas, boletas y pagos</p>
        </div>
      </div>

      {/* Filtros por estado + Búsqueda */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {ESTADOS_FACTURA.map((e) => {
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
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            value={busquedaInput}
            onChange={(e) => setBusquedaInput(e.target.value)}
            placeholder="Buscar por N° factura o cliente..."
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
                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">N° Factura</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Cliente</th>
                <th className="px-5 py-3 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Tipo</th>
                <th className="px-5 py-3 text-right text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Total</th>
                <th className="px-5 py-3 text-right text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Pagado</th>
                <th className="px-5 py-3 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Estado</th>
                <th className="px-5 py-3 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Fecha</th>
                <th className="px-5 py-3 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="py-16 text-center"><div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></td></tr>
              ) : data?.datos.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <FileText className="mx-auto h-8 w-8 text-text-muted mb-2" />
                    <p className="text-sm font-medium text-text-secondary">No se encontraron facturas</p>
                    <p className="text-xs text-text-muted mt-1">Las facturas se generan desde las órdenes de trabajo</p>
                  </td>
                </tr>
              ) : data?.datos.map((f, idx) => {
                const totalPagado = f.pagos.reduce((s, p) => s + Number(p.monto), 0);
                const pendiente = Number(f.total) - totalPagado;
                return (
                  <tr key={f.id} className={cn('border-b border-border-light hover:bg-hover transition-colors', f.estado === 'ANULADA' && 'opacity-50')}>
                    <td className="px-5 py-3 text-center text-xs font-medium text-text-muted">{(pagina - 1) * 10 + idx + 1}</td>
                    <td className="px-5 py-3 font-bold text-primary text-sm">{f.numeroFactura}</td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-text text-sm">{nombreCliente(f.cliente)}</p>
                      <p className="text-xs text-text-muted">{f.cliente.numeroDocumento}</p>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="rounded-full bg-surface-alt px-2.5 py-0.5 text-xs font-semibold text-text-secondary">{f.tipoDocumento}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-text text-sm">S/ {Number(f.total).toFixed(2)}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={cn('font-bold text-sm', totalPagado >= Number(f.total) ? 'text-success' : 'text-text')}>S/ {totalPagado.toFixed(2)}</span>
                      {pendiente > 0 && f.estado !== 'ANULADA' && <p className="text-[11px] text-error font-semibold">Pend: S/ {pendiente.toFixed(2)}</p>}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-bold', COLORES_ESTADO[f.estado] || COLORES_ESTADO.BORRADOR)}>
                        {f.estado}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center text-sm text-text-secondary">
                      {f.emitidaEn ? new Date(f.emitidaEn).toLocaleDateString('es-PE') : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setModalDetalle(f)}
                          className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden lg:inline">Ver</span>
                        </button>
                        {(f.estado === 'EMITIDA' || f.estado === 'PARCIAL') && (
                          <button
                            onClick={() => setModalPago(f)}
                            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-success hover:bg-success/10 transition-colors"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            <span className="hidden lg:inline">Pagar</span>
                          </button>
                        )}
                        {f.estado !== 'PAGADA' && f.estado !== 'ANULADA' && (
                          <button
                            onClick={() => setAnulando(f)}
                            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-error hover:bg-error/10 transition-colors"
                          >
                            <Ban className="h-3.5 w-3.5" />
                            <span className="hidden lg:inline">Anular</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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

      {/* Modal detalle */}
      {modalDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4">
          <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-bold text-text">{modalDetalle.numeroFactura}</h3>
              <button onClick={() => setModalDetalle(null)} className="text-text-muted hover:text-text-secondary"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-text-muted">Cliente:</span><span className="font-semibold text-text">{nombreCliente(modalDetalle.cliente)}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Tipo:</span><span className="font-semibold">{modalDetalle.tipoDocumento}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Subtotal:</span><span>S/ {Number(modalDetalle.subtotal).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">IGV ({Number(modalDetalle.tasaImpuesto)}%):</span><span>S/ {Number(modalDetalle.montoImpuesto).toFixed(2)}</span></div>
              <div className="flex justify-between border-t border-border pt-2"><span className="font-bold text-text">TOTAL:</span><span className="text-lg font-black text-primary">S/ {Number(modalDetalle.total).toFixed(2)}</span></div>
            </div>
            {modalDetalle.pagos.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold text-text-muted uppercase mb-2">Pagos registrados</p>
                {modalDetalle.pagos.map((p) => (
                  <div key={p.id} className="flex justify-between rounded-lg bg-surface-alt p-3 mb-1 text-sm">
                    <div>
                      <span className="font-semibold text-text">{p.metodoPago.nombre}</span>
                      {p.referencia && <span className="text-text-muted ml-2">({p.referencia})</span>}
                      <p className="text-xs text-text-muted">{new Date(p.pagadoEn).toLocaleString('es-PE')}</p>
                    </div>
                    <span className="font-bold text-success">S/ {Number(p.monto).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal pago */}
      {modalPago && (
        <RegistrarPagoModal
          factura={modalPago}
          onClose={() => setModalPago(null)}
          onPagado={() => { setModalPago(null); queryClient.invalidateQueries({ queryKey: ['facturas'] }); }}
        />
      )}

      {anulando && (
        <ConfirmDialog
          titulo={`¿Anular factura ${anulando.numeroFactura}?`}
          mensaje="Esta acción no se puede deshacer. La factura quedará como anulada."
          textoConfirmar="Anular Factura"
          variante="danger"
          cargando={anular.isPending}
          onConfirm={() => anular.mutate(anulando.id)}
          onCancel={() => setAnulando(null)}
        />
      )}
    </div>
  );
}

function RegistrarPagoModal({ factura, onClose, onPagado }: { factura: FacturaItem; onClose: () => void; onPagado: () => void }) {
  const [metodoPagoId, setMetodoPagoId] = useState('');
  const [monto, setMonto] = useState('');
  const [referencia, setReferencia] = useState('');
  const [metodos, setMetodos] = useState<{ value: string; label: string }[]>([]);
  const [cargando, setCargando] = useState(false);

  const totalPagado = factura.pagos.reduce((s, p) => s + Number(p.monto), 0);
  const pendiente = Number(factura.total) - totalPagado;

  useEffect(() => {
    listarCatalogoAPI('metodos-pago', { activo: 'true' }).then((m) =>
      setMetodos(m.map((i) => ({ value: i.id, label: i.nombre })))
    );
    setMonto(pendiente.toFixed(2));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metodoPagoId) { toast.error('Seleccione un método de pago'); return; }
    if (!monto || Number(monto) <= 0) { toast.error('Ingrese un monto válido'); return; }
    if (Number(monto) > pendiente) { toast.error(`El monto no puede superar el pendiente: S/ ${pendiente.toFixed(2)}`); return; }

    setCargando(true);
    try {
      await registrarPagoAPI(factura.id, { metodoPagoId, monto: Number(monto), referencia: referencia || undefined });
      toast.success('Pago registrado correctamente');
      onPagado();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Error al registrar pago'); }
    finally { setCargando(false); }
  };

  const ic = 'w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl">
        <h3 className="mb-2 text-lg font-bold text-text">Registrar Pago</h3>
        <p className="mb-4 text-sm text-text-secondary">
          <span className="font-bold text-primary">{factura.numeroFactura}</span> — Pendiente: <span className="font-black text-error">S/ {pendiente.toFixed(2)}</span>
        </p>
        <div className="space-y-4">
          <SearchSelect label="Método de pago" required options={metodos} value={metodoPagoId} onChange={setMetodoPagoId} placeholder="Seleccionar..." />
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-text">Monto S/ *</label>
            <input value={monto} onChange={(e) => setMonto(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0.00" inputMode="decimal" className={ic} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-text">Referencia (opcional)</label>
            <input value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="N° operación, voucher..." maxLength={100} className={ic} />
          </div>
        </div>
        <div className="mt-5 flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-alt transition-colors">Cancelar</button>
          <button type="submit" disabled={cargando} className="rounded-lg bg-success px-5 py-2.5 text-sm font-bold text-white hover:bg-green-600 disabled:opacity-50 transition-colors">{cargando ? 'Registrando...' : 'Registrar Pago'}</button>
        </div>
      </form>
    </div>
  );
}
