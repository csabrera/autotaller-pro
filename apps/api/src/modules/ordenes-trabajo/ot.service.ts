import { prisma } from '../../core/database/prisma.js';
import { AppError } from '../../core/errors/AppError.js';
import { notificarCambioEstadoOT } from '../notificaciones/notificaciones.triggers.js';

const TRANSICIONES: Record<string, string[]> = {
  RECIBIDO: ['EN_PROCESO', 'CANCELADO'],
  EN_PROCESO: ['ENTREGADO', 'CANCELADO'],
  ENTREGADO: [],
  CANCELADO: [],
};

const INCLUDE_OT = {
  vehiculo: { include: { marca: true, modelo: true, color: true } },
  cliente: true,
  recepcionista: true,
  mecanicoAsignado: true,
  sucursal: true,
  servicios: true,
  repuestos: true,
  checklist: true,
  evidencias: true,
  historialEstados: { orderBy: { cambiadoEn: 'desc' as const } },
};

async function generarNumeroOrden(): Promise<string> {
  const anio = new Date().getFullYear();
  const prefijo = `OT-${anio}-`;

  const ultima = await prisma.ordenTrabajo.findFirst({
    where: { numeroOrden: { startsWith: prefijo } },
    orderBy: { numeroOrden: 'desc' },
  });

  if (!ultima) return `${prefijo}0001`;

  const ultimoNum = parseInt(ultima.numeroOrden.replace(prefijo, ''), 10);
  return `${prefijo}${String(ultimoNum + 1).padStart(4, '0')}`;
}

export async function listarOrdenes(pagina = 1, porPagina = 10, estado?: string, busqueda?: string) {
  const skip = (pagina - 1) * porPagina;
  const where: any = {};

  if (estado) where.estado = estado;
  if (busqueda) {
    where.OR = [
      { numeroOrden: { contains: busqueda, mode: 'insensitive' } },
      { cliente: { nombres: { contains: busqueda, mode: 'insensitive' } } },
      { cliente: { apellidoPaterno: { contains: busqueda, mode: 'insensitive' } } },
      { cliente: { razonSocial: { contains: busqueda, mode: 'insensitive' } } },
      { vehiculo: { placa: { contains: busqueda, mode: 'insensitive' } } },
    ];
  }

  const [ordenes, total, conteos] = await Promise.all([
    prisma.ordenTrabajo.findMany({
      where,
      include: INCLUDE_OT,
      skip,
      take: porPagina,
      orderBy: { creadoEn: 'desc' },
    }),
    prisma.ordenTrabajo.count({ where }),
    prisma.ordenTrabajo.groupBy({
      by: ['estado'],
      _count: true,
    }),
  ]);

  return {
    datos: ordenes,
    total,
    pagina,
    porPagina,
    totalPaginas: Math.ceil(total / porPagina),
    conteosPorEstado: Object.fromEntries(conteos.map((c) => [c.estado, c._count])),
  };
}

export async function obtenerOrden(id: string) {
  const orden = await prisma.ordenTrabajo.findUnique({
    where: { id },
    include: INCLUDE_OT,
  });
  if (!orden) throw new AppError(404, 'Orden de trabajo no encontrada');
  return orden;
}

export async function crearOrden(data: any, usuarioId: string) {
  const vehiculo = await prisma.vehiculo.findUnique({ where: { id: data.vehiculoId } });
  if (!vehiculo) throw new AppError(400, 'Vehículo no encontrado');

  const numeroOrden = await generarNumeroOrden();

  const orden = await prisma.ordenTrabajo.create({
    data: {
      numeroOrden,
      vehiculoId: data.vehiculoId,
      clienteId: data.clienteId,
      recepcionistaId: usuarioId,
      mecanicoAsignadoId: data.mecanicoAsignadoId || null,
      sucursalId: data.sucursalId,
      estado: 'RECIBIDO',
      kilometrajeEntrada: data.kilometrajeEntrada,
      fechaEstimada: data.fechaEstimada ? new Date(data.fechaEstimada) : null,
      notasCliente: data.notasCliente || null,
      notasInternas: data.notasInternas || null,
    },
    include: INCLUDE_OT,
  });

  // Crear checklist
  if (data.checklist?.length > 0) {
    await prisma.oTChecklist.createMany({
      data: data.checklist.map((item: any) => ({
        ordenTrabajoId: orden.id,
        item: item.item,
        marcado: item.marcado || false,
        notas: item.notas || null,
      })),
    });
  }

  // Registrar historial
  await prisma.oTHistorialEstado.create({
    data: {
      ordenTrabajoId: orden.id,
      estadoAnterior: '',
      estadoNuevo: 'RECIBIDO',
      cambiadoPorId: usuarioId,
      notas: 'Orden de trabajo creada',
    },
  });

  // Actualizar kilometraje del vehículo
  await prisma.vehiculo.update({
    where: { id: data.vehiculoId },
    data: { kilometrajeActual: data.kilometrajeEntrada },
  });

  return obtenerOrden(orden.id);
}

