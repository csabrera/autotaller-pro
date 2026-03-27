import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { crearUsuarioSchema, type CrearUsuarioInput } from '@autotaller/shared';
import { crearUsuarioAPI, listarRolesAPI, listarSucursalesAPI } from '@/services/usuarios.service';

const TIPOS_DOC = [
  { value: 'DNI', label: 'DNI', maxLength: 8, inputMode: 'numeric' as const },
  { value: 'PASAPORTE', label: 'Pasaporte', maxLength: 12, inputMode: 'text' as const },
  { value: 'CE', label: 'Carnet Extranjería', maxLength: 9, inputMode: 'numeric' as const },
];

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function CrearUsuarioModal({ onClose, onCreated }: Props) {
  const [cargando, setCargando] = useState(false);
  const [roles, setRoles] = useState<{ id: string; nombre: string }[]>([]);
  const [sucursales, setSucursales] = useState<{ id: string; nombre: string }[]>([]);

  const {
    register, handleSubmit, watch, setValue, formState: { errors },
  } = useForm<CrearUsuarioInput>({
    resolver: zodResolver(crearUsuarioSchema),
    defaultValues: { tipoDocumento: 'DNI', numeroDocumento: '', correo: '' },
  });

  const tipoDoc = watch('tipoDocumento');
  const tipoConfig = TIPOS_DOC.find((t) => t.value === tipoDoc) ?? TIPOS_DOC[0];

  useEffect(() => {
    Promise.all([listarRolesAPI(), listarSucursalesAPI()]).then(([r, s]) => {
      setRoles(r);
      setSucursales(s);
    });
  }, []);

  const handleDocInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (tipoDoc === 'DNI' || tipoDoc === 'CE') val = val.replace(/\D/g, '');
    if (tipoDoc === 'PASAPORTE') val = val.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    val = val.slice(0, tipoConfig.maxLength);
    setValue('numeroDocumento', val, { shouldValidate: true });
  };

  const handleApellidoInput = (campo: 'apellidoPaterno' | 'apellidoMaterno') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\s/g, '').toUpperCase();
    setValue(campo, val, { shouldValidate: true });
  };

  const handleTelInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 9);
    setValue('telefono', val, { shouldValidate: true });
  };

  const onSubmit = async (data: CrearUsuarioInput) => {
    setCargando(true);
    try {
      const result = await crearUsuarioAPI(data);
      toast.success(
        `Usuario creado exitosamente. Clave temporal: ${result.claveTemporal}`,
        { duration: 8000 },
      );
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear usuario');
    } finally {
      setCargando(false);
    }
  };

  const inputClass = (error?: string) =>
    `w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-primary/20 ${
      error ? 'border-error focus:border-error' : 'border-border focus:border-primary'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-surface p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text">Nuevo Usuario</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Fila 1: Tipo documento */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Tipo de Documento *</label>
            <div className="flex gap-2">
              {TIPOS_DOC.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setValue('tipoDocumento', t.value as CrearUsuarioInput['tipoDocumento'], { shouldValidate: false });
                    setValue('numeroDocumento', '', { shouldValidate: false });
                  }}
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                    tipoDoc === t.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-text-secondary hover:border-border'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fila 2: N° Documento + Nombres */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">N° Documento *</label>
              <input
                {...register('numeroDocumento')}
                onChange={handleDocInput}
                placeholder={tipoConfig.inputMode === 'numeric' ? `${tipoConfig.maxLength} dígitos` : '6-12 caracteres'}
                maxLength={tipoConfig.maxLength}
                inputMode={tipoConfig.inputMode}
                className={inputClass(errors.numeroDocumento?.message)}
              />
              {errors.numeroDocumento && <p className="mt-1 text-xs text-error">{errors.numeroDocumento.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Nombres *</label>
              <input {...register('nombres')} placeholder="Nombres completos" maxLength={50} className={inputClass(errors.nombres?.message)} />
              {errors.nombres && <p className="mt-1 text-xs text-error">{errors.nombres.message}</p>}
            </div>
          </div>

          {/* Fila 3: Apellido Paterno + Apellido Materno */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Apellido Paterno *</label>
              <input {...register('apellidoPaterno')} onChange={handleApellidoInput('apellidoPaterno')} placeholder="GUZMAN" maxLength={30} className={inputClass(errors.apellidoPaterno?.message)} />
              {errors.apellidoPaterno && <p className="mt-1 text-xs text-error">{errors.apellidoPaterno.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Apellido Materno *</label>
              <input {...register('apellidoMaterno')} onChange={handleApellidoInput('apellidoMaterno')} placeholder="LOPEZ" maxLength={30} className={inputClass(errors.apellidoMaterno?.message)} />
              {errors.apellidoMaterno && <p className="mt-1 text-xs text-error">{errors.apellidoMaterno.message}</p>}
            </div>
          </div>

          {/* Fila 4: Teléfono + Correo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Teléfono *</label>
              <input
                {...register('telefono')}
                onChange={handleTelInput}
                placeholder="9XXXXXXXX"
                maxLength={9}
                inputMode="numeric"
                className={inputClass(errors.telefono?.message)}
              />
              {errors.telefono && <p className="mt-1 text-xs text-error">{errors.telefono.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Correo electrónico (opcional)</label>
              <input {...register('correo')} type="email" placeholder="correo@email.com" maxLength={100} className={inputClass(errors.correo?.message)} />
              {errors.correo && <p className="mt-1 text-xs text-error">{errors.correo.message}</p>}
            </div>
          </div>

          {/* Fila 5: Dirección */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Dirección *</label>
            <input {...register('direccion')} placeholder="Dirección completa" maxLength={150} className={inputClass(errors.direccion?.message)} />
            {errors.direccion && <p className="mt-1 text-xs text-error">{errors.direccion.message}</p>}
          </div>

          {/* Fila 6: Rol + Sucursal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Rol *</label>
              <select {...register('rolId')} className={inputClass(errors.rolId?.message)}>
                <option value="">Seleccionar rol</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
              {errors.rolId && <p className="mt-1 text-xs text-error">{errors.rolId.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Sucursal *</label>
              <select {...register('sucursalId')} className={inputClass(errors.sucursalId?.message)}>
                <option value="">Seleccionar sucursal</option>
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
              {errors.sucursalId && <p className="mt-1 text-xs text-error">{errors.sucursalId.message}</p>}
            </div>
          </div>

          {/* Info clave temporal */}
          <div className="rounded-lg bg-info/5 p-3 text-xs text-info">
            <strong>Clave temporal:</strong> Se generará automáticamente con el N° de documento. El usuario deberá cambiarla en su primer inicio de sesión.
          </div>

          {/* Botones */}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-alt">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {cargando ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {cargando ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
