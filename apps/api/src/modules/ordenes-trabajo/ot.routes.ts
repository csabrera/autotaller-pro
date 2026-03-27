import type { FastifyInstance } from 'fastify';
import {
  listarOrdenes, obtenerOrden, crearOrden, cambiarEstado,
  actualizarDiagnostico, agregarServicio, agregarRepuesto,
} from './ot.service.js';
import { authMiddleware, requiereCambioClave } from '../../middlewares/auth.middleware.js';
import { requierePermiso } from '../../middlewares/permisos.middleware.js';
import { AppError } from '../../core/errors/AppError.js';

export async function otRoutes(app: FastifyInstance) {
  const preRead = [authMiddleware, requiereCambioClave, requierePermiso('ORDENES_TRABAJO', 'puedeLeer')];
  const preWrite = [authMiddleware, requiereCambioClave, requierePermiso('ORDENES_TRABAJO', 'puedeCrear')];

  // GET /api/ordenes-trabajo
  app.get('/api/ordenes-trabajo', { preHandler: preRead }, async (request, reply) => {
    const { pagina, porPagina, estado, busqueda } = request.query as any;
    try {
      return await listarOrdenes(Number(pagina) || 1, Number(porPagina) || 10, estado, busqueda);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // GET /api/ordenes-trabajo/:id
  app.get('/api/ordenes-trabajo/:id', { preHandler: preRead }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      return await obtenerOrden(id);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // POST /api/ordenes-trabajo
  app.post('/api/ordenes-trabajo', { preHandler: preWrite }, async (request, reply) => {
    try {
      const orden = await crearOrden(request.body, request.usuario!.sub);
      return reply.status(201).send(orden);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // PATCH /api/ordenes-trabajo/:id/estado
  app.patch('/api/ordenes-trabajo/:id/estado', { preHandler: preWrite }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { estado, notas } = request.body as { estado: string; notas?: string };
    try {
      return await cambiarEstado(id, estado, request.usuario!.sub, notas);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // PATCH /api/ordenes-trabajo/:id/diagnostico
  app.patch('/api/ordenes-trabajo/:id/diagnostico', { preHandler: preWrite }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { diagnostico } = request.body as { diagnostico: string };
    try {
      return await actualizarDiagnostico(id, diagnostico);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // POST /api/ordenes-trabajo/:id/servicios
  app.post('/api/ordenes-trabajo/:id/servicios', { preHandler: preWrite }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      return reply.status(201).send(await agregarServicio(id, request.body));
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // POST /api/ordenes-trabajo/:id/repuestos
  app.post('/api/ordenes-trabajo/:id/repuestos', { preHandler: preWrite }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      return reply.status(201).send(await agregarRepuesto(id, request.body));
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });
}
