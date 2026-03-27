import { prisma } from '../../core/database/prisma.js';
import { AppError } from '../../core/errors/AppError.js';

/**
 * Login del cliente: solo DNI + teléfono (sin contraseña)
 */
export async function loginCliente(numeroDocumento: string, telefono: string) {
  const cliente = await prisma.cliente.findUnique({
    where: { numeroDocumento },
    include: { vehiculos: { include: { marca: true, modelo: true, color: true } } },
  });

  if (!cliente) {
    throw new AppError(401, 'No encontramos un cliente con ese número de documento. Verifique e intente nuevamente.');
  }

  if (cliente.telefono !== telefono) {
    throw new AppError(401, 'El teléfono no coincide con nuestros registros. Verifique e intente nuevamente.');
  }

  if (!cliente.activo) {
    throw new AppError(403, 'Su cuenta se encuentra deshabilitada. Contacte al taller para más información.');
  }

  return {
    id: cliente.id,
    tipoCliente: cliente.tipoCliente,
    nombres: cliente.nombres,
    apellidoPaterno: cliente.apellidoPaterno,
    razonSocial: cliente.razonSocial,
    telefono: cliente.telefono,
    correo: cliente.correo,
    numeroDocumento: cliente.numeroDocumento,
    vehiculos: cliente.vehiculos,
  };
}

/**
 * Mis vehículos con estado actual (si tienen OT abierta)
 */
export async function misVehiculos(clienteId: string) {
  const vehiculos = await prisma.vehiculo.findMany({
    where: { clienteId, activo: true },
    include: {
      marca: true,
      modelo: true,
      color: true,
      combustible: true,
      transmision: true,
    },
    orderBy: { creadoEn: 'desc' },
  });

  // Para cada vehículo, buscar si tiene OT abierta
  const vehiculosConEstado = await Promise.all(
    vehiculos.map(async (v) => {
      const otAbierta = await prisma.ordenTrabajo.findFirst({
        where: {
          vehiculoId: v.id,
          estado: { in: ['RECIBIDO', 'EN_PROCESO'] },
        },
        select: { id: true, numeroOrden: true, estado: true, fechaEntrada: true },
        orderBy: { creadoEn: 'desc' },
      });
      return { ...v, otAbierta };
    }),
  );

  return vehiculosConEstado;
}

/**
 * Historial de OTs del cliente
 */
export async function misOrdenes(clienteId: string) {
  return prisma.ordenTrabajo.findMany({
    where: { clienteId },
    include: {
      vehiculo: { include: { marca: true, modelo: true } },
      servicios: true,
      repuestos: true,
      sucursal: true,
    },
    orderBy: { creadoEn: 'desc' },
    take: 20,
  });
}

/**
 * Facturas del cliente
 */
export async function misFacturas(clienteId: string) {
  return prisma.factura.findMany({
    where: { clienteId },
    include: {
      pagos: { include: { metodoPago: true } },
    },
    orderBy: { creadoEn: 'desc' },
    take: 20,
  });
}

/**
 * Citas del cliente
 */
export async function misCitas(clienteId: string) {
  return prisma.cita.findMany({
    where: { clienteId },
    include: {
      vehiculo: { include: { marca: true, modelo: true } },
      servicio: true,
      mecanico: true,
      sucursal: true,
    },
    orderBy: { fechaProgramada: 'desc' },
    take: 20,
  });
}

/**
 * Agendar cita desde el portal (solo fecha + servicio + vehículo)
 */
export async function agendarCitaPortal(clienteId: string, data: {
  vehiculoId: string;
  servicioId?: string;
  fechaProgramada: string;
  duracionMinutos?: number;
  notas?: string;
}) {
  // Validar vehículo del cliente
  const vehiculo = await prisma.vehiculo.findUnique({ where: { id: data.vehiculoId } });
  if (!vehiculo || vehiculo.clienteId !== clienteId) {
    throw new AppError(400, 'El vehículo seleccionado no es válido');
  }

  // Obtener sucursal principal
  const sucursal = await prisma.sucursal.findFirst({ where: { esPrincipal: true } });
  if (!sucursal) throw new AppError(500, 'No se encontró la sucursal principal');

  // Generar número de cita
  const anio = new Date().getFullYear();
  const prefijo = `CIT-${anio}-`;
  const ultima = await prisma.cita.findFirst({
    where: { numeroCita: { startsWith: prefijo } },
    orderBy: { numeroCita: 'desc' },
  });
  const ultimoNum = ultima ? parseInt(ultima.numeroCita.replace(prefijo, ''), 10) : 0;
  const numeroCita = `${prefijo}${String(ultimoNum + 1).padStart(4, '0')}`;

  // Buscar un usuario recepcionista para asignar como creador
  const recepcionista = await prisma.usuario.findFirst({
    where: { activo: true, rol: { nombre: { in: ['RECEPCIONISTA', 'ADMIN'] } } },
  });
  if (!recepcionista) throw new AppError(500, 'No hay usuarios disponibles para procesar la cita');

  return prisma.cita.create({
    data: {
      numeroCita,
      clienteId,
      vehiculoId: data.vehiculoId,
      servicioId: data.servicioId || null,
      mecanicoId: null,
      sucursalId: sucursal.id,
      fechaProgramada: new Date(data.fechaProgramada),
      duracionMinutos: data.duracionMinutos || 60,
      estado: 'PROGRAMADA',
      notas: data.notas || null,
      creadoPorId: recepcionista.id,
    },
    include: {
      vehiculo: { include: { marca: true, modelo: true } },
      servicio: true,
      sucursal: true,
    },
  });
}

/**
 * Dashboard resumen del cliente
 */
export async function resumenCliente(clienteId: string) {
  const [vehiculos, otAbiertas, facturasPendientes, citasProximas] = await Promise.all([
    prisma.vehiculo.count({ where: { clienteId, activo: true } }),
    prisma.ordenTrabajo.count({
      where: { clienteId, estado: { in: ['RECIBIDO', 'EN_PROCESO'] } },
    }),
    prisma.factura.count({
      where: { clienteId, estado: { in: ['EMITIDA', 'PARCIAL'] } },
    }),
    prisma.cita.count({
      where: {
        clienteId,
        estado: { in: ['PROGRAMADA', 'CONFIRMADA'] },
        fechaProgramada: { gte: new Date() },
      },
    }),
  ]);

  return { vehiculos, otAbiertas, facturasPendientes, citasProximas };
}
