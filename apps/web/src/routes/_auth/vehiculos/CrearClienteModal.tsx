import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, UserPlus, Building2, User } from 'lucide-react';
import { toast } from 'sonner';
import { crearClienteSchema, type CrearClienteInput } from '@autotaller/shared';
import { crearClienteAPI } from '@/services/clientes.service';
import { cn } from '@/lib/utils';

const TIPOS_DOC_PERSONA = [
  { value: 'DNI', label: 'DNI', maxLength: 8 },
  { value: 'PASAPORTE', label: 'Pasaporte', maxLength: 12 },
  { value: 'CE', label: 'Carnet Extranjería', maxLength: 9 },
];

interface Props {
  onClose: () => void;
  onCreated: (cliente: any) => void;
}

export function CrearClienteModal({ onClose, onCreated }: Props) {
  const [tab, setTab] = useState<'PERSONA' | 'EMPRESA'>('PERSONA');
  const [cargando, setCargando] = useState(false);

  const personaForm = useForm<any>({
    defaultValues: { tipoCliente: 'PERSONA', tipoDocumento: 'DNI', numeroDocumento: '', nombres: '', apellidoPaterno: '', apellidoMaterno: '', telefono: '', direccion: '', correo: '' },
  });

  const empresaForm = useForm<any>({
    defaultValues: { tipoCliente: 'EMPRESA', tipoDocumento: 'RUC', numeroDocumento: '', razonSocial: '', nombreComercial: '', telefono: '', direccion: '', correo: '', contactoNombres: '', contactoApellidoPaterno: '', contactoApellidoMaterno: '', contactoCargo: '', contactoTelefono: '' },
  });

  const form = tab === 'PERSONA' ? personaForm : empresaForm;
  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;
  const tipoDoc = watch('tipoDocumento');
  const tipoConfig = TIPOS_DOC_PERSONA.find(t => t.value === tipoDoc);

  const handleDocInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (tab === 'EMPRESA') {
      val = val.replace(/\D/g, '').slice(0, 11);
    } else if (tipoDoc === 'DNI' || tipoDoc === 'CE') {
      val = val.replace(/\D/g, '').slice(0, tipoConfig?.maxLength || 12);
    } else {
      val = val.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12);
    }
    setValue('numeroDocumento', val, { shouldValidate: true });
  };

  const handleApellidoInput = (campo: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(campo, e.target.value.replace(/\s/g, '').toUpperCase(), { shouldValidate: true });
  };

  const handleTelInput = (campo: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(campo, e.target.value.replace(/\D/g, '').slice(0, 9), { shouldValidate: true });
  };

  const onSubmit = async (data: any) => {
    setCargando(true);
    try {
      const cliente = await crearClienteAPI(data);
      toast.success('Cliente registrado correctamente');
      onCreated(cliente);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ocurrió un error al registrar el cliente');
    } finally {
      setCargando(false);
    }
  };

  const inputClass = (error?: any) =>
    `w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-primary/20 ${
      error ? 'border-error' : 'border-border focus:border-primary'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-surface p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text">Registrar Nuevo Cliente</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary"><X className="h-5 w-5" /></button>
        </div>

        {/* Tabs Persona / Empresa */}
        <div className="mb-5 flex gap-0 border-b-2 border-border">
          <button
            onClick={() => setTab('PERSONA')}
            className={cn('flex items-center gap-2 px-5 py-2.5 text-sm font-medium -mb-[2px]', tab === 'PERSONA' ? 'border-b-2 border-primary text-primary' : 'text-text-muted')}
          >
            <User className="h-4 w-4" /> Persona Natural
          </button>
          <button
            onClick={() => setTab('EMPRESA')}
            className={cn('flex items-center gap-2 px-5 py-2.5 text-sm font-medium -mb-[2px]', tab === 'EMPRESA' ? 'border-b-2 border-primary text-primary' : 'text-text-muted')}
          >
            <Building2 className="h-4 w-4" /> Empresa
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {tab === 'PERSONA' ? (
            <>
              {/* Tipo doc + Número */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">Tipo Documento *</label>
                  <select {...register('tipoDocumento')} onChange={(e) => { setValue('tipoDocumento', e.target.value); setValue('numeroDocumento', ''); }} className={inputClass()}>
                    {TIPOS_DOC_PERSONA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">N° Documento *</label>
                  <input {...register('numeroDocumento', { required: 'Requerido' })} onChange={handleDocInput} maxLength={tipoConfig?.maxLength || 12} inputMode={tipoDoc === 'PASAPORTE' ? 'text' : 'numeric'} className={inputClass(errors.numeroDocumento)} />
                  {errors.numeroDocumento && <p className="mt-1 text-xs text-error">{(errors.numeroDocumento as any).message}</p>}
                </div>
              </div>
              {/* Nombres */}
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Nombres *</label>
                <input {...register('nombres', { required: 'Requerido' })} placeholder="Nombres completos" maxLength={50} className={inputClass(errors.nombres)} />
              </div>
              {/* Apellidos */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">Apellido Paterno *</label>
                  <input {...register('apellidoPaterno', { required: 'Requerido' })} onChange={handleApellidoInput('apellidoPaterno')} placeholder="APELLIDO" maxLength={30} className={inputClass(errors.apellidoPaterno)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">Apellido Materno *</label>
                  <input {...register('apellidoMaterno', { required: 'Requerido' })} onChange={handleApellidoInput('apellidoMaterno')} placeholder="APELLIDO" maxLength={30} className={inputClass(errors.apellidoMaterno)} />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* RUC */}
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">RUC *</label>
                <input {...register('numeroDocumento', { required: 'Requerido', pattern: { value: /^20\d{9}$/, message: 'El RUC debe tener 11 dígitos e iniciar con 20' } })} onChange={handleDocInput} placeholder="20XXXXXXXXX" maxLength={11} inputMode="numeric" className={inputClass(errors.numeroDocumento)} />
                {errors.numeroDocumento && <p className="mt-1 text-xs text-error">{(errors.numeroDocumento as any).message}</p>}
              </div>
              {/* Razón social */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">Razón Social *</label>
                  <input {...register('razonSocial', { required: 'Requerido' })} maxLength={150} className={inputClass(errors.razonSocial)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">Nombre Comercial (opcional)</label>
                  <input {...register('nombreComercial')} maxLength={150} className={inputClass()} />
                </div>
              </div>
              {/* Contacto */}
              <div className="border-t border-border-light pt-3 mt-2">
                <p className="mb-2 text-xs font-semibold text-primary">Datos del Contacto (persona responsable)</p>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">Nombres del contacto *</label>
                  <input {...register('contactoNombres', { required: 'Requerido' })} maxLength={50} className={inputClass(errors.contactoNombres)} />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-secondary">Apellido Paterno *</label>
                    <input {...register('contactoApellidoPaterno', { required: 'Requerido' })} onChange={handleApellidoInput('contactoApellidoPaterno')} placeholder="APELLIDO" maxLength={30} className={inputClass(errors.contactoApellidoPaterno)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-secondary">Apellido Materno *</label>
                    <input {...register('contactoApellidoMaterno', { required: 'Requerido' })} onChange={handleApellidoInput('contactoApellidoMaterno')} placeholder="APELLIDO" maxLength={30} className={inputClass(errors.contactoApellidoMaterno)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-secondary">Cargo *</label>
                    <input {...register('contactoCargo', { required: 'Requerido' })} maxLength={50} className={inputClass(errors.contactoCargo)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-secondary">Teléfono del contacto *</label>
                    <input {...register('contactoTelefono', { required: 'Requerido', pattern: { value: /^9\d{8}$/, message: 'Debe iniciar con 9 y tener 9 dígitos' } })} onChange={handleTelInput('contactoTelefono')} placeholder="9XXXXXXXX" maxLength={9} inputMode="numeric" className={inputClass(errors.contactoTelefono)} />
                    {errors.contactoTelefono && <p className="mt-1 text-xs text-error">{(errors.contactoTelefono as any).message}</p>}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Comunes: Teléfono + Correo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Teléfono *</label>
              <input {...register('telefono', { required: 'Requerido', pattern: { value: /^9\d{8}$/, message: 'Debe iniciar con 9 y tener 9 dígitos' } })} onChange={handleTelInput('telefono')} placeholder="9XXXXXXXX" maxLength={9} inputMode="numeric" className={inputClass(errors.telefono)} />
              {errors.telefono && <p className="mt-1 text-xs text-error">{(errors.telefono as any).message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Correo (opcional)</label>
              <input {...register('correo')} type="email" placeholder="correo@email.com" maxLength={100} className={inputClass()} />
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Dirección *</label>
            <input {...register('direccion', { required: 'Requerido' })} placeholder="Dirección completa" maxLength={150} className={inputClass(errors.direccion)} />
          </div>

          {/* Botones */}
          <div className="flex gap-3 justify-end pt-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-alt">Cancelar</button>
            <button type="submit" disabled={cargando} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50">
              {cargando ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <UserPlus className="h-4 w-4" />}
              {cargando ? 'Registrando...' : 'Registrar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
