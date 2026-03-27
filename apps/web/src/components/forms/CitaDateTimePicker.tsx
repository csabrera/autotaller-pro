import { useState, useRef, useEffect } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import { Calendar, Clock, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('es', es);

function generarSlots(): string[] {
  const slots: string[] = [];
  for (let h = 7; h <= 18; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  slots.push('19:00');
  return slots;
}

const SLOTS = generarSlots();
const SLOTS_MANANA = SLOTS.filter((s) => parseInt(s) < 12);
const SLOTS_TARDE = SLOTS.filter((s) => parseInt(s) >= 12);

interface CitaDateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  required?: boolean;
  error?: string;
  minDate?: Date;
}

export function CitaDateTimePicker({ value, onChange, label, required, error, minDate }: CitaDateTimePickerProps) {
  const [abierto, setAbierto] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(
    value ? new Date(value.getFullYear(), value.getMonth(), value.getDate()) : null,
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const horaSeleccionada = value
    ? `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
    : '';

  // Click fuera cierra
  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    if (abierto) document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, [abierto]);

  function handleFechaChange(date: Date | null) {
    setFechaSeleccionada(date);
    if (!date) { onChange(null); return; }
    if (horaSeleccionada) {
      const [h, m] = horaSeleccionada.split(':').map(Number);
      onChange(new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m));
    }
  }

  function handleHoraClick(slot: string) {
    if (!fechaSeleccionada) return;
    const [h, m] = slot.split(':').map(Number);
    const combined = new Date(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth(), fechaSeleccionada.getDate(), h, m);
    onChange(combined);
    setAbierto(false);
  }

  function slotDisabled(slot: string): boolean {
    if (!fechaSeleccionada) return false;
    const hoy = new Date();
    const esHoy = fechaSeleccionada.toDateString() === hoy.toDateString();
    if (!esHoy) return false;
    const [h, m] = slot.split(':').map(Number);
    return h < hoy.getHours() || (h === hoy.getHours() && m <= hoy.getMinutes());
  }

  const textoBoton = value
    ? `${value.toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}  —  ${horaSeleccionada} hrs`
    : 'Seleccionar fecha y hora';

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label className="mb-1 block text-xs font-medium text-text-secondary">
          {label} {required && '*'}
        </label>
      )}

      {/* Botón trigger */}
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border bg-surface px-3 py-2 text-sm text-left outline-none transition-colors',
          abierto && 'ring-2 ring-primary/20 border-primary',
          error ? 'border-error' : 'border-border',
        )}
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-text-muted" />
          <span className={value ? 'text-text font-medium' : 'text-text-muted'}>
            {textoBoton}
          </span>
        </div>
        <ChevronDown className={cn('h-4 w-4 text-text-muted transition-transform', abierto && 'rotate-180')} />
      </button>

      {/* Panel desplegable */}
      {abierto && (
        <div className="mt-1 rounded-xl border border-border bg-surface shadow-lg z-30 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            {/* Calendario */}
            <div className="p-3 border-b sm:border-b-0 sm:border-r border-border-light">
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Fecha</span>
              </div>
              <DatePicker
                selected={fechaSeleccionada}
                onChange={handleFechaChange}
                locale="es"
                inline
                minDate={minDate || new Date()}
              />
            </div>

            {/* Hora */}
            <div className="p-3 flex-1">
              <div className="flex items-center gap-1.5 mb-2">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Hora</span>
              </div>

              {!fechaSeleccionada ? (
                <div className="flex items-center justify-center h-28 text-xs text-text-muted">
                  Primero seleccione una fecha
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto pr-1">
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Mañana</p>
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    {SLOTS_MANANA.map((slot) => {
                      const disabled = slotDisabled(slot);
                      const active = horaSeleccionada === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={disabled}
                          onClick={() => handleHoraClick(slot)}
                          className={cn(
                            'rounded-lg py-1.5 text-xs font-medium transition-all',
                            active
                              ? 'bg-primary text-white shadow-sm ring-2 ring-primary/30'
                              : disabled
                                ? 'bg-surface-alt text-text-muted cursor-not-allowed'
                                : 'bg-surface-alt text-text hover:bg-primary/10 hover:text-primary',
                          )}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Tarde</p>
                  <div className="grid grid-cols-3 gap-1">
                    {SLOTS_TARDE.map((slot) => {
                      const disabled = slotDisabled(slot);
                      const active = horaSeleccionada === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={disabled}
                          onClick={() => handleHoraClick(slot)}
                          className={cn(
                            'rounded-lg py-1.5 text-xs font-medium transition-all',
                            active
                              ? 'bg-primary text-white shadow-sm ring-2 ring-primary/30'
                              : disabled
                                ? 'bg-surface-alt text-text-muted cursor-not-allowed'
                                : 'bg-surface-alt text-text hover:bg-primary/10 hover:text-primary',
                          )}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
