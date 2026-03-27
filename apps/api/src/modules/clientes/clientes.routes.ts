import type { FastifyInstance } from 'fastify';
import { listarClientes, obtenerCliente, buscarClienteRapido, crearCliente, actualizarCliente, toggleActivoCliente } from './clientes.service.js';
import { authMiddleware, requiereCambioClave } from '../../middlewares/auth.middleware.js';
import { requierePermiso } from '../../middlewares/permisos.middleware.js';
import { AppError } from '../../core/errors/AppError.js';

export async function clientesRoutes(app: FastifyInstance) {
  const preRead = [authMiddleware, requiereCambioClave, requierePermiso('VEHICULOS_CLIENTES', 'puedeLeer')];
  const preWrite = [authMiddleware, requiereCambioClave, requierePermiso('VEHICULOS_CLIENTES', 'puedeCrear')];

  app.get('/api/clientes', { preHandler: preRead }, async (request, reply) => {
    const { pagina, porPagina, busqueda } = request.query as any;
    try {
      return await listarClientes(Number(pagina) || 1, Number(porPagina) || 10, busqueda);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  app.get('/api/clientes/buscar', { preHandler: preRead }, async (request, reply) => {
    const { q } = request.query as { q?: string };
    if (!q || q.length < 2) return [];
    try {
      return await buscarClienteRapido(q);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  app.get('/api/clientes/:id', { preHandler: preRead }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      return await obtenerCliente(id);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  app.post('/api/clientes', { preHandler: preWrite }, async (request, reply) => {
    try {
      const cliente = await crearCliente(request.body);
      return reply.status(201).send(cliente);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  app.put('/api/clientes/:id', { preHandler: preWrite }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      return await actualizarCliente(id, request.body);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  app.patch('/api/clientes/:id/toggle-activo', {
    preHandler: [authMiddleware, requiereCambioClave, requierePermiso('VEHICULOS_CLIENTES', 'puedeEditar')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      return await toggleActivoCliente(id);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });
}
