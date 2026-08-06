import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { exportDocumentToPdf, pdfDocumentExporter, createJsPdfInstance } from '../pdfExporter';
import { createDocumentViewModel } from '../documentViewModel';
import { getDocumentExporter } from '../documentPolicy';

/**
 * Recursively retrieves all .ts and .tsx files under a given directory.
 */
function getAllTsFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.git') && !fullPath.includes('dist')) {
        getAllTsFiles(fullPath, arrayOfFiles);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

describe('Sprint F-E — Regla de Aislamiento e Inviolabilidad de jsPDF', () => {
  it('debe garantizar que SOLO src/lib/pdfExporter.ts importa la librería jspdf', () => {
    const srcDir = path.resolve(__dirname, '../../');
    const allFiles = getAllTsFiles(srcDir);

    const violatingFiles: string[] = [];
    const jsPdfImportRegex = /import\s+.*from\s+['"]jspdf['"]/i;

    allFiles.forEach((filePath) => {
      // Normalize relative path from project root for clean reporting
      const relativePath = path.relative(path.resolve(__dirname, '../../../'), filePath).replace(/\\/g, '/');

      // Exclude the canonical pdfExporter.ts itself
      if (relativePath.endsWith('src/lib/pdfExporter.ts')) {
        return;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      if (jsPdfImportRegex.test(content)) {
        violatingFiles.push(relativePath);
      }
    });

    expect(violatingFiles, `Se encontraron imports directos de 'jspdf' fuera de pdfExporter.ts: ${violatingFiles.join(', ')}`).toEqual([]);
  });

  it('debe exportar correctamente el contrato DocumentExporter para PDF y generar un Blob válido', async () => {
    expect(pdfDocumentExporter.id).toBe('pdf-canonical');
    expect(pdfDocumentExporter.format).toBe('pdf');

    const testExporter = getDocumentExporter('pdf');
    expect(testExporter).toBeDefined();

    const sampleVm = createDocumentViewModel({
      documentId: 'DOC-TEST-001',
      title: 'Documento de Prueba PDF Canónico',
      code: 'DOC-001',
      date: '2026-08-06',
      status: 'DRAFT',
      contractorBrand: { companyName: 'CONTRATISTA PRUEBA' },
      operatorBrand: { companyName: 'PDVSA' },
      signers: [],
      metadata: {
        templateVersion: '2026.1',
        brandKitVersion: 'v1.0',
        documentVersion: 'REV-0',
        sealVersion: 'v1.0',
        locale: 'es-VE',
        timezone: 'America/Caracas',
        frozenAt: '2026-08-06',
        signers: [],
      },
      sections: [
        {
          id: 'sec-1',
          title: 'Sección de Prueba',
          content: ['Texto de prueba para el motor PDF canónico.'],
        },
      ],
      tables: [
        {
          id: 'tbl-1',
          title: 'Tabla de Prueba',
          headers: ['Item', 'Valor'],
          rows: [{ cells: [{ value: 'P-1' }, { value: 100 }] }],
        },
      ],
    });

    const blob = await testExporter.export(sampleVm);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(100);
  });

  it('debe instanciar jsPDF a través de createJsPdfInstance', () => {
    const doc = createJsPdfInstance();
    expect(doc).toBeDefined();
    expect(typeof doc.output).toBe('function');
  });
});
