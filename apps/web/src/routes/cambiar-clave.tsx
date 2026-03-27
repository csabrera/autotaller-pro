import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cambiarClaveSchema, type CambiarClaveInput } from '@autotaller/shared';
import { PasswordInput } from '@/components/forms/PasswordInput';
import { useAuthStore } from '@/stores/auth.store';
import { cambiarClaveAPI } from '@/services/auth.service';

export function CambiarClavePage() {
  const [cargando, setCargando] = useState(false);
  const { setAuth, usuario } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CambiarClaveInput>({
    resolver: zodResolver(cambiarClaveSchema),
  });

  const onSubmit = async (data: CambiarClaveInput) => {
    setCargando(true);
    try {
      const resultado = await cambiarClaveAPI(data.nuevaClave, data.confirmarClave);
      if (usuario) {
        setAuth(resultado.token, resultado.refreshToken, {
          ...usuario,
          debeCambiarClave: false,
        });
      }
      toast.success('Contraseña actualizada exitosamente');
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cambiar contraseña');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-alt px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-error/10">
            <Lock className="h-8 w-8 text-error" />
          </div>
          <h1 className="text-xl font-bold text-text">Cambio de Contraseña Requerido</h1>
          <p className="mt-1 text-sm text-text-muted">
            Por seguridad, debes crear una nueva contraseña para continuar.
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl bg-surface p-6 shadow-sm">
          <div className="mb-4">
            <PasswordInput
              {...register('nuevaClave')}
              label="Nueva contraseña"
              placeholder="Mínimo 4 caracteres"
              autoFocus
              error={errors.nuevaClave?.message}
            />
          </div>

          <div className="mb-6">
            <PasswordInput
              {...register('confirmarClave')}
              label="Confirmar contraseña"
              placeholder="Repite tu nueva contraseña"
              error={errors.confirmarClave?.message}
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {cargando ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {cargando ? 'Cambiando...' : 'Cambiar Contraseña'}
          </button>
        </form>

        <div className="mt-4 rounded-lg bg-error/5 p-3 text-center">
          <p className="text-xs text-error">
            No puedes acceder al sistema sin cambiar tu contraseña
          </p>
        </div>
      </div>
    </div>
  );
}
