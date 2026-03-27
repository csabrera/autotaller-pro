import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, Wrench, Plus, Check, Lock, User, Car, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { buscarClienteRapidoAPI, type ClienteItem, type VehiculoItem } from '@/services/clientes.service';
import { DateTimePicker } from '@/components/forms/DateTimePicker';
import { crearOrdenAPI } from '@/services/ordenes.service';
import { listarSucursalesAPI } from '@/services/usuarios.service';
import { useAuthStore } from '@/stores/auth.store';
import { CrearClienteModal } from '@/routes/_auth/vehiculos/CrearClienteModal';
import { CrearVehiculoModal } from '@/routes/_auth/vehiculos/CrearVehiculoModal';

const CHECKLIST_ITEMS = [
  'Nivel de combustible',
  'Herramientas del vehículo',
  'Llanta de repuesto',
  'Rayones / golpes existentes',
  'Radio / accesorios',
  'Documentos del vehículo',
  'Objetos personales en el vehículo',
];

export function CrearOTPage() {
  const navigate = useNavigate();
  const usuario = useAuthStore((s) => s.usuario);
  const queryClient = useQueryClient();

  // Búsqueda cliente
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [resultadosCliente, setResultadosCliente] = useState<ClienteItem[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteItem | null>(null);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<VehiculoItem | null>(null);

  // Modales
  const [modalCliente, setModalCliente] = useState(false);
  const [modalVehiculo, setModalVehiculo] = useState(false);

  // Datos OT
  const [kilometraje, setKilometraje] = useState('');
  const [notasCliente, setNotasCliente] = useState('');
  const [sucursalId] = useState(usuario?.sucursalId || '');
  const [fechaEstimada, setFechaEstimada] = useState<Date | null>(null);

  // Checklist
  const [checklist, setChecklist] = useState(
    CHECKLIST_ITEMS.map((item) => ({ item, marcado: false, notas: '' }))
  );

  const [cargando, setCargando] = useState(false);
  const [sucursalNombre, setSucursalNombre] = useState('');

  // Paso completado
  const paso1Completo = !!clienteSeleccionado && !!vehiculoSeleccionado;

  useEffect(() => {
    listarSucursalesAPI().then((suc) => {
      const miSucursal = suc.find((s) => s.id === sucursalId);
      if (miSucursal) setSucursalNombre(miSucursal.nombre);
    });
  }, [sucursalId]);

  // Buscar cliente con debounce
  useEffect(() => {
    if (busquedaCliente.length < 2) { setResultadosCliente([]); return; }
    const timer = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await buscarClienteRapidoAPI(busquedaCliente);
        setResultadosCliente(res);
      } catch { setResultadosCliente([]); }
      setBuscando(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [busquedaCliente]);

  const seleccionarCliente = (cliente: ClienteItem) => {
    setClienteSeleccionado(cliente);
    setVehiculoSeleccionado(null);
    setKilometraje('');
    setResultadosCliente([]);
    setBusquedaCliente('');
  };

  const toggleChecklist = (index: number) => {
    setChecklist((prev) => prev.map((c, i) =>
      i === index ? { ...c, marcado: !c.marcado, notas: !c.marcado ? c.notas : '' } : c
    ));
  };

  const updateChecklistNotas = (index: number, notas: string) => {
    setChecklist((prev) => prev.map((c, i) => i === index ? { ...c, notas } : c));
  };

  const handleCrear = async () => {
    if (!clienteSeleccionado) { toast.error('Seleccione un cliente'); return; }
    if (!vehiculoSeleccionado) { toast.error('Seleccione un vehículo'); return; }
    if (!kilometraje) { toast.error('Ingrese el kilometraje de entrada'); return; }

    setCargando(true);
    try {
      const orden = await crearOrdenAPI({
        vehiculoId: vehiculoSeleccionado.id,
        clienteId: clienteSeleccionado.id,
        sucursalId,
        kilometrajeEntrada: Number(kilometraje),
        fechaEstimada: fechaEstimada?.toISOString() || undefined,
        notasCliente: notasCliente || undefined,
        checklist: checklist.filter((c) => c.marcado),
      });
      toast.success(`Orden ${orden.numeroOrden} creada exitosamente`);
      queryClient.invalidateQueries({ queryKey: ['ordenes'] });
      navigate(`/ordenes-trabajo/${orden.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ocurrió un error al crear la orden');
    } finally {
      setCargando(false);
    }
  };

  const inputClass = 'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';
  const nombreCliente = (c: ClienteItem) => c.tipoCliente === 'PERSONA' ? `${c.nombres} ${c.apellidoPaterno} ${c.apellidoMaterno}` : c.razonSocial;

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/ordenes-trabajo')} className="rounded-lg border border-border p-2 hover:bg-surface-alt">
            <ArrowLeft className="h-4 w-4 text-text-secondary" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-text">Nueva Orden de Trabajo</h2>
            <p className="text-xs text-text-muted">Complete los pasos para registrar la orden</p>
          </div>
        </div>
        {sucursalNombre && (
          <span className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary border border-primary/20">
            {sucursalNombre}
          </span>
        )}
      </div>

      {/* Stepper visual */}
      <div className="mb-6 flex items-center gap-4">
        <div className={cn('flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors', paso1Completo ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary')}>
          {paso1Completo ? <Check className="h-4 w-4" /> : <User className="h-4 w-4" />}
          Paso 1: Cliente y Vehículo
        </div>
        <div className="h-px flex-1 bg-surface-alt" />
        <div className={cn('flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors', paso1Completo ? 'bg-primary/10 text-primary' : 'bg-surface-alt text-text-muted')}>
          {paso1Completo ? <ClipboardList className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          Paso 2: Datos y Checklist
        </div>
      </div>

      {/* ====== PASO 1: Cliente + Vehículo ====== */}
      <div className={cn(!paso1Completo ? '' : 'mb-6')}>
        {!clienteSeleccionado ? (
          /* Buscar cliente */
          <div className="rounded-xl bg-surface p-6 shadow-sm max-w-2xl">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-text">
              <User className="h-5 w-5 text-primary" />
              Buscar Cliente
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
                placeholder="Buscar por DNI, nombre, teléfono o placa..."
                autoFocus
                className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {buscando && <p className="mt-3 text-xs text-text-muted">Buscando...</p>}

            {resultadosCliente.length > 0 && (
              <div className="mt-3 max-h-60 overflow-y-auto rounded-lg border border-border">
                {resultadosCliente.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => seleccionarCliente(c)}
                    className="flex w-full items-center gap-3 border-b border-border-light px-4 py-3 text-left hover:bg-primary/5 last:border-0"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {c.tipoCliente === 'PERSONA' ? `${c.nombres?.[0] || ''}${c.apellidoPaterno?.[0] || ''}` : (c.razonSocial?.[0] || 'E')}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text">{nombreCliente(c)}</p>
                      <p className="text-xs text-text-muted">{c.tipoDocumento}: {c.numeroDocumento} | Tel: {c.telefono} | {c.vehiculos.length} vehículo(s)</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {busquedaCliente.length >= 2 && !buscando && resultadosCliente.length === 0 && (
              <div className="mt-4 rounded-lg border border-dashed border-border p-6 text-center">
                <p className="mb-3 text-sm text-text-muted">No se encontró ningún cliente</p>
                <button onClick={() => setModalCliente(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover">
                  <Plus className="mr-1 inline h-4 w-4" /> Registrar nuevo cliente
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Cliente seleccionado */}
            <div className="rounded-xl border-2 border-success/30 bg-success/5 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
                  <Check className="h-3.5 w-3.5" /> CLIENTE SELECCIONADO
                </span>
                <button onClick={() => { setClienteSeleccionado(null); setVehiculoSeleccionado(null); setKilometraje(''); }} className="text-xs text-primary hover:underline">Cambiar</button>
              </div>
              <p className="font-semibold text-text">{nombreCliente(clienteSeleccionado)}</p>
              <p className="text-xs text-text-muted">{clienteSeleccionado.tipoDocumento}: {clienteSeleccionado.numeroDocumento} | Tel: {clienteSeleccionado.telefono}</p>
            </div>

            {/* Vehículos del cliente */}
            <div className="rounded-xl bg-surface p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-text">
                  <Car className="h-4 w-4 text-primary" /> Seleccionar Vehículo
                </h3>
                <button onClick={() => setModalVehiculo(true)} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover">
                  <Plus className="h-3 w-3" /> Nuevo
                </button>
              </div>

              {clienteSeleccionado.vehiculos.length === 0 ? (
                <p className="py-4 text-center text-sm text-text-muted">No tiene vehículos registrados</p>
              ) : (
                <div className="space-y-2">
                  {clienteSeleccionado.vehiculos.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => { setVehiculoSeleccionado(v); setKilometraje(String(v.kilometrajeActual || 0)); }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                        vehiculoSeleccionado?.id === v.id ? 'border-primary bg-primary/5' : 'border-border hover:border-border',
                      )}
                    >
                      <Car className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-text">{v.placa}</p>
                        <p className="text-xs text-text-muted">{v.marca?.nombre || ''} {v.modelo?.nombre || ''} {v.anio} | {v.color?.nombre || ''} | KM: {(v.kilometrajeActual || 0).toLocaleString()}</p>
                      </div>
                      {vehiculoSeleccionado?.id === v.id && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white"><Check className="h-3.5 w-3.5" /></div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ====== PASO 2: Datos OT + Checklist (bloqueado hasta paso 1) ====== */}
      {!paso1Completo ? (
        <div className="mt-6 rounded-xl border-2 border-dashed border-border bg-surface-alt/50 p-8 text-center">
          <Lock className="mx-auto mb-3 h-8 w-8 text-text-muted" />
          <p className="text-sm font-medium text-text-muted">Datos de la Orden y Checklist</p>
          <p className="mt-1 text-xs text-text-muted">Seleccione un cliente y un vehículo para continuar</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Datos de la orden */}
          <div className="rounded-xl bg-surface p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-text">
              <ClipboardList className="h-5 w-5 text-primary" />
              Datos de la Orden
            </h3>
            <div className="space-y-3">
              {/* Vehículo seleccionado - resumen */}
              <div className="rounded-lg bg-surface-alt p-3 text-xs text-text-secondary">
                <span className="font-semibold text-text">{vehiculoSeleccionado?.placa}</span> — {vehiculoSeleccionado?.marca?.nombre} {vehiculoSeleccionado?.modelo?.nombre} {vehiculoSeleccionado?.anio}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Kilometraje de entrada *</label>
                <input value={kilometraje} onChange={(e) => setKilometraje(e.target.value.replace(/\D/g, ''))} placeholder="Ej: 45000" inputMode="numeric" className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Motivo de ingreso / Queja del cliente</label>
                <textarea value={notasCliente} onChange={(e) => setNotasCliente(e.target.value)} placeholder="Describa el problema o motivo de ingreso..." rows={3} maxLength={500} className={inputClass} />
              </div>
              <DateTimePicker
                label="Fecha y hora estimada de entrega"
                value={fechaEstimada}
                onChange={setFechaEstimada}
                showTime
                placeholder="Seleccionar fecha y hora"
                minDate={new Date()}
              />
            </div>
          </div>

          {/* Checklist */}
          <div className="rounded-xl bg-surface p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-text">
              <Check className="h-5 w-5 text-primary" />
              Checklist de Recepción
            </h3>
            <div className="space-y-2">
              {checklist.map((item, i) => (
                <div
                  key={i}
                  className={cn(
                    'rounded-lg border p-3 transition-all',
                    item.marcado ? 'border-primary/20 bg-primary/5' : 'border-border-light',
                  )}
                >
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={item.marcado}
                      onChange={() => toggleChecklist(i)}
                      className="h-4 w-4 rounded border-border text-primary accent-primary"
                    />
                    <span className={cn('text-sm', item.marcado ? 'font-medium text-text' : 'text-text-secondary')}>
                      {item.item}
                    </span>
                  </label>
                  {item.marcado && (
                    <div className="mt-2 ml-7">
                      <input
                        value={item.notas}
                        onChange={(e) => updateChecklistNotas(i, e.target.value)}
                        placeholder="Agregar observación..."
                        maxLength={200}
                        className="w-full rounded-md border border-dashed border-primary/30 bg-surface px-3 py-1.5 text-xs outline-none placeholder-text-muted focus:border-primary"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Botón crear */}
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={() => navigate('/ordenes-trabajo')} className="rounded-lg border border-border px-5 py-2.5 text-sm text-text-secondary hover:bg-surface-alt">Cancelar</button>
        <button
          onClick={handleCrear}
          disabled={cargando || !paso1Completo || !kilometraje}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {cargando ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Wrench className="h-4 w-4" />}
          {cargando ? 'Creando...' : 'Crear Orden de Trabajo'}
        </button>
      </div>

      {/* Modales */}
      {modalCliente && (
        <CrearClienteModal
          onClose={() => setModalCliente(false)}
          onCreated={(cliente) => { setModalCliente(false); seleccionarCliente(cliente); }}
        />
      )}
      {modalVehiculo && clienteSeleccionado && (
        <CrearVehiculoModal
          cliente={clienteSeleccionado}
          onClose={() => setModalVehiculo(false)}
          onCreated={() => {
            setModalVehiculo(false);
            buscarClienteRapidoAPI(clienteSeleccionado.numeroDocumento).then((res) => {
              const actualizado = res.find((c) => c.id === clienteSeleccionado.id);
              if (actualizado) setClienteSeleccionado(actualizado);
            });
          }}
        />
      )}
    </div>
  );
}
