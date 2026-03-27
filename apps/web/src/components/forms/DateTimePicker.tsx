import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('es', es);

interface DateTimePickerProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  showTime?: boolean;
  placeholder?: string;
  minDate?: Date;
  error?: string;
  required?: boolean;
}

export function DateTimePicker({
  label,
  value,
  onChange,
  showTime = true,
  placeholder = 'Seleccionar fecha y hora',
  minDate,
  error,
  required,
}: DateTimePickerProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1 block text-xs font-medium text-text-secondary">
          {label} {required && '*'}
        </label>
      )}
      <div className="relative">
        <DatePicker
          selected={value}
          onChange={onChange}
          showTimeSelect={showTime}
          timeFormat="HH:mm"
          timeIntervals={30}
          dateFormat={showTime ? "dd/MM/yyyy  HH:mm" : "dd/MM/yyyy"}
          locale="es"
          placeholderText={placeholder}
          minDate={minDate}
          timeCaption="Hora"
          isClearable
          className={cn(
            'w-full rounded-lg border bg-surface px-3 py-2 pl-9 text-sm outline-none transition-colors focus:ring-2 focus:ring-primary/20',
            error ? 'border-error focus:border-error' : 'border-border focus:border-primary',
          )}
          calendarClassName="autotaller-datepicker"
          popperPlacement="bottom-start"
        />
        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted pointer-events-none" />
      </div>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
