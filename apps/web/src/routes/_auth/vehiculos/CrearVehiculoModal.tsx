import { useState, useEffect } from 'react';
import { X, Car } from 'lucide-react';
import { toast } from 'sonner';
import { crearVehiculoAPI, type ClienteItem } from '@/services/clientes.service';
import { listarCatalogoAPI, type CatalogoItem } from '@/services/catalogos.service';
import { SearchSelect } from '@/components/forms/SearchSelect';

// Placa Perú: ABC-123 (actual) o AB-1234 (antiguo)
const PLACA_REGEX = /^[A-Z]{2,3}-?\d{3,4}$/;
function validarPlacaPeru(placa: string): boolean {
  const limpia = placa.replace(/-/g, '');
  if (limpia.length < 6 || limpia.length > 7) return false;
  return PLACA_REGEX.test(placa);
}

function formatearPlaca(valor: string): string {
  const limpio = valor.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (limpio.length <= 3) return limpio;
  const letras = limpio.match(/^[A-Z]+/)?.[0] || '';
  const numeros = limpio.slice(letras.length);
  if (letras.length >= 2 && numeros.length > 0) {
    return `${letras}-${numeros}`.slice(0, 8);
  }
  return limpio.slice(0, 7);
}

interface Props {
  cliente: ClienteItem;
  onClose: () => void;
  onCreated: () => void;
}

interface Errores {
  placa?: string;
  marcaId?: string;
  modeloId?: string;
  anio?: string;
  colorId?: string;
  combustibleId?: string;
  kilometraje?: string;
}

