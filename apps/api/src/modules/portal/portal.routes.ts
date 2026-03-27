import type { FastifyInstance } from 'fastify';
import {
  loginCliente, misVehiculos, misOrdenes, misFacturas,
  misCitas, agendarCitaPortal, resumenCliente,
} from './portal.service.js';
import { AppError } from '../../core/errors/AppError.js';

export async function portalRoutes(app: FastifyInstance) {

  // POST /api/portal/login — Login del cliente con DNI + teléfono
  app.post('/api/portal/login', async (request, reply) => {
    const { numeroDocumento, telefono } = request.body as { numeroDocumento: string; telefono: string };
    try {
      if (!numeroDocumento || !telefono) {
        throw new AppError(400, 'Ingrese su número de documento y teléfono');
      }
      const cliente = await loginCliente(numeroDocumento, telefono);
      return { cliente };
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // GET /api/portal/:clienteId/resumen
  app.get('/api/portal/:clienteId/resumen', async (request, reply) => {
    const { clienteId } = request.params as { clienteId: string };
    try {
      return await resumenCliente(clienteId);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // GET /api/portal/:clienteId/vehiculos
  app.get('/api/portal/:clienteId/vehiculos', async (request, reply) => {
    const { clienteId } = request.params as { clienteId: string };
    try {
      return await misVehiculos(clienteId);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // GET /api/portal/:clienteId/ordenes
  app.get('/api/portal/:clienteId/ordenes', async (request, reply) => {
    const { clienteId } = request.params as { clienteId: string };
    try {
      return await misOrdenes(clienteId);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // GET /api/portal/:clienteId/facturas
  app.get('/api/portal/:clienteId/facturas', async (request, reply) => {
    const { clienteId } = request.params as { clienteId: string };
    try {
      return await misFacturas(clienteId);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // GET /api/portal/:clienteId/citas
  app.get('/api/portal/:clienteId/citas', async (request, reply) => {
    const { clienteId } = request.params as { clienteId: string };
    try {
      return await misCitas(clienteId);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // POST /api/portal/:clienteId/citas — Agendar cita
  app.post('/api/portal/:clienteId/citas', async (request, reply) => {
    const { clienteId } = request.params as { clienteId: string };
    try {
      const cita = await agendarCitaPortal(clienteId, request.body as any);
      return reply.status(201).send(cita);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });
}
