import ExcelJS from 'exceljs';
import { TakeoffItem } from '../components/engineering/QuantityTakeoff';
import { ApuItem, calculateApuUnitCost } from './engineering/apuCalculator';
import { DocumentViewModel, DocumentTableCell } from './documentViewModel';

/**
 * Utility to download ExcelJS Workbook buffer in browser
 */
async function downloadWorkbook(workbook: ExcelJS.Workbook, fileName: string) {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
}

/**
 * Build a structured ExcelJS.Workbook from a DocumentViewModel contract (S19)
 */
export function buildDocumentViewModelWorkbook(vm: DocumentViewModel): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = vm.contractorBrand?.companyName || 'PROINTECA C.A.';
  workbook.lastModifiedBy = 'Industrial 360 App';
  workbook.created = new Date();

  const sheetName = (vm.title || 'Documento').substring(0, 31).replace(/[:\\/?*\[\]]/g, '_');
  const ws = workbook.addWorksheet(sheetName);

  // Row 1: Draft watermark banner if applicable
  if (vm.isDraft) {
    const draftRow = ws.addRow(['[BORRADOR - IC360 - DOCUMENTO DE TRABAJO EDITABLE]']);
    const cellA1 = draftRow.getCell(1);
    cellA1.font = { bold: true, color: { argb: 'FFB91C1C' }, size: 9 };
  }

  // Row 2 & 3: Dual Header Branding
  const contractorName = vm.contractorBrand?.companyName || 'PROINTECA C.A.';
  const operatorName = vm.operatorBrand?.companyName || 'PDVSA';
  ws.addRow([`CONTRATISTA: ${contractorName}`, '', '', `OPERADOR: ${operatorName}`]);
  ws.addRow([`CÓDIGO: ${vm.code}`, `FECHA: ${vm.date}`, `ESTADO: ${vm.status}`]);
  ws.addRow([`TÍTULO: ${vm.title.toUpperCase()}`]);
  ws.addRow([]); // Blank spacer

  // Iterate over tables in DocumentViewModel
  if (vm.tables && vm.tables.length > 0) {
    vm.tables.forEach((table) => {
      if (table.title) {
        const titleRow = ws.addRow([table.title.toUpperCase()]);
        titleRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FF0B2239' } };
      }

      // Header row
      const headerRow = ws.addRow(table.headers);
      headerRow.eachCell((c) => {
        c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        c.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0B2239' }
        };
        c.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      // Data rows
      table.rows.forEach((row) => {
        const rowValues = row.cells.map(() => ''); // placeholder array
        const wsRow = ws.addRow(rowValues);

        row.cells.forEach((cell: DocumentTableCell, colIdx: number) => {
          const wsCell = wsRow.getCell(colIdx + 1);

          // C2 Rule: Safe formula assignment check
          if (typeof cell.formula === 'string' && cell.formula.trim().length > 0) {
            wsCell.value = { formula: cell.formula };
          } else {
            wsCell.value = cell.value ?? '';
          }

          if (cell.bold) {
            wsCell.font = { bold: true };
          }

          if (cell.align) {
            wsCell.alignment = { horizontal: cell.align };
          }

          // Number formatting for VES/USD
          if (typeof cell.value === 'number') {
            if (table.title?.toLowerCase().includes('ves') || table.title?.toLowerCase().includes('bs')) {
              wsCell.numFmt = '#,##0.00 "Bs."';
            } else if (typeof cell.value === 'number') {
              wsCell.numFmt = '#,##0.00';
            }
          }
        });
      });

      // Summary Row if present
      if (table.summaryRow) {
        const sumRowValues = table.summaryRow.cells.map(() => '');
        const wsSumRow = ws.addRow(sumRowValues);
        table.summaryRow.cells.forEach((cell, colIdx) => {
          const wsCell = wsSumRow.getCell(colIdx + 1);
          if (typeof cell.formula === 'string' && cell.formula.trim().length > 0) {
            wsCell.value = { formula: cell.formula };
          } else {
            wsCell.value = cell.value ?? '';
          }
          wsCell.font = { bold: true };
          if (cell.align) wsCell.alignment = { horizontal: cell.align };
        });
      }

      ws.addRow([]); // Blank spacer between tables
    });
  } else {
    // If no explicit tables, render sections content
    vm.sections.forEach((sec) => {
      const secTitleRow = ws.addRow([sec.title.toUpperCase()]);
      secTitleRow.getCell(1).font = { bold: true, size: 11 };
      sec.content.forEach((p) => {
        ws.addRow([p]);
      });
      ws.addRow([]);
    });
  }

  // Signatures block at bottom
  if (vm.signers && vm.signers.length > 0) {
    ws.addRow(['MATRIZ DE FIRMAS Y ACEPTACIÓN DIGITAL']);
    const signerHeaders = ['Rol', 'Nombre', 'Cargo / Organización', 'Estado', 'Fecha Firma'];
    const sHeaderRow = ws.addRow(signerHeaders);
    sHeaderRow.eachCell((c) => {
      c.font = { bold: true };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    });

    vm.signers.forEach((s) => {
      ws.addRow([s.role, s.name, `${s.title} (${s.organization})`, s.status, s.signedAt || 'Pendiente']);
    });
  }

  // Auto column widths
  ws.columns.forEach((col) => {
    col.width = 24;
  });

  return workbook;
}

