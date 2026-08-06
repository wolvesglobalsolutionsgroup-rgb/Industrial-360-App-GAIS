import { jsPDF } from 'jspdf';
import { DocumentViewModel } from './documentViewModel';
import { DocumentExporter } from './documentPolicy';

/**
 * Utility to convert Hex color string (e.g. '#0B2239') into RGB tuple
 */
function hexToRgb(hexString?: string): { r: number; g: number; b: number } {
  let clean = (hexString || '#0B2239').replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16) || 0x0b2239;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Creates and returns a new jsPDF instance cleanly.
 * This is the ONLY designated entrypoint for raw jsPDF instantiation in the codebase.
 */
export function createJsPdfInstance(options?: any): jsPDF {
  return new jsPDF(
    options || {
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    }
  );
}

/**
 * Canonical PDF Exporter: Renders a DocumentViewModel contract into an immutable PDF Blob.
 */
export async function exportDocumentToPdf(doc: DocumentViewModel): Promise<Blob> {
  const pdf = createJsPdfInstance({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const contractorName = doc.contractorBrand?.companyName || 'PROINTECA C.A.';
  const operatorName = doc.operatorBrand?.companyName || 'PDVSA';
  const primaryRgb = hexToRgb(doc.contractorBrand?.primaryColor || '#0B2239');
  const secondaryRgb = hexToRgb(doc.contractorBrand?.secondaryColor || '#059669');

  const marginX = 12;
  const pageWidth = 210;
  const printableWidth = pageWidth - marginX * 2; // 186mm
  let y = 12;

  const checkPageOverflow = (heightNeeded: number) => {
    if (y + heightNeeded > 275) {
      pdf.addPage();
      y = 15;
    }
  };

  // 1. Dual Branding Header Banner
  pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.rect(0, 0, pageWidth, 22, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text(contractorName.toUpperCase(), marginX, 9);

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`CONTRATISTA DE OBRA  |  CÓDIGO: ${doc.code || doc.documentId}`, marginX, 15);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  pdf.text(`OPERADOR: ${operatorName.toUpperCase()}`, pageWidth - marginX, 9, { align: 'right' });

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`FECHA: ${doc.date}`, pageWidth - marginX, 15, { align: 'right' });

  // Secondary Accent Line
  pdf.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
  pdf.rect(0, 22, pageWidth, 2, 'F');

  y = 28;

  // Draft Watermark Banner
  if (doc.isDraft) {
    pdf.setFillColor(254, 226, 226); // Red-100
    pdf.setDrawColor(220, 38, 38);
    pdf.rect(marginX, y, printableWidth, 8, 'DF');

    pdf.setTextColor(185, 28, 28);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.text('⚠️ [BORRADOR - IC360 - DOCUMENTO DE TRABAJO EDITABLE]', pageWidth / 2, y + 5.5, {
      align: 'center',
    });

    y += 12;
  }

  // Document Main Title
  pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text(doc.title.toUpperCase(), marginX, y, { maxWidth: printableWidth });

  y += 8;

  // Metadata Box
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.rect(marginX, y, printableWidth, 14, 'DF');

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(51, 65, 85);
  pdf.text(`Estado Documental: ${doc.status} (${doc.isDraft ? 'Editable' : 'Sellado/Inmutable'})`, marginX + 4, y + 5);
  pdf.text(`Plantilla / Sello: ${doc.metadata?.templateVersion || '2026.1'} / ${doc.metadata?.sealVersion || 'v1.0'}`, marginX + 4, y + 10);

  pdf.text(`Zona Horaria: ${doc.metadata?.timezone || 'America/Caracas'}`, marginX + 100, y + 5);
  pdf.text(`Congelado en: ${doc.metadata?.frozenAt || doc.date}`, marginX + 100, y + 10);

  y += 18;

  // 2. Sections Rendering
  if (doc.sections && doc.sections.length > 0) {
    doc.sections.forEach((sec, idx) => {
      checkPageOverflow(15);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      pdf.text(`${idx + 1}. ${sec.title.toUpperCase()}`, marginX, y);
      y += 6;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(30, 41, 59);

      sec.content.forEach((paragraphText) => {
        const splitLines = pdf.splitTextToSize(paragraphText, printableWidth);
        checkPageOverflow(splitLines.length * 4.5 + 4);
        pdf.text(splitLines, marginX, y);
        y += splitLines.length * 4.5 + 2;
      });

      if (sec.bullets && sec.bullets.length > 0) {
        sec.bullets.forEach((bullet) => {
          const splitBullet = pdf.splitTextToSize(`• ${bullet}`, printableWidth - 4);
          checkPageOverflow(splitBullet.length * 4.5 + 2);
          pdf.text(splitBullet, marginX + 4, y);
          y += splitBullet.length * 4.5 + 2;
        });
      }

      y += 4;
    });
  }

  // 3. Tables Rendering
  if (doc.tables && doc.tables.length > 0) {
    doc.tables.forEach((table) => {
      checkPageOverflow(20);

      if (table.title) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9.5);
        pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        pdf.text(table.title.toUpperCase(), marginX, y);
        y += 5;
      }

      const colCount = Math.max(1, table.headers.length);
      const colWidth = printableWidth / colCount;

      // Header Row
      checkPageOverflow(8);
      pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      pdf.rect(marginX, y, printableWidth, 7, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(255, 255, 255);

      table.headers.forEach((h, colIdx) => {
        const cellX = marginX + colIdx * colWidth + 2;
        pdf.text(String(h).substring(0, 20), cellX, y + 4.5);
      });

      y += 7;

      // Data Rows
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(15, 23, 42);

      table.rows.forEach((row, rowIdx) => {
        checkPageOverflow(7);

        if (rowIdx % 2 === 1) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(marginX, y, printableWidth, 6, 'F');
        }

        row.cells.forEach((cell, colIdx) => {
          const cellX = marginX + colIdx * colWidth + 2;
          const displayVal = cell.formula ? `[Fórmula: ${cell.formula}]` : String(cell.value ?? '');

          if (cell.bold) pdf.setFont('helvetica', 'bold');
          else pdf.setFont('helvetica', 'normal');

          pdf.text(displayVal.substring(0, 22), cellX, y + 4.2);
        });

        y += 6;
      });

      // Summary Row if present
      if (table.summaryRow) {
        checkPageOverflow(7);
        pdf.setFillColor(241, 245, 249);
        pdf.rect(marginX, y, printableWidth, 6.5, 'F');

        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(11, 34, 57);

        table.summaryRow.cells.forEach((cell, colIdx) => {
          const cellX = marginX + colIdx * colWidth + 2;
          const displayVal = cell.formula ? `[Fórmula: ${cell.formula}]` : String(cell.value ?? '');
          pdf.text(displayVal.substring(0, 22), cellX, y + 4.5);
        });

        y += 6.5;
      }

      y += 6;
    });
  }

  // 4. Signatures Matrix
  if (doc.signers && doc.signers.length > 0) {
    checkPageOverflow(35);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    pdf.text('MATRIZ DE FIRMAS Y VALIDADORES DIGITALES', marginX, y);
    y += 5;

    const signerCount = doc.signers.length;
    const boxW = Math.min(88, printableWidth / Math.min(2, signerCount));
    const boxH = 22;

    doc.signers.forEach((s, sIdx) => {
      const col = sIdx % 2;
      if (col === 0 && sIdx > 0) {
        y += boxH + 4;
        checkPageOverflow(boxH + 4);
      }
      const boxX = marginX + col * (boxW + 6);

      pdf.setDrawColor(203, 213, 225);
      pdf.setFillColor(250, 250, 250);
      pdf.rect(boxX, y, boxW, boxH, 'DF');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(5, 150, 105);
      pdf.text(`[${s.role}] - ${s.status}`, boxX + 3, y + 5);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(15, 23, 42);
      pdf.text(s.name, boxX + 3, y + 10);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(71, 85, 105);
      pdf.text(`${s.title} (${s.organization})`, boxX + 3, y + 14);
      pdf.text(`Fecha: ${s.signedAt || 'Pendiente'}`, boxX + 3, y + 18);
    });

    y += boxH + 8;
  }

  // 5. Footer and Disclaimer
  checkPageOverflow(20);
  pdf.setDrawColor(203, 213, 225);
  pdf.line(marginX, y, pageWidth - marginX, y);
  y += 4;

  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  pdf.text(doc.disclaimer || 'DOCUMENTO OFICIAL INDUSTRIAL CONTROL 360', marginX, y, {
    maxWidth: printableWidth,
  });

  return pdf.output('blob');
}

/**
 * Convenience Helper to trigger browser download for DocumentViewModel in PDF format.
 */
export async function exportDocumentViewModelToPdf(doc: DocumentViewModel, fileName?: string): Promise<void> {
  const blob = await exportDocumentToPdf(doc);
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || `${doc.code || 'DOC'}_${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

/**
 * Concrete instance of DocumentExporter contract for PDF format.
 */
export const pdfDocumentExporter: DocumentExporter = {
  id: 'pdf-canonical',
  format: 'pdf',
  export: exportDocumentToPdf,
};
