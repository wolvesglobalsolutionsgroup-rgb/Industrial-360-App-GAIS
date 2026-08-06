import { DocumentViewModel } from '../documentViewModel';
import { DocumentExporter, DocumentFormat } from './types';
import { pdfDocumentExporter } from '../pdfExporter';
import { docxDocumentExporter } from '../docxExporter';
import { excelDocumentExporter } from '../excelExporter';
import { pptxDocumentExporter } from '../pptxExporter';

/**
 * Returns the appropriate DocumentExporter implementation for the requested format.
 */
export function getExporterForFormat(format: DocumentFormat): DocumentExporter {
  switch (format) {
    case 'pdf':
      return pdfDocumentExporter;
    case 'docx':
      return docxDocumentExporter;
    case 'xlsx':
      return excelDocumentExporter;
    case 'pptx':
      return pptxDocumentExporter;
    default:
      return pdfDocumentExporter;
  }
}

/**
 * Canonical Multi-Format Export Flow:
 * Takes a single DocumentViewModel and converts it into Blobs for each requested format.
 * Pure document transformation engine without business logic or JSX.
 */
export async function exportDocument(
  doc: DocumentViewModel,
  formats: DocumentFormat[]
): Promise<Record<DocumentFormat, Blob>> {
  const results = {} as Record<DocumentFormat, Blob>;

  for (const fmt of formats) {
    const exporter = getExporterForFormat(fmt);
    results[fmt] = await exporter.export(doc);
  }

  return results;
}
