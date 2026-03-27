import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wrench, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { loginSchema, type LoginInput } from '@autotaller/shared';
import { PasswordInput } from '@/components/forms/PasswordInput';
import { useAuthStore } from '@/stores/auth.store';
import { loginAPI } from '@/services/auth.service';

const TIPOS_DOCUMENTO = [
  { value: 'DNI', label: 'DNI', placeholder: 'Ej: 45678912', maxLength: 8, inputMode: 'numeric' as const },
  { value: 'PASAPORTE', label: 'Pasaporte', placeholder: 'Ej: AB123456', maxLength: 12, inputMode: 'text' as const },
  { value: 'CE', label: 'Carnet Extranjería', placeholder: 'Ej: 123456789', maxLength: 9, inputMode: 'numeric' as const },
];

export function LoginPage() {
  const [cargando, setCargando] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      tipoDocumento: 'DNI',
      numeroDocumento: '',
      clave: '',
    },
  });

  const tipoDocumento = watch('tipoDocumento');
  const tipoConfig = TIPOS_DOCUMENTO.find((t) => t.value === tipoDocumento) ?? TIPOS_DOCUMENTO[0];

  const handleTipoChange = (nuevoTipo: string) => {
    setValue('tipoDocumento', nuevoTipo as LoginInput['tipoDocumento'], { shouldValidate: false });
    setValue('numeroDocumento', '', { shouldValidate: false });
  };

  const handleDocumentoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value;

    if (tipoDocumento === 'DNI' || tipoDocumento === 'CE') {
      valor = valor.replace(/\D/g, '');
    }
    if (tipoDocumento === 'PASAPORTE') {
      valor = valor.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    }

    valor = valor.slice(0, tipoConfig.maxLength);
    setValue('numeroDocumento', valor, { shouldValidate: true });
  };

  const onSubmit = async (data: LoginInput) => {
    setCargando(true);
    try {
      const resultado = await loginAPI(data.numeroDocumento, data.clave);
      setAuth(resultado.token, resultado.refreshToken, resultado.usuario);
      toast.success(`Bienvenido, ${resultado.usuario.nombres}`);
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-alt px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Wrench className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text">AutoTaller</h1>
          <p className="mt-1 text-sm text-text-muted">Sistema de Gestión Automotriz</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl bg-surface p-6 shadow-sm">
          <h2 className="mb-5 text-center text-lg font-semibold text-text">Iniciar Sesión</h2>

          {/* Tipo de documento */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">
              Tipo de Documento
            </label>
            <div className="flex gap-2">
              {TIPOS_DOCUMENTO.map((tipo) => (
                <button
                  key={tipo.value}
                  type="button"
                  onClick={() => handleTipoChange(tipo.value)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    tipoDocumento === tipo.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-text-secondary hover:border-border hover:bg-surface-alt'
                  }`}
                >
                  {tipo.label}
                </button>
              ))}
            </div>
            {errors.tipoDocumento && (
              <p className="mt-1 text-xs text-error">{errors.tipoDocumento.message}</p>
            )}
          </div>

          {/* Número de documento */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">
              Número de Documento
            </label>
            <input
              {...register('numeroDocumento')}
              onChange={handleDocumentoInput}
              placeholder={tipoConfig.placeholder}
              maxLength={tipoConfig.maxLength}
              inputMode={tipoConfig.inputMode}
              autoFocus
              className={`w-full rounded-lg border bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-primary/20 ${
                errors.numeroDocumento
                  ? 'border-error focus:border-error'
                  : 'border-border focus:border-primary'
              }`}
            />
            {errors.numeroDocumento && (
              <p className="mt-1 text-xs text-error">{errors.numeroDocumento.message}</p>
            )}
            <p className="mt-1 text-[10px] text-text-muted">
              {tipoDocumento === 'DNI' && '8 dígitos numéricos'}
              {tipoDocumento === 'PASAPORTE' && '6 a 12 caracteres alfanuméricos'}
              {tipoDocumento === 'CE' && '9 dígitos numéricos'}
            </p>
          </div>

          {/* Contraseña */}
          <div className="mb-6">
            <PasswordInput
              {...register('clave')}
              label="Contraseña"
              placeholder="Ingrese su contraseña"
              error={errors.clave?.message}
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
              <LogIn className="h-4 w-4" />
            )}
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-text-muted">
          AutoTaller Pro v0.1.0
        </p>
      </div>
    </div>
  );
}
