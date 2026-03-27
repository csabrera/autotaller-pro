import { prisma } from '../../core/database/prisma.js';
import { AppError } from '../../core/errors/AppError.js';

const INCLUDE = { categoria: true, especialidad: true };

export async function listarServicios(pagina = 1, porPagina = 10, busqueda?: string, tipo?: string) {
  const skip = (pagina - 1) * porPagina;
  const where: any = {};
  if (busqueda) where.nombre = { contains: busqueda, mode: 'insensitive' };
  if (tipo) where.tipoServicio = tipo;

  const [datos, total] = await Promise.all([
    prisma.servicio.findMany({ where, include: INCLUDE, skip, take: porPagina, orderBy: { nombre: 'asc' } }),
    prisma.servicio.count({ where }),
  ]);

  return { datos, total, pagina, porPagina, totalPaginas: Math.ceil(total / porPagina) };
}

export async function listarServiciosActivos() {
  return prisma.servicio.findMany({ where: { activo: true }, include: INCLUDE, orderBy: { nombre: 'asc' } });
}

export async function crearServicio(data: any) {
  return prisma.servicio.create({ data, include: INCLUDE });
}

export async function actualizarServicio(id: string, data: any) {
  const servicio = await prisma.servicio.findUnique({ where: { id } });
  if (!servicio) throw new AppError(404, 'Servicio no encontrado');
  return prisma.servicio.update({ where: { id }, data, include: INCLUDE });
}

export async function toggleActivoServicio(id: string) {
  const servicio = await prisma.servicio.findUnique({ where: { id } });
  if (!servicio) throw new AppError(404, 'Servicio no encontrado');
  return prisma.servicio.update({ where: { id }, data: { activo: !servicio.activo } });
}
