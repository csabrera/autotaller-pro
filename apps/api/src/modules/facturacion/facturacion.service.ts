import { prisma } from '../../core/database/prisma.js';
import { AppError } from '../../core/errors/AppError.js';

async function generarNumero(prefijo: string, campo: string, modelo: any): Promise<string> {
  const anio = new Date().getFullYear();
  const pre = `${prefijo}-${anio}-`;
  const ultima = await modelo.findFirst({
    where: { [campo]: { startsWith: pre } },
    orderBy: { [campo]: 'desc' },
  });
  if (!ultima) return `${pre}0001`;
  const num = parseInt(ultima[campo].replace(pre, ''), 10);
  return `${pre}${String(num + 1).padStart(4, '0')}`;
}

export async function generarFacturaDesdeOT(ordenTrabajoId: string, tipoDocumento: string) {
  const ot = await prisma.ordenTrabajo.findUnique({
    where: { id: ordenTrabajoId },
    include: { servicios: true, repuestos: true, cliente: true },
  });
  if (!ot) throw new AppError(404, 'Orden de trabajo no encontrada');

  const existente = await prisma.factura.findFirst({ where: { ordenTrabajoId } });
  if (existente) throw new AppError(409, 'Ya existe una factura para esta orden');

  const subtotal = Number(ot.costoTotal);
  const tasaImpuesto = 18;
  const montoImpuesto = subtotal * (tasaImpuesto / 100);
  const total = subtotal + montoImpuesto;

  const numeroFactura = await generarNumero('FAC', 'numeroFactura', prisma.factura);

  return prisma.factura.create({
    data: {
      numeroFactura,
      ordenTrabajoId,
      clienteId: ot.clienteId,
      tipoDocumento,
      subtotal,
      tasaImpuesto,
      montoImpuesto,
      total,
      estado: 'EMITIDA',
      emitidaEn: new Date(),
    },
    include: { cliente: true, pagos: { include: { metodoPago: true } } },
  });
}

export async function listarFacturas(pagina = 1, porPagina = 10, estado?: string, busqueda?: string) {
  const skip = (pagina - 1) * porPagina;
  const where: any = {};
  if (estado) where.estado = estado;
  if (busqueda) {
    where.OR = [
      { numeroFactura: { contains: busqueda, mode: 'insensitive' } },
      { cliente: { nombres: { contains: busqueda, mode: 'insensitive' } } },
      { cliente: { razonSocial: { contains: busqueda, mode: 'insensitive' } } },
    ];
  }

  const [datos, total] = await Promise.all([
    prisma.factura.findMany({
      where,
      include: { cliente: true, pagos: { include: { metodoPago: true } } },
      skip, take: porPagina, orderBy: { creadoEn: 'desc' },
    }),
    prisma.factura.count({ where }),
  ]);

  return { datos, total, pagina, porPagina, totalPaginas: Math.ceil(total / porPagina) };
}

export async function obtenerFactura(id: string) {
  const factura = await prisma.factura.findUnique({
    where: { id },
    include: { cliente: true, pagos: { include: { metodoPago: true } } },
  });
  if (!factura) throw new AppError(404, 'Factura no encontrada');
  return factura;
}

export async function registrarPago(facturaId: string, metodoPagoId: string, monto: number, referencia: string, recibidoPorId: string) {
  const factura = await prisma.factura.findUnique({
    where: { id: facturaId },
    include: { pagos: true },
  });
  if (!factura) throw new AppError(404, 'Factura no encontrada');
  if (factura.estado === 'PAGADA') throw new AppError(400, 'La factura ya está completamente pagada');
  if (factura.estado === 'ANULADA') throw new AppError(400, 'No se puede pagar una factura anulada');

  const totalPagado = factura.pagos.reduce((sum, p) => sum + Number(p.monto), 0) + monto;
  const totalFactura = Number(factura.total);

  const nuevoEstado = totalPagado >= totalFactura ? 'PAGADA' : 'PARCIAL';

  const [pago] = await prisma.$transaction([
    prisma.pago.create({
      data: { facturaId, metodoPagoId, monto, referencia: referencia || null, recibidoPorId },
      include: { metodoPago: true },
    }),
    prisma.factura.update({ where: { id: facturaId }, data: { estado: nuevoEstado } }),
  ]);

  // Notificar si la factura quedó pagada
  if (nuevoEstado === 'PAGADA') {
    import('../notificaciones/notificaciones.triggers.js')
      .then((m) => m.notificarFacturaPagada(facturaId))
      .catch(() => {});
  }

  return { pago, estadoFactura: nuevoEstado, totalPagado, totalFactura };
}

export async function anularFactura(id: string) {
  const factura = await prisma.factura.findUnique({ where: { id } });
  if (!factura) throw new AppError(404, 'Factura no encontrada');
  if (factura.estado === 'PAGADA') throw new AppError(400, 'No se puede anular una factura pagada');

  return prisma.factura.update({ where: { id }, data: { estado: 'ANULADA' } });
}
