import Dexie, { Table } from 'dexie';

export type OutboxSyncStatus = 
  | 'pending' 
  | 'syncing' 
  | 'synced' 
  | 'duplicate' 
  | 'conflict_blocked' 
  | 'failed' 
  | 'denied';

export interface OutboxItem {
  id?: number;
  operationId: string; // UUID v4
  collectionName: string; // Target Firestore collection
  operationType: 'create' | 'update' | 'delete';
  docId?: string;
  payload: Record<string, any>;
  orgId: string;
  projectId: string;
  category: 'report' | 'valuation' | 'ptw' | 'qa_qc' | 'evidence' | 'route' | 'general' | string;
  conflictStrategy: 'APPEND_ONLY' | 'FIELD_VISIBLE' | 'BLOCKING';
  timestamp: number;
  retries: number;
  syncStatus: OutboxSyncStatus;
  errorMessage?: string;
  conflictDetails?: string;
  lastAttemptAt?: string;
  nextAttemptAt?: string;
  remoteSnapshot?: Record<string, any>;
}

export interface PendingReport {
  id?: number;
  operationId: string;
  tempId: string;
  projectId: string;
  date: string;
  weather: string;
  personnelCount: number;
  workHours: number;
  notes: string;
  slumpTest?: number | null;
  temperature?: number | null;
  equipmentSerial?: string;
  location?: { lat: number; lng: number; accuracy?: number } | null;
  imagePreview?: string | null;
  aiAnalysis?: string;
  correlatedTaskId?: string;
  correlatedTaskName?: string;
  inspectorName?: string;
  createdAt: string;
  syncStatus: OutboxSyncStatus;
  errorMessage?: string;
}

export interface PendingValuation {
  id?: number;
  operationId: string;
  tempId: string;
  projectId: string;
  number: number;
  periodStart: string;
  periodEnd: string;
  description: string;
  grossAmount: number;
  retentionFCPercent: number;
  retentionLaboralPercent: number;
  advancePercent: number;
  otherDeductions: number;
  netAmount: number;
  status: string;
  photos: string[];
  ownerId: string;
  createdAt: string;
  syncStatus: OutboxSyncStatus;
  errorMessage?: string;
}

export interface PendingRoute {
  id?: number;
  operationId: string;
  tempId: string;
  projectId?: string;
  name: string;
  distanceKm: number;
  path: { lat: number; lng: number; timestamp?: number; altitude?: number }[];
  startTime: number;
  endTime: number;
  createdAt: string;
  syncStatus: OutboxSyncStatus;
  errorMessage?: string;
}

export interface SyncLogItem {
  id?: number;
  operationId: string;
  action: 'create' | 'update' | 'delete';
  collectionName: string;
  recordId: string;
  timestamp: string;
  status: 'success' | 'failed' | 'idempotent_duplicate' | 'conflict_blocked' | 'denied';
  details?: string;
  orgId?: string;
  projectId?: string;
  category?: string;
  sanitizedReason?: string;
}

export interface LocalDraft {
  id: string;
  category: 'ptw' | 'ast' | 'takeoff' | 'isometric' | 'hht_attendance' | 'general';
  title: string;
  data: Record<string, any>;
  updatedAt: string;
}

export interface QrTokenCacheItem {
  id: string; // credentialId
  token: string;
  workerId?: string;
  issuedAt: number;
  expiresAt: number;
  cachedAt: number;
}

export class IndustrialControl360DB extends Dexie {
  outbox!: Table<OutboxItem>;
  pendingReports!: Table<PendingReport>;
  pendingValuations!: Table<PendingValuation>;
  pendingRoutes!: Table<PendingRoute>;
  syncLog!: Table<SyncLogItem>;
  localDrafts!: Table<LocalDraft>;
  qrTokenCache!: Table<QrTokenCacheItem>;

  constructor() {
    super('IndustrialControl360_OfflineDB');
    this.version(2).stores({
      outbox: '++id, operationId, collectionName, category, syncStatus, timestamp, orgId, projectId',
      pendingReports: '++id, operationId, tempId, projectId, date, syncStatus, createdAt',
      pendingValuations: '++id, operationId, tempId, projectId, number, syncStatus, createdAt',
      pendingRoutes: '++id, operationId, tempId, projectId, syncStatus, createdAt',
      syncLog: '++id, operationId, collectionName, recordId, timestamp, status',
      localDrafts: 'id, category, updatedAt'
    });
    this.version(3).stores({
      outbox: '++id, operationId, collectionName, category, syncStatus, timestamp, orgId, projectId',
      pendingReports: '++id, operationId, tempId, projectId, date, syncStatus, createdAt',
      pendingValuations: '++id, operationId, tempId, projectId, number, syncStatus, createdAt',
      pendingRoutes: '++id, operationId, tempId, projectId, syncStatus, createdAt',
      syncLog: '++id, operationId, collectionName, recordId, timestamp, status',
      localDrafts: 'id, category, updatedAt',
      qrTokenCache: 'id, expiresAt, cachedAt'
    });
  }
}

export const offlineDb = new IndustrialControl360DB();
