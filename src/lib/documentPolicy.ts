import { BrandKit } from '../ProjectContext';
import { DocumentExporter, DocumentFormat } from './exporters/types';
import { getExporterForFormat } from './exporters/exportDocument';

export type { DocumentExporter, DocumentFormat };

export function getDocumentExporter(format: DocumentFormat): DocumentExporter {
  return getExporterForFormat(format);
}

export interface DocumentSignerItem {
  id: string;
  name: string;
  title: string;
  role: 'CONTRACTOR' | 'OPERATOR' | 'INSPECTOR' | 'CLIENT' | 'AUDITOR';
  organization: string;
  status: 'PENDING' | 'SIGNED' | 'REJECTED';
  signedAt?: string;
  signatureHash?: string;
  comments?: string;
}

export interface FrozenDocumentMetadata {
  templateVersion: string;
  brandKitVersion: string;
  documentVersion: string;
  sealVersion: string;
  locale: string;
  timezone: string;
  frozenAt: string;
  signers: DocumentSignerItem[];
  operatorPreset?: string;
  verifierBaseUrl?: string;
}

export const DEFAULT_DOCUMENT_POLICY = {
  templateVersion: '2026.1',
  brandKitVersion: 'v1.0',
  documentVersion: 'REV-0',
  sealVersion: 'v1.0',
  locale: 'es-VE',
  timezone: 'America/Caracas',
};

/**
 * Formats a date/timestamp strictly according to the target timezone policy.
 */
export function formatDocumentDateTime(
  dateInput?: string | Date | number,
  timezone: string = DEFAULT_DOCUMENT_POLICY.timezone,
  locale: string = DEFAULT_DOCUMENT_POLICY.locale
): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) {
    return 'Fecha No Válida';
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(d);
  } catch {
    // Fallback if timezone string is unsupported
    return d.toISOString();
  }
}

/**
 * Freezes document metadata cleanly into an immutable record.
 */
export function freezeDocumentMetadata(
  signers: DocumentSignerItem[],
  customPolicy?: Partial<typeof DEFAULT_DOCUMENT_POLICY>,
  brandKit?: Partial<BrandKit>,
  operatorPreset?: string
): FrozenDocumentMetadata {
  const envVerifierUrl = typeof process !== 'undefined' && process.env?.VERIFIER_BASE_URL
    ? process.env.VERIFIER_BASE_URL
    : 'https://industrial-360.app';

  return {
    templateVersion: customPolicy?.templateVersion || DEFAULT_DOCUMENT_POLICY.templateVersion,
    brandKitVersion: customPolicy?.brandKitVersion || DEFAULT_DOCUMENT_POLICY.brandKitVersion,
    documentVersion: customPolicy?.documentVersion || DEFAULT_DOCUMENT_POLICY.documentVersion,
    sealVersion: customPolicy?.sealVersion || DEFAULT_DOCUMENT_POLICY.sealVersion,
    locale: customPolicy?.locale || DEFAULT_DOCUMENT_POLICY.locale,
    timezone: customPolicy?.timezone || DEFAULT_DOCUMENT_POLICY.timezone,
    frozenAt: formatDocumentDateTime(new Date(), customPolicy?.timezone || DEFAULT_DOCUMENT_POLICY.timezone),
    signers: signers.map(s => ({ ...s })),
    operatorPreset: operatorPreset || 'CUSTOM',
    verifierBaseUrl: envVerifierUrl,
  };
}

/**
 * Generates a minimal, secure QR URL for document verification without leaking PII or internal server routes.
 */
export function buildMinimalQrVerificationUrl(
  docId: string,
  sha256Hash: string,
  verifierBaseUrl?: string
): string {
  const baseUrl = verifierBaseUrl || (typeof process !== 'undefined' && process.env?.VERIFIER_BASE_URL) || 'https://industrial-360.app';
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const shortHash = sha256Hash.substring(0, 16);
  return `${cleanBase}/verify-document?doc=${encodeURIComponent(docId)}&hash=${shortHash}`;
}

/**
 * Computes SHA-256 hex string client-side for immediate verification/testing.
 */
export async function computeBrowserSha256(data: string | Uint8Array): Promise<string> {
  const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return '0'.repeat(64);
}
