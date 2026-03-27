import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { reporteIngresos } from './reportes.service.js';

const ETIQUETAS_PERIODO: Record<string, string> = {
  semana: 'Esta Semana',
  mes: 'Este Mes',
  anio: 'Este Año',
};

// =============================================
// PDF con PDFKit
// =============================================

export async function exportarIngresosPDF(periodo: 'semana' | 'mes' | 'anio'): Promise<Buffer> {
  const data = await reporteIngresos(periodo);
  const fechaReporte = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  // Header
  doc.fontSize(18).fillColor('#f97316').text('AutoTaller Pro', { align: 'left' });
  doc.fontSize(12).fillColor('#475569').text(`Reporte de Ingresos — ${ETIQUETAS_PERIODO[periodo] || periodo}`);
  doc.fontSize(8).fillColor('#94a3b8').text(`Generado: ${fechaReporte}`);
  doc.moveDown(1);

  // KPIs
  doc.fontSize(10).fillColor('#1e293b');
  doc.text(`Total Ingresos: S/ ${data.totalIngresos.toFixed(2)}     |     Pagos: ${data.cantidadPagos}     |     Promedio: S/ ${data.cantidadPagos > 0 ? (data.totalIngresos / data.cantidadPagos).toFixed(2) : '0.00'}`);
  doc.moveDown(1);

  // Por método de pago
  doc.fontSize(12).fillColor('#1e293b').text('Ingresos por Método de Pago', { underline: true });
  doc.moveDown(0.5);
  if (data.porMetodo.length === 0) {
    doc.fontSize(9).fillColor('#94a3b8').text('Sin datos en este período');
  } else {
    data.porMetodo.sort((a, b) => b.monto - a.monto).forEach((m) => {
      const pct = data.totalIngresos > 0 ? ((m.monto / data.totalIngresos) * 100).toFixed(1) : '0';
      doc.fontSize(9).fillColor('#1e293b').text(`${m.nombre}: S/ ${m.monto.toFixed(2)} (${pct}%)`);
    });
  }
  doc.moveDown(1);

  // Detalle de pagos
  doc.fontSize(12).fillColor('#1e293b').text('Detalle de Pagos', { underline: true });
  doc.moveDown(0.5);

  if (data.detalle.length === 0) {
    doc.fontSize(9).fillColor('#94a3b8').text('Sin pagos registrados');
  } else {
    // Header tabla
    const y = doc.y;
    doc.fontSize(8).fillColor('#64748b');
    doc.text('Factura', 40, y, { width: 80 });
    doc.text('Cliente', 120, y, { width: 150 });
    doc.text('Método', 270, y, { width: 80 });
    doc.text('Monto', 350, y, { width: 80 });
    doc.text('Fecha', 430, y, { width: 100 });
    doc.moveDown(0.3);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#e2e8f0').stroke();
    doc.moveDown(0.3);

    data.detalle.forEach((p) => {
      const py = doc.y;
      if (py > 750) { doc.addPage(); }
      doc.fontSize(8).fillColor('#1e293b');
      doc.text(p.factura, 40, doc.y, { width: 80 });
      const lineY = doc.y - 10;
      doc.text(String(p.cliente || ''), 120, lineY, { width: 150 });
      doc.text(p.metodo, 270, lineY, { width: 80 });
      doc.text(`S/ ${p.monto.toFixed(2)}`, 350, lineY, { width: 80 });
      doc.text(new Date(p.fecha).toLocaleDateString('es-PE'), 430, lineY, { width: 100 });
    });
  }

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

// =============================================
// EXCEL
// =============================================

export async function exportarIngresosExcel(periodo: 'semana' | 'mes' | 'anio'): Promise<Buffer> {
  const data = await reporteIngresos(periodo);
  const fechaReporte = new Date().toLocaleDateString('es-PE');

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AutoTaller Pro';
  workbook.created = new Date();

  // === Hoja Resumen ===
  const resumen = workbook.addWorksheet('Resumen');

  resumen.mergeCells('A1:E1');
  const tituloCell = resumen.getCell('A1');
  tituloCell.value = `Reporte de Ingresos — ${ETIQUETAS_PERIODO[periodo] || periodo}`;
  tituloCell.font = { size: 14, bold: true, color: { argb: 'FFF97316' } };

  resumen.mergeCells('A2:E2');
  resumen.getCell('A2').value = `Generado: ${fechaReporte}`;
  resumen.getCell('A2').font = { size: 9, color: { argb: 'FF94A3B8' } };

  resumen.getCell('A4').value = 'Total Ingresos';
  resumen.getCell('B4').value = data.totalIngresos;
  resumen.getCell('B4').numFmt = '"S/" #,##0.00';
  resumen.getCell('B4').font = { bold: true, size: 12 };

  resumen.getCell('A5').value = 'Pagos Registrados';
  resumen.getCell('B5').value = data.cantidadPagos;
  resumen.getCell('B5').font = { bold: true };

  resumen.getCell('A6').value = 'Promedio por Pago';
  resumen.getCell('B6').value = data.cantidadPagos > 0 ? data.totalIngresos / data.cantidadPagos : 0;
  resumen.getCell('B6').numFmt = '"S/" #,##0.00';
  resumen.getCell('B6').font = { bold: true };

  resumen.getCell('A8').value = 'Por Método de Pago';
  resumen.getCell('A8').font = { bold: true, size: 11 };

  const headerMetodo = resumen.addRow(['Método', 'Monto', '%']);
  headerMetodo.font = { bold: true };
  headerMetodo.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  });

  data.porMetodo.sort((a, b) => b.monto - a.monto).forEach((m) => {
    const row = resumen.addRow([m.nombre, m.monto, data.totalIngresos > 0 ? (m.monto / data.totalIngresos) * 100 : 0]);
    row.getCell(2).numFmt = '"S/" #,##0.00';
    row.getCell(3).numFmt = '0.0"%"';
  });

  resumen.columns = [{ width: 25 }, { width: 18 }, { width: 10 }, { width: 18 }, { width: 18 }];

  // === Hoja Detalle ===
  const detalle = workbook.addWorksheet('Detalle Pagos');
  detalle.columns = [
    { header: 'Factura', key: 'factura', width: 18 },
    { header: 'Cliente', key: 'cliente', width: 30 },
    { header: 'Método', key: 'metodo', width: 15 },
    { header: 'Monto', key: 'monto', width: 15 },
    { header: 'Fecha', key: 'fecha', width: 18 },
  ];
  detalle.getRow(1).font = { bold: true };
  detalle.getRow(1).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  });
  data.detalle.forEach((p) => {
    const row = detalle.addRow({ factura: p.factura, cliente: p.cliente || '', metodo: p.metodo, monto: p.monto, fecha: new Date(p.fecha).toLocaleDateString('es-PE') });
    row.getCell('monto').numFmt = '"S/" #,##0.00';
  });

  // === Hoja Por Día ===
  const porDia = workbook.addWorksheet('Por Día');
  porDia.columns = [
    { header: 'Fecha', key: 'fecha', width: 18 },
    { header: 'Ingresos', key: 'monto', width: 18 },
  ];
  porDia.getRow(1).font = { bold: true };
  porDia.getRow(1).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  });
  data.porDia.forEach((d) => {
    const row = porDia.addRow({ fecha: d.fecha, monto: d.monto });
    row.getCell('monto').numFmt = '"S/" #,##0.00';
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
