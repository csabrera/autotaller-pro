import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Wrench, Pause, Play, ShieldCheck, ShieldAlert, ChevronLeft, ChevronRight, ListFilter } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { listarServiciosAPI, crearServicioAPI, toggleActivoServicioAPI, type ServicioItem } from '@/services/servicios.service';
import { listarCatalogoAPI } from '@/services/catalogos.service';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SearchSelect } from '@/components/forms/SearchSelect';

export function ServiciosPage() {
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaInput, setBusquedaInput] = useState('');
  const [tipo, setTipo] = useState('');
  const [modal, setModal] = useState(false);
  const [confirmando, setConfirmando] = useState<ServicioItem | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['servicios', pagina, busqueda, tipo],
    queryFn: () => listarServiciosAPI(pagina, 10, busqueda || undefined, tipo || undefined),
  });

  const toggle = useMutation({
    mutationFn: toggleActivoServicioAPI,
    onSuccess: (r) => { toast.success(r.activo ? 'Servicio activado' : 'Servicio deshabilitado'); queryClient.invalidateQueries({ queryKey: ['servicios'] }); setConfirmando(null); },
    onError: (e: Error) => { toast.error(e.message); setConfirmando(null); },
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
          <h2 className="text-2xl font-bold text-text">Servicios & Catálogo</h2>
          <p className="text-sm text-text-muted mt-0.5">Gestión de servicios preventivos y correctivos</p>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover shadow-sm transition-colors">
          <Plus className="h-4 w-4" /> Nuevo Servicio
        </button>
      </div>

      {/* Filtros por tipo + Búsqueda */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {([
            { key: '', label: 'Todos', icon: ListFilter },
            { key: 'PREVENTIVO', label: 'Preventivo', icon: ShieldCheck },
            { key: 'CORRECTIVO', label: 'Correctivo', icon: ShieldAlert },
          ] as const).map((f) => (
            <button
              key={f.key}
              onClick={() => { setTipo(f.key); setPagina(1); }}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                tipo === f.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface text-text-secondary border border-border hover:border-primary hover:text-primary',
              )}
            >
              <f.icon className="h-3.5 w-3.5" />
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            value={busquedaInput}
            onChange={(e) => setBusquedaInput(e.target.value)}
            placeholder="Buscar servicio..."
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
                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Servicio</th>
                <th className="px-5 py-3 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Tipo</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Categoría</th>
                <th className="px-5 py-3 text-right text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Precio</th>
                <th className="px-5 py-3 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Estado</th>
                <th className="px-5 py-3 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="py-16 text-center"><div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></td></tr>
              ) : data?.datos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Wrench className="mx-auto h-8 w-8 text-text-muted mb-2" />
                    <p className="text-sm font-medium text-text-secondary">No se encontraron servicios</p>
                    <p className="text-xs text-text-muted mt-1">Cree un nuevo servicio para comenzar</p>
                  </td>
                </tr>
              ) : data?.datos.map((s, idx) => (
                <tr key={s.id} className={cn('border-b border-border-light hover:bg-hover transition-colors', !s.activo && 'opacity-50')}>
                  <td className="px-5 py-3 text-center text-xs font-medium text-text-muted">{(pagina - 1) * 10 + idx + 1}</td>
                  <td className="px-5 py-3">
                    <p className="font-semibold text-text text-sm">{s.nombre}</p>
                    {s.descripcion && <p className="text-xs text-text-muted mt-0.5 truncate max-w-[300px]">{s.descripcion}</p>}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold', s.tipoServicio === 'PREVENTIVO' ? 'bg-info/15 text-info' : 'bg-error/15 text-error')}>
                      {s.tipoServicio === 'PREVENTIVO' ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                      {s.tipoServicio}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-text-secondary">{s.categoria.nombre}</td>
                  <td className="px-5 py-3 text-right font-bold text-text text-sm">S/ {Number(s.precioBase).toFixed(2)}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold', s.activo ? 'bg-success/10 text-success' : 'bg-error/10 text-error')}>
                      {s.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => setConfirmando(s)}
                      className={cn(
                        'flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors mx-auto',
                        s.activo ? 'text-warning hover:bg-warning/10' : 'text-success hover:bg-success/10',
                      )}
                    >
                      {s.activo ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      <span className="hidden lg:inline">{s.activo ? 'Deshab.' : 'Activar'}</span>
                    </button>
                  </td>
                </tr>
              ))}
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

      {modal && <CrearServicioModal onClose={() => setModal(false)} onCreado={() => { setModal(false); queryClient.invalidateQueries({ queryKey: ['servicios'] }); }} />}
      {confirmando && <ConfirmDialog titulo={`¿${confirmando.activo ? 'Deshabilitar' : 'Activar'} "${confirmando.nombre}"?`} mensaje={confirmando.activo ? 'El servicio no aparecerá en los selectores.' : 'El servicio volverá a estar disponible.'} textoConfirmar={confirmando.activo ? 'Deshabilitar' : 'Activar'} cargando={toggle.isPending} onConfirm={() => toggle.mutate(confirmando.id)} onCancel={() => setConfirmando(null)} />}
    </div>
  );
}

function CrearServicioModal({ onClose, onCreado }: { onClose: () => void; onCreado: () => void }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState('CORRECTIVO');
  const [precio, setPrecio] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [especialidadId, setEspecialidadId] = useState('');
  const [categorias, setCategorias] = useState<{ value: string; label: string }[]>([]);
  const [especialidades, setEspecialidades] = useState<{ value: string; label: string }[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    Promise.all([
      listarCatalogoAPI('categorias-servicio', { activo: 'true' }),
      listarCatalogoAPI('especialidades', { activo: 'true' }),
    ]).then(([c, e]) => {
      setCategorias(c.map(i => ({ value: i.id, label: i.nombre })));
      setEspecialidades(e.map(i => ({ value: i.id, label: i.nombre })));
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !precio || !categoriaId) { toast.error('Complete los campos obligatorios'); return; }
    setCargando(true);
    try {
      await crearServicioAPI({ nombre, descripcion: descripcion || undefined, tipoServicio: tipo, precioBase: Number(precio), categoriaId, especialidadId: especialidadId || undefined });
      toast.success('Servicio creado correctamente');
      onCreado();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Error al crear servicio'); }
    finally { setCargando(false); }
  };

  const ic = 'w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-xl bg-surface p-6 shadow-xl">
        <h3 className="mb-5 text-lg font-bold text-text">Nuevo Servicio</h3>
        <div className="space-y-4">
          <div><label className="mb-1.5 block text-sm font-semibold text-text">Nombre *</label><input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={200} className={ic} /></div>
          <div><label className="mb-1.5 block text-sm font-semibold text-text">Descripción</label><input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={500} className={ic} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1.5 block text-sm font-semibold text-text">Tipo *</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={ic}><option value="CORRECTIVO">Correctivo</option><option value="PREVENTIVO">Preventivo</option></select>
            </div>
            <div><label className="mb-1.5 block text-sm font-semibold text-text">Precio Base S/ *</label><input value={precio} onChange={(e) => setPrecio(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0.00" inputMode="decimal" className={ic} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SearchSelect label="Categoría" required options={categorias} value={categoriaId} onChange={setCategoriaId} placeholder="Seleccionar..." />
            <SearchSelect label="Especialidad" options={especialidades} value={especialidadId} onChange={setEspecialidadId} placeholder="Opcional" />
          </div>
        </div>
        <div className="mt-5 flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-alt transition-colors">Cancelar</button>
          <button type="submit" disabled={cargando} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50 transition-colors">{cargando ? 'Creando...' : 'Crear Servicio'}</button>
        </div>
      </form>
    </div>
  );
}
