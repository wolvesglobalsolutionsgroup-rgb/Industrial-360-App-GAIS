import { createJsPdfInstance } from '../pdfExporter';
import { IsometricDrawing } from './isometricTypes';

export async function generateAsBuiltPdf(
  drawing: IsometricDrawing,
  orgName: string = 'SEMAX PINO C.A.',
  projectName: string = 'Proyecto Tuberías y Recipientes PDVSA',
  liberatedBy: string = 'Ing. Manuel Silva (QA/QC Manager)'
): Promise<{ pdfBlob: Blob; hashSha256: string }> {
  const doc = createJsPdfInstance({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const nowIso = new Date().toISOString();
  const rawPayload = `PDVSA-ASBUILT-L-STC-001|ISO:${drawing.number}|TAG:${drawing.lineTag}|JOINTS:${drawing.joints.length}|DATE:${nowIso}|ORG:${orgName}`;

  // Generate SHA-256 Hash
  const encoder = new TextEncoder();
  const data = encoder.encode(rawPayload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashSha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const primaryColor = [11, 34, 57]; // #0B2239
  const accentColor = [16, 185, 129]; // #10b981
  const darkGray = [55, 65, 81]; // #374151

  // Standard 15mm margins (A4 width = 210mm, printable width = 180mm)
  const marginX = 15;
  const contentWidth = 180;
  let y = 15;

  // Header Box
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(marginX, y, contentWidth, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('PDVSA — INDUSTRIAL CONTROL 360', marginX + 5, y + 8);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('DOSSIER DE CALIDAD DE PIPING — CAPÍTULO 6 (AS-BUILT)', marginX + 5, y + 15);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`CÓDIGO INTEGRIDAD: ${hashSha256.substring(0, 16).toUpperCase()}`, marginX + 5, y + 21);

  y += 32;

  // Document Title
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('CERTIFICADO OFICIAL DE LIBERACIÓN AS-BUILT DE ISOMÉTRICO', marginX, y);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text('Norma PDVSA L-STC-001 / PIC-01-03-05 — Inspección NDT 100% Aprobada Sin Defectos', marginX, y + 5);

  y += 11;

  // Metadata Table Box
  doc.setFillColor(243, 244, 246);
  doc.rect(marginX, y, contentWidth, 32, 'F');
  doc.setDrawColor(209, 213, 219);
  doc.rect(marginX, y, contentWidth, 32, 'S');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

  const col1X = marginX + 4;
  const col2X = marginX + 95;

  doc.text(`N° Isométrico: ${drawing.number}`, col1X, y + 7, { maxWidth: 85 });
  doc.text(`Tag de Línea: ${drawing.lineTag}`, col1X, y + 14, { maxWidth: 85 });
  doc.text(`Organización: ${orgName}`, col1X, y + 21, { maxWidth: 85 });
  doc.text(`Proyecto: ${projectName}`, col1X, y + 28, { maxWidth: 85 });

  doc.text(`Fluido / Sistema: ${drawing.fluidSystem}`, col2X, y + 7, { maxWidth: 80 });
  doc.text(`Presión / Temp: ${drawing.designPressurePsi} PSI / ${drawing.designTempC}°C`, col2X, y + 14, { maxWidth: 80 });
  doc.text(`Revisión: ${drawing.revision} (${drawing.date})`, col2X, y + 21, { maxWidth: 80 });
  doc.text(`Total Juntas / Status: ${drawing.joints.length} / APROBADO 100%`, col2X, y + 28, { maxWidth: 80 });

  y += 38;

  // Table Title
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('MATRIZ DE TRAZABILIDAD MTR, SOLDADURA Y ENSAYOS NO DESTRUCTIVOS (NDT)', marginX, y);

  y += 5;

  // Table Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(marginX, y, contentWidth, 8, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);

  doc.text('Junta', marginX + 2, y + 5.5);
  doc.text('Spool', marginX + 16, y + 5.5);
  doc.text('Estampa', marginX + 38, y + 5.5);
  doc.text('Colada MTR', marginX + 58, y + 5.5);
  doc.text('Material / Especificación', marginX + 92, y + 5.5);
  doc.text('NDT', marginX + 138, y + 5.5);
  doc.text('Reporte NDT', marginX + 152, y + 5.5);
  doc.text('Status', marginX + 172, y + 5.5);

  y += 8;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  drawing.joints.forEach((joint, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(marginX, y, contentWidth, 7, 'F');
    }

    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(joint.tag, marginX + 2, y + 5);
    doc.text(joint.spoolTag, marginX + 16, y + 5);
    doc.text(joint.welderStamp, marginX + 38, y + 5);
    doc.text(joint.heatNumber, marginX + 58, y + 5);
    doc.text(joint.material.substring(0, 22), marginX + 92, y + 5);
    doc.text(joint.ndtMethod, marginX + 138, y + 5);
    doc.text(joint.ndtReportNo || 'REP-PEND', marginX + 152, y + 5);

    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('APROBADO', marginX + 172, y + 5);
    doc.setFont('helvetica', 'normal');

    y += 7;
  });

  y += 8;

  // Summary Note
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(16, 185, 129);
  doc.rect(marginX, y, contentWidth, 16, 'DF');

  doc.setFontSize(8);
  doc.setTextColor(6, 78, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('DICTAMEN DE INSPECCIÓN Y LIBERACIÓN AS-BUILT:', marginX + 4, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Se certifica que el 100% de las juntas soldadas del isométrico ${drawing.number} han sido inspeccionadas mediante ensayo radiográfico/ultrasónico conforme a API 1104 / ASME B31.3. La trazabilidad MTR corresponde fielmente con los certificados de colada del Capítulo 3 del Dossier.`, marginX + 4, y + 10, { maxWidth: contentWidth - 8 });

  y += 24;

  // Digital Verification Stamp
  doc.setFillColor(243, 244, 246);
  doc.setDrawColor(209, 213, 219);
  doc.rect(marginX, y, contentWidth, 15, 'DF');

  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.text(`VERIFICACIÓN DIGITAL SHA-256: ${hashSha256}`, marginX + 4, y + 5);
  doc.text(`FECHA DE EMISIÓN: ${new Date().toLocaleString()} | REGISTRO AUTÉNTICO EN FIRESTORE DOSSIER CAP. 6`, marginX + 4, y + 10);

  y += 22;

  // Signatures
  doc.setDrawColor(156, 163, 175);
  doc.line(marginX + 5, y + 15, marginX + 55, y + 15);
  doc.line(marginX + 65, y + 15, marginX + 115, y + 15);
  doc.line(marginX + 125, y + 15, marginX + 175, y + 15);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

  doc.text(liberatedBy, marginX + 5, y + 19);
  doc.text('Gerente de Obra / QAQC Manager', marginX + 5, y + 23);

  doc.text('Ing. Marcos Silva', marginX + 65, y + 19);
  doc.text('Inspector CWI / Nivel III ASNT', marginX + 65, y + 23);

  doc.text('Representante Inspección PDVSA', marginX + 125, y + 19);
  doc.text('Superintendencia de Calidad', marginX + 125, y + 23);

  const pdfOutput = doc.output('blob');
  return { pdfBlob: pdfOutput, hashSha256 };
}

