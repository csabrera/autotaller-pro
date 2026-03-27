import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Plus, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { usePortalStore } from '@/stores/portal.store';
import { citasPortalAPI, agendarCitaPortalAPI } from '@/services/portal.service';
import { listarServiciosActivosAPI } from '@/services/servicios.service';
import { cn } from '@/lib/utils';
import { COLORES_ESTADO_CITA, ETIQUETAS_ESTADO_CITA } from '@autotaller/shared';
import { CitaDateTimePicker } from '@/components/forms/CitaDateTimePicker';
import { SearchSelect } from '@/components/forms/SearchSelect';

export function PortalCitas() {
  const cliente = usePortalStore((s) => s.cliente);
  const queryClient = useQueryClient();
  const [modalAbierto, setModalAbierto] = useState(false);

  const { data: citas, isLoading } = useQuery({
    queryKey: ['portal-citas', cliente?.id],
    queryFn: () => citasPortalAPI(cliente!.id),
    enabled: !!cliente,
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text">Mis Citas</h2>
          <p className="text-sm text-text-muted mt-0.5">Citas programadas y su historial</p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" /> Agendar Cita
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
      ) : !citas || citas.length === 0 ? (
        <div className="rounded-xl bg-surface border border-border p-12 text-center">
          <Calendar className="mx-auto h-10 w-10 text-text-muted mb-3" />
          <p className="text-sm text-text-secondary mb-3">No tienes citas registradas</p>
          <button onClick={() => setModalAbierto(true)} className="text-sm font-semibold text-primary hover:text-primary-hover">
            + Agendar tu primera cita
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {citas.map((c, idx) => {
            const fecha = new Date(c.fechaProgramada);
            const colores = COLORES_ESTADO_CITA[c.estado as keyof typeof COLORES_ESTADO_CITA];
            return (
              <div key={c.id} className="rounded-xl bg-surface border border-border p-5 hover:border-primary/20 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center flex-shrink-0 rounded-lg bg-primary/10 px-3 py-2">
                      <p className="text-lg font-black text-primary">{fecha.getDate()}</p>
                      <p className="text-[10px] font-semibold text-primary uppercase">{fecha.toLocaleDateString('es-PE', { month: 'short' })}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted">#{idx + 1}</span>
                        <span className="font-bold text-text">{c.numeroCita}</span>
                        {colores && (
                          <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-bold', colores.bg, colores.text)}>
                            {ETIQUETAS_ESTADO_CITA[c.estado as keyof typeof ETIQUETAS_ESTADO_CITA]}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })} ({c.duracionMinutos} min)
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {c.vehiculo.placa} — {c.vehiculo.marca.nombre} {c.vehiculo.modelo.nombre}
                        {c.servicio && ` — ${c.servicio.nombre}`}
                      </p>
                    </div>
                  </div>
                </div>
                {c.notas && (
                  <p className="text-xs text-text-muted mt-2 bg-surface-alt rounded-lg p-2">{c.notas}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal agendar cita */}
      {modalAbierto && cliente && (
        <ModalAgendarCita
          cliente={cliente}
          onCerrar={() => setModalAbierto(false)}
          onAgendada={() => {
            setModalAbierto(false);
            queryClient.invalidateQueries({ queryKey: ['portal-citas'] });
          }}
        />
      )}
    </div>
  );
}

function ModalAgendarCita({ cliente, onCerrar, onAgendada }: {
  cliente: { id: string; vehiculos: { id: string; placa: string; marca: { nombre: string }; modelo: { nombre: string }; anio: number }[] };
  onCerrar: () => void;
  onAgendada: () => void;
}) {
  const [vehiculoId, setVehiculoId] = useState('');
  const [servicioId, setServicioId] = useState('');
  const [fechaHora, setFechaHora] = useState<Date | null>(null);
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);

  const { data: serviciosData } = useQuery({
    queryKey: ['servicios-activos-portal'],
    queryFn: () => listarServiciosActivosAPI(),
  });

  const vehiculos = cliente.vehiculos.map((v) => ({
    value: v.id,
    label: `${v.placa} - ${v.marca.nombre} ${v.modelo.nombre} ${v.anio}`,
  }));

  const servicios = (serviciosData || []).map((s: any) => ({
    value: s.id,
    label: `${s.nombre} — S/ ${Number(s.precioBase).toFixed(2)}`,
  }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vehiculoId || !fechaHora) {
      toast.error('Seleccione un vehículo y una fecha');
      return;
    }
    setEnviando(true);
    try {
      await agendarCitaPortalAPI(cliente.id, {
        vehiculoId,
        servicioId: servicioId || undefined,
        fechaProgramada: fechaHora.toISOString(),
        notas: notas || undefined,
      });
      toast.success('Cita agendada correctamente. El taller confirmará tu cita.');
      onAgendada();
    } catch (err: any) {
      toast.error(err.message || 'No se pudo agendar la cita');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-surface shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-6 py-4 rounded-t-xl">
          <h3 className="text-lg font-bold text-text">Agendar Cita</h3>
          <button onClick={onCerrar} className="text-text-muted hover:text-text-secondary text-xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <SearchSelect
            label="Vehículo"
            required
            options={vehiculos}
            value={vehiculoId}
            onChange={setVehiculoId}
            placeholder="Seleccionar vehículo..."
          />

          <SearchSelect
            label="Servicio (opcional)"
            options={servicios}
            value={servicioId}
            onChange={setServicioId}
            placeholder="Seleccionar servicio..."
          />

          <CitaDateTimePicker
            label="Fecha y hora"
            required
            value={fechaHora}
            onChange={setFechaHora}
            minDate={new Date()}
          />

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Notas (opcional)</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Describe lo que necesitas..."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none placeholder:text-text-muted"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCerrar} className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-alt transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={enviando} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover shadow-sm transition-colors disabled:opacity-50">
              {enviando ? 'Agendando...' : 'Agendar Cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
