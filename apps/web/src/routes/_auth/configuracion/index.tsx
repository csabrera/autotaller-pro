import { useState, useCallback, useRef } from 'react';
import { Car, Settings2, Building2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CatalogoTabla } from './CatalogoTabla';
import { SistemaTab } from './SistemaTab';

type Tab = 'vehiculares' | 'operativos' | 'sistema';

interface PillConfig {
  key: string;
  label: string;
  catalogo: string;
  camposExtra?: ('pais' | 'marca' | 'sucursal')[];
}

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'vehiculares', label: 'Vehiculares', icon: Car },
  { key: 'operativos', label: 'Operativos', icon: Settings2 },
  { key: 'sistema', label: 'Sistema', icon: Building2 },
];

const PILLS_VEHICULARES: PillConfig[] = [
  { key: 'marcas', label: 'Marcas', catalogo: 'marcas', camposExtra: ['pais'] },
  { key: 'modelos', label: 'Modelos', catalogo: 'modelos', camposExtra: ['marca'] },
  { key: 'tipos-vehiculo', label: 'Tipos Vehículo', catalogo: 'tipos-vehiculo' },
  { key: 'colores', label: 'Colores', catalogo: 'colores' },
  { key: 'combustibles', label: 'Combustibles', catalogo: 'combustibles' },
  { key: 'transmisiones', label: 'Transmisiones', catalogo: 'transmisiones' },
];

const PILLS_OPERATIVOS: PillConfig[] = [
  { key: 'categorias-servicio', label: 'Cat. Servicios', catalogo: 'categorias-servicio' },
  { key: 'especialidades', label: 'Especialidades', catalogo: 'especialidades' },
  { key: 'metodos-pago', label: 'Métodos de Pago', catalogo: 'metodos-pago' },
  { key: 'tipos-doc-fiscal', label: 'Doc. Fiscal', catalogo: 'tipos-doc-fiscal' },
  { key: 'unidades', label: 'Unidades', catalogo: 'unidades' },
  { key: 'motivos-descuento', label: 'Motivos Descuento', catalogo: 'motivos-descuento' },
  { key: 'categorias-repuesto', label: 'Cat. Repuestos', catalogo: 'categorias-repuesto' },
];

export function ConfiguracionPage() {
  const [tabActual, setTabActual] = useState<Tab>('vehiculares');
  const [pillVehicular, setPillVehicular] = useState('marcas');
  const [pillOperativo, setPillOperativo] = useState('categorias-servicio');
  const nuevoFnRef = useRef<(() => void) | null>(null);

  const pillsActuales = tabActual === 'vehiculares' ? PILLS_VEHICULARES : PILLS_OPERATIVOS;
  const pillSeleccionada = tabActual === 'vehiculares' ? pillVehicular : pillOperativo;
  const setPill = tabActual === 'vehiculares' ? setPillVehicular : setPillOperativo;
  const configPill = pillsActuales.find((p) => p.key === pillSeleccionada) ?? pillsActuales[0];

  const esCatalogo = tabActual !== 'sistema';

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text">Configuración del Sistema</h2>
          <p className="text-sm text-text-muted mt-0.5">Administra catálogos maestros y parámetros del sistema</p>
        </div>
        {esCatalogo && (
          <button
            onClick={() => nuevoFnRef.current?.()}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" /> Nuevo Registro
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-0 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTabActual(tab.key)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-colors -mb-px',
              tabActual === tab.key
                ? 'border-b-2 border-primary text-primary'
                : 'text-text-muted hover:text-text-secondary',
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tabActual === 'sistema' ? (
        <SistemaTab />
      ) : (
        <>
          {/* Pills de catálogos */}
          <div className="mb-5 flex flex-wrap gap-2">
            {pillsActuales.map((pill) => (
              <button
                key={pill.key}
                onClick={() => setPill(pill.key)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                  pillSeleccionada === pill.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface text-text-secondary border border-border hover:border-primary hover:text-primary',
                )}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Tabla del catálogo seleccionado */}
          <CatalogoTabla
            key={configPill.catalogo}
            catalogo={configPill.catalogo}
            titulo={configPill.label}
            camposExtra={configPill.camposExtra}
            onNuevoRef={(fn) => { nuevoFnRef.current = fn; }}
          />
        </>
      )}
    </div>
  );
}
