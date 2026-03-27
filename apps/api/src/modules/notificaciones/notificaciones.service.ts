import { prisma } from '../../core/database/prisma.js';

export async function listarNotificaciones(usuarioId: string, soloNoLeidas = false) {
  return prisma.notificacion.findMany({
    where: {
      usuarioId,
      ...(soloNoLeidas ? { leida: false } : {}),
    },
    orderBy: { creadoEn: 'desc' },
    take: 50,
  });
}

export async function contarNoLeidas(usuarioId: string) {
  const count = await prisma.notificacion.count({
    where: { usuarioId, leida: false },
  });
  return { noLeidas: count };
}

export async function marcarLeida(id: string, usuarioId: string) {
  return prisma.notificacion.updateMany({
    where: { id, usuarioId },
    data: { leida: true },
  });
}

export async function marcarTodasLeidas(usuarioId: string) {
  return prisma.notificacion.updateMany({
    where: { usuarioId, leida: false },
    data: { leida: true },
  });
}

export async function crearNotificacion(data: {
  usuarioId: string;
  tipo?: string;
  titulo: string;
  mensaje: string;
  enlace?: string;
}) {
  return prisma.notificacion.create({
    data: {
      usuarioId: data.usuarioId,
      tipo: data.tipo || 'SISTEMA',
      titulo: data.titulo,
      mensaje: data.mensaje,
      enlace: data.enlace || null,
    },
  });
}

export async function crearNotificacionMasiva(
  usuarioIds: string[],
  data: { tipo?: string; titulo: string; mensaje: string; enlace?: string },
) {
  if (usuarioIds.length === 0) return;

  await prisma.notificacion.createMany({
    data: usuarioIds.map((usuarioId) => ({
      usuarioId,
      tipo: data.tipo || 'SISTEMA',
      titulo: data.titulo,
      mensaje: data.mensaje,
      enlace: data.enlace || null,
    })),
  });
}
