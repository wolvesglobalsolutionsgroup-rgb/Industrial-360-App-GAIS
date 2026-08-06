import { DocumentViewModel } from '../documentViewModel';

export type DocumentFormat = 'pdf' | 'docx' | 'xlsx' | 'pptx';

export interface DocumentExporter {
  id: string;
  format: DocumentFormat;
  export: (doc: DocumentViewModel) => Promise<Blob>;
}
