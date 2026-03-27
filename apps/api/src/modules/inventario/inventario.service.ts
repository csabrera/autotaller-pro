import { prisma } from '../../core/database/prisma.js';
import { AppError } from '../../core/errors/AppError.js';

const INCLUDE = { categoria: true, unidad: true };

export async function listarRepuestos(pagina = 1, porPagina = 10, busqueda?: string, stockBajo?: boolean) {
  const skip = (pagina - 1) * porPagina;
  const where: any = {};
  if (busqueda) {
    where.OR = [
      { nombre: { contains: busqueda, mode: 'insensitive' } },
      { codigo: { contains: busqueda, mode: 'insensitive' } },
    ];
  }
  if (stockBajo) {
    where.stockActual = { lte: prisma.repuesto.fields.stockMinimo };
  }

  const [datos, total, totalStockBajo] = await Promise.all([
    prisma.repuesto.findMany({ where, include: INCLUDE, skip, take: porPagina, orderBy: { nombre: 'asc' } }),
    prisma.repuesto.count({ where }),
    prisma.$queryRawUnsafe<[{ count: bigint }]>('SELECT COUNT(*) as count FROM repuestos WHERE stock_actual <= stock_minimo AND activo = true'),
  ]);

  return { datos, total, pagina, porPagina, totalPaginas: Math.ceil(total / porPagina), totalStockBajo: Number(totalStockBajo[0]?.count || 0) };
}

export async function crearRepuesto(data: any) {
  const existe = await prisma.repuesto.findUnique({ where: { codigo: data.codigo } });
  if (existe) throw new AppError(409, 'Ya existe un repuesto con ese código');
  return prisma.repuesto.create({ data, include: INCLUDE });
}

export async function actualizarRepuesto(id: string, data: any) {
  const repuesto = await prisma.repuesto.findUnique({ where: { id } });
  if (!repuesto) throw new AppError(404, 'Repuesto no encontrado');
  return prisma.repuesto.update({ where: { id }, data, include: INCLUDE });
}

export async function registrarMovimiento(repuestoId: string, tipo: string, cantidad: number, referencia: string, usuarioId: string) {
  const repuesto = await prisma.repuesto.findUnique({ where: { id: repuestoId } });
  if (!repuesto) throw new AppError(404, 'Repuesto no encontrado');

  let nuevoStock = repuesto.stockActual;
  if (tipo === 'ENTRADA') nuevoStock += cantidad;
  else if (tipo === 'SALIDA') {
    if (repuesto.stockActual < cantidad) throw new AppError(400, 'Stock insuficiente');
    nuevoStock -= cantidad;
  } else {
    nuevoStock = cantidad;
  }

  const [movimiento] = await prisma.$transaction([
    prisma.movimientoStock.create({ data: { repuestoId, tipo, cantidad, referencia, usuarioId } }),
    prisma.repuesto.update({ where: { id: repuestoId }, data: { stockActual: nuevoStock } }),
  ]);

  // Alertar si el stock quedó por debajo del mínimo
  if (nuevoStock <= repuesto.stockMinimo) {
    import('../notificaciones/notificaciones.triggers.js')
      .then((m) => m.notificarStockBajo(repuestoId))
      .catch(() => {});
  }

  return movimiento;
}

export async function listarProveedores() {
  return prisma.proveedor.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } });
}

export async function crearProveedor(data: any) {
  return prisma.proveedor.create({ data });
}
