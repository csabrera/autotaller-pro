import { prisma } from '../../core/database/prisma.js';
import { AppError } from '../../core/errors/AppError.js';

const INCLUDE_VEHICULO = {
  cliente: true,
  marca: true,
  modelo: true,
  color: true,
  combustible: true,
  transmision: true,
  tipoVehiculo: true,
};

export async function listarVehiculosPorCliente(clienteId: string) {
  return prisma.vehiculo.findMany({
    where: { clienteId },
    include: INCLUDE_VEHICULO,
    orderBy: { creadoEn: 'desc' },
  });
}

export async function obtenerVehiculo(id: string) {
  const vehiculo = await prisma.vehiculo.findUnique({
    where: { id },
    include: INCLUDE_VEHICULO,
  });
  if (!vehiculo) throw new AppError(404, 'Vehículo no encontrado');
  return vehiculo;
}

export async function crearVehiculo(data: any) {
  const existePlaca = await prisma.vehiculo.findUnique({ where: { placa: data.placa } });
  if (existePlaca) throw new AppError(409, 'Ya existe un vehículo con esa placa');

  const cliente = await prisma.cliente.findUnique({ where: { id: data.clienteId } });
  if (!cliente) throw new AppError(400, 'Cliente no encontrado');

  return prisma.vehiculo.create({
    data: {
      clienteId: data.clienteId,
      marcaId: data.marcaId,
      modeloId: data.modeloId,
      anio: data.anio,
      placa: data.placa.toUpperCase(),
      vin: data.vin || null,
      colorId: data.colorId,
      combustibleId: data.combustibleId,
      transmisionId: data.transmisionId || null,
      tipoVehiculoId: data.tipoVehiculoId || null,
      kilometrajeActual: data.kilometrajeActual || 0,
      notas: data.notas || null,
    },
    include: INCLUDE_VEHICULO,
  });
}

export async function actualizarVehiculo(id: string, data: any) {
  const vehiculo = await prisma.vehiculo.findUnique({ where: { id } });
  if (!vehiculo) throw new AppError(404, 'Vehículo no encontrado');

  return prisma.vehiculo.update({
    where: { id },
    data,
    include: INCLUDE_VEHICULO,
  });
}
