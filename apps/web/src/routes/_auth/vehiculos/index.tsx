import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Plus, Car, UserX, UserCheck, Eye, Phone, Mail,
  MapPin, FileText, Building2, User, CirclePlus, Gauge,
  ChevronLeft, ChevronRight, Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { listarClientesAPI, toggleActivoClienteAPI, type ClienteItem, type VehiculoItem } from '@/services/clientes.service';
import { CrearClienteModal } from './CrearClienteModal';
import { CrearVehiculoModal } from './CrearVehiculoModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

function nombreCliente(c: ClienteItem) {
  return c.tipoCliente === 'PERSONA'
    ? `${c.nombres} ${c.apellidoPaterno}`
    : c.razonSocial || '';
}

function inicialesCliente(c: ClienteItem) {
  if (c.tipoCliente === 'PERSONA') return `${c.nombres?.[0] || ''}${c.apellidoPaterno?.[0] || ''}`;
  return c.razonSocial?.[0] || 'E';
}

export function VehiculosClientesPage() {
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaInput, setBusquedaInput] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'' | 'PERSONA' | 'EMPRESA'>('');
  const [modalClienteAbierto, setModalClienteAbierto] = useState(false);
  const [clienteDetalle, setClienteDetalle] = useState<ClienteItem | null>(null);
  const [confirmando, setConfirmando] = useState<ClienteItem | null>(null);
  const [clienteParaVehiculo, setClienteParaVehiculo] = useState<ClienteItem | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['clientes', pagina, busqueda],
    queryFn: () => listarClientesAPI(pagina, 10, busqueda),
  });

  const toggleActivo = useMutation({
    mutationFn: toggleActivoClienteAPI,
    onSuccess: (result) => {
      toast.success(result.activo ? 'Cliente activado correctamente' : 'Cliente deshabilitado correctamente');
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setConfirmando(null);
    },
    onError: (err: Error) => { toast.error(err.message); setConfirmando(null); },
  });

  useEffect(() => {
    const timer = setTimeout(() => { setBusqueda(busquedaInput); setPagina(1); }, 400);
    return () => clearTimeout(timer);
  }, [busquedaInput]);

  const datosFiltrados = filtroTipo
    ? (data?.datos || []).filter((c) => c.tipoCliente === filtroTipo)
    : (data?.datos || []);
  const total = data?.total || 0;
  const totalVehiculos = data?.datos.reduce((s, c) => s + c.vehiculos.length, 0) || 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text">Vehículos & Clientes</h2>
          <p className="text-sm text-text-muted mt-0.5">Gestión de clientes y sus vehículos</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Stats compactos */}
          <div className="hidden sm:flex items-center gap-4 mr-2">
            <div className="flex items-center gap-1.5 text-sm">
              <User className="h-4 w-4 text-primary" />
              <span className="font-bold text-text">{total}</span>
              <span className="text-text-muted">clientes</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Car className="h-4 w-4 text-info" />
              <span className="font-bold text-text">{totalVehiculos}</span>
              <span className="text-text-muted">vehículos</span>
            </div>
          </div>
          <button
            onClick={() => setModalClienteAbierto(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" /> Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Filtros por tipo + Búsqueda */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {([
            { key: '' as const, label: 'Todos', icon: Users },
            { key: 'PERSONA' as const, label: 'Personas', icon: User },
            { key: 'EMPRESA' as const, label: 'Empresas', icon: Building2 },
          ]).map((f) => (
            <button
              key={f.key}
              onClick={() => { setFiltroTipo(f.key); setPagina(1); }}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                filtroTipo === f.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface text-text-secondary border border-border hover:border-primary hover:text-primary',
              )}
            >
              <f.icon className="h-3.5 w-3.5" />
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            value={busquedaInput}
            onChange={(e) => setBusquedaInput(e.target.value)}
            placeholder="Buscar por nombre, DNI, teléfono o placa..."
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-text-muted"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-xl bg-surface shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-alt">
                <th className="px-5 py-3 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border w-12">#</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Cliente</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Documento</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Contacto</th>
                <th className="px-5 py-3 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Tipo</th>
                <th className="px-5 py-3 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Vehículos</th>
                <th className="px-5 py-3 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Estado</th>
                <th className="px-5 py-3 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="px-5 py-16 text-center"><div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></td></tr>
              ) : datosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <User className="mx-auto h-8 w-8 text-text-muted mb-2" />
                    <p className="text-sm font-medium text-text-secondary">No se encontraron clientes</p>
                    <p className="text-xs text-text-muted mt-1">Registre un nuevo cliente para comenzar</p>
                  </td>
                </tr>
              ) : (
                datosFiltrados.map((cliente, idx) => (
                  <tr
                    key={cliente.id}
                    className={cn(
                      'border-b border-border-light hover:bg-hover transition-colors cursor-pointer',
                      !cliente.activo && 'opacity-50',
                    )}
                    onClick={() => setClienteDetalle(cliente)}
                  >
                    <td className="px-5 py-3 text-center text-xs font-medium text-text-muted">{(pagina - 1) * 10 + idx + 1}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold flex-shrink-0',
                          cliente.tipoCliente === 'PERSONA' ? 'bg-primary/10 text-primary' : 'bg-purple-500/10 text-purple-600',
                        )}>
                          {inicialesCliente(cliente)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-text text-sm truncate">{nombreCliente(cliente)}</p>
                          {cliente.correo && <p className="text-xs text-text-muted truncate">{cliente.correo}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-text">{cliente.numeroDocumento}</p>
                      <p className="text-xs text-text-muted">{cliente.tipoDocumento}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-text">{cliente.telefono}</p>
                      {cliente.direccion && <p className="text-xs text-text-muted truncate max-w-[200px]">{cliente.direccion}</p>}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        cliente.tipoCliente === 'PERSONA' ? 'bg-info/10 text-info' : 'bg-purple-500/10 text-purple-600',
                      )}>
                        {cliente.tipoCliente === 'PERSONA' ? 'Persona' : 'Empresa'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
                        cliente.vehiculos.length > 0 ? 'bg-primary/10 text-primary' : 'bg-surface-alt text-text-muted',
                      )}>
                        <Car className="h-3.5 w-3.5" />
                        {cliente.vehiculos.length}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={cn(
                        'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                        cliente.activo ? 'bg-success/10 text-success' : 'bg-error/10 text-error',
                      )}>
                        {cliente.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setClienteDetalle(cliente)}
                          className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden lg:inline">Ver</span>
                        </button>
                        <button
                          onClick={() => setClienteParaVehiculo(cliente)}
                          className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-info hover:bg-info/10 transition-colors"
                        >
                          <CirclePlus className="h-3.5 w-3.5" />
                          <span className="hidden lg:inline">Vehículo</span>
                        </button>
                        <button
                          onClick={() => setConfirmando(cliente)}
                          className={cn(
                            'flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                            cliente.activo ? 'text-warning hover:bg-warning/10' : 'text-success hover:bg-success/10',
                          )}
                        >
                          {cliente.activo ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                          <span className="hidden lg:inline">{cliente.activo ? 'Deshab.' : 'Activar'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación profesional */}
        {data && (
          <div className="flex items-center justify-between border-t border-border bg-surface-alt/30 px-5 py-3">
            <p className="text-xs text-text-muted">
              Mostrando <span className="font-semibold text-text-secondary">{datosFiltrados.length > 0 ? (data.pagina - 1) * data.porPagina + 1 : 0}</span> a <span className="font-semibold text-text-secondary">{Math.min(data.pagina * data.porPagina, data.total)}</span> de <span className="font-semibold text-text">{data.total}</span> registros
            </p>
            {data.totalPaginas > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPagina(Math.max(1, pagina - 1))}
                  disabled={pagina === 1}
                  className="flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-medium text-text-secondary hover:bg-surface-alt disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                </button>
                {Array.from({ length: data.totalPaginas }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPagina(p)}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors',
                      p === data.pagina
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-text-secondary hover:bg-surface-alt',
                    )}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPagina(Math.min(data.totalPaginas, pagina + 1))}
                  disabled={pagina === data.totalPaginas}
                  className="flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-medium text-text-secondary hover:bg-surface-alt disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Detalle Cliente + Vehículos */}
      {clienteDetalle && (
        <ModalDetalleCliente
          cliente={clienteDetalle}
          onCerrar={() => setClienteDetalle(null)}
          onAgregarVehiculo={() => { setClienteParaVehiculo(clienteDetalle); }}
          onToggleActivo={() => { setConfirmando(clienteDetalle); setClienteDetalle(null); }}
        />
      )}

      {modalClienteAbierto && (
        <CrearClienteModal
          onClose={() => setModalClienteAbierto(false)}
          onCreated={() => { setModalClienteAbierto(false); queryClient.invalidateQueries({ queryKey: ['clientes'] }); }}
        />
      )}

      {clienteParaVehiculo && (
        <CrearVehiculoModal
          cliente={clienteParaVehiculo}
          onClose={() => setClienteParaVehiculo(null)}
          onCreated={() => { setClienteParaVehiculo(null); queryClient.invalidateQueries({ queryKey: ['clientes'] }); }}
        />
      )}

      {confirmando && (
        <ConfirmDialog
          titulo={`¿${confirmando.activo ? 'Deshabilitar' : 'Activar'} a "${nombreCliente(confirmando)}"?`}
          mensaje={confirmando.activo ? 'El cliente no aparecerá en las búsquedas pero sus registros se mantienen.' : 'El cliente volverá a estar disponible en el sistema.'}
          textoConfirmar={confirmando.activo ? 'Deshabilitar' : 'Activar'}
          cargando={toggleActivo.isPending}
          onConfirm={() => toggleActivo.mutate(confirmando.id)}
          onCancel={() => setConfirmando(null)}
        />
      )}
    </div>
  );
}

