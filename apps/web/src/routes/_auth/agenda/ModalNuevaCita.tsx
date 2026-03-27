import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { SearchSelect } from '@/components/forms/SearchSelect';
import { CitaDateTimePicker } from '@/components/forms/CitaDateTimePicker';
import { crearCitaAPI, actualizarCitaAPI, verificarDisponibilidadAPI, type CitaItem } from '@/services/agenda.service';
import { listarClientesAPI, listarVehiculosClienteAPI } from '@/services/clientes.service';
import { listarUsuariosAPI } from '@/services/usuarios.service';
import { listarServiciosActivosAPI } from '@/services/servicios.service';
import { cn } from '@/lib/utils';

const DURACIONES = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hora' },
  { value: '90', label: '1h 30min' },
  { value: '120', label: '2 horas' },
  { value: '180', label: '3 horas' },
  { value: '240', label: '4 horas' },
];

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  citaEditar?: CitaItem | null;
}

export function ModalNuevaCita({ abierto, onCerrar, citaEditar }: Props) {
  const queryClient = useQueryClient();
  const esEdicion = !!citaEditar;

  const [clienteId, setClienteId] = useState('');
  const [vehiculoId, setVehiculoId] = useState('');
  const [servicioId, setServicioId] = useState('');
  const [mecanicoId, setMecanicoId] = useState('');
  const [fechaHora, setFechaHora] = useState<Date | null>(null);
  const [duracion, setDuracion] = useState('60');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [conflictos, setConflictos] = useState<string[]>([]);

  // Cargar datos para selects
  const { data: clientesData } = useQuery({
    queryKey: ['clientes-lista-agenda'],
    queryFn: () => listarClientesAPI(1, 200),
  });

  const { data: vehiculosCliente } = useQuery({
    queryKey: ['vehiculos-cliente', clienteId],
    queryFn: () => listarVehiculosClienteAPI(clienteId),
    enabled: !!clienteId,
  });

  const { data: usuariosData } = useQuery({
    queryKey: ['usuarios-lista'],
    queryFn: () => listarUsuariosAPI(1, 100),
  });

  const { data: serviciosData } = useQuery({
    queryKey: ['servicios-activos-agenda'],
    queryFn: () => listarServiciosActivosAPI(),
  });

  // Mecanicos: filtrar usuarios con rol MECANICO
  const mecanicos = (usuariosData?.datos || []).filter(
    (u: any) => u.rol?.nombre === 'MECANICO' && u.activo,
  );

  const clientes = (clientesData?.datos || []).map((c: any) => ({
    value: c.id,
    label: c.tipoCliente === 'PERSONA'
      ? `${c.nombres} ${c.apellidoPaterno} - ${c.numeroDocumento}`
      : `${c.razonSocial} - ${c.numeroDocumento}`,
  }));

  const vehiculos = (vehiculosCliente || []).map((v: any) => ({
    value: v.id,
    label: `${v.placa} - ${v.marca.nombre} ${v.modelo.nombre} ${v.anio}`,
  }));

  const servicios = (serviciosData || []).map((s: any) => ({
    value: s.id,
    label: `${s.nombre} — S/ ${Number(s.precioBase).toFixed(2)}`,
  }));

  const mecanicosOptions = mecanicos.map((m: any) => ({
    value: m.id,
    label: `${m.nombres} ${m.apellidoPaterno}`,
  }));

  // Prellenar en edición
  useEffect(() => {
    if (citaEditar && abierto) {
      setClienteId(citaEditar.cliente.id);
      setVehiculoId(citaEditar.vehiculo.id);
      setServicioId(citaEditar.servicio?.id || '');
      setMecanicoId(citaEditar.mecanico?.id || '');
      setFechaHora(new Date(citaEditar.fechaProgramada));
      setDuracion(String(citaEditar.duracionMinutos));
      setNotas(citaEditar.notas || '');
    } else if (abierto) {
      resetForm();
    }
  }, [citaEditar, abierto]);

  // Limpiar vehiculo si cambia cliente
  useEffect(() => {
    if (!esEdicion) setVehiculoId('');
  }, [clienteId]);

  // Verificar disponibilidad
  useEffect(() => {
    if (!fechaHora) { setConflictos([]); return; }
    if (!mecanicoId) { setConflictos([]); return; }

    const fechaProgramada = fechaHora.toISOString();
    const timer = setTimeout(async () => {
      try {
        const res = await verificarDisponibilidadAPI(fechaProgramada, Number(duracion), mecanicoId || undefined);
        setConflictos(res.conflictos.map((c) => c.mensaje));
      } catch {
        setConflictos([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [fechaHora, duracion, mecanicoId]);

  function resetForm() {
    setClienteId(''); setVehiculoId(''); setServicioId('');
    setMecanicoId('');
    setFechaHora(null); setDuracion('60');
    setNotas(''); setConflictos([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteId || !vehiculoId || !fechaHora) {
      toast.error('Por favor complete los campos obligatorios');
      return;
    }

    setEnviando(true);
    try {
      const data = {
        clienteId,
        vehiculoId,
        servicioId: servicioId || null,
        mecanicoId: mecanicoId || null,
        fechaProgramada: fechaHora.toISOString(),
        duracionMinutos: Number(duracion),
        notas: notas || null,
      };

      if (esEdicion) {
        await actualizarCitaAPI(citaEditar!.id, data);
        toast.success('Cita actualizada correctamente');
      } else {
        await crearCitaAPI(data);
        toast.success('Cita agendada correctamente');
      }

      queryClient.invalidateQueries({ queryKey: ['citas'] });
      queryClient.invalidateQueries({ queryKey: ['citas-hoy'] });
      onCerrar();
      resetForm();
    } catch (err: any) {
      toast.error(err.message || 'No se pudo guardar la cita');
    } finally {
      setEnviando(false);
    }
  }

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCerrar} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-surface shadow-xl mx-4">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-6 py-4 rounded-t-xl">
          <h3 className="text-lg font-bold text-text">
            {esEdicion ? 'Editar Cita' : 'Nueva Cita'}
          </h3>
          <button onClick={onCerrar} className="text-text-muted hover:text-text-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Cliente */}
          <SearchSelect
            label="Cliente"
            required
            options={clientes}
            value={clienteId}
            onChange={setClienteId}
            placeholder="Buscar por nombre, DNI o RUC..."
            disabled={esEdicion}
          />

          {/* Vehículo */}
          <SearchSelect
            label="Vehículo"
            required
            options={vehiculos}
            value={vehiculoId}
            onChange={setVehiculoId}
            placeholder={clienteId ? 'Seleccionar vehículo' : 'Primero seleccione un cliente'}
            disabled={!clienteId || esEdicion}
          />

          {/* Servicio */}
          <SearchSelect
            label="Servicio (opcional)"
            options={servicios}
            value={servicioId}
            onChange={setServicioId}
            placeholder="Seleccionar servicio..."
          />

          {/* Fecha y Hora */}
          <CitaDateTimePicker
            label="Fecha y hora"
            required
            value={fechaHora}
            onChange={setFechaHora}
            minDate={new Date()}
          />

          {/* Duración */}
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Duración *</label>
            <div className="flex flex-wrap gap-2">
              {DURACIONES.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDuracion(d.value)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                    duracion === d.value
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-surface-alt text-text-secondary hover:bg-surface-alt',
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mecánico */}
          <SearchSelect
            label="Mecánico (opcional)"
            options={mecanicosOptions}
            value={mecanicoId}
            onChange={setMecanicoId}
            placeholder="Seleccionar mecánico..."
          />

          {/* Alerta de conflictos */}
          {conflictos.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-800">Conflictos de horario detectados:</p>
                {conflictos.map((c, i) => (
                  <p key={i} className="text-xs text-amber-700 mt-0.5">{c}</p>
                ))}
              </div>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Notas (opcional)</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Observaciones adicionales..."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none placeholder:text-text-muted"
            />
            <p className="text-right text-[10px] text-text-muted mt-0.5">{notas.length}/500</p>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-alt transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando || conflictos.length > 0}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enviando ? 'Guardando...' : esEdicion ? 'Actualizar Cita' : 'Agendar Cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
