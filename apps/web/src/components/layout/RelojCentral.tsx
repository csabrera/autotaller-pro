import { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';

function formatearFecha(fecha: Date, modo: 'desktop' | 'tablet' | 'mobile'): string {
  if (modo === 'mobile') {
    return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
  }
  if (modo === 'tablet') {
    return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  return fecha.toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatearHora(fecha: Date, conSegundos: boolean): string {
  return fecha.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    ...(conSegundos && { second: '2-digit' }),
    hour12: false,
  });
}

export function RelojCentral() {
  const [ahora, setAhora] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-primary/15 bg-gradient-to-r from-primary/8 to-primary/5 px-4 py-1.5">
      {/* Desktop */}
      <div className="hidden items-center gap-2 lg:flex">
        <Calendar className="h-3.5 w-3.5 text-primary/60" />
        <span className="text-xs text-text-secondary capitalize">
          {formatearFecha(ahora, 'desktop')}
        </span>
        <div className="mx-1 h-4 w-px bg-primary/20" />
        <Clock className="h-3.5 w-3.5 text-primary/60" />
        <span className="text-sm font-bold tabular-nums text-primary">
          {formatearHora(ahora, true)}
        </span>
      </div>

      {/* Tablet */}
      <div className="hidden items-center gap-2 md:flex lg:hidden">
        <span className="text-xs text-text-secondary">
          {formatearFecha(ahora, 'tablet')}
        </span>
        <div className="h-3.5 w-px bg-primary/20" />
        <span className="text-sm font-bold tabular-nums text-primary">
          {formatearHora(ahora, false)}
        </span>
      </div>

      {/* Mobile */}
      <div className="flex items-center gap-1.5 md:hidden">
        <span className="text-xs text-text-secondary">
          {formatearFecha(ahora, 'mobile')}
        </span>
        <span className="text-xs font-bold tabular-nums text-primary">
          {formatearHora(ahora, false)}
        </span>
      </div>
    </div>
  );
}