// =============================================
// Modal Detalle Cliente con Vehículos
// =============================================

function ModalDetalleCliente({ cliente, onCerrar, onAgregarVehiculo, onToggleActivo }: {
  cliente: ClienteItem;
  onCerrar: () => void;
  onAgregarVehiculo: () => void;
  onToggleActivo: () => void;
}) {
  const esPersona = cliente.tipoCliente === 'PERSONA';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-overlay" onClick={onCerrar} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-surface shadow-xl mx-4">
        {/* Header con avatar */}
        <div className="relative border-b border-border px-6 py-5">
          <div className="flex items-start gap-4">
            <div className={cn(
              'flex h-14 w-14 items-center justify-center rounded-xl text-lg font-bold flex-shrink-0',
              esPersona ? 'bg-primary/10 text-primary' : 'bg-purple-500/10 text-purple-600',
            )}>
              {inicialesCliente(cliente)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-text truncate">{nombreCliente(cliente)}</h3>
                <span className={cn(
                  'inline-block h-2.5 w-2.5 rounded-full flex-shrink-0',
                  cliente.activo ? 'bg-success' : 'bg-error',
                )} />
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                  esPersona ? 'bg-info/10 text-info' : 'bg-purple-500/10 text-purple-600',
                )}>
                  {esPersona ? <User className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                  {esPersona ? 'Persona Natural' : 'Empresa'}
                </span>
                <span className="text-xs text-text-muted">{cliente.tipoDocumento}: {cliente.numeroDocumento}</span>
              </div>
            </div>
            <button onClick={onCerrar} className="text-text-muted hover:text-text-secondary text-xl leading-none">&times;</button>
          </div>
        </div>

        <div className="p-6">
          {/* Info de contacto */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-alt">
                <Phone className="h-4 w-4 text-text-muted" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Teléfono</p>
                <p className="text-sm font-medium text-text">{cliente.telefono}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-alt">
                <Mail className="h-4 w-4 text-text-muted" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Correo</p>
                <p className="text-sm font-medium text-text">{cliente.correo || 'No registrado'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 col-span-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-alt">
                <MapPin className="h-4 w-4 text-text-muted" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Dirección</p>
                <p className="text-sm font-medium text-text">{cliente.direccion || 'No registrada'}</p>
              </div>
            </div>
          </div>

          {/* Contacto empresa */}
          {!esPersona && cliente.contactoNombres && (
            <div className="mb-6 rounded-lg border border-border bg-surface-alt/50 p-4">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Contacto de la empresa</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-text-muted">Nombre</p>
                  <p className="text-sm font-medium text-text">{cliente.contactoNombres} {cliente.contactoApellidoPaterno} {cliente.contactoApellidoMaterno}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Cargo</p>
                  <p className="text-sm font-medium text-text">{cliente.contactoCargo || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Teléfono</p>
                  <p className="text-sm font-medium text-text">{cliente.contactoTelefono || '-'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Vehículos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-text flex items-center gap-2">
                <Car className="h-4 w-4 text-primary" />
                Vehículos ({cliente.vehiculos.length})
              </h4>
              <button
                onClick={onAgregarVehiculo}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-hover transition-colors"
              >
                <Plus className="h-3 w-3" /> Agregar
              </button>
            </div>

            {cliente.vehiculos.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <Car className="mx-auto h-8 w-8 text-text-muted mb-2" />
                <p className="text-sm text-text-secondary">Este cliente no tiene vehículos registrados</p>
                <button
                  onClick={onAgregarVehiculo}
                  className="mt-3 text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
                >
                  Registrar primer vehículo
                </button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {cliente.vehiculos.map((v) => (
                  <VehiculoCard key={v.id} vehiculo={v} />
                ))}
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-border">
            <button
              onClick={onToggleActivo}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-colors',
                cliente.activo
                  ? 'text-warning hover:bg-warning/10'
                  : 'text-success hover:bg-success/10',
              )}
            >
              {cliente.activo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
              {cliente.activo ? 'Deshabilitar cliente' : 'Activar cliente'}
            </button>
            <button
              onClick={onCerrar}
              className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-text-secondary hover:bg-surface-alt transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================
// Card de Vehículo
// =============================================

function VehiculoCard({ vehiculo: v }: { vehiculo: VehiculoItem }) {
  return (
    <div className="rounded-lg border border-border p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Car className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-primary">{v.placa}</p>
            <p className="text-xs text-text-secondary">{v.marca.nombre} {v.modelo.nombre}</p>
          </div>
        </div>
        <span className="rounded-full bg-surface-alt px-2 py-0.5 text-xs font-semibold text-text-secondary">{v.anio}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <div className="h-2.5 w-2.5 rounded-full border-2 border-text-muted" style={{ backgroundColor: v.color.nombre === 'Blanco' ? '#f8fafc' : undefined }} />
          {v.color.nombre}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Gauge className="h-3 w-3" />
          {v.kilometrajeActual.toLocaleString()} km
        </div>
        {v.combustible && (
          <div className="text-xs text-text-muted">{v.combustible.nombre}</div>
        )}
        {v.transmision && (
          <div className="text-xs text-text-muted">{v.transmision.nombre}</div>
        )}
      </div>
    </div>
  );
}
