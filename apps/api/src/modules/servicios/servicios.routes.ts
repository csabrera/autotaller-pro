import type { FastifyInstance } from 'fastify';
import { listarServicios, listarServiciosActivos, crearServicio, actualizarServicio, toggleActivoServicio } from './servicios.service.js';
import { authMiddleware, requiereCambioClave } from '../../middlewares/auth.middleware.js';
import { requierePermiso } from '../../middlewares/permisos.middleware.js';
import { AppError } from '../../core/errors/AppError.js';

export async function serviciosRoutes(app: FastifyInstance) {
  const preRead = [authMiddleware, requiereCambioClave, requierePermiso('SERVICIOS_CATALOGO', 'puedeLeer')];
  const preWrite = [authMiddleware, requiereCambioClave, requierePermiso('SERVICIOS_CATALOGO', 'puedeCrear')];

  app.get('/api/servicios', { preHandler: preRead }, async (request, reply) => {
    const { pagina, porPagina, busqueda, tipo } = request.query as any;
    try { return await listarServicios(Number(pagina) || 1, Number(porPagina) || 10, busqueda, tipo); }
    catch (err) { if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message }); throw err; }
  });

  app.get('/api/servicios/activos', { preHandler: [authMiddleware, requiereCambioClave] }, async () => {
    return listarServiciosActivos();
  });

  app.post('/api/servicios', { preHandler: preWrite }, async (request, reply) => {
    try { return reply.status(201).send(await crearServicio(request.body)); }
    catch (err) { if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message }); throw err; }
  });

  app.put('/api/servicios/:id', { preHandler: preWrite }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try { return await actualizarServicio(id, request.body); }
    catch (err) { if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message }); throw err; }
  });

  app.patch('/api/servicios/:id/toggle-activo', { preHandler: preWrite }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try { return await toggleActivoServicio(id); }
    catch (err) { if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message }); throw err; }
  });
}