/**
 * Export DocumentViewModel directly to Excel XLSX download (S19)
 */
export async function exportDocumentViewModelToXlsx(vm: DocumentViewModel, fileName?: string) {
  const workbook = buildDocumentViewModelWorkbook(vm);
  const outName = fileName || `${vm.code || 'Documento'}_${vm.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
  await downloadWorkbook(workbook, outName);
  return workbook;
}

/**
 * Utility to export Quantity Takeoffs (Cómputos Métricos) to native .xlsx Excel with corporate formatting
 */
export async function exportQuantityTakeoffsToXlsx(
  takeoffs: TakeoffItem[],
  projectName: string = 'Proyecto Industrial PDVSA',
  orgName: string = 'PROINTECA C.A. / PDVSA'
) {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Cómputos Métricos');

  ws.addRow([orgName]);
  ws.addRow(['LIBRO OFICIAL DE CÓMPUTOS MÉTRICOS Y METRADOS (SIDCON)']);
  ws.addRow([`Proyecto: ${projectName}`, '', '', '', `Fecha de Emisión: ${new Date().toLocaleDateString()}`]);
  ws.addRow([]); // Blank row
  ws.addRow([
    'Partida WBS',
    'Descripción del Ítem',
    'Ubicación / Tramo',
    'Unidad',
    'N° Piezas',
    'Largo (m)',
    'Ancho (m)',
    'Alto / Esp. (m)',
    'Cantidad Total',
    'Notas de Campo',
    'Estado SIDCON'
  ]);

  takeoffs.forEach((t) => {
    ws.addRow([
      t.wbsCode,
      t.description,
      t.location,
      t.unit,
      t.count,
      t.lengthM,
      t.widthM,
      t.heightOrThicknessM,
      t.totalQuantity,
      t.notes || '',
      t.status
    ]);
  });

  const lastDataRowIndex = 5 + takeoffs.length;
  ws.addRow([
    'TOTAL GENERAL',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    { formula: `SUM(I6:I${lastDataRowIndex})` },
    '',
    ''
  ]);

  ws.columns = [
    { width: 16 }, // WBS
    { width: 42 }, // Desc
    { width: 22 }, // Ubicacion
    { width: 10 }, // Unidad
    { width: 12 }, // Piezas
    { width: 12 }, // Largo
    { width: 12 }, // Ancho
    { width: 14 }, // Alto
    { width: 18 }, // Total
    { width: 28 }, // Notas
    { width: 18 }  // Status
  ];

  const cleanProjName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
  await downloadWorkbook(workbook, `Libro_Computos_Metricos_${cleanProjName}.xlsx`);
}

/**
 * Utility to export APUs (Análisis de Precios Unitarios) to native .xlsx Excel with corporate formatting
 */
export async function exportApuPresupuestoToXlsx(
  apus: ApuItem[],
  projectName: string = 'Proyecto Industrial PDVSA',
  orgName: string = 'PROINTECA C.A. / PDVSA'
) {
  const workbook = new ExcelJS.Workbook();

  // --- SHEET 1: RESUMEN DE PRESUPUESTO APU ---
  const wsResumen = workbook.addWorksheet('Resumen APU');

  wsResumen.addRow([orgName]);
  wsResumen.addRow(['PRESUPUESTO OFICIAL DE ANÁLISIS DE PRECIOS UNITARIOS (APU & BC3)']);
  wsResumen.addRow([`Proyecto: ${projectName}`, '', '', '', `Fecha: ${new Date().toLocaleDateString()}`]);
  wsResumen.addRow([]);
  wsResumen.addRow([
    'Código APU',
    'Título de la Partida',
    'Unidad',
    'Mano de Obra ($)',
    'Equipos ($)',
    'Materiales ($)',
    'Subtotal Directo ($)',
    'Indirectos & Ganancia ($)',
    'Precio Unitario ($)'
  ]);

  apus.forEach((apu, index) => {
    const calc = calculateApuUnitCost(apu);
    const excelRow = 6 + index;

    wsResumen.addRow([
      apu.code,
      apu.title,
      apu.unit,
      calc.laborTotal,
      calc.equipTotal,
      calc.matTotal,
      { formula: `SUM(D${excelRow}:F${excelRow})` },
      calc.indirectTotal,
      { formula: `G${excelRow}+H${excelRow}` }
    ]);
  });

  const lastDataRow = 5 + apus.length;
  wsResumen.addRow([
    'TOTAL PRESUPUESTO UNITARIO',
    '',
    '',
    { formula: `SUM(D6:D${lastDataRow})` },
    { formula: `SUM(E6:E${lastDataRow})` },
    { formula: `SUM(F6:F${lastDataRow})` },
    { formula: `SUM(G6:G${lastDataRow})` },
    { formula: `SUM(H6:H${lastDataRow})` },
    { formula: `SUM(I6:I${lastDataRow})` }
  ]);

  wsResumen.columns = [
    { width: 16 },
    { width: 45 },
    { width: 10 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
    { width: 22 },
    { width: 24 },
    { width: 24 }
  ];

  // --- SHEET 2: DESGLOSE DETALLADO DE INSUMOS ---
  const wsDesglose = workbook.addWorksheet('Desglose Insumos');
  wsDesglose.addRow([orgName]);
  wsDesglose.addRow(['MATRIZ DETALLADA DE DESGLOSE DE INSUMOS (MANO DE OBRA, EQUIPOS, MATERIALES)']);
  wsDesglose.addRow([]);
  wsDesglose.addRow([
    'Partida APU',
    'Rubro / Tipo',
    'Descripción del Insumo',
    'Cantidad / Cant. Per Unit',
    'Unidad',
    'Tarifa Unit. ($)',
    'Costo Parcial ($)'
  ]);

  apus.forEach((apu) => {
    // Labor
    apu.labor.forEach((l) => {
      wsDesglose.addRow([
        `${apu.code} - ${apu.title}`,
        'Mano de Obra',
        l.category,
        l.count,
        'pers',
        l.baseSalaryDailyUsd,
        l.count * l.baseSalaryDailyUsd
      ]);
    });
    // Equipment
    apu.equipment.forEach((e) => {
      wsDesglose.addRow([
        `${apu.code} - ${apu.title}`,
        'Equipos y Maquinaria',
        e.name,
        e.hoursActive,
        'hrs',
        e.hourlyRateActiveUsd,
        e.hoursActive * e.hourlyRateActiveUsd
      ]);
    });
    // Materials
    apu.materials.forEach((m) => {
      wsDesglose.addRow([
        `${apu.code} - ${apu.title}`,
        'Materiales e Insumos',
        m.description,
        m.quantityPerUnit,
        m.unit,
        m.unitPriceUsd,
        m.quantityPerUnit * m.unitPriceUsd
      ]);
    });
  });

  wsDesglose.columns = [
    { width: 30 },
    { width: 20 },
    { width: 35 },
    { width: 16 },
    { width: 10 },
    { width: 18 },
    { width: 18 }
  ];

  const cleanProjName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
  await downloadWorkbook(workbook, `Presupuesto_APU_PROINTECA_${cleanProjName}.xlsx`);
}
