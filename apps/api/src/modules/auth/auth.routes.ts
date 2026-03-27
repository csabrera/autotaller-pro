import type { FastifyInstance } from 'fastify';
import { login, cambiarClave, refreshTokenService, obtenerPerfil } from './auth.service.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { AppError } from '../../core/errors/AppError.js';

export async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/login
  app.post('/api/auth/login', async (request, reply) => {
    const { numeroDocumento, clave } = request.body as { numeroDocumento: string; clave: string };

    if (!numeroDocumento || !clave) {
      return reply.status(400).send({ error: 'Número de documento y contraseña son requeridos' });
    }

    try {
      const resultado = await login(numeroDocumento, clave);
      return reply.send(resultado);
    } catch (err) {
      if (err instanceof AppError) {
        return reply.status(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  // POST /api/auth/cambiar-clave
  app.post('/api/auth/cambiar-clave', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const { nuevaClave, confirmarClave } = request.body as { nuevaClave: string; confirmarClave: string };

    if (!nuevaClave || !confirmarClave) {
      return reply.status(400).send({ error: 'Ambos campos son requeridos' });
    }

    if (nuevaClave.length < 4) {
      return reply.status(400).send({ error: 'La contraseña debe tener al menos 4 caracteres' });
    }

    if (nuevaClave !== confirmarClave) {
      return reply.status(400).send({ error: 'Las contraseñas no coinciden' });
    }

    try {
      const resultado = await cambiarClave(request.usuario!.sub, nuevaClave);
      return reply.send({ mensaje: 'Contraseña actualizada exitosamente', ...resultado });
    } catch (err) {
      if (err instanceof AppError) {
        return reply.status(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  // POST /api/auth/refresh
  app.post('/api/auth/refresh', async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };

    if (!refreshToken) {
      return reply.status(400).send({ error: 'Refresh token requerido' });
    }

    try {
      const resultado = await refreshTokenService(refreshToken);
      return reply.send(resultado);
    } catch (err) {
      if (err instanceof AppError) {
        return reply.status(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  // GET /api/auth/perfil
  app.get('/api/auth/perfil', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    try {
      const perfil = await obtenerPerfil(request.usuario!.sub);
      return reply.send(perfil);
    } catch (err) {
      if (err instanceof AppError) {
        return reply.status(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });
}
