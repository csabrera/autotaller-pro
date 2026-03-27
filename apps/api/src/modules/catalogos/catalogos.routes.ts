import type { FastifyInstance } from 'fastify';
import {
  catalogosDisponibles, listarCatalogo, obtenerCatalogoItem,
  crearCatalogoItem, actualizarCatalogoItem, toggleActivoCatalogo,
} from './catalogos.service.js';
import { authMiddleware, requiereCambioClave } from '../../middlewares/auth.middleware.js';
import { requierePermiso } from '../../middlewares/permisos.middleware.js';
import { AppError } from '../../core/errors/AppError.js';

export async function catalogosRoutes(app: FastifyInstance) {
  const preRead = [authMiddleware, requiereCambioClave];
  const preWrite = [authMiddleware, requiereCambioClave, requierePermiso('CONFIGURACION', 'puedeCrear')];

  // GET /api/catalogos — lista de catálogos disponibles
  app.get('/api/catalogos', { preHandler: preRead }, async () => {
    return catalogosDisponibles();
  });

  // GET /api/catalogos/:catalogo
  app.get('/api/catalogos/:catalogo', { preHandler: preRead }, async (request, reply) => {
    const { catalogo } = request.params as { catalogo: string };
    const { activo, busqueda } = request.query as { activo?: string; busqueda?: string };
    try {
      return await listarCatalogo(catalogo, { activo, busqueda });
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // GET /api/catalogos/:catalogo/:id
  app.get('/api/catalogos/:catalogo/:id', { preHandler: preRead }, async (request, reply) => {
    const { catalogo, id } = request.params as { catalogo: string; id: string };
    try {
      return await obtenerCatalogoItem(catalogo, id);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // POST /api/catalogos/:catalogo
  app.post('/api/catalogos/:catalogo', { preHandler: preWrite }, async (request, reply) => {
    const { catalogo } = request.params as { catalogo: string };
    try {
      const item = await crearCatalogoItem(catalogo, request.body);
      return reply.status(201).send(item);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // PUT /api/catalogos/:catalogo/:id
  app.put('/api/catalogos/:catalogo/:id', { preHandler: preWrite }, async (request, reply) => {
    const { catalogo, id } = request.params as { catalogo: string; id: string };
    try {
      return await actualizarCatalogoItem(catalogo, id, request.body);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // PATCH /api/catalogos/:catalogo/:id/toggle-activo
  app.patch('/api/catalogos/:catalogo/:id/toggle-activo', { preHandler: preWrite }, async (request, reply) => {
    const { catalogo, id } = request.params as { catalogo: string; id: string };
    try {
      return await toggleActivoCatalogo(catalogo, id);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });
}
