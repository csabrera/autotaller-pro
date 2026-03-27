import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { authRoutes } from './modules/auth/auth.routes.js';
import { usuariosRoutes } from './modules/usuarios/usuarios.routes.js';
import { catalogosRoutes } from './modules/catalogos/catalogos.routes.js';
import { clientesRoutes } from './modules/clientes/clientes.routes.js';
import { vehiculosRoutes } from './modules/vehiculos/vehiculos.routes.js';
import { otRoutes } from './modules/ordenes-trabajo/ot.routes.js';
import { serviciosRoutes } from './modules/servicios/servicios.routes.js';
import { inventarioRoutes } from './modules/inventario/inventario.routes.js';
import { facturacionRoutes } from './modules/facturacion/facturacion.routes.js';
import { reportesRoutes } from './modules/reportes/reportes.routes.js';
import { agendaRoutes } from './modules/agenda/agenda.routes.js';
import { notificacionesRoutes } from './modules/notificaciones/notificaciones.routes.js';
import { portalRoutes } from './modules/portal/portal.routes.js';

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.NODE_ENV === 'production' ? true : ['http://localhost:5175'],
  credentials: true,
});

// Rutas
await app.register(authRoutes);
await app.register(usuariosRoutes);
await app.register(catalogosRoutes);
await app.register(clientesRoutes);
await app.register(vehiculosRoutes);
await app.register(otRoutes);
await app.register(serviciosRoutes);
await app.register(inventarioRoutes);
await app.register(facturacionRoutes);
await app.register(reportesRoutes);
await app.register(agendaRoutes);
await app.register(notificacionesRoutes);
await app.register(portalRoutes);

// Health check
app.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// En producción: servir frontend estático
if (process.env.NODE_ENV === 'production') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const frontendPath = path.join(__dirname, '../../web/dist');

  await app.register(fastifyStatic, {
    root: frontendPath,
    prefix: '/',
    decorateReply: false,
  });

  // SPA fallback: rutas que no son /api devuelven index.html
  app.setNotFoundHandler(async (request, reply) => {
    if (request.url.startsWith('/api')) {
      return reply.status(404).send({ error: 'Ruta no encontrada' });
    }
    return reply.sendFile('index.html');
  });
}

// Start
const start = async () => {
  try {
    const port = Number(process.env.API_PORT) || 3005;
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`🔧 AutoTaller API corriendo en http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
