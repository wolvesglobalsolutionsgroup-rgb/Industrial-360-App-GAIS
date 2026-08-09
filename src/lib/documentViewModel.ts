import { FrozenDocumentMetadata, DocumentSignerItem } from './documentPolicy';
import { OperatorBrandPreset } from './brandKitPresets';
import { BrandKit } from '../ProjectContext';

export interface DocumentTableCell {
  value: string | number | boolean | null;
  formula?: string; // Excel formula string e.g. "SUM(C2:C10)"
  isHeader?: boolean;
  align?: 'left' | 'center' | 'right';
  bold?: boolean;
  width?: number; // Relative width or column width
}

export interface DocumentTableRow {
  cells: DocumentTableCell[];
}

export interface DocumentTable {
  id: string;
  title?: string;
  headers: string[];
  rows: DocumentTableRow[];
  summaryRow?: DocumentTableRow;
}

export interface DocumentSection {
  id: string;
  title: string;
  content: string[]; // Paragraphs of text
  tables?: DocumentTable[];
  bullets?: string[];
}

export interface DocumentAttachment {
  id: string;
  name: string;
  type: string;
  url?: string;
  description?: string;
}

export interface DocumentViewModel {
  documentId: string;
  title: string;
  code: string;
  date: string;
  status: 'DRAFT' | 'APPROVED' | 'SEALED';
  isDraft: boolean; // True for editable DOCX/XLSX/PPTX work copies
  contractorBrand: BrandKit;
  operatorBrand: OperatorBrandPreset | BrandKit;
  signers: DocumentSignerItem[];
  metadata: FrozenDocumentMetadata;
  sections: DocumentSection[];
  tables: DocumentTable[];
  attachments?: DocumentAttachment[];
  disclaimer?: string;
}

/**
 * Creates a normalized DocumentViewModel from domain data for unified export.
 */
export function createDocumentViewModel(params: {
  documentId: string;
  title: string;
  code: string;
  date?: string;
  status?: 'DRAFT' | 'APPROVED' | 'SEALED';
  contractorBrand: BrandKit;
  operatorBrand: OperatorBrandPreset | BrandKit;
  signers: DocumentSignerItem[];
  metadata: FrozenDocumentMetadata;
  sections?: DocumentSection[];
  tables?: DocumentTable[];
  attachments?: DocumentAttachment[];
}): DocumentViewModel {
  const isDraft = params.status !== 'SEALED';

  return {
    documentId: params.documentId,
    title: params.title,
    code: params.code,
    date: params.date ?? '',
    status: params.status || 'DRAFT',
    isDraft,
    contractorBrand: params.contractorBrand,
    operatorBrand: params.operatorBrand,
    signers: params.signers.map(s => ({ ...s })),
    metadata: { ...params.metadata },
    sections: params.sections || [],
    tables: params.tables || [],
    attachments: params.attachments || [],
    disclaimer: isDraft
      ? 'DOCUMENTO DE TRABAJO EDITABLE (BORRADOR - IC360). EL ENTREGABLE OFICIAL CERTIFICADO ES EL PDF SELLADO DIGITALMENTE SHA-256.'
      : 'DOCUMENTO CERTIFICADO Y SELLADO DIGITALMENTE.',
  };
}
