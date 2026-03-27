import type { FastifyRequest, FastifyReply } from 'fastify';
import { verificarToken, type JwtPayload } from '../core/auth/jwt.js';

declare module 'fastify' {
  interface FastifyRequest {
    usuario?: JwtPayload;
  }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Token no proporcionado' });
  }

  try {
    const token = authHeader.substring(7);
    request.usuario = verificarToken(token);
  } catch {
    return reply.status(401).send({ error: 'Token inválido o expirado' });
  }
}

export async function requiereCambioClave(request: FastifyRequest, reply: FastifyReply) {
  if (request.usuario?.debeCambiarClave) {
    return reply.status(403).send({
      error: 'Debe cambiar su contraseña antes de continuar',
      codigo: 'CAMBIO_CLAVE_REQUERIDO',
    });
  }
}
