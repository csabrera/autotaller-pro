import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  variante?: 'warning' | 'danger';
  cargando?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  variante = 'warning',
  cargando = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const colorBtn = variante === 'danger'
    ? 'bg-error hover:bg-red-600'
    : 'bg-warning hover:bg-amber-600';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-surface p-6 shadow-xl text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warning/10">
          <AlertTriangle className="h-7 w-7 text-warning" />
        </div>

        <h3 className="mb-2 text-base font-bold text-text">{titulo}</h3>
        <p className="mb-6 text-sm text-text-secondary">{mensaje}</p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            disabled={cargando}
            className="rounded-lg border border-border px-5 py-2 text-sm text-text-secondary hover:bg-surface-alt transition-colors"
          >
            {textoCancelar}
          </button>
          <button
            onClick={onConfirm}
            disabled={cargando}
            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${colorBtn}`}
          >
            {cargando && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
