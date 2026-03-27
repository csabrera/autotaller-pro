import { prisma } from '../../core/database/prisma.js';
import { AppError } from '../../core/errors/AppError.js';
import { notificarCitaCreada, notificarCitaConfirmada } from '../notificaciones/notificaciones.triggers.js';

const TRANSICIONES: Record<string, string[]> = {
  PROGRAMADA: ['CONFIRMADA', 'CANCELADA'],
  CONFIRMADA: ['EN_PROCESO', 'CANCELADA', 'NO_ASISTIO'],
  EN_PROCESO: ['COMPLETADA', 'CANCELADA'],
  COMPLETADA: [],
  CANCELADA: [],
  NO_ASISTIO: [],
};

const INCLUDE_CITA = {
  cliente: true,
  vehiculo: { include: { marca: true, modelo: true, color: true } },
  servicio: true,
  mecanico: true,
  sucursal: true,
  creadoPor: true,
};

async function generarNumeroCita(): Promise<string> {
  const anio = new Date().getFullYear();
  const prefijo = `CIT-${anio}-`;

  const ultima = await prisma.cita.findFirst({
    where: { numeroCita: { startsWith: prefijo } },
    orderBy: { numeroCita: 'desc' },
  });

  if (!ultima) return `${prefijo}0001`;

  const ultimoNum = parseInt(ultima.numeroCita.replace(prefijo, ''), 10);
  return `${prefijo}${String(ultimoNum + 1).padStart(4, '0')}`;
}

export async function listarCitas(
  pagina = 1,
  porPagina = 10,
  estado?: string,
  busqueda?: string,
  fechaDesde?: string,
  fechaHasta?: string,
  mecanicoId?: string,
) {
  const skip = (pagina - 1) * porPagina;
  const where: any = {};

  if (estado) where.estado = estado;
  if (mecanicoId) where.mecanicoId = mecanicoId;

  if (fechaDesde || fechaHasta) {
    where.fechaProgramada = {};
    if (fechaDesde) where.fechaProgramada.gte = new Date(fechaDesde);
    if (fechaHasta) where.fechaProgramada.lte = new Date(fechaHasta);
  }

  if (busqueda) {
    where.OR = [
      { numeroCita: { contains: busqueda, mode: 'insensitive' } },
      { cliente: { nombres: { contains: busqueda, mode: 'insensitive' } } },
      { cliente: { apellidoPaterno: { contains: busqueda, mode: 'insensitive' } } },
      { cliente: { razonSocial: { contains: busqueda, mode: 'insensitive' } } },
      { vehiculo: { placa: { contains: busqueda, mode: 'insensitive' } } },
    ];
  }

  const [citas, total, conteos] = await Promise.all([
    prisma.cita.findMany({
      where,
      include: INCLUDE_CITA,
      skip,
      take: porPagina,
      orderBy: { fechaProgramada: 'asc' },
    }),
    prisma.cita.count({ where }),
    prisma.cita.groupBy({
      by: ['estado'],
      _count: true,
    }),
  ]);

  return {
    datos: citas,
    total,
    pagina,
    porPagina,
    totalPaginas: Math.ceil(total / porPagina),
    conteosPorEstado: Object.fromEntries(conteos.map((c) => [c.estado, c._count])),
  };
}

export async function obtenerCita(id: string) {
  const cita = await prisma.cita.findUnique({
    where: { id },
    include: INCLUDE_CITA,
  });
  if (!cita) throw new AppError(404, 'Cita no encontrada');
  return cita;
}

export async function crearCita(data: any, usuarioId: string) {
  // Validar cliente
  const cliente = await prisma.cliente.findUnique({ where: { id: data.clienteId } });
  if (!cliente) throw new AppError(400, 'El cliente seleccionado no existe');

  // Validar vehiculo
  const vehiculo = await prisma.vehiculo.findUnique({ where: { id: data.vehiculoId } });
  if (!vehiculo) throw new AppError(400, 'El vehículo seleccionado no existe');

  // Validar que el vehiculo pertenezca al cliente
  if (vehiculo.clienteId !== data.clienteId) {
    throw new AppError(400, 'El vehículo no pertenece al cliente seleccionado');
  }

  // Verificar disponibilidad si se asigna mecanico
  if (data.mecanicoId) {
    const conflictos = await verificarDisponibilidad(
      data.fechaProgramada,
      data.duracionMinutos || 60,
      data.mecanicoId,
    );
    if (conflictos.length > 0) {
      const detalle = conflictos.map((c) => c.mensaje).join('. ');
      throw new AppError(409, `Hay conflictos de horario: ${detalle}`);
    }
  }

  // Obtener sucursal del usuario
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) throw new AppError(400, 'Usuario no encontrado');

  const numeroCita = await generarNumeroCita();

  const cita = await prisma.cita.create({
    data: {
      numeroCita,
      clienteId: data.clienteId,
      vehiculoId: data.vehiculoId,
      servicioId: data.servicioId || null,
      mecanicoId: data.mecanicoId || null,
      sucursalId: usuario.sucursalId,
      fechaProgramada: new Date(data.fechaProgramada),
      duracionMinutos: data.duracionMinutos || 60,
      estado: 'PROGRAMADA',
      notas: data.notas || null,
      creadoPorId: usuarioId,
    },
    include: INCLUDE_CITA,
  });

  // Notificar al mecánico asignado (no bloquea la respuesta)
  notificarCitaCreada(cita.id).catch(() => {});

  return cita;
}

