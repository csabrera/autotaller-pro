import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Package, AlertTriangle, ChevronLeft, ChevronRight, ListFilter, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { listarRepuestosAPI, crearRepuestoAPI, registrarMovimientoAPI, type RepuestoItem } from '@/services/inventario.service';
import { listarCatalogoAPI } from '@/services/catalogos.service';
import { SearchSelect } from '@/components/forms/SearchSelect';

export function InventarioPage() {
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaInput, setBusquedaInput] = useState('');
  const [soloStockBajo, setSoloStockBajo] = useState(false);
  const [modal, setModal] = useState(false);
  const [modalMovimiento, setModalMovimiento] = useState<RepuestoItem | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['repuestos', pagina, busqueda, soloStockBajo],
    queryFn: () => listarRepuestosAPI(pagina, 10, busqueda || undefined, soloStockBajo),
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
          <h2 className="text-2xl font-bold text-text">Inventario de Repuestos</h2>
          <p className="text-sm text-text-muted mt-0.5">Control de stock y movimientos</p>
        </div>
        <div className="flex items-center gap-2">
          {data?.totalStockBajo ? (
            <span className="flex items-center gap-1.5 rounded-full bg-error/10 border border-error/20 px-4 py-2 text-sm font-bold text-error">
              <AlertTriangle className="h-4 w-4" /> {data.totalStockBajo} stock bajo
            </span>
          ) : null}
          <button onClick={() => setModal(true)} className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover shadow-sm transition-colors">
            <Plus className="h-4 w-4" /> Nuevo Repuesto
          </button>
        </div>
      </div>

      {/* Filtros + Búsqueda */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setSoloStockBajo(false); setPagina(1); }}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              !soloStockBajo
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface text-text-secondary border border-border hover:border-primary hover:text-primary',
            )}
          >
            <ListFilter className="h-3.5 w-3.5" />
            Todos
          </button>
          <button
            onClick={() => { setSoloStockBajo(true); setPagina(1); }}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              soloStockBajo
                ? 'bg-error text-white shadow-sm'
                : 'bg-surface text-text-secondary border border-border hover:border-error hover:text-error',
            )}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Stock Bajo
          </button>
        </div>
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            value={busquedaInput}
            onChange={(e) => setBusquedaInput(e.target.value)}
            placeholder="Buscar por código o nombre..."
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
                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Código</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Repuesto</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Categoría</th>
                <th className="px-5 py-3 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Stock</th>
                <th className="px-5 py-3 text-right text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Precio</th>
                <th className="px-5 py-3 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="py-16 text-center"><div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></td></tr>
              ) : data?.datos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Package className="mx-auto h-8 w-8 text-text-muted mb-2" />
                    <p className="text-sm font-medium text-text-secondary">No se encontraron repuestos</p>
                    <p className="text-xs text-text-muted mt-1">Registre un nuevo repuesto para comenzar</p>
                  </td>
                </tr>
              ) : data?.datos.map((r, idx) => {
                const stockBajo = r.stockActual <= r.stockMinimo;
                return (
                  <tr key={r.id} className="border-b border-border-light hover:bg-hover transition-colors">
                    <td className="px-5 py-3 text-center text-xs font-medium text-text-muted">{(pagina - 1) * 10 + idx + 1}</td>
                    <td className="px-5 py-3 font-mono text-sm font-bold text-primary">{r.codigo}</td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-text text-sm">{r.nombre}</p>
                      {r.ubicacion && <p className="text-xs text-text-muted mt-0.5">Ubic: {r.ubicacion}</p>}
                    </td>
                    <td className="px-5 py-3 text-sm text-text-secondary">{r.categoria.nombre}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={cn('font-bold text-lg', stockBajo ? 'text-error' : 'text-text')}>
                        {r.stockActual}
                      </span>
                      <p className="text-xs text-text-muted">Mín: {r.stockMinimo}</p>
                      {stockBajo && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-error/10 px-2 py-0.5 text-[10px] font-bold text-error mt-0.5">
                          <AlertTriangle className="h-2.5 w-2.5" /> Bajo
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-text text-sm">S/ {Number(r.precioVenta).toFixed(2)}</td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => setModalMovimiento(r)}
                        className="flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors mx-auto"
                      >
                        <ArrowDownToLine className="h-3.5 w-3.5" />
                        <span className="hidden lg:inline">Movimiento</span>
                      </button>
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

      {modal && <CrearRepuestoModal onClose={() => setModal(false)} onCreado={() => { setModal(false); queryClient.invalidateQueries({ queryKey: ['repuestos'] }); }} />}
      {modalMovimiento && <MovimientoModal repuesto={modalMovimiento} onClose={() => setModalMovimiento(null)} onRegistrado={() => { setModalMovimiento(null); queryClient.invalidateQueries({ queryKey: ['repuestos'] }); }} />}
    </div>
  );
}

function CrearRepuestoModal({ onClose, onCreado }: { onClose: () => void; onCreado: () => void }) {
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [unidadId, setUnidadId] = useState('');
  const [stockMinimo, setStockMinimo] = useState('5');
  const [precioVenta, setPrecioVenta] = useState('');
  const [categorias, setCategorias] = useState<{ value: string; label: string }[]>([]);
  const [unidades, setUnidades] = useState<{ value: string; label: string }[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    Promise.all([
      listarCatalogoAPI('categorias-repuesto', { activo: 'true' }),
      listarCatalogoAPI('unidades', { activo: 'true' }),
    ]).then(([c, u]) => {
      setCategorias(c.map(i => ({ value: i.id, label: i.nombre })));
      setUnidades(u.map(i => ({ value: i.id, label: i.nombre })));
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo || !nombre || !categoriaId || !unidadId || !precioVenta) { toast.error('Complete los campos obligatorios'); return; }
    setCargando(true);
    try {
      await crearRepuestoAPI({ codigo: codigo.toUpperCase(), nombre, categoriaId, unidadId, stockMinimo: Number(stockMinimo), precioVenta: Number(precioVenta) });
      toast.success('Repuesto creado correctamente');
      onCreado();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Error al crear repuesto'); }
    finally { setCargando(false); }
  };

  const ic = 'w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-xl bg-surface p-6 shadow-xl">
        <h3 className="mb-5 text-lg font-bold text-text">Nuevo Repuesto</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1.5 block text-sm font-semibold text-text">Código *</label><input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="REP-001" maxLength={50} className={ic} /></div>
            <div><label className="mb-1.5 block text-sm font-semibold text-text">Precio Venta S/ *</label><input value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0.00" className={ic} /></div>
          </div>
          <div><label className="mb-1.5 block text-sm font-semibold text-text">Nombre *</label><input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={200} className={ic} /></div>
          <div className="grid grid-cols-2 gap-3">
            <SearchSelect label="Categoría" required options={categorias} value={categoriaId} onChange={setCategoriaId} placeholder="Seleccionar..." />
            <SearchSelect label="Unidad" required options={unidades} value={unidadId} onChange={setUnidadId} placeholder="Seleccionar..." />
          </div>
          <div><label className="mb-1.5 block text-sm font-semibold text-text">Stock Mínimo</label><input value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value.replace(/\D/g, ''))} className={ic} /></div>
        </div>
        <div className="mt-5 flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-alt transition-colors">Cancelar</button>
          <button type="submit" disabled={cargando} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50 transition-colors">{cargando ? 'Creando...' : 'Crear Repuesto'}</button>
        </div>
      </form>
    </div>
  );
}

function MovimientoModal({ repuesto, onClose, onRegistrado }: { repuesto: RepuestoItem; onClose: () => void; onRegistrado: () => void }) {
  const [tipo, setTipo] = useState('ENTRADA');
  const [cantidad, setCantidad] = useState('');
  const [referencia, setReferencia] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cantidad || Number(cantidad) <= 0) { toast.error('Ingrese una cantidad válida'); return; }
    setCargando(true);
    try {
      await registrarMovimientoAPI(repuesto.id, tipo, Number(cantidad), referencia || 'Manual');
      toast.success(`Movimiento de ${tipo.toLowerCase()} registrado`);
      onRegistrado();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Error al registrar movimiento'); }
    finally { setCargando(false); }
  };

  const ic = 'w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl">
        <h3 className="mb-2 text-lg font-bold text-text">Registrar Movimiento</h3>
        <p className="mb-5 text-sm text-text-secondary"><span className="font-bold text-primary">{repuesto.codigo}</span> — {repuesto.nombre} | Stock actual: <span className="font-bold">{repuesto.stockActual}</span></p>
        <div className="space-y-4">
          <div><label className="mb-1.5 block text-sm font-semibold text-text">Tipo *</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={ic}>
              <option value="ENTRADA">Entrada (compra/devolución)</option>
              <option value="SALIDA">Salida (uso en OT)</option>
              <option value="AJUSTE">Ajuste de inventario</option>
            </select>
          </div>
          <div><label className="mb-1.5 block text-sm font-semibold text-text">Cantidad *</label><input value={cantidad} onChange={(e) => setCantidad(e.target.value.replace(/\D/g, ''))} placeholder="0" inputMode="numeric" className={ic} /></div>
          <div><label className="mb-1.5 block text-sm font-semibold text-text">Referencia</label><input value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="N° factura, OT, etc." maxLength={100} className={ic} /></div>
        </div>
        <div className="mt-5 flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-alt transition-colors">Cancelar</button>
          <button type="submit" disabled={cargando} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50 transition-colors">{cargando ? 'Registrando...' : 'Registrar'}</button>
        </div>
      </form>
    </div>
  );
}
