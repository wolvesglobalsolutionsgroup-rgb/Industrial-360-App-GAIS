import { describe, it, expect } from 'vitest';
import { createDocumentViewModel, DocumentViewModel } from '../documentViewModel';
import { OPERATOR_BRAND_PRESETS } from '../brandKitPresets';
import { freezeDocumentMetadata } from '../documentPolicy';
import { buildDocumentViewModelWorkbook } from '../excelExporter';
import { buildDocxDocument, generateDocxBuffer } from '../docxExporter';
import { buildPptxPresentation, PPTX_LAYOUT, pptxDocumentExporter } from '../pptxExporter';
import { calculateImageDimensions } from '../imageSizeUtils';
import { exportDocument } from '../exporters/exportDocument';

describe('S19 — Exportadores Multiformato (DOCX, XLSX, PPTX y PDF Inmutable)', () => {

  const sampleSigners = [
    {
      id: 'sig-1',
      name: 'Ing. María Rodríguez',
      title: 'Residente de Obra',
      role: 'CONTRACTOR' as const,
      organization: 'PROINTECA C.A.',
      status: 'SIGNED' as const,
      signedAt: '2026-08-01T14:00:00Z',
      signatureHash: 'a1b2c3d4e5f67890'
    },
    {
      id: 'sig-2',
      name: 'Ing. José Alarcón',
      title: 'Inspector Fiscal',
      role: 'CLIENT' as const,
      organization: 'PDVSA GAS C.A.',
      status: 'SIGNED' as const,
      signedAt: '2026-08-01T15:00:00Z',
      signatureHash: 'f0e9d8c7b6a54321'
    }
  ];

  const contractorBrand = {
    companyName: 'PROINTECA INDUSTRIAL C.A.',
    taxId: 'RIF J-30123456-0',
    primaryColor: '#0B2239',
    secondaryColor: '#059669',
    address: 'Anaco, Estado Anzoátegui',
    logoUrl: ''
  };

  const operatorBrand = OPERATOR_BRAND_PRESETS.PDVSA;

  const frozenMeta = freezeDocumentMetadata(sampleSigners, {
    templateVersion: '2026.1',
    brandKitVersion: 'v1.0',
    documentVersion: 'REV-0',
    sealVersion: 'v1.0',
    locale: 'es-VE',
    timezone: 'America/Caracas'
  }, contractorBrand, 'PDVSA');

  const sampleVm = createDocumentViewModel({
    documentId: 'PTS-2026-001',
    title: 'Permiso de Trabajo Seguro (PTS) - Reparación de Tubería 16" Ø',
    code: 'PTS-PROINTECA-2026-001',
    date: '01/08/2026',
    status: 'DRAFT',
    contractorBrand,
    operatorBrand,
    signers: sampleSigners,
    metadata: frozenMeta,
    sections: [
      {
        id: 'sec-1',
        title: 'Descripción de Trabajos y Ubicación',
        content: [
          'Se realizarán trabajos de corte y soldadura en caliente sobre tubería de gas natural de 16 pulgadas de diámetro en la Estación de Flujo San Joaquín.',
          'Ubicación exacta: Kilómetro 14+200, Frente N° 2.'
        ],
        bullets: [
          'Aislamiento eléctrico y mecánico verificado.',
          'Monitoreo continuo de atmósfera explosiva LEL 0.0%.'
        ]
      }
    ],
    tables: [
      {
        id: 'tbl-1',
        title: 'Presupuesto y Medición de Obra Executada (VES)',
        headers: ['Partida', 'Descripción', 'Unidad', 'Cantidad', 'Precio Unitario (Bs.)', 'Monto Total (Bs.)'],
        rows: [
          {
            cells: [
              { value: 'E-001' },
              { value: 'Excavación en tierra con equipo pesado' },
              { value: 'm3' },
              { value: 150 },
              { value: 250.00 },
              { value: null, formula: 'D2*E2' }
            ]
          },
          {
            cells: [
              { value: 'E-002' },
              { value: 'Soldadura de junta SMAW API 1104' },
              { value: 'junta' },
              { value: 12 },
              { value: 1200.00 },
              { value: null, formula: 'D3*E3' }
            ]
          }
        ],
        summaryRow: {
          cells: [
            { value: 'TOTAL GENERAL', bold: true },
            { value: '' },
            { value: '' },
            { value: '' },
            { value: '' },
            { value: null, formula: 'SUM(F2:F3)', bold: true }
          ]
        }
      }
    ]
  });

  describe('1. Contrato Único DocumentViewModel', () => {
    it('debe crear un DocumentViewModel válido con banderas de borrador e inmutabilidad', () => {
      expect(sampleVm.documentId).toBe('PTS-2026-001');
      expect(sampleVm.isDraft).toBe(true);
      expect(sampleVm.disclaimer).toContain('BORRADOR');
      expect(sampleVm.signers).toHaveLength(2);
      expect(sampleVm.metadata.timezone).toBe('America/Caracas');
    });
  });

  describe('2. Generación XLSX (excelExporter.ts)', () => {
    it('debe construir un Workbook con fórmulas reales, formato VES y banner de borrador', () => {
      const wb = buildDocumentViewModelWorkbook(sampleVm);
      expect(wb).toBeDefined();

      const ws = wb.getWorksheet(1);
      expect(ws).toBeDefined();

      // Row 1 should contain draft watermark
      const row1Val = ws?.getRow(1).getCell(1).value;
      expect(String(row1Val)).toContain('BORRADOR');

      // Check cell formulas
      const dataRow1 = ws?.getRow(8); // Data row 1 (Row 7 is table headers)
      const totalCell = dataRow1?.getCell(6);
      expect(totalCell?.value).toEqual({ formula: 'D2*E2' });
    });
  });

  describe('3. Generación DOCX (docxExporter.ts)', () => {
    it('debe generar la estructura de Document de docx y convertir a buffer Uint8Array', async () => {
      const doc = buildDocxDocument(sampleVm);
      expect(doc).toBeDefined();

      const buffer = await generateDocxBuffer(sampleVm);
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.length).toBeGreaterThan(100);
    });
  });

  describe('4. Generación PPTX e Integridad de Imágenes (pptxExporter.ts y imageSizeUtils.ts)', () => {
    // 1x1 PNG Real Buffer
    const png1x1Base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const png1x1Buffer = Buffer.from(png1x1Base64, 'base64');
    const png1x1DataUrl = `data:image/png;base64,${png1x1Base64}`;

    // JPEG Real Buffer with known SOF0 dimensions: Height = 10 (0x000A), Width = 20 (0x0014)
    const jpeg20x10Hex = 'ffd8ffe000104a46494600010101006000600000ffc0001108000a001403012200021101031101ffd9';
    const jpeg20x10Buffer = Buffer.from(jpeg20x10Hex, 'hex');

    // PNG with Transparency (RGBA)
    const pngAlphaBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAYAAAC5643DAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAGElEQVR42mP8z8D8n4GBgYGhkYGBgYEBABsnAgTz3LzUAAAAAElFTkSuQmCC';
    const pngAlphaBuffer = Buffer.from(pngAlphaBase64, 'base64');

    it('1. PPTX de texto/tablas: debe configurar presentación 16:9 con slides de portada, sección y tablas', async () => {
      expect(PPTX_LAYOUT).toBe('LAYOUT_WIDE');

      const pptx = await buildPptxPresentation(sampleVm);
      expect(pptx).toBeDefined();
      expect(pptx.layout).toBe('LAYOUT_WIDE');
    });

    it('2. PNG real de dimensiones conocidas (1x1)', () => {
      const dims = calculateImageDimensions(png1x1Buffer);
      expect(dims.width).toBe(1);
      expect(dims.height).toBe(1);
      expect(dims.type).toBe('png');
    });

    it('3. JPEG real de dimensiones conocidas (20x10)', () => {
      const dims = calculateImageDimensions(jpeg20x10Buffer);
      expect(dims.width).toBe(20);
      expect(dims.height).toBe(10);
      expect(dims.type).toBe('jpg');
    });

    it('4. Imagen con transparencia y tipos de color PNG', () => {
      const dims = calculateImageDimensions(pngAlphaBuffer);
      expect(dims.type).toBe('png');
      expect(dims.hasAlpha).toBe(true);

      // PNG Header template (26 bytes)
      const createHeader = (colorType: number) => {
        const buf = Buffer.alloc(26);
        // PNG Signature
        buf.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
        // Width = 100 at byte 16
        buf.writeUInt32BE(100, 16);
        // Height = 50 at byte 20
        buf.writeUInt32BE(50, 20);
        // Color type at byte 25
        buf[25] = colorType;
        return buf;
      };

      // PNG RGB (colorType 2) -> hasAlpha false
      const pngRgb = calculateImageDimensions(createHeader(2));
      expect(pngRgb.hasAlpha).toBe(false);

      // PNG RGBA (colorType 6) -> hasAlpha true
      const pngRgba = calculateImageDimensions(createHeader(6));
      expect(pngRgba.hasAlpha).toBe(true);

      // PNG Grayscale + Alpha (colorType 4) -> hasAlpha true
      const pngGrayAlpha = calculateImageDimensions(createHeader(4));
      expect(pngGrayAlpha.hasAlpha).toBe(true);
    });

    it('5 & 6. Logo contractorBrand y Logo operatorBrand incluidos en la presentación PPTX', async () => {
      const vmWithLogos = createDocumentViewModel({
        ...sampleVm,
        contractorBrand: {
          ...contractorBrand,
          logoUrl: png1x1DataUrl,
        },
        operatorBrand: {
          ...operatorBrand,
          logoUrl: png1x1DataUrl,
        },
        attachments: [
          {
            id: 'att-1',
            name: 'Inspección de Junta de Soldadura',
            type: 'image/png',
            url: png1x1DataUrl,
          },
        ],
      });

      const pptx = await buildPptxPresentation(vmWithLogos);
      expect(pptx).toBeDefined();

      const blob = await pptxDocumentExporter.export(vmWithLogos);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(1000);
      expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.presentationml.presentation');
    });

    it('7. Buffer de imagen inválido debe lanzar excepción determinista', () => {
      const invalidBuffer = Buffer.from('DATOS_INVALIDOS_NO_ES_UNA_IMAGEN');
      expect(() => calculateImageDimensions(invalidBuffer)).toThrow('Unsupported or invalid image file');
    });

    it('8. Exportación canónica mediante exportDocument', async () => {
      const result = await exportDocument(sampleVm, ['pptx']);
      expect(result.pptx).toBeDefined();
      expect(result.pptx).toBeInstanceOf(Blob);
      expect(result.pptx.size).toBeGreaterThan(1000);
    });

    it('9. Blob final con MIME correcto', async () => {
      const blob = await pptxDocumentExporter.export(sampleVm);
      expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.presentationml.presentation');
    });

    it('10. Validación de que las dimensiones calculadas NO son siempre 100x100', () => {
      const dims1 = calculateImageDimensions(png1x1Buffer);
      const dims2 = calculateImageDimensions(jpeg20x10Buffer);

      expect(dims1.width).not.toBe(100);
      expect(dims1.height).not.toBe(100);

      expect(dims2.width).not.toBe(100);
      expect(dims2.height).not.toBe(100);

      expect(dims1.width).toBe(1);
      expect(dims2.width).toBe(20);
    });
  });

  describe('5. Cierre Documental PDF Inmutable', () => {
    it('debe distinguir adecuadamente los formatos editables de borrador frente al PDF final sellado', () => {
      const sealedVm = createDocumentViewModel({
        ...sampleVm,
        status: 'SEALED'
      });

      expect(sealedVm.isDraft).toBe(false);
      expect(sealedVm.disclaimer).toContain('CERTIFICADO Y SELLADO');
    });
  });

});
