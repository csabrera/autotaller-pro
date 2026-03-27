import { prisma } from '../../core/database/prisma.js';
import { AppError } from '../../core/errors/AppError.js';

const INCLUDE_CLIENTE = { vehiculos: { include: { marca: true, modelo: true, color: true } } };

function formatCliente(c: any) {
  const nombre = c.tipoCliente === 'PERSONA'
    ? `${c.nombres} ${c.apellidoPaterno} ${c.apellidoMaterno}`
    : c.razonSocial;
  return { ...c, nombreCompleto: nombre };
}

export async function listarClientes(pagina = 1, porPagina = 10, busqueda?: string) {
  const skip = (pagina - 1) * porPagina;
  const where: any = {};

  if (busqueda) {
    where.OR = [
      { nombres: { contains: busqueda, mode: 'insensitive' } },
      { apellidoPaterno: { contains: busqueda, mode: 'insensitive' } },
      { apellidoMaterno: { contains: busqueda, mode: 'insensitive' } },
      { razonSocial: { contains: busqueda, mode: 'insensitive' } },
      { numeroDocumento: { contains: busqueda } },
      { telefono: { contains: busqueda } },
      { vehiculos: { some: { placa: { contains: busqueda, mode: 'insensitive' } } } },
    ];
  }

  const [clientes, total] = await Promise.all([
    prisma.cliente.findMany({
      where,
      include: INCLUDE_CLIENTE,
      skip,
      take: porPagina,
      orderBy: { creadoEn: 'desc' },
    }),
    prisma.cliente.count({ where }),
  ]);

  return {
    datos: clientes.map(formatCliente),
    total,
    pagina,
    porPagina,
    totalPaginas: Math.ceil(total / porPagina),
  };
}

export async function obtenerCliente(id: string) {
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: INCLUDE_CLIENTE,
  });
  if (!cliente) throw new AppError(404, 'Cliente no encontrado');
  return formatCliente(cliente);
}

export async function buscarClienteRapido(termino: string) {
  const clientes = await prisma.cliente.findMany({
    where: {
      activo: true,
      OR: [
        { nombres: { contains: termino, mode: 'insensitive' } },
        { apellidoPaterno: { contains: termino, mode: 'insensitive' } },
        { razonSocial: { contains: termino, mode: 'insensitive' } },
        { numeroDocumento: { contains: termino } },
        { telefono: { contains: termino } },
        { vehiculos: { some: { placa: { contains: termino, mode: 'insensitive' } } } },
      ],
    },
    include: INCLUDE_CLIENTE,
    take: 10,
  });
  return clientes.map(formatCliente);
}

export async function crearCliente(data: any) {
  const existe = await prisma.cliente.findUnique({
    where: { numeroDocumento: data.numeroDocumento },
  });
  if (existe) throw new AppError(409, 'Ya existe un cliente con ese número de documento');

  const cliente = await prisma.cliente.create({
    data,
    include: INCLUDE_CLIENTE,
  });
  return formatCliente(cliente);
}

export async function actualizarCliente(id: string, data: any) {
  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) throw new AppError(404, 'Cliente no encontrado');

  const actualizado = await prisma.cliente.update({
    where: { id },
    data,
    include: INCLUDE_CLIENTE,
  });
  return formatCliente(actualizado);
}

export async function toggleActivoCliente(id: string) {
  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) throw new AppError(404, 'Cliente no encontrado');

  return prisma.cliente.update({
    where: { id },
    data: { activo: !cliente.activo },
  });
}
