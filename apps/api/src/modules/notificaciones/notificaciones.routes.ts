import type { FastifyInstance } from 'fastify';
import {
  listarNotificaciones, contarNoLeidas, marcarLeida, marcarTodasLeidas,
} from './notificaciones.service.js';
import { authMiddleware, requiereCambioClave } from '../../middlewares/auth.middleware.js';
import { AppError } from '../../core/errors/AppError.js';

export async function notificacionesRoutes(app: FastifyInstance) {
  const preAuth = [authMiddleware, requiereCambioClave];

  // GET /api/notificaciones
  app.get('/api/notificaciones', { preHandler: preAuth }, async (request, reply) => {
    const { soloNoLeidas } = request.query as { soloNoLeidas?: string };
    try {
      return await listarNotificaciones(request.usuario!.sub, soloNoLeidas === 'true');
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // GET /api/notificaciones/count
  app.get('/api/notificaciones/count', { preHandler: preAuth }, async (request, reply) => {
    try {
      return await contarNoLeidas(request.usuario!.sub);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // PATCH /api/notificaciones/:id/leer
  app.patch('/api/notificaciones/:id/leer', { preHandler: preAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await marcarLeida(id, request.usuario!.sub);
      return { ok: true };
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // PATCH /api/notificaciones/leer-todas
  app.patch('/api/notificaciones/leer-todas', { preHandler: preAuth }, async (request, reply) => {
    try {
      await marcarTodasLeidas(request.usuario!.sub);
      return { ok: true };
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });
}