export async function actualizarCita(id: string, data: any) {
  const cita = await prisma.cita.findUnique({ where: { id } });
  if (!cita) throw new AppError(404, 'Cita no encontrada');

  if (!['PROGRAMADA', 'CONFIRMADA'].includes(cita.estado)) {
    throw new AppError(400, 'Solo se pueden editar citas en estado Programada o Confirmada');
  }

  // Verificar disponibilidad si cambia mecanico o fecha
  const nuevaFecha = data.fechaProgramada ? new Date(data.fechaProgramada) : cita.fechaProgramada;
  const nuevaDuracion = data.duracionMinutos || cita.duracionMinutos;
  const nuevoMecanico = data.mecanicoId !== undefined ? data.mecanicoId : cita.mecanicoId;

  if (nuevoMecanico) {
    const conflictos = await verificarDisponibilidad(
      nuevaFecha.toISOString(),
      nuevaDuracion,
      nuevoMecanico,
      id, // excluir esta misma cita
    );
    if (conflictos.length > 0) {
      const detalle = conflictos.map((c) => c.mensaje).join('. ');
      throw new AppError(409, `Hay conflictos de horario: ${detalle}`);
    }
  }

  return prisma.cita.update({
    where: { id },
    data: {
      clienteId: data.clienteId,
      vehiculoId: data.vehiculoId,
      servicioId: data.servicioId !== undefined ? data.servicioId : undefined,
      mecanicoId: data.mecanicoId !== undefined ? data.mecanicoId : undefined,
      fechaProgramada: data.fechaProgramada ? new Date(data.fechaProgramada) : undefined,
      duracionMinutos: data.duracionMinutos,
      notas: data.notas !== undefined ? data.notas : undefined,
    },
    include: INCLUDE_CITA,
  });
}

export async function cambiarEstadoCita(id: string, nuevoEstado: string) {
  const cita = await prisma.cita.findUnique({ where: { id } });
  if (!cita) throw new AppError(404, 'Cita no encontrada');

  const transicionesPermitidas = TRANSICIONES[cita.estado] || [];
  if (!transicionesPermitidas.includes(nuevoEstado)) {
    throw new AppError(
      400,
      `No es posible cambiar de "${cita.estado}" a "${nuevoEstado}". Cambios permitidos: ${transicionesPermitidas.join(', ') || 'ninguno'}`,
    );
  }

  const citaActualizada = await prisma.cita.update({
    where: { id },
    data: { estado: nuevoEstado },
    include: INCLUDE_CITA,
  });

  // Notificar cuando se confirma la cita
  if (nuevoEstado === 'CONFIRMADA') {
    notificarCitaConfirmada(id).catch(() => {});
  }

  return citaActualizada;
}

export async function citasDelDia(fecha?: string) {
  const dia = fecha ? new Date(fecha) : new Date();
  const inicio = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate());
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 1);

  return prisma.cita.findMany({
    where: {
      fechaProgramada: { gte: inicio, lt: fin },
      estado: { notIn: ['CANCELADA'] },
    },
    include: INCLUDE_CITA,
    orderBy: { fechaProgramada: 'asc' },
  });
}

export async function verificarDisponibilidad(
  fechaProgramada: string,
  duracionMinutos: number,
  mecanicoId?: string | null,
  excluirCitaId?: string,
) {
  const inicio = new Date(fechaProgramada);
  const fin = new Date(inicio.getTime() + duracionMinutos * 60 * 1000);

  const conflictos: { tipo: string; mensaje: string }[] = [];

  const baseWhere: any = {
    estado: { notIn: ['CANCELADA', 'COMPLETADA', 'NO_ASISTIO'] },
    ...(excluirCitaId ? { id: { not: excluirCitaId } } : {}),
  };

  // Verificar conflicto de mecanico
  if (mecanicoId) {
    const citasMecanico = await prisma.cita.findMany({
      where: {
        ...baseWhere,
        mecanicoId,
        fechaProgramada: { lt: fin },
      },
      include: { mecanico: true },
    });

    const conflictosMecanico = citasMecanico.filter((c) => {
      const finExistente = new Date(c.fechaProgramada.getTime() + c.duracionMinutos * 60 * 1000);
      return inicio < finExistente && fin > c.fechaProgramada;
    });

    if (conflictosMecanico.length > 0) {
      conflictos.push({
        tipo: 'MECANICO',
        mensaje: `El mecánico ${conflictosMecanico[0].mecanico?.nombres || ''} ya tiene una cita en ese horario`,
      });
    }
  }

  return conflictos;
}
