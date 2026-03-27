import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Pencil, Pause, Play, Database, ListFilter, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { listarCatalogoAPI, toggleActivoCatalogoAPI, type CatalogoItem } from '@/services/catalogos.service';
import { CatalogoModal } from './CatalogoModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

interface Props {
  catalogo: string;
  titulo: string;
  camposExtra?: ('pais' | 'marca' | 'sucursal')[];
  onNuevoRef?: (fn: () => void) => void;
}

export function CatalogoTabla({ catalogo, titulo, camposExtra = [], onNuevoRef }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroActivo, setFiltroActivo] = useState<string>('');
  const [pagina, setPagina] = useState(1);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<CatalogoItem | null>(null);
  const [confirmando, setConfirmando] = useState<CatalogoItem | null>(null);
  const porPagina = 10;
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['catalogo', catalogo, filtroActivo, busqueda],
    queryFn: () => listarCatalogoAPI(catalogo, {
      activo: filtroActivo || undefined,
      busqueda: busqueda || undefined,
    }),
  });

  const toggleActivo = useMutation({
    mutationFn: (id: string) => toggleActivoCatalogoAPI(catalogo, id),
    onSuccess: (result) => {
      toast.success(result.activo ? 'Registro activado correctamente' : 'Registro deshabilitado correctamente');
      queryClient.invalidateQueries({ queryKey: ['catalogo', catalogo] });
      setConfirmando(null);
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setConfirmando(null);
    },
  });

  // Exponer función "nuevo" al padre para el botón del header
  if (onNuevoRef) onNuevoRef(() => { setEditando(null); setModalAbierto(true); });

  const colCount = 5 + camposExtra.length;
  const totalPaginas = Math.ceil(items.length / porPagina);
  const itemsPaginados = useMemo(() => {
    const inicio = (pagina - 1) * porPagina;
    return items.slice(inicio, inicio + porPagina);
  }, [items, pagina]);

  return (
    <div>
      {/* Filtros + Búsqueda */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {([
            { key: '', label: 'Todos', icon: ListFilter },
            { key: 'true', label: 'Activos', icon: CheckCircle },
            { key: 'false', label: 'Inactivos', icon: XCircle },
          ]).map((f) => (
            <button
              key={f.key}
              onClick={() => { setFiltroActivo(f.key); setPagina(1); }}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                filtroActivo === f.key
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
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
            placeholder={`Buscar ${titulo.toLowerCase()}...`}
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
                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Nombre</th>
                {camposExtra.includes('pais') && <th className="px-5 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">País</th>}
                {camposExtra.includes('marca') && <th className="px-5 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Marca</th>}
                {camposExtra.includes('sucursal') && <th className="px-5 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Sucursal</th>}
                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Descripción</th>
                <th className="px-5 py-3 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Estado</th>
                <th className="px-5 py-3 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={colCount} className="py-16 text-center"><div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></td></tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="py-16 text-center">
                    <Database className="mx-auto h-8 w-8 text-text-muted mb-2" />
                    <p className="text-sm font-medium text-text-secondary">No se encontraron registros</p>
                    <p className="text-xs text-text-muted mt-1">Cree un nuevo registro para comenzar</p>
                  </td>
                </tr>
              ) : (
                itemsPaginados.map((item, idx) => (
                  <tr key={item.id} className={cn(
                    'border-b border-border-light hover:bg-hover transition-colors',
                    !item.activo && 'opacity-50',
                  )}>
                    <td className="px-5 py-3 text-center text-xs font-medium text-text-muted">{(pagina - 1) * porPagina + idx + 1}</td>
                    <td className="px-5 py-3 font-semibold text-text text-sm">{item.nombre}</td>
                    {camposExtra.includes('pais') && <td className="px-5 py-3 text-sm text-text-secondary">{item.pais || '—'}</td>}
                    {camposExtra.includes('marca') && <td className="px-5 py-3 text-sm text-text-secondary">{item.marca?.nombre || '—'}</td>}
                    {camposExtra.includes('sucursal') && <td className="px-5 py-3 text-sm text-text-secondary">{item.sucursal?.nombre || '—'}</td>}
                    <td className="px-5 py-3 text-xs text-text-muted">{item.descripcion || '—'}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={cn(
                        'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                        item.activo ? 'bg-success/10 text-success' : 'bg-error/10 text-error',
                      )}>
                        {item.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => { setEditando(item); setModalAbierto(true); }}
                          className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-info hover:bg-info/10 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="hidden lg:inline">Editar</span>
                        </button>
                        <button
                          onClick={() => setConfirmando(item)}
                          className={cn(
                            'flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                            item.activo ? 'text-warning hover:bg-warning/10' : 'text-success hover:bg-success/10',
                          )}
                        >
                          {item.activo ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                          <span className="hidden lg:inline">{item.activo ? 'Deshab.' : 'Activar'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-between border-t border-border bg-surface-alt/30 px-5 py-3">
          <p className="text-xs text-text-muted">
            Mostrando <span className="font-semibold text-text-secondary">{items.length > 0 ? (pagina - 1) * porPagina + 1 : 0}</span> a <span className="font-semibold text-text-secondary">{Math.min(pagina * porPagina, items.length)}</span> de <span className="font-semibold text-text">{items.length}</span> registros
          </p>
          {totalPaginas > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagina(Math.max(1, pagina - 1))}
                disabled={pagina === 1}
                className="flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-medium text-text-secondary hover:bg-surface-alt disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Anterior
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPagina(p)}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors',
                    p === pagina ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-surface-alt',
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPagina(Math.min(totalPaginas, pagina + 1))}
                disabled={pagina === totalPaginas}
                className="flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-medium text-text-secondary hover:bg-surface-alt disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {modalAbierto && (
        <CatalogoModal
          catalogo={catalogo}
          titulo={titulo}
          editando={editando}
          camposExtra={camposExtra}
          onClose={() => { setModalAbierto(false); setEditando(null); }}
          onSaved={() => {
            setModalAbierto(false);
            setEditando(null);
            queryClient.invalidateQueries({ queryKey: ['catalogo', catalogo] });
          }}
        />
      )}

      {confirmando && (
        <ConfirmDialog
          titulo={`¿${confirmando.activo ? 'Deshabilitar' : 'Activar'} "${confirmando.nombre}"?`}
          mensaje={
            confirmando.activo
              ? 'Este registro no aparecerá en los selectores del sistema, pero se mantendrá en el historial.'
              : 'Este registro volverá a estar disponible en los selectores del sistema.'
          }
          textoConfirmar={confirmando.activo ? 'Deshabilitar' : 'Activar'}
          variante={confirmando.activo ? 'warning' : 'warning'}
          cargando={toggleActivo.isPending}
          onConfirm={() => toggleActivo.mutate(confirmando.id)}
          onCancel={() => setConfirmando(null)}
        />
      )}
    </div>
  );
}
