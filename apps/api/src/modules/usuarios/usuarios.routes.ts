import type { FastifyInstance } from 'fastify';
import {
  listarUsuarios, obtenerUsuario, crearUsuario,
  actualizarUsuario, toggleActivoUsuario, resetearClave,
  listarRoles, listarSucursales,
} from './usuarios.service.js';
import { authMiddleware, requiereCambioClave } from '../../middlewares/auth.middleware.js';
import { requierePermiso } from '../../middlewares/permisos.middleware.js';
import { AppError } from '../../core/errors/AppError.js';

export async function usuariosRoutes(app: FastifyInstance) {
  const preHandler = [authMiddleware, requiereCambioClave, requierePermiso('USUARIOS', 'puedeLeer')];
  const preHandlerWrite = [authMiddleware, requiereCambioClave, requierePermiso('USUARIOS', 'puedeCrear')];

  // GET /api/usuarios
  app.get('/api/usuarios', { preHandler }, async (request, reply) => {
    const { pagina, porPagina, busqueda } = request.query as {
      pagina?: string; porPagina?: string; busqueda?: string;
    };
    try {
      const resultado = await listarUsuarios(
        Number(pagina) || 1,
        Number(porPagina) || 10,
        busqueda,
      );
      return reply.send(resultado);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // GET /api/usuarios/:id
  app.get('/api/usuarios/:id', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const usuario = await obtenerUsuario(id);
      return reply.send(usuario);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // POST /api/usuarios
  app.post('/api/usuarios', { preHandler: preHandlerWrite }, async (request, reply) => {
    try {
      const resultado = await crearUsuario(request.body as any);
      return reply.status(201).send(resultado);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // PUT /api/usuarios/:id
  app.put('/api/usuarios/:id', {
    preHandler: [authMiddleware, requiereCambioClave, requierePermiso('USUARIOS', 'puedeEditar')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const resultado = await actualizarUsuario(id, request.body as any);
      return reply.send(resultado);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // PATCH /api/usuarios/:id/toggle-activo
  app.patch('/api/usuarios/:id/toggle-activo', {
    preHandler: [authMiddleware, requiereCambioClave, requierePermiso('USUARIOS', 'puedeEditar')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const resultado = await toggleActivoUsuario(id);
      return reply.send(resultado);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // POST /api/usuarios/:id/resetear-clave
  app.post('/api/usuarios/:id/resetear-clave', {
    preHandler: [authMiddleware, requiereCambioClave, requierePermiso('USUARIOS', 'puedeEditar')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const resultado = await resetearClave(id);
      return reply.send(resultado);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });

  // GET /api/roles
  app.get('/api/roles', { preHandler: [authMiddleware, requiereCambioClave] }, async (_request, reply) => {
    const roles = await listarRoles();
    return reply.send(roles);
  });

  // GET /api/sucursales
  app.get('/api/sucursales', { preHandler: [authMiddleware, requiereCambioClave] }, async (_request, reply) => {
    const sucursales = await listarSucursales();
    return reply.send(sucursales);
  });
}
