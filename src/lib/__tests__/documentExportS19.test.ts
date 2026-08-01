import { describe, it, expect } from 'vitest';
import { createDocumentViewModel, DocumentViewModel } from '../documentViewModel';
import { OPERATOR_BRAND_PRESETS } from '../brandKitPresets';
import { freezeDocumentMetadata } from '../documentPolicy';
import { buildDocumentViewModelWorkbook } from '../excelExporter';
import { buildDocxDocument, generateDocxBuffer } from '../docxExporter';
import { buildPptxPresentation, PPTX_LAYOUT } from '../pptxExporter';

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

  describe('4. Generación PPTX (pptxExporter.ts)', () => {
    it('debe configurar presentación 16:9 con slides de portada, sección y tablas', async () => {
      expect(PPTX_LAYOUT).toBe('LAYOUT_WIDE');

      const pptx = await buildPptxPresentation(sampleVm);
      expect(pptx).toBeDefined();
      expect(pptx.layout).toBe('LAYOUT_WIDE');
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
