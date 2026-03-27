import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, RotateCcw, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  listarUsuariosAPI, toggleActivoUsuarioAPI, resetearClaveAPI,
  type UsuarioListItem,
} from '@/services/usuarios.service';
import { CrearUsuarioModal } from './CrearUsuarioModal';

export function UsuariosPage() {
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaInput, setBusquedaInput] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['usuarios', pagina, busqueda],
    queryFn: () => listarUsuariosAPI(pagina, 10, busqueda),
  });

  const toggleActivo = useMutation({
    mutationFn: toggleActivoUsuarioAPI,
    onSuccess: (result) => {
      toast.success(result.activo ? 'Usuario activado' : 'Usuario deshabilitado');
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetearClave = useMutation({
    mutationFn: resetearClaveAPI,
    onSuccess: (result) => {
      toast.success(`Clave reseteada. Clave temporal: ${result.claveTemporal}`);
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleBuscar = useCallback(() => {
    setBusqueda(busquedaInput);
    setPagina(1);
  }, [busquedaInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBusqueda(busquedaInput);
      setPagina(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [busquedaInput]);

  const nombreCompleto = (u: UsuarioListItem) =>
    `${u.nombres} ${u.apellidoPaterno} ${u.apellidoMaterno}`;

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-text">Gestión de Usuarios</h2>
          <p className="text-xs text-text-muted">Crear, editar y administrar usuarios del sistema</p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo Usuario
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            value={busquedaInput}
            onChange={(e) => setBusquedaInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
            placeholder="Buscar por nombre, apellido o documento..."
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border-light">
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted w-12">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">Nombre Completo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">Documento</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">Teléfono</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted">Rol</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted">Sucursal</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-text-muted">
                    <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </td>
                </tr>
              ) : data?.datos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-text-muted">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                data?.datos.map((usuario, idx) => (
                  <tr key={usuario.id} className={cn(
                    'border-b border-border-light transition-colors hover:bg-surface-alt/50',
                    !usuario.activo && 'opacity-50',
                  )}>
                    <td className="px-4 py-3 text-center text-xs font-medium text-text-muted">{(pagina - 1) * 10 + idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {usuario.nombres[0]}{usuario.apellidoPaterno[0]}
                        </div>
                        <div>
                          <p className={cn('font-medium text-text', !usuario.activo && 'line-through')}>
                            {nombreCompleto(usuario)}
                          </p>
                          {usuario.correo && (
                            <p className="text-xs text-text-muted">{usuario.correo}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-text-muted">{usuario.tipoDocumento}:</span>{' '}
                      <span className="font-medium">{usuario.numeroDocumento}</span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{usuario.telefono}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {usuario.rol}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-text-secondary">
                      {usuario.sucursal}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-medium',
                        usuario.activo ? 'bg-success/10 text-success' : 'bg-error/10 text-error',
                      )}>
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => toggleActivo.mutate(usuario.id)}
                          title={usuario.activo ? 'Deshabilitar' : 'Activar'}
                          className={cn(
                            'rounded-md p-1.5 transition-colors',
                            usuario.activo
                              ? 'text-warning hover:bg-warning/10'
                              : 'text-success hover:bg-success/10',
                          )}
                        >
                          {usuario.activo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Resetear la clave de ${nombreCompleto(usuario)}? La nueva clave será su número de documento.`)) {
                              resetearClave.mutate(usuario.id);
                            }
                          }}
                          title="Resetear contraseña"
                          className="rounded-md p-1.5 text-info hover:bg-info/10 transition-colors"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {data && data.totalPaginas > 1 && (
          <div className="flex items-center justify-between border-t border-border-light px-4 py-3">
            <p className="text-xs text-text-muted">
              Mostrando {(data.pagina - 1) * data.porPagina + 1}-{Math.min(data.pagina * data.porPagina, data.total)} de {data.total}
            </p>
            <div className="flex gap-1">
              {Array.from({ length: data.totalPaginas }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPagina(p)}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md text-xs',
                    p === data.pagina
                      ? 'bg-primary text-white'
                      : 'border border-border text-text-secondary hover:bg-surface-alt',
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal crear usuario */}
      {modalAbierto && (
        <CrearUsuarioModal
          onClose={() => setModalAbierto(false)}
          onCreated={() => {
            setModalAbierto(false);
            queryClient.invalidateQueries({ queryKey: ['usuarios'] });
          }}
        />
      )}
    </div>
  );
}
