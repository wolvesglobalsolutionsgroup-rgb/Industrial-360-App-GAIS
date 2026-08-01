import PptxGenJS from 'pptxgenjs';
import { DocumentViewModel } from './documentViewModel';

/**
 * PPTX_LAYOUT: Widescreen 16:9 — estándar corporativo IC360
 * PptxGenJS default widescreen layout width: 10", height: 5.625"
 */
export const PPTX_LAYOUT = 'LAYOUT_WIDE' as const;

/**
 * Generates a PptxGenJS presentation instance from a DocumentViewModel (S19)
 */
export async function buildPptxPresentation(vm: DocumentViewModel): Promise<PptxGenJS> {
  const pptx = new PptxGenJS();
  pptx.layout = PPTX_LAYOUT;

  const contractorName = vm.contractorBrand?.companyName || 'PROINTECA C.A.';
  const operatorName = vm.operatorBrand?.companyName || 'PDVSA';
  const primaryHex = (vm.contractorBrand?.primaryColor || '#0B2239').replace('#', '');

  // ---------------------------------------------------------
  // SLIDE 1: PORTADA OFICIAL DE PRESENTACIÓN
  // ---------------------------------------------------------
  const coverSlide = pptx.addSlide();

  // Background Top Accent Bar
  coverSlide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.8,
    fill: { color: primaryHex },
  });

  // Top Header Text
  coverSlide.addText(`${contractorName}  |  ${operatorName}`, {
    x: 0.5,
    y: 0.2,
    w: 9.0,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: 'FFFFFF',
    align: 'left',
  });

  // Draft Watermark Banner
  if (vm.isDraft) {
    coverSlide.addText('⚠️ [BORRADOR - IC360 - DOCUMENTO DE TRABAJO EDITABLE]', {
      x: 0.5,
      y: 0.9,
      w: 9.0,
      h: 0.3,
      fontSize: 12,
      bold: true,
      color: 'B91C1C',
      align: 'center',
    });
  }

  // Document Title
  coverSlide.addText(vm.title.toUpperCase(), {
    x: 0.8,
    y: 1.5,
    w: 8.4,
    h: 1.2,
    fontSize: 24,
    bold: true,
    color: primaryHex,
    align: 'center',
    valign: 'middle',
  });

  // Code and Metadata Box
  coverSlide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 1.5,
    y: 2.9,
    w: 7.0,
    h: 1.0,
    fill: { color: 'F1F5F9' },
    line: { color: 'CBD5E1', width: 1 },
  });

  coverSlide.addText(`CÓDIGO DOCUMENTO: ${vm.code}\nFECHA EMISIÓN: ${vm.date}  |  ESTADO: ${vm.status}`, {
    x: 1.6,
    y: 3.0,
    w: 6.8,
    h: 0.8,
    fontSize: 13,
    bold: true,
    color: '0F172A',
    align: 'center',
  });

  // Signers Summary
  if (vm.signers && vm.signers.length > 0) {
    const signerNames = vm.signers.map(s => `${s.role}: ${s.name} (${s.title})`).join('  •  ');
    coverSlide.addText(`FIRMANTES Y VALIDACIÓN:\n${signerNames}`, {
      x: 0.5,
      y: 4.2,
      w: 9.0,
      h: 0.8,
      fontSize: 10,
      color: '475569',
      align: 'center',
    });
  }

  // ---------------------------------------------------------
  // SLIDES 2+: SECCIONES Y TABLAS
  // ---------------------------------------------------------
  // Render Sections
  if (vm.sections && vm.sections.length > 0) {
    vm.sections.forEach((sec, idx) => {
      const slide = pptx.addSlide();

      // Top Header Line
      slide.addShape('rect' as PptxGenJS.ShapeType, {
        x: 0,
        y: 0,
        w: '100%',
        h: 0.6,
        fill: { color: primaryHex },
      });

      slide.addText(`${idx + 1}. ${sec.title.toUpperCase()}`, {
        x: 0.5,
        y: 0.1,
        w: 9.0,
        h: 0.4,
        fontSize: 16,
        bold: true,
        color: 'FFFFFF',
      });

      // Section Content
      const textContent = sec.content.join('\n\n');
      slide.addText(textContent, {
        x: 0.6,
        y: 0.9,
        w: 8.8,
        h: 2.2,
        fontSize: 12,
        color: '0F172A',
        align: 'left',
        valign: 'top',
      });

      // Bullets if present
      if (sec.bullets && sec.bullets.length > 0) {
        const bulletRows = sec.bullets.map(b => ({ text: b, options: { bullet: true } }));
        slide.addText(bulletRows, {
          x: 0.6,
          y: 3.2,
          w: 8.8,
          h: 1.8,
          fontSize: 11,
          color: '334155',
        });
      }
    });
  }

  // Render Tables as Slides
  if (vm.tables && vm.tables.length > 0) {
    vm.tables.forEach((table) => {
      const slide = pptx.addSlide();

      // Top Header
      slide.addShape('rect' as PptxGenJS.ShapeType, {
        x: 0,
        y: 0,
        w: '100%',
        h: 0.6,
        fill: { color: primaryHex },
      });

      slide.addText((table.title || 'TABLA DE DATOS DEL DOCUMENTO').toUpperCase(), {
        x: 0.5,
        y: 0.1,
        w: 9.0,
        h: 0.4,
        fontSize: 16,
        bold: true,
        color: 'FFFFFF',
      });

      // Prepare Table Data for PptxGenJS
      const tableRows: PptxGenJS.TableRow[] = [];

      // Header Row
      const headerRowCells: PptxGenJS.TableCell[] = table.headers.map(h => ({
        text: h,
        options: { bold: true, color: 'FFFFFF', fill: { color: primaryHex }, align: 'center', fontSize: 10 }
      }));
      tableRows.push(headerRowCells);

      // Data Rows
      table.rows.forEach(r => {
        const dataRowCells: PptxGenJS.TableCell[] = r.cells.map(c => ({
          text: c.formula ? `[Formula: ${c.formula}]` : String(c.value ?? ''),
          options: {
            bold: c.bold || false,
            align: c.align || 'left',
            color: '0F172A',
            fontSize: 9
          }
        }));
        tableRows.push(dataRowCells);
      });

      // Summary Row
      if (table.summaryRow) {
        const sumRowCells: PptxGenJS.TableCell[] = table.summaryRow.cells.map(c => ({
          text: String(c.value ?? ''),
          options: { bold: true, align: c.align || 'left', color: '0B2239', fontSize: 10 }
        }));
        tableRows.push(sumRowCells);
      }

      slide.addTable(tableRows, {
        x: 0.5,
        y: 0.9,
        w: 9.0,
        colW: Array(table.headers.length).fill(9.0 / Math.max(1, table.headers.length)),
        border: { pt: 1, color: 'CBD5E1' }
      });
    });
  }

  return pptx;
}

/**
 * Export DocumentViewModel directly to PPTX file download in browser
 */
export async function exportDocumentViewModelToPptx(vm: DocumentViewModel, fileName?: string) {
  const pptx = await buildPptxPresentation(vm);
  const outName = fileName || `${vm.code || 'PPTX'}_${vm.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pptx`;
  await pptx.writeFile({ fileName: outName });
}
