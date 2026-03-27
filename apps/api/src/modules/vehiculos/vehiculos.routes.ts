import type { FastifyInstance } from 'fastify';
import { listarVehiculosPorCliente, obtenerVehiculo, crearVehiculo, actualizarVehiculo } from './vehiculos.service.js';
import { authMiddleware, requiereCambioClave } from '../../middlewares/auth.middleware.js';
import { requierePermiso } from '../../middlewares/permisos.middleware.js';
import { AppError } from '../../core/errors/AppError.js';

export async function vehiculosRoutes(app: FastifyInstance) {
  const preRead = [authMiddleware, requiereCambioClave, requierePermiso('VEHICULOS_CLIENTES', 'puedeLeer')];
  const preWrite = [authMiddleware, requiereCambioClave, requierePermiso('VEHICULOS_CLIENTES', 'puedeCrear')];

  app.get('/api/vehiculos/cliente/:clienteId', { preHandler: preRead }, async (request, reply) => {
    const { clienteId } = request.params as { clienteId: string };
    try {
      return await listarVehiculosPorCliente(clienteId);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  app.get('/api/vehiculos/:id', { preHandler: preRead }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      return await obtenerVehiculo(id);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  app.post('/api/vehiculos', { preHandler: preWrite }, async (request, reply) => {
    try {
      const vehiculo = await crearVehiculo(request.body);
      return reply.status(201).send(vehiculo);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  app.put('/api/vehiculos/:id', { preHandler: preWrite }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      return await actualizarVehiculo(id, request.body);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });
}
