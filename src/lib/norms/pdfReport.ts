import { createJsPdfInstance } from '../pdfExporter';
import { NormCalculator, NormResult } from './types';

/**
 * Generador automático de Memorias de Cálculo en PDF institucional
 * Exporta resultados de cualquier calculadora basada en NormCalculator
 */
export function generateNormCalculationPDF(
  calculator: NormCalculator,
  inputs: Record<string, any>,
  results: NormResult[],
  projectName: string = 'PROYECTO INDUSTRIAL O&G',
  engineerName: string = 'Ingeniero de Inspección y Sostenibilidad'
): void {
  const doc = createJsPdfInstance({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString('es-VE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Header Banner
  doc.setFillColor(11, 34, 57); // Dark navy
  doc.rect(0, 0, 210, 28, 'F');

  // Title in Banner
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INDUSTRIAL CONTROL 360', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('MEMORIA TÉCNICA DE CÁLCULO Y EVALUACIÓN NORMATIVA', 14, 18);

  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`FECHA: ${dateStr.toUpperCase()}`, 145, 12);
  doc.text(`PROYECTO: ${projectName.substring(0, 25)}`, 145, 18);

  let y = 38;

  // Title & Standard Reference
  doc.setTextColor(11, 34, 57);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(calculator.name.toUpperCase(), 14, y);

  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  const editionText = calculator.edition || (calculator as any).version || '';
  doc.text(`Norma de Referencia: ${calculator.standard} ${editionText ? `(${editionText})` : ''}`, 14, y);

  y += 10;

  // Inputs Section Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, y, 182, 50, 'FD');

  doc.setTextColor(11, 34, 57);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PARÁMETROS Y DATOS DE ENTRADA', 18, y + 7);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const fields = calculator.getFields();
  let col = 0;
  let rowY = y + 14;

  fields.forEach((field) => {
    const val = inputs[field.id] !== undefined ? inputs[field.id] : field.defaultValue;
    const text = `${field.label.split('(')[0].trim()}: ${val} ${field.unit || ''}`;

    const posX = col === 0 ? 18 : 105;
    doc.text(`• ${text.substring(0, 45)}`, posX, rowY);

    if (col === 1) {
      col = 0;
      rowY += 5;
    } else {
      col = 1;
    }
  });

  y += 56;

  // Results Section
  results.forEach((res) => {
    const isPassed = res.passed;
    doc.setFillColor(isPassed ? 240 : 254, isPassed ? 253 : 242, isPassed ? 244 : 242);
    doc.setDrawColor(isPassed ? 187 : 254, isPassed ? 247 : 202, isPassed ? 208 : 202);
    doc.rect(14, y, 182, 55, 'FD');

    // Dictamen Status
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    if (isPassed) {
      doc.setTextColor(22, 101, 52);
      doc.text(`DICTAMEN: CUMPLE CON ${calculator.standard}`, 18, y + 8);
    } else {
      doc.setTextColor(153, 27, 27);
      doc.text(`DICTAMEN: RECHAZADO / ACCIÓN REQUERIDA`, 18, y + 8);
    }

    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'bold');
    doc.text(`${res.label}: ${res.value} ${res.unit || ''}`, 18, y + 16);

    if (res.margin !== undefined) {
      doc.text(`Margen de Seguridad Calculado: ${res.margin}%`, 18, y + 22);
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text(`Ref. de Ecuación: ${res.codeReference}`, 18, y + 28);

    // Details grid
    if (res.details) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      let detY = y + 34;
      Object.entries(res.details).slice(0, 4).forEach(([k, v]) => {
        doc.text(`${k}: ${v}`, 18, detY);
        detY += 4.5;
      });
    }

    y += 60;
  });

  // Recommendations Section
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, y, 182, 35, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(11, 34, 57);
  doc.text('RECOMENDACIONES TÉCNICAS Y REQUERIMIENTOS DE CAMPO:', 18, y + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  let recY = y + 12;
  const allRecs = results.flatMap(r => r.recommendations);
  allRecs.slice(0, 4).forEach((rec) => {
    doc.text(`- ${rec.substring(0, 95)}`, 18, recY);
    recY += 5;
  });

  y += 42;

  // Signatures Section
  doc.setDrawColor(203, 213, 225);
  doc.line(20, y + 20, 85, y + 20);
  doc.line(125, y + 20, 190, y + 20);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('ELABORADO POR:', 20, y + 25);
  doc.text('REVISADO Y APROBADO:', 125, y + 25);

  doc.setFont('helvetica', 'normal');
  doc.text(engineerName, 20, y + 29);
  doc.text('Ingeniero Inspector / CIP / AIST', 125, y + 29);

  // Footer page number
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Documento generado automáticamente por Industrial Control 360 — WGS', 14, 285);

  // Download PDF
  const filename = `Memoria_Calculo_${calculator.id}_${Date.now()}.pdf`;
  doc.save(filename);
}
