import type { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../core/database/prisma.js';

export function requierePermiso(modulo: string, accion: 'puedeCrear' | 'puedeLeer' | 'puedeEditar' | 'puedeEliminar') {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.usuario) {
      return reply.status(401).send({ error: 'No autenticado' });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: request.usuario.sub },
      include: { rol: { include: { permisos: true } } },
    });

    if (!usuario) {
      return reply.status(401).send({ error: 'Usuario no encontrado' });
    }

    const permiso = usuario.rol.permisos.find((p) => p.modulo === modulo);

    if (!permiso || !permiso[accion]) {
      return reply.status(403).send({ error: 'No tiene permisos para esta acción' });
    }
  };
}
