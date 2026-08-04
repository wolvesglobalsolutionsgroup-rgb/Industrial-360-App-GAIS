export interface QaDatasetMetadata {
  datasetId: string;
  version: string;
  source: string;
  orgId: string;
  projectId: string;
  watermarkText: string;
}

export const QA_DATASET_METADATA: QaDatasetMetadata = {
  datasetId: 'DS-IC360-QA-CANONICAL',
  version: 'v1.0.0-QA',
  source: 'CONSORCIO O&G QA PILOT (DATOS SINTÉTICOS)',
  orgId: 'ic360-qa-pilot',
  projectId: 'proj-qa-anaco-001',
  watermarkText: 'DATOS SINTÉTICOS — ENTORNO QA — NO OPERACIONAL',
};

export function isQaEnvironment(orgId?: string, environment?: string): boolean {
  if (environment === 'qa') return true;
  if (orgId === QA_DATASET_METADATA.orgId) return true;
  if (typeof window !== 'undefined' && window.location.hostname.includes('qa')) return true;
  return false;
}

export function tagQaRecord<T extends Record<string, any>>(record: T): T & { isQa: boolean; datasetId: string; version: string } {
  return {
    ...record,
    isQa: true,
    datasetId: QA_DATASET_METADATA.datasetId,
    version: QA_DATASET_METADATA.version,
  };
}
