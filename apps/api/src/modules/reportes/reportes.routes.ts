import type { FastifyInstance } from 'fastify';
import { obtenerDashboard, reporteIngresos } from './reportes.service.js';
import { exportarIngresosPDF, exportarIngresosExcel } from './reportes.export.js';
import { authMiddleware, requiereCambioClave } from '../../middlewares/auth.middleware.js';
import { AppError } from '../../core/errors/AppError.js';

export async function reportesRoutes(app: FastifyInstance) {
  app.get('/api/dashboard', { preHandler: [authMiddleware, requiereCambioClave] }, async () => {
    return obtenerDashboard();
  });

  app.get('/api/reportes/ingresos', { preHandler: [authMiddleware, requiereCambioClave] }, async (request) => {
    const { periodo } = request.query as { periodo?: string };
    return reporteIngresos((periodo as any) || 'mes');
  });

  // Exportar PDF
  app.get('/api/reportes/ingresos/exportar', { preHandler: [authMiddleware, requiereCambioClave] }, async (request, reply) => {
    const { formato, periodo } = request.query as { formato?: string; periodo?: string };
    const per = (periodo as 'semana' | 'mes' | 'anio') || 'mes';

    try {
      if (formato === 'excel') {
        const buffer = await exportarIngresosExcel(per);
        return reply
          .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
          .header('Content-Disposition', `attachment; filename="reporte-ingresos-${per}.xlsx"`)
          .send(buffer);
      }

      // PDF por defecto
      const buffer = await exportarIngresosPDF(per);
      return reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `attachment; filename="reporte-ingresos-${per}.pdf"`)
        .send(buffer);
    } catch (err) {
      if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message });
      throw err;
    }
  });
}
