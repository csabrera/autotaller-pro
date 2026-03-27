import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, LogIn, Phone, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { loginPortalAPI } from '@/services/portal.service';
import { usePortalStore } from '@/stores/portal.store';

export function PortalLogin() {
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cargando, setCargando] = useState(false);
  const setCliente = usePortalStore((s) => s.setCliente);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documento || !telefono) {
      toast.error('Ingrese su documento y teléfono');
      return;
    }
    setCargando(true);
    try {
      const { cliente } = await loginPortalAPI(documento, telefono);
      setCliente(cliente);
      toast.success(`Bienvenido, ${cliente.nombres || cliente.razonSocial}`);
      navigate('/portal');
    } catch (err: any) {
      toast.error(err.message || 'No se pudo iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  const ic = 'w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-text-muted';

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Wrench className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text">AutoTaller</h1>
          <p className="mt-1 text-sm text-text-muted">Portal del Cliente</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl bg-surface p-6 shadow-sm border border-border">
          <h2 className="mb-1 text-center text-lg font-bold text-text">Consultar estado</h2>
          <p className="mb-5 text-center text-xs text-text-muted">
            Ingrese los datos registrados en el taller
          </p>

          <div className="mb-4">
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
              <FileText className="h-3.5 w-3.5" />
              Número de Documento (DNI / RUC)
            </label>
            <input
              value={documento}
              onChange={(e) => setDocumento(e.target.value.replace(/\D/g, ''))}
              placeholder="Ej: 45678912"
              maxLength={11}
              inputMode="numeric"
              autoFocus
              className={ic}
            />
          </div>

          <div className="mb-6">
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
              <Phone className="h-3.5 w-3.5" />
              Teléfono
            </label>
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
              placeholder="Ej: 987654321"
              maxLength={9}
              inputMode="numeric"
              className={ic}
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {cargando ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {cargando ? 'Consultando...' : 'Ingresar'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <a href="/login" className="text-xs text-text-muted hover:text-primary transition-colors">
            Acceso para empleados del taller
          </a>
        </div>
      </div>
    </div>
  );
}
