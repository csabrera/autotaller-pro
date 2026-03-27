import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, Save, Palette, Moon, Sun, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { useThemeStore, TEMAS_DISPONIBLES } from '@/stores/theme.store';

type SubTab = 'apariencia';

const TEMAS_INFO = [
  { key: 'naranja', label: 'Naranja Automotriz', descripcion: 'Por defecto' },
  { key: 'azul', label: 'Azul Profesional', descripcion: 'Clásico SaaS' },
  { key: 'navy', label: 'Azul Navy', descripcion: 'Corporativo' },
  { key: 'esmeralda', label: 'Verde Esmeralda', descripcion: 'Moderno' },
];

export function SistemaTab() {
  const [subTab, setSubTab] = useState<SubTab>('apariencia');

  return (
    <div>
      {/* Pills */}
      <div className="mb-5 flex flex-wrap gap-2">
        {[
          { key: 'apariencia' as SubTab, label: 'Apariencia', icon: Palette },
        ].map((pill) => (
          <button
            key={pill.key}
            onClick={() => setSubTab(pill.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              subTab === pill.key
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface text-text-secondary border border-border hover:border-primary hover:text-primary',
            )}
          >
            <pill.icon className="h-3.5 w-3.5" />
            {pill.label}
          </button>
        ))}
      </div>

      {subTab === 'apariencia' && <AparienciaSection />}
    </div>
  );
}

function AparienciaSection() {
  const { temaActual, setTema, modoOscuro, toggleModoOscuro } = useThemeStore();
  const [seleccionado, setSeleccionado] = useState(temaActual);

  const handleGuardar = () => {
    setTema(seleccionado);
    toast.success('Tema actualizado correctamente');
  };

  return (
    <div className="space-y-5">
      {/* Modo oscuro */}
      <div className="rounded-xl bg-surface border border-border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {modoOscuro ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
            <div>
              <h3 className="text-sm font-bold text-text">Modo de visualización</h3>
              <p className="text-xs text-text-muted mt-0.5">Cambia entre modo claro y oscuro</p>
            </div>
          </div>
          <button
            onClick={toggleModoOscuro}
            className={cn(
              'relative h-7 w-12 rounded-full transition-colors',
              modoOscuro ? 'bg-primary' : 'bg-border',
            )}
          >
            <span className={cn(
              'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform flex items-center justify-center',
              modoOscuro ? 'translate-x-5' : 'translate-x-0.5',
            )}>
              {modoOscuro ? <Moon className="h-3 w-3 text-primary" /> : <Sun className="h-3 w-3 text-text-muted" />}
            </span>
          </button>
        </div>
      </div>

      {/* Color del sistema */}
      <div className="rounded-xl bg-surface border border-border p-6">
        <div className="flex items-center gap-3 mb-5">
          <Palette className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-sm font-bold text-text">Color del Sistema</h3>
            <p className="text-xs text-text-muted mt-0.5">Selecciona el color primario que se aplicará en todo el sistema</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {TEMAS_INFO.map((tema) => {
            const colores = TEMAS_DISPONIBLES[tema.key];
            const activo = seleccionado === tema.key;

            return (
              <button
                key={tema.key}
                onClick={() => setSeleccionado(tema.key)}
                className={cn(
                  'relative rounded-xl border-2 p-4 text-left transition-all hover:shadow-md',
                  activo ? 'shadow-md' : 'border-border hover:border-border',
                )}
                style={activo ? { borderColor: colores.primary } : undefined}
              >
                {activo && (
                  <div
                    className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: colores.primary }}
                  >
                    <Check className="h-3 w-3" />
                  </div>
                )}

                {/* Color bars */}
                <div className="mb-3 flex gap-1 overflow-hidden rounded-md">
                  <div className="h-8 flex-1 rounded-l-md" style={{ backgroundColor: colores.primary }} />
                  <div className="h-8 flex-1" style={{ backgroundColor: colores.primaryHover }} />
                  <div className="h-8 flex-1 rounded-r-md" style={{ backgroundColor: colores.sidebar }} />
                </div>

                <p className="text-sm font-semibold text-text">{tema.label}</p>
                <p className="text-xs text-text-muted">{tema.descripcion}</p>

                {/* Mini preview */}
                <div className="mt-3 overflow-hidden rounded-md border border-border-light">
                  <div className="h-1" style={{ backgroundColor: colores.primary }} />
                  <div className="flex h-8">
                    <div className="w-5" style={{ backgroundColor: colores.sidebar }} />
                    <div className="flex-1 bg-surface-alt p-1">
                      <div className="mb-1 h-1 w-3/4 rounded bg-border" />
                      <div className="flex gap-1">
                        <div className="h-2 flex-1 rounded bg-surface" style={{ borderLeft: `2px solid ${colores.primary}` }} />
                        <div className="h-2 flex-1 rounded bg-surface" style={{ borderLeft: '2px solid #f59e0b' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleGuardar}
            disabled={seleccionado === temaActual}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors"
          >
            <Save className="h-4 w-4" />
            Guardar Tema
          </button>
        </div>
      </div>
    </div>
  );
}
