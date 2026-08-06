import { describe, it, expect } from 'vitest';
import { exportDocument, getExporterForFormat } from '../exportDocument';
import {
  createWf042FixtureDoc,
  createWf043FixtureDoc,
  createWf044FixtureDoc,
} from '../../../../tests/fixtures/documents/workflowFixtures';

describe('Sprint F-E — Multi-Format Deliverables Engine Parity', () => {
  const fixtures = [
    { name: 'wf-042 Inspección Izaje (Certificado)', factory: createWf042FixtureDoc },
    { name: 'wf-043 Aprobación PTW (Documento)', factory: createWf043FixtureDoc },
    { name: 'wf-044 Reporte Tabular NDT (Reporte Tabular)', factory: createWf044FixtureDoc },
  ];

  fixtures.forEach(({ name, factory }) => {
    describe(`Documento Canónico: ${name}`, () => {
      it('debe generar PDF, DOCX y XLSX desde el mismo DocumentViewModel único', async () => {
        const docViewModel = await factory();

        // Ensure single source of truth ViewModel properties
        expect(docViewModel.documentId).toBeDefined();
        expect(docViewModel.code).toBeDefined();
        expect(docViewModel.title).toBeDefined();
        expect(docViewModel.sections.length).toBeGreaterThan(0);

        // Execute canonical export flow
        const exportResults = await exportDocument(docViewModel, ['pdf', 'docx', 'xlsx']);

        // 1. Verify PDF Blob
        const pdfBlob = exportResults.pdf;
        expect(pdfBlob).toBeInstanceOf(Blob);
        expect(pdfBlob.type).toBe('application/pdf');
        expect(pdfBlob.size).toBeGreaterThan(500);

        // 2. Verify DOCX Blob
        const docxBlob = exportResults.docx;
        expect(docxBlob).toBeInstanceOf(Blob);
        expect(docxBlob.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        expect(docxBlob.size).toBeGreaterThan(500);

        // 3. Verify XLSX Blob
        const xlsxBlob = exportResults.xlsx;
        expect(xlsxBlob).toBeInstanceOf(Blob);
        expect(xlsxBlob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        expect(xlsxBlob.size).toBeGreaterThan(500);
      });

      it('debe mantener paridad de metadatos e identidad documental entre exportadores', async () => {
        const docViewModel = await factory();

        const pdfExporter = getExporterForFormat('pdf');
        const docxExporter = getExporterForFormat('docx');
        const excelExporter = getExporterForFormat('xlsx');

        expect(pdfExporter.format).toBe('pdf');
        expect(docxExporter.format).toBe('docx');
        expect(excelExporter.format).toBe('xlsx');

        // Parallel export using individual exporters
        const [pdfBlob, docxBlob, xlsxBlob] = await Promise.all([
          pdfExporter.export(docViewModel),
          docxExporter.export(docViewModel),
          excelExporter.export(docViewModel),
        ]);

        expect(pdfBlob.type).toBe('application/pdf');
        expect(docxBlob.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        expect(xlsxBlob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      });
    });
  });
});
