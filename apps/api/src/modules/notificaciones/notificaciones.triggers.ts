import { prisma } from '../../core/database/prisma.js';
import { crearNotificacion, crearNotificacionMasiva } from './notificaciones.service.js';

/**
 * Notifica al mecánico asignado cuando se crea una cita
 */
export async function notificarCitaCreada(citaId: string) {
  const cita = await prisma.cita.findUnique({
    where: { id: citaId },
    include: { cliente: true, vehiculo: { include: { marca: true, modelo: true } }, mecanico: true, servicio: true },
  });
  if (!cita || !cita.mecanicoId) return;

  const fecha = cita.fechaProgramada.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const hora = cita.fechaProgramada.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  const clienteNombre = cita.cliente.nombres
    ? `${cita.cliente.nombres} ${cita.cliente.apellidoPaterno}`
    : cita.cliente.razonSocial;
  const vehiculo = `${cita.vehiculo.marca.nombre} ${cita.vehiculo.modelo.nombre}`;

  await crearNotificacion({
    usuarioId: cita.mecanicoId,
    titulo: 'Nueva cita asignada',
    mensaje: `Cita ${cita.numeroCita} programada para ${fecha} a las ${hora}. Cliente: ${clienteNombre} - ${vehiculo}${cita.servicio ? ` (${cita.servicio.nombre})` : ''}`,
    enlace: `agenda:${cita.id}`,
  });
}

/**
 * Notifica al mecánico y recepcionistas cuando se confirma una cita
 */
export async function notificarCitaConfirmada(citaId: string) {
  const cita = await prisma.cita.findUnique({
    where: { id: citaId },
    include: { cliente: true, vehiculo: { include: { marca: true, modelo: true } } },
  });
  if (!cita) return;

  const clienteNombre = cita.cliente.nombres
    ? `${cita.cliente.nombres} ${cita.cliente.apellidoPaterno}`
    : cita.cliente.razonSocial;
  const vehiculo = `${cita.vehiculo.marca.nombre} ${cita.vehiculo.modelo.nombre}`;
  const hora = cita.fechaProgramada.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  const destinatarios: string[] = [];

  if (cita.mecanicoId) destinatarios.push(cita.mecanicoId);

  // Notificar a recepcionistas de la misma sucursal
  const recepcionistas = await prisma.usuario.findMany({
    where: {
      sucursalId: cita.sucursalId,
      activo: true,
      rol: { nombre: 'RECEPCIONISTA' },
    },
    select: { id: true },
  });
  recepcionistas.forEach((r) => {
    if (!destinatarios.includes(r.id)) destinatarios.push(r.id);
  });

  if (destinatarios.length > 0) {
    await crearNotificacionMasiva(destinatarios, {
      titulo: 'Cita confirmada',
      mensaje: `${clienteNombre} confirmó su cita de las ${hora} - ${vehiculo}`,
      enlace: `agenda:${cita.id}`,
    });
  }
}

/**
 * Notifica al creador de la OT cuando cambia de estado
 */
export async function notificarCambioEstadoOT(ordenId: string, nuevoEstado: string) {
  const orden = await prisma.ordenTrabajo.findUnique({
    where: { id: ordenId },
    include: { vehiculo: { include: { marca: true, modelo: true } }, cliente: true },
  });
  if (!orden) return;

  const etiquetas: Record<string, string> = {
    EN_PROCESO: 'En Proceso',
    ENTREGADO: 'Entregado',
    CANCELADO: 'Cancelado',
  };

  const vehiculo = `${orden.vehiculo.marca.nombre} ${orden.vehiculo.modelo.nombre}`;

  await crearNotificacion({
    usuarioId: orden.recepcionistaId,
    titulo: `OT ${orden.numeroOrden} - ${etiquetas[nuevoEstado] || nuevoEstado}`,
    mensaje: `La orden ${orden.numeroOrden} (${vehiculo} - ${orden.vehiculo.placa}) pasó a estado ${etiquetas[nuevoEstado] || nuevoEstado}`,
    enlace: `detalle-ot:${orden.id}`,
  });
}

/**
 * Notifica a usuarios de almacén cuando un repuesto llega a stock bajo
 */
export async function notificarStockBajo(repuestoId: string) {
  const repuesto = await prisma.repuesto.findUnique({ where: { id: repuestoId } });
  if (!repuesto || repuesto.stockActual > repuesto.stockMinimo) return;

  const almaceneros = await prisma.usuario.findMany({
    where: { activo: true, rol: { nombre: 'ALMACEN' } },
    select: { id: true },
  });

  if (almaceneros.length === 0) return;

  await crearNotificacionMasiva(
    almaceneros.map((a) => a.id),
    {
      titulo: 'Alerta: stock bajo',
      mensaje: `${repuesto.nombre} (${repuesto.codigo}) tiene ${repuesto.stockActual} unidades, por debajo del mínimo de ${repuesto.stockMinimo}`,
      enlace: `inventario:${repuesto.id}`,
    },
  );
}

/**
 * Notifica a contabilidad cuando una factura se paga completamente
 */
export async function notificarFacturaPagada(facturaId: string) {
  const factura = await prisma.factura.findUnique({
    where: { id: facturaId },
    include: { cliente: true },
  });
  if (!factura || factura.estado !== 'PAGADA') return;

  const clienteNombre = factura.cliente.nombres
    ? `${factura.cliente.nombres} ${factura.cliente.apellidoPaterno}`
    : factura.cliente.razonSocial;

  const contadores = await prisma.usuario.findMany({
    where: { activo: true, rol: { nombre: 'CONTABILIDAD' } },
    select: { id: true },
  });

  if (contadores.length === 0) return;

  await crearNotificacionMasiva(
    contadores.map((c) => c.id),
    {
      titulo: 'Factura pagada',
      mensaje: `${factura.numeroFactura} de ${clienteNombre} por S/ ${Number(factura.total).toFixed(2)} fue pagada completamente`,
      enlace: `facturacion:${factura.id}`,
    },
  );
}
