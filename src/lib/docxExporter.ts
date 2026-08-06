import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  Header,
  Footer,
  HeadingLevel
} from 'docx';
import { DocumentViewModel } from './documentViewModel';
import { DocumentExporter } from './exporters/types';

/**
 * Concrete instance of DocumentExporter contract for DOCX format.
 */
export const docxDocumentExporter: DocumentExporter = {
  id: 'docx-canonical',
  format: 'docx',
  export: async (doc: DocumentViewModel): Promise<Blob> => {
    const buffer = await generateDocxBuffer(doc);
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  },
};

/**
 * Generates a DOCX Document instance from a DocumentViewModel (S19)
 */
export function buildDocxDocument(vm: DocumentViewModel): Document {
  const contractorName = vm.contractorBrand?.companyName || 'PROINTECA C.A.';
  const operatorName = vm.operatorBrand?.companyName || 'PDVSA';
  const primaryHex = (vm.contractorBrand?.primaryColor || '#0B2239').replace('#', '');

  // 1. Dual Header Table
  const dualHeaderTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 12, color: primaryHex },
      bottom: { style: BorderStyle.SINGLE, size: 12, color: primaryHex },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' },
    },
    rows: [
      new TableRow({
        children: [
          // Left: Contractor
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: contractorName, bold: true, size: 20, color: primaryHex }),
                  new TextRun({ text: '\nCONTRATISTA DE OBRA', size: 14, bold: true, color: '64748B' }),
                ],
              }),
            ],
          }),
          // Center: Title & Metadata
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: vm.title.toUpperCase(), bold: true, size: 22, color: primaryHex }),
                  new TextRun({ text: `\nCÓDIGO: ${vm.code}`, size: 16, bold: true, color: '0F172A' }),
                  new TextRun({ text: ` | FECHA: ${vm.date}`, size: 16, color: '475569' }),
                ],
              }),
            ],
          }),
          // Right: Operator
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: operatorName, bold: true, size: 20, color: 'B91C1C' }),
                  new TextRun({ text: '\nCLIENTE / OPERADOR', size: 14, bold: true, color: '7F1D1D' }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const children: (Paragraph | Table)[] = [];

  // Top Watermark Banner if Draft
  if (vm.isDraft) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: '⚠️ [BORRADOR - IC360 - DOCUMENTO DE TRABAJO EDITABLE]',
            bold: true,
            color: 'B91C1C',
            size: 18,
          }),
        ],
      })
    );
  }

  children.push(dualHeaderTable);
  children.push(new Paragraph({ text: '' })); // Spacer

  // 2. Render Sections
  if (vm.sections && vm.sections.length > 0) {
    vm.sections.forEach((sec, idx) => {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: `${idx + 1}. ${sec.title}`,
              bold: true,
              size: 24,
              color: primaryHex,
            }),
          ],
        })
      );

      sec.content.forEach((paragraphText) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: paragraphText,
                size: 20, // 10pt
              }),
            ],
          })
        );
      });

      if (sec.bullets) {
        sec.bullets.forEach((b) => {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              children: [new TextRun({ text: b, size: 20 })],
            })
          );
        });
      }

      children.push(new Paragraph({ text: '' }));
    });
  }

  // 3. Render Tables
  if (vm.tables && vm.tables.length > 0) {
    vm.tables.forEach((t) => {
      if (t.title) {
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: [
              new TextRun({
                text: t.title,
                bold: true,
                size: 22,
                color: primaryHex,
              }),
            ],
          })
        );
      }

      const tableRows: TableRow[] = [];

      // Headers
      tableRows.push(
        new TableRow({
          tableHeader: true,
          children: t.headers.map(
            (h) =>
              new TableCell({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 18 })],
                  }),
                ],
                shading: { fill: primaryHex },
              })
          ),
        })
      );

      // Rows
      t.rows.forEach((r) => {
        tableRows.push(
          new TableRow({
            children: r.cells.map(
              (c) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      alignment: c.align === 'center' ? AlignmentType.CENTER : c.align === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT,
                      children: [
                        new TextRun({
                          text: c.formula ? `[Fórumula: ${c.formula}]` : String(c.value ?? ''),
                          bold: c.bold,
                          size: 18,
                        }),
                      ],
                    }),
                  ],
                })
            ),
          })
        );
      });

      children.push(
        new Table(
          {
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows,
          }
        )
      );

      children.push(new Paragraph({ text: '' }));
    });
  }

  // 4. Signers Block Table 1:N
  if (vm.signers && vm.signers.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [
          new TextRun({
            text: 'MATRIZ Y REGISTRO DE FIRMAS DIGITALES',
            bold: true,
            size: 22,
            color: primaryHex,
          }),
        ],
      })
    );

    const signerCells = vm.signers.map(
      (s) =>
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: `[${s.role}]`, bold: true, size: 16, color: '059669' }),
                new TextRun({ text: `\n${s.name}`, bold: true, size: 18 }),
                new TextRun({ text: `\n${s.title}`, size: 16, color: '475569' }),
                new TextRun({ text: `\n${s.organization}`, size: 14, color: '64748B' }),
                new TextRun({ text: `\nFecha: ${s.signedAt || 'Pendiente'}`, size: 14 }),
              ],
            }),
          ],
        })
    );

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [new TableRow({ children: signerCells })],
      })
    );
  }

  // Header & Footer Configuration
  const docHeader = new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: `DOCUMENTO EDITABLE DE TRABAJO - ${vm.code}`,
            size: 14,
            color: '94A3B8',
          }),
        ],
      }),
    ],
  });

  const docFooter = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: vm.disclaimer || 'INDUSTRIAL 360 - DOCUMENTO EDITABLE',
            size: 14,
            color: '64748B',
          }),
        ],
      }),
    ],
  });

  return new Document({
    sections: [
      {
        headers: { default: docHeader },
        footers: { default: docFooter },
        children,
      },
    ],
  });
}

/**
 * Generates a Uint8Array / Buffer from DocumentViewModel in DOCX format (S19)
 */
export async function generateDocxBuffer(vm: DocumentViewModel): Promise<Uint8Array> {
  const doc = buildDocxDocument(vm);
  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}

/**
 * Export DocumentViewModel directly to DOCX file download in browser
 */
export async function exportDocumentViewModelToDocx(vm: DocumentViewModel, fileName?: string) {
  const buffer = await generateDocxBuffer(vm);
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || `${vm.code || 'DOC'}_${vm.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
