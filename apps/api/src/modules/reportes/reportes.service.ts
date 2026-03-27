import { prisma } from '../../core/database/prisma.js';

export async function obtenerDashboard() {
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);

  const [
    vehiculosEnTaller,
    otPorEstado,
    ingresosMes,
    ingresosMesAnterior,
    stockBajo,
    otRecientes,
    serviciosMasSolicitados,
    totalClientes,
    totalVehiculos,
  ] = await Promise.all([
    // Vehículos en taller (OT no entregadas ni canceladas)
    prisma.ordenTrabajo.count({
      where: { estado: { notIn: ['ENTREGADO', 'CANCELADO'] } },
    }),

    // OT por estado
    prisma.ordenTrabajo.groupBy({
      by: ['estado'],
      _count: true,
    }),

    // Ingresos del mes (facturas pagadas/parciales)
    prisma.pago.aggregate({
      _sum: { monto: true },
      where: { pagadoEn: { gte: inicioMes } },
    }),

    // Ingresos mes anterior
    prisma.pago.aggregate({
      _sum: { monto: true },
      where: { pagadoEn: { gte: inicioMesAnterior, lte: finMesAnterior } },
    }),

    // Repuestos con stock bajo
    prisma.$queryRawUnsafe<[{ count: bigint }]>(
      'SELECT COUNT(*) as count FROM repuestos WHERE stock_actual <= stock_minimo AND activo = true'
    ),

    // Últimas 5 OT
    prisma.ordenTrabajo.findMany({
      include: {
        vehiculo: { include: { marca: true, modelo: true } },
        cliente: true,
      },
      orderBy: { creadoEn: 'desc' },
      take: 5,
    }),

    // Top 5 servicios más solicitados
    prisma.oTServicio.groupBy({
      by: ['servicioNombre'],
      _count: true,
      orderBy: { _count: { servicioNombre: 'desc' } },
      take: 5,
    }),

    // Total clientes activos
    prisma.cliente.count({ where: { activo: true } }),

    // Total vehículos
    prisma.vehiculo.count({ where: { activo: true } }),
  ]);

  const ingresoActual = Number(ingresosMes._sum.monto || 0);
  const ingresoAnterior = Number(ingresosMesAnterior._sum.monto || 0);
  const variacionIngresos = ingresoAnterior > 0
    ? Math.round(((ingresoActual - ingresoAnterior) / ingresoAnterior) * 100)
    : 0;

  const conteoEstados = Object.fromEntries(otPorEstado.map((e) => [e.estado, e._count]));
  const otAbiertas = (conteoEstados['RECIBIDO'] || 0) + (conteoEstados['EN_PROCESO'] || 0);

  return {
    kpis: {
      vehiculosEnTaller,
      otAbiertas,
      ingresosMes: ingresoActual,
      variacionIngresos,
      stockBajo: Number(stockBajo[0]?.count || 0),
      totalClientes,
      totalVehiculos,
    },
    conteoEstados,
    otRecientes: otRecientes.map((ot) => ({
      id: ot.id,
      numeroOrden: ot.numeroOrden,
      estado: ot.estado,
      placa: ot.vehiculo.placa,
      marca: ot.vehiculo.marca.nombre,
      modelo: ot.vehiculo.modelo.nombre,
      cliente: ot.cliente.tipoCliente === 'PERSONA'
        ? `${ot.cliente.nombres} ${ot.cliente.apellidoPaterno}`
        : ot.cliente.razonSocial,
      costoTotal: Number(ot.costoTotal),
      fechaEntrada: ot.fechaEntrada,
    })),
    serviciosTop: serviciosMasSolicitados.map((s) => ({
      nombre: s.servicioNombre,
      cantidad: s._count,
    })),
  };
}

export async function reporteIngresos(periodo: 'semana' | 'mes' | 'anio') {
  const hoy = new Date();
  let desde: Date;

  if (periodo === 'semana') {
    desde = new Date(hoy);
    desde.setDate(desde.getDate() - 7);
  } else if (periodo === 'mes') {
    desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  } else {
    desde = new Date(hoy.getFullYear(), 0, 1);
  }

  const pagos = await prisma.pago.findMany({
    where: { pagadoEn: { gte: desde } },
    include: { metodoPago: true, factura: { include: { cliente: true } } },
    orderBy: { pagadoEn: 'desc' },
  });

  const totalIngresos = pagos.reduce((s, p) => s + Number(p.monto), 0);

  // Agrupar por método de pago
  const porMetodo: Record<string, number> = {};
  pagos.forEach((p) => {
    const metodo = p.metodoPago.nombre;
    porMetodo[metodo] = (porMetodo[metodo] || 0) + Number(p.monto);
  });

  // Agrupar por día
  const porDia: Record<string, number> = {};
  pagos.forEach((p) => {
    const dia = new Date(p.pagadoEn).toLocaleDateString('es-PE');
    porDia[dia] = (porDia[dia] || 0) + Number(p.monto);
  });

  return {
    totalIngresos,
    cantidadPagos: pagos.length,
    porMetodo: Object.entries(porMetodo).map(([nombre, monto]) => ({ nombre, monto })),
    porDia: Object.entries(porDia).map(([fecha, monto]) => ({ fecha, monto })),
    detalle: pagos.slice(0, 20).map((p) => ({
      id: p.id,
      monto: Number(p.monto),
      metodo: p.metodoPago.nombre,
      referencia: p.referencia,
      fecha: p.pagadoEn,
      factura: p.factura.numeroFactura,
      cliente: p.factura.cliente.tipoCliente === 'PERSONA'
        ? `${p.factura.cliente.nombres} ${p.factura.cliente.apellidoPaterno}`
        : p.factura.cliente.razonSocial,
    })),
  };
}
