import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { crearCatalogoItemAPI, actualizarCatalogoItemAPI, type CatalogoItem } from '@/services/catalogos.service';
import { listarCatalogoAPI } from '@/services/catalogos.service';
import { listarSucursalesAPI } from '@/services/usuarios.service';

interface Props {
  catalogo: string;
  titulo: string;
  editando: CatalogoItem | null;
  camposExtra?: ('pais' | 'marca' | 'sucursal')[];
  onClose: () => void;
  onSaved: () => void;
}

export function CatalogoModal({ catalogo, titulo, editando, camposExtra = [], onClose, onSaved }: Props) {
  const [cargando, setCargando] = useState(false);
  const [nombre, setNombre] = useState(editando?.nombre || '');
  const [descripcion, setDescripcion] = useState(editando?.descripcion || '');
  const [pais, setPais] = useState(editando?.pais || '');
  const [marcaId, setMarcaId] = useState(editando?.marcaId || '');
  const [sucursalId, setSucursalId] = useState(editando?.sucursalId || '');
  const [marcas, setMarcas] = useState<CatalogoItem[]>([]);
  const [sucursales, setSucursales] = useState<{ id: string; nombre: string }[]>([]);

  useEffect(() => {
    if (camposExtra.includes('marca')) {
      listarCatalogoAPI('marcas', { activo: 'true' }).then(setMarcas);
    }
    if (camposExtra.includes('sucursal')) {
      listarSucursalesAPI().then(setSucursales);
    }
  }, [camposExtra]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    setCargando(true);
    try {
      const data: Record<string, unknown> = { nombre: nombre.trim().toUpperCase(), descripcion: descripcion.trim() || null };
      if (camposExtra.includes('pais')) data.pais = pais.trim() || null;
      if (camposExtra.includes('marca')) data.marcaId = marcaId;
      if (camposExtra.includes('sucursal')) data.sucursalId = sucursalId;

      if (editando) {
        await actualizarCatalogoItemAPI(catalogo, editando.id, data);
        toast.success('Registro actualizado correctamente');
      } else {
        await crearCatalogoItemAPI(catalogo, data);
        toast.success('Registro creado correctamente');
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ocurrió un error al guardar');
    } finally {
      setCargando(false);
    }
  };

  const inputClass = 'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4">
      <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text">
            {editando ? 'Editar' : 'Nuevo'} {titulo}
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Nombre *</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value.toUpperCase())}
              placeholder="Nombre del registro"
              maxLength={100}
              autoFocus
              className={inputClass}
            />
          </div>

          {camposExtra.includes('pais') && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">País de origen</label>
              <input value={pais} onChange={(e) => setPais(e.target.value)} placeholder="Ej: Japón" maxLength={100} className={inputClass} />
            </div>
          )}

          {camposExtra.includes('marca') && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Marca *</label>
              <select value={marcaId} onChange={(e) => setMarcaId(e.target.value)} className={inputClass}>
                <option value="">Seleccionar marca</option>
                {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
          )}

          {camposExtra.includes('sucursal') && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Sucursal *</label>
              <select value={sucursalId} onChange={(e) => setSucursalId(e.target.value)} className={inputClass}>
                <option value="">Seleccionar sucursal</option>
                {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Descripción (opcional)</label>
            <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción breve" maxLength={255} className={inputClass} />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-alt transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {cargando ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
              {cargando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
