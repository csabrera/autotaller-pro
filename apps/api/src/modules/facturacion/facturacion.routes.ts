import type { FastifyInstance } from 'fastify';
import { generarFacturaDesdeOT, listarFacturas, obtenerFactura, registrarPago, anularFactura } from './facturacion.service.js';
import { authMiddleware, requiereCambioClave } from '../../middlewares/auth.middleware.js';
import { requierePermiso } from '../../middlewares/permisos.middleware.js';
import { AppError } from '../../core/errors/AppError.js';

export async function facturacionRoutes(app: FastifyInstance) {
  const preRead = [authMiddleware, requiereCambioClave, requierePermiso('FACTURACION', 'puedeLeer')];
  const preWrite = [authMiddleware, requiereCambioClave, requierePermiso('FACTURACION', 'puedeCrear')];

  app.get('/api/facturas', { preHandler: preRead }, async (request, reply) => {
    const { pagina, porPagina, estado, busqueda } = request.query as any;
    try { return await listarFacturas(Number(pagina) || 1, Number(porPagina) || 10, estado, busqueda); }
    catch (err) { if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message }); throw err; }
  });

  app.get('/api/facturas/:id', { preHandler: preRead }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try { return await obtenerFactura(id); }
    catch (err) { if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message }); throw err; }
  });

  app.post('/api/facturas/desde-ot/:otId', { preHandler: preWrite }, async (request, reply) => {
    const { otId } = request.params as { otId: string };
    const { tipoDocumento } = request.body as { tipoDocumento: string };
    try { return reply.status(201).send(await generarFacturaDesdeOT(otId, tipoDocumento || 'BOLETA DE VENTA')); }
    catch (err) { if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message }); throw err; }
  });

  app.post('/api/facturas/:id/pago', { preHandler: preWrite }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { metodoPagoId, monto, referencia } = request.body as any;
    try { return reply.status(201).send(await registrarPago(id, metodoPagoId, Number(monto), referencia, request.usuario!.sub)); }
    catch (err) { if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message }); throw err; }
  });

  app.patch('/api/facturas/:id/anular', { preHandler: preWrite }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try { return await anularFactura(id); }
    catch (err) { if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message }); throw err; }
  });
}