export async function cambiarEstado(id: string, nuevoEstado: string, usuarioId: string, notas?: string) {
  const orden = await prisma.ordenTrabajo.findUnique({ where: { id } });
  if (!orden) throw new AppError(404, 'Orden de trabajo no encontrada');

  const transicionesPermitidas = TRANSICIONES[orden.estado] || [];
  if (!transicionesPermitidas.includes(nuevoEstado)) {
    throw new AppError(400, `No es posible cambiar de "${orden.estado}" a "${nuevoEstado}". Transiciones permitidas: ${transicionesPermitidas.join(', ') || 'ninguna'}`);
  }

  const updateData: any = { estado: nuevoEstado };
  if (nuevoEstado === 'ENTREGADO') {
    updateData.fechaEntrega = new Date();
  }

  await prisma.ordenTrabajo.update({ where: { id }, data: updateData });

  await prisma.oTHistorialEstado.create({
    data: {
      ordenTrabajoId: id,
      estadoAnterior: orden.estado,
      estadoNuevo: nuevoEstado,
      cambiadoPorId: usuarioId,
      notas: notas || null,
    },
  });

  // Notificar cambio de estado (no bloquea la respuesta)
  notificarCambioEstadoOT(id, nuevoEstado).catch(() => {});

  return obtenerOrden(id);
}

export async function actualizarDiagnostico(id: string, diagnostico: string) {
  const orden = await prisma.ordenTrabajo.findUnique({ where: { id } });
  if (!orden) throw new AppError(404, 'Orden de trabajo no encontrada');

  return prisma.ordenTrabajo.update({
    where: { id },
    data: { diagnostico },
    include: INCLUDE_OT,
  });
}

export async function agregarServicio(ordenId: string, data: any) {
  const subtotal = (data.cantidad || 1) * data.precioUnitario;
  const servicio = await prisma.oTServicio.create({
    data: {
      ordenTrabajoId: ordenId,
      servicioNombre: data.servicioNombre,
      servicioTipo: data.servicioTipo || 'CORRECTIVO',
      mecanicoId: data.mecanicoId || null,
      cantidad: data.cantidad || 1,
      precioUnitario: data.precioUnitario,
      subtotal,
      notas: data.notas || null,
    },
  });

  await recalcularTotal(ordenId);
  return servicio;
}

export async function agregarRepuesto(ordenId: string, data: any) {
  const subtotal = data.cantidad * data.costoUnitario;
  const repuesto = await prisma.oTRepuesto.create({
    data: {
      ordenTrabajoId: ordenId,
      repuestoNombre: data.repuestoNombre,
      cantidad: data.cantidad,
      costoUnitario: data.costoUnitario,
      subtotal,
    },
  });

  await recalcularTotal(ordenId);
  return repuesto;
}

async function recalcularTotal(ordenId: string) {
  const servicios = await prisma.oTServicio.findMany({ where: { ordenTrabajoId: ordenId } });
  const repuestos = await prisma.oTRepuesto.findMany({ where: { ordenTrabajoId: ordenId } });

  const totalServicios = servicios.reduce((sum, s) => sum + Number(s.subtotal), 0);
  const totalRepuestos = repuestos.reduce((sum, r) => sum + Number(r.subtotal), 0);

  await prisma.ordenTrabajo.update({
    where: { id: ordenId },
    data: { costoTotal: totalServicios + totalRepuestos },
  });
}
