import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, DollarSign, CreditCard, TrendingUp, FileText, FileSpreadsheet, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';

interface ReporteIngresos {
  totalIngresos: number;
  cantidadPagos: number;
  porMetodo: { nombre: string; monto: number }[];
  porDia: { fecha: string; monto: number }[];
  detalle: { id: string; monto: number; metodo: string; referencia: string | null; fecha: string; factura: string; cliente: string }[];
}

export function ReportesPage() {
  const [periodo, setPeriodo] = useState<'semana' | 'mes' | 'anio'>('mes');
  const [exportando, setExportando] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['reporteIngresos', periodo],
    queryFn: () => api.get<ReporteIngresos>(`/reportes/ingresos?periodo=${periodo}`),
  });

  async function handleExportar(formato: 'pdf' | 'excel') {
    setExportando(formato);
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`/api/reportes/ingresos/exportar?formato=${formato}&periodo=${periodo}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al generar el archivo');

      const blob = await res.blob();
      const ext = formato === 'excel' ? 'xlsx' : 'pdf';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-ingresos-${periodo}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Reporte ${formato.toUpperCase()} descargado correctamente`);
    } catch (err: any) {
      toast.error(err.message || 'No se pudo exportar el reporte');
    } finally {
      setExportando(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text">Reportes</h2>
          <p className="text-sm text-text-secondary mt-0.5">Análisis de ingresos y actividad del taller</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExportar('pdf')}
            disabled={exportando !== null || !data}
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-surface px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportando === 'pdf' ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" /> : <FileText className="h-4 w-4" />}
            PDF
          </button>
          <button
            onClick={() => handleExportar('excel')}
            disabled={exportando !== null || !data}
            className="flex items-center gap-2 rounded-lg border border-green-200 bg-surface px-4 py-2.5 text-sm font-semibold text-green-600 hover:bg-green-50 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportando === 'excel' ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-500 border-t-transparent" /> : <FileSpreadsheet className="h-4 w-4" />}
            Excel
          </button>
        </div>
      </div>

      {/* Filtro período */}
      <div className="mb-5 flex gap-2">
        {([['semana', 'Esta semana'], ['mes', 'Este mes'], ['anio', 'Este año']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setPeriodo(key)}
            className={cn('rounded-full px-5 py-2 text-sm font-semibold', periodo === key ? 'bg-primary text-white' : 'bg-surface border border-border text-text hover:border-primary')}>
            {label}
          </button>
        ))}
      </div>

      {isLoading || !data ? (
        <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" /></div>
      ) : (
        <>
          {/* KPIs de ingresos */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
            <div className="rounded-xl bg-surface p-5 shadow-sm border-l-4 border-success">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-text-secondary font-medium">Total Ingresos</p>
                  <p className="mt-1 text-3xl font-black text-text">S/ {data.totalIngresos.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="rounded-lg bg-success/10 p-2.5"><DollarSign className="h-6 w-6 text-success" /></div>
              </div>
            </div>

            <div className="rounded-xl bg-surface p-5 shadow-sm border-l-4 border-info">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-text-secondary font-medium">Pagos Registrados</p>
                  <p className="mt-1 text-3xl font-black text-text">{data.cantidadPagos}</p>
                </div>
                <div className="rounded-lg bg-info/10 p-2.5"><CreditCard className="h-6 w-6 text-info" /></div>
              </div>
            </div>

            <div className="rounded-xl bg-surface p-5 shadow-sm border-l-4 border-primary">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-text-secondary font-medium">Promedio por pago</p>
                  <p className="mt-1 text-3xl font-black text-text">
                    S/ {data.cantidadPagos > 0 ? (data.totalIngresos / data.cantidadPagos).toFixed(2) : '0.00'}
                  </p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2.5"><TrendingUp className="h-6 w-6 text-primary" /></div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Ingresos por método de pago */}
            <div className="rounded-xl bg-surface p-5 shadow-sm">
              <h3 className="mb-4 text-base font-bold text-text">Por Método de Pago</h3>
              {data.porMetodo.length === 0 ? (
                <p className="py-4 text-sm text-text-muted text-center">Sin datos en este período</p>
              ) : (
                <div className="space-y-3">
                  {data.porMetodo.sort((a, b) => b.monto - a.monto).map((m) => {
                    const porcentaje = data.totalIngresos > 0 ? (m.monto / data.totalIngresos) * 100 : 0;
                    return (
                      <div key={m.nombre}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-semibold text-text">{m.nombre}</span>
                          <span className="text-sm font-bold text-text">S/ {m.monto.toFixed(2)}</span>
                        </div>
                        <div className="h-3 rounded-full bg-surface-alt overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${porcentaje}%` }} />
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5">{porcentaje.toFixed(1)}%</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Ingresos por día */}
            <div className="rounded-xl bg-surface p-5 shadow-sm">
              <h3 className="mb-4 text-base font-bold text-text">Por Día</h3>
              {data.porDia.length === 0 ? (
                <p className="py-4 text-sm text-text-muted text-center">Sin datos en este período</p>
              ) : (
                <div className="space-y-2">
                  {data.porDia.map((d) => {
                    const porcentaje = data.totalIngresos > 0 ? (d.monto / data.totalIngresos) * 100 : 0;
                    return (
                      <div key={d.fecha} className="flex items-center gap-3">
                        <span className="text-sm text-text-secondary w-24 flex-shrink-0">{d.fecha}</span>
                        <div className="flex-1 h-3 rounded-full bg-surface-alt overflow-hidden">
                          <div className="h-full rounded-full bg-success transition-all" style={{ width: `${Math.max(porcentaje, 3)}%` }} />
                        </div>
                        <span className="text-sm font-bold text-text w-24 text-right">S/ {d.monto.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Detalle de pagos */}
          <div className="mt-5 rounded-xl bg-surface p-5 shadow-sm">
            <h3 className="mb-4 text-base font-bold text-text">Últimos Pagos</h3>
            {data.detalle.length === 0 ? (
              <p className="py-4 text-sm text-text-muted text-center">Sin pagos registrados</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-alt border-b border-border">
                      <th className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase">Factura</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase">Cliente</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-text-secondary uppercase">Método</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-text-secondary uppercase">Monto</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-text-secondary uppercase">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {data.detalle.map((p) => (
                      <tr key={p.id} className="hover:bg-surface-alt/50">
                        <td className="px-4 py-3 font-bold text-primary text-sm">{p.factura}</td>
                        <td className="px-4 py-3 text-sm text-text">{p.cliente}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">{p.metodo}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-text text-sm">S/ {p.monto.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center text-sm text-text-secondary">{new Date(p.fecha).toLocaleString('es-PE')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
