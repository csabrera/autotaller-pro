import type { FastifyInstance } from 'fastify';
import {
  listarCitas, obtenerCita, crearCita, actualizarCita,
  cambiarEstadoCita, citasDelDia, verificarDisponibilidad,
} from './agenda.service.js';
import { authMiddleware, requiereCambioClave } from '../../middlewares/auth.middleware.js';
import { requierePermiso } from '../../middlewares/permisos.middleware.js';
import { AppError } from '../../core/errors/AppError.js';

export async function agendaRoutes(app: FastifyInstance) {
  const preRead = [authMiddleware, requiereCambioClave, requierePermiso('AGENDA_CITAS', 'puedeLeer')];
  const preWrite = [authMiddleware, requiereCambioClave, requierePermiso('AGENDA_CITAS', 'puedeCrear')];
  const preEdit = [authMiddleware, requiereCambioClave, requierePermiso('AGENDA_CITAS', 'puedeEditar')];

  // GET /api/agenda
  app.get('/api/agenda', { preHandler: preRead }, async (request, reply) => {
    const { pagina, porPagina, estado, busqueda, fechaDesde, fechaHasta, mecanicoId } = request.query as any;
    try {
      return await listarCitas(
        Number(pagina) || 1,
        Number(porPagina) || 10,
        estado, busqueda, fechaDesde, fechaHasta, mecanicoId,
      );
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // GET /api/agenda/hoy
  app.get('/api/agenda/hoy', { preHandler: preRead }, async (request, reply) => {
    const { fecha } = request.query as { fecha?: string };
    try {
      return await citasDelDia(fecha);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // GET /api/agenda/disponibilidad
  app.get('/api/agenda/disponibilidad', { preHandler: preRead }, async (request, reply) => {
    const { fechaProgramada, duracionMinutos, mecanicoId } = request.query as any;
    try {
      if (!fechaProgramada) throw new AppError(400, 'La fecha es obligatoria');
      const conflictos = await verificarDisponibilidad(
        fechaProgramada,
        Number(duracionMinutos) || 60,
        mecanicoId || null,
      );
      return { disponible: conflictos.length === 0, conflictos };
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // GET /api/agenda/:id
  app.get('/api/agenda/:id', { preHandler: preRead }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      return await obtenerCita(id);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // POST /api/agenda
  app.post('/api/agenda', { preHandler: preWrite }, async (request, reply) => {
    try {
      const cita = await crearCita(request.body, request.usuario!.sub);
      return reply.status(201).send(cita);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // PUT /api/agenda/:id
  app.put('/api/agenda/:id', { preHandler: preEdit }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      return await actualizarCita(id, request.body);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // PATCH /api/agenda/:id/estado
  app.patch('/api/agenda/:id/estado', { preHandler: preEdit }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { estado } = request.body as { estado: string };
    try {
      return await cambiarEstadoCita(id, estado);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });
}
