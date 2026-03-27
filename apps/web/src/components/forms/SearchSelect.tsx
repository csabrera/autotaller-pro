import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
}

interface SearchSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
}

export function SearchSelect({ options, value, onChange, placeholder = 'Seleccionar', disabled = false, error, label, required }: SearchSelectProps) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const seleccionado = options.find((o) => o.value === value);

  const filtradas = busqueda
    ? options.filter((o) => o.label.toLowerCase().includes(busqueda.toLowerCase()))
    : options;

  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAbierto(false);
        setBusqueda('');
      }
    }
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  useEffect(() => {
    if (abierto && inputRef.current) {
      inputRef.current.focus();
    }
  }, [abierto]);

  return (
    <div className="w-full">
      {label && (
        <label className="mb-1 block text-xs font-medium text-text-secondary">
          {label} {required && '*'}
        </label>
      )}
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => { if (!disabled) { setAbierto(!abierto); setBusqueda(''); } }}
          disabled={disabled}
          className={cn(
            'flex w-full items-center justify-between rounded-lg border bg-surface px-3 py-2 text-sm text-left outline-none transition-colors',
            abierto && 'ring-2 ring-primary/20 border-primary',
            error ? 'border-error' : 'border-border',
            disabled && 'opacity-50 cursor-not-allowed bg-surface-alt',
          )}
        >
          <span className={seleccionado ? 'text-text' : 'text-text-muted'}>
            {seleccionado?.label || placeholder}
          </span>
          <div className="flex items-center gap-1">
            {value && !disabled && (
              <span
                onClick={(e) => { e.stopPropagation(); onChange(''); setAbierto(false); }}
                className="text-text-muted hover:text-text-secondary cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronDown className={cn('h-4 w-4 text-text-muted transition-transform', abierto && 'rotate-180')} />
          </div>
        </button>

        {abierto && (
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-surface shadow-lg">
            {/* Búsqueda */}
            <div className="flex items-center gap-2 border-b border-border-light px-3 py-2">
              <Search className="h-4 w-4 text-text-muted flex-shrink-0" />
              <input
                ref={inputRef}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Escriba para buscar..."
                className="w-full text-sm outline-none placeholder-text-muted"
              />
            </div>

            {/* Opciones */}
            <div className="max-h-48 overflow-y-auto">
              {filtradas.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-text-muted">
                  No se encontraron resultados
                </div>
              ) : (
                filtradas.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setAbierto(false);
                      setBusqueda('');
                    }}
                    className={cn(
                      'flex w-full items-center px-3 py-2 text-sm text-left transition-colors hover:bg-primary/5',
                      option.value === value && 'bg-primary/10 text-primary font-medium',
                    )}
                  >
                    {option.label}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