export function CrearVehiculoModal({ cliente, onClose, onCreated }: Props) {
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState<Errores>({});
  const [intentoEnvio, setIntentoEnvio] = useState(false);

  const [marcas, setMarcas] = useState<CatalogoItem[]>([]);
  const [modelos, setModelos] = useState<CatalogoItem[]>([]);
  const [todosModelos, setTodosModelos] = useState<CatalogoItem[]>([]);
  const [colores, setColores] = useState<CatalogoItem[]>([]);
  const [combustibles, setCombustibles] = useState<CatalogoItem[]>([]);
  const [transmisiones, setTransmisiones] = useState<CatalogoItem[]>([]);
  const [tiposVehiculo, setTiposVehiculo] = useState<CatalogoItem[]>([]);

  const [marcaId, setMarcaId] = useState('');
  const [modeloId, setModeloId] = useState('');
  const [placa, setPlaca] = useState('');
  const [anio, setAnio] = useState('');
  const [colorId, setColorId] = useState('');
  const [combustibleId, setCombustibleId] = useState('');
  const [transmisionId, setTransmisionId] = useState('');
  const [tipoVehiculoId, setTipoVehiculoId] = useState('');
  const [kilometraje, setKilometraje] = useState('');
  const [vin, setVin] = useState('');

  useEffect(() => {
    Promise.all([
      listarCatalogoAPI('marcas', { activo: 'true' }),
      listarCatalogoAPI('modelos', { activo: 'true' }),
      listarCatalogoAPI('colores', { activo: 'true' }),
      listarCatalogoAPI('combustibles', { activo: 'true' }),
      listarCatalogoAPI('transmisiones', { activo: 'true' }),
      listarCatalogoAPI('tipos-vehiculo', { activo: 'true' }),
    ]).then(([m, mod, col, comb, trans, tipos]) => {
      setMarcas(m);
      setTodosModelos(mod);
      setColores(col);
      setCombustibles(comb);
      setTransmisiones(trans);
      setTiposVehiculo(tipos);
    });
  }, []);

  useEffect(() => {
    if (marcaId) {
      setModelos(todosModelos.filter((m) => m.marcaId === marcaId));
      setModeloId('');
    } else {
      setModelos([]);
      setModeloId('');
    }
  }, [marcaId, todosModelos]);

  useEffect(() => {
    if (intentoEnvio) validar();
  }, [placa, marcaId, modeloId, anio, colorId, combustibleId, kilometraje, intentoEnvio]);

  function validar(): boolean {
    const e: Errores = {};

    if (!placa) e.placa = 'La placa es requerida';
    else if (!validarPlacaPeru(placa)) e.placa = 'Formato inválido. Ej: ABC-123 o AB-1234';

    if (!marcaId) e.marcaId = 'Seleccione una marca';
    if (!modeloId) e.modeloId = 'Seleccione un modelo';

    if (!anio) e.anio = 'El año es requerido';
    else {
      const n = Number(anio);
      if (n < 1950 || n > new Date().getFullYear() + 1) e.anio = `Año entre 1950 y ${new Date().getFullYear() + 1}`;
    }

    if (!colorId) e.colorId = 'Seleccione un color';
    if (!combustibleId) e.combustibleId = 'Seleccione el combustible';

    if (!kilometraje || Number(kilometraje) < 0) (e as any).kilometraje = 'El kilometraje es requerido';

    setErrores(e);
    return Object.keys(e).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIntentoEnvio(true);
    if (!validar()) return;

    setCargando(true);
    try {
      await crearVehiculoAPI({
        clienteId: cliente.id,
        marcaId,
        modeloId,
        anio: Number(anio),
        placa,
        vin: vin || undefined,
        colorId,
        combustibleId,
        transmisionId: transmisionId || undefined,
        tipoVehiculoId: tipoVehiculoId || undefined,
        kilometrajeActual: Number(kilometraje) || 0,
      });
      toast.success(`Vehículo ${placa} registrado correctamente`);
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ocurrió un error al registrar el vehículo');
    } finally {
      setCargando(false);
    }
  };

  const inputClass = (error?: string) =>
    `w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-primary/20 ${
      error ? 'border-error focus:border-error' : 'border-border focus:border-primary'
    }`;

  const toOptions = (items: CatalogoItem[]) => items.map((i) => ({ value: i.id, label: i.nombre }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-surface p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text">Registrar Nuevo Vehículo</h3>
            <p className="text-xs text-text-muted">Cliente: {cliente.nombreCompleto} ({cliente.tipoDocumento}: {cliente.numeroDocumento})</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Placa + VIN */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Placa *</label>
              <input
                value={placa}
                onChange={(e) => setPlaca(formatearPlaca(e.target.value))}
                placeholder="ABC-123"
                maxLength={8}
                className={inputClass(errores.placa)}
              />
              {errores.placa && <p className="mt-1 text-xs text-error">{errores.placa}</p>}
              <p className="mt-0.5 text-[10px] text-text-muted">Formato: ABC-123 (actual) o AB-1234 (antiguo)</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">N° Serie / VIN (opcional)</label>
              <input
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 17))}
                placeholder="17 caracteres alfanuméricos"
                maxLength={17}
                className={inputClass()}
              />
              <p className="mt-0.5 text-[10px] text-text-muted">Número de identificación vehicular</p>
            </div>
          </div>

          {/* Marca + Modelo + Año */}
          <div className="grid grid-cols-3 gap-3">
            <SearchSelect
              label="Marca"
              required
              options={toOptions(marcas)}
              value={marcaId}
              onChange={setMarcaId}
              placeholder="Buscar marca..."
              error={errores.marcaId}
            />
            <SearchSelect
              label="Modelo"
              required
              options={toOptions(modelos)}
              value={modeloId}
              onChange={setModeloId}
              placeholder={marcaId ? 'Buscar modelo...' : 'Elija marca primero'}
              disabled={!marcaId}
              error={errores.modeloId}
            />
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Año *</label>
              <input
                value={anio}
                onChange={(e) => setAnio(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder={String(new Date().getFullYear())}
                maxLength={4}
                inputMode="numeric"
                className={inputClass(errores.anio)}
              />
              {errores.anio && <p className="mt-1 text-xs text-error">{errores.anio}</p>}
            </div>
          </div>

          {/* Color + Combustible */}
          <div className="grid grid-cols-2 gap-3">
            <SearchSelect
              label="Color"
              required
              options={toOptions(colores)}
              value={colorId}
              onChange={setColorId}
              placeholder="Buscar color..."
              error={errores.colorId}
            />
            <SearchSelect
              label="Combustible"
              required
              options={toOptions(combustibles)}
              value={combustibleId}
              onChange={setCombustibleId}
              placeholder="Buscar combustible..."
              error={errores.combustibleId}
            />
          </div>

          {/* Transmisión + Tipo vehículo */}
          <div className="grid grid-cols-2 gap-3">
            <SearchSelect
              label="Transmisión"
              options={toOptions(transmisiones)}
              value={transmisionId}
              onChange={setTransmisionId}
              placeholder="Opcional"
            />
            <SearchSelect
              label="Tipo de vehículo"
              options={toOptions(tiposVehiculo)}
              value={tipoVehiculoId}
              onChange={setTipoVehiculoId}
              placeholder="Opcional"
            />
          </div>

          {/* Kilometraje */}
          <div className="max-w-[220px]">
            <label className="mb-1 block text-xs font-medium text-text-secondary">Kilometraje actual *</label>
            <input
              value={kilometraje}
              onChange={(e) => setKilometraje(e.target.value.replace(/\D/g, ''))}
              placeholder="Ej: 45000"
              inputMode="numeric"
              className={inputClass(errores.kilometraje)}
            />
            {errores.kilometraje && <p className="mt-1 text-xs text-error">{errores.kilometraje}</p>}
          </div>

          {/* Botones */}
          <div className="flex gap-3 justify-end pt-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-alt">Cancelar</button>
            <button type="submit" disabled={cargando} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50">
              {cargando ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Car className="h-4 w-4" />}
              {cargando ? 'Registrando...' : 'Registrar Vehículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
