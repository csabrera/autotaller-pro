import type { FastifyInstance } from 'fastify';
import { listarRepuestos, crearRepuesto, actualizarRepuesto, registrarMovimiento, listarProveedores, crearProveedor } from './inventario.service.js';
import { authMiddleware, requiereCambioClave } from '../../middlewares/auth.middleware.js';
import { requierePermiso } from '../../middlewares/permisos.middleware.js';
import { AppError } from '../../core/errors/AppError.js';

export async function inventarioRoutes(app: FastifyInstance) {
  const preRead = [authMiddleware, requiereCambioClave, requierePermiso('INVENTARIO', 'puedeLeer')];
  const preWrite = [authMiddleware, requiereCambioClave, requierePermiso('INVENTARIO', 'puedeCrear')];

  app.get('/api/repuestos', { preHandler: preRead }, async (request, reply) => {
    const { pagina, porPagina, busqueda, stockBajo } = request.query as any;
    try { return await listarRepuestos(Number(pagina) || 1, Number(porPagina) || 10, busqueda, stockBajo === 'true'); }
    catch (err) { if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message }); throw err; }
  });

  app.post('/api/repuestos', { preHandler: preWrite }, async (request, reply) => {
    try { return reply.status(201).send(await crearRepuesto(request.body)); }
    catch (err) { if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message }); throw err; }
  });

  app.put('/api/repuestos/:id', { preHandler: preWrite }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try { return await actualizarRepuesto(id, request.body); }
    catch (err) { if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message }); throw err; }
  });

  app.post('/api/repuestos/:id/movimiento', { preHandler: preWrite }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { tipo, cantidad, referencia } = request.body as any;
    try { return reply.status(201).send(await registrarMovimiento(id, tipo, cantidad, referencia, request.usuario!.sub)); }
    catch (err) { if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message }); throw err; }
  });

  app.get('/api/proveedores', { preHandler: preRead }, async () => listarProveedores());
  app.post('/api/proveedores', { preHandler: preWrite }, async (request, reply) => {
    try { return reply.status(201).send(await crearProveedor(request.body)); }
    catch (err) { if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message }); throw err; }
  });
}
