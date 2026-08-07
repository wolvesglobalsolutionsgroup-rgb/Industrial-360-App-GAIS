import { DocumentViewModel } from '../documentViewModel';
import { DocumentExporter, DocumentFormat } from './types';
import { pdfDocumentExporter } from '../pdfExporter';
import { docxDocumentExporter } from '../docxExporter';
import { excelDocumentExporter } from '../excelExporter';
import { pptxDocumentExporter } from '../pptxExporter';
import { QuotaExceededError } from '../finops/platformMetricsEngine';

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
 * Integrated with FinOps server-side quota guard.
 */
export async function exportDocument(
  doc: DocumentViewModel,
  formats: DocumentFormat[]
): Promise<Record<DocumentFormat, Blob>> {
  // FinOps Quota Guardrail (EXPORT_DOCUMENT)
  if (typeof window !== 'undefined') {
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        const response = await fetch('/api/reserveExportQuota', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ formats }),
        });

        if (!response.ok && response.status === 429) {
          const errData = await response.json().catch(() => ({}));
          throw new QuotaExceededError({
            operation: 'EXPORT_DOCUMENT',
            limit: errData?.quotaError?.limit || 20,
            currentUsage: errData?.quotaError?.currentUsage || 20,
            orgId: errData?.quotaError?.orgId || 'org',
            message: errData?.error || 'Límite de cuotas de exportación de documentos alcanzado.',
            recoverable: true,
          });
        }
      }
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        throw err;
      }
      // Silently fall through if unauthenticated or offline
    }
  }

  const results = {} as Record<DocumentFormat, Blob>;

  for (const fmt of formats) {
    const exporter = getExporterForFormat(fmt);
    results[fmt] = await exporter.export(doc);
  }

  return results;
}
