import { collection, addDoc, updateDoc, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useState, useEffect, useCallback } from 'react';
import { db, functionsInstance } from '../../firebase';
import { offlineDb, PendingReport, PendingValuation, PendingRoute, OutboxSyncStatus, OutboxItem, SyncLogItem } from './dexieDb';
import { 
  queueOutboxOperation, 
  getPendingOutboxOperations, 
  removeOutboxItem, 
  cleanUndefinedValues,
  generateOperationId,
  clearLocalDrafts 
} from './outbox';
import { evaluateConflictPolicy, determineConflictStrategy } from './conflictPolicy';
import { logger } from '../logger';

export const RETENTION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 días de retención para idempotencia y logs

export interface SyncStats {
  isOnline: boolean;
  pendingReportsCount: number;
  pendingValuationsCount: number;
  pendingRoutesCount: number;
  outboxPendingCount: number;
  totalPending: number;
  isSyncing: boolean;
  blockedCount: number;
  failedCount: number;
  deniedCount: number;
}

type SyncStatusCallback = (stats: SyncStats) => void;
const subscribers: Set<SyncStatusCallback> = new Set();
let isSyncingActive = false;

export function isBrowserOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export function sanitizeErrorMessage(message?: string): string {
  if (!message) return 'Error desconocido durante la transmisión.';
  const str = String(message);

  if (str.includes('permission-denied') || str.includes('PERMISSION_DENIED')) {
    return 'Acceso denegado por políticas de seguridad o rol insuficiente para esta entidad.';
  }
  if (str.includes('unauthenticated') || str.includes('UNAUTHENTICATED')) {
    return 'Sesión no autenticada en servidor. Por favor inicie sesión nuevamente.';
  }
  if (str.includes('invalid-argument') || str.includes('INVALID_ARGUMENT')) {
    return 'Estructura o tipo de parámetros no permitido en el payload enviado.';
  }
  if (str.includes('quota-exceeded') || str.includes('RESOURCE_EXHAUSTED')) {
    return 'Límite de cuota o tasa de peticiones excedida en el proyecto de Firestore.';
  }
  if (str.includes('Failed to fetch') || str.includes('NetworkError') || str.includes('offline')) {
    return 'Sin conectividad de red. La operación se mantiene en cola para auto-reintento.';
  }

  return str
    .replace(/bearer\s+[a-zA-Z0-9\-_.]+/gi, 'Bearer [MASCARADO]')
    .replace(/apiKey=[a-zA-Z0-9\-_.]+/gi, 'apiKey=[OCULTO]')
    .replace(/\bat\s+.*:\d+:\d+/g, '')
    .substring(0, 300)
    .trim();
}

export async function getSyncStats(): Promise<SyncStats> {
  const pendingReportsCount = await offlineDb.pendingReports.where('syncStatus').equals('pending').count();
  const pendingValuationsCount = await offlineDb.pendingValuations.where('syncStatus').equals('pending').count();
  const pendingRoutesCount = await offlineDb.pendingRoutes.where('syncStatus').equals('pending').count();
  const outboxPending = await offlineDb.outbox.where('syncStatus').equals('pending').count();
  const blockedCount = await offlineDb.outbox.where('syncStatus').equals('conflict_blocked').count();
  const failedCount = await offlineDb.outbox.where('syncStatus').equals('failed').count();
  const deniedCount = await offlineDb.outbox.where('syncStatus').equals('denied').count();

  const totalPending = pendingReportsCount + pendingValuationsCount + pendingRoutesCount + outboxPending;

  return {
    isOnline: isBrowserOnline(),
    pendingReportsCount,
    pendingValuationsCount,
    pendingRoutesCount,
    outboxPendingCount: outboxPending,
    totalPending,
    isSyncing: isSyncingActive,
    blockedCount,
    failedCount,
    deniedCount
  };
}

export function subscribeSyncStatus(callback: SyncStatusCallback): () => void {
  subscribers.add(callback);
  getSyncStats().then(callback);

  const handleStatusChange = () => {
    getSyncStats().then(stats => {
      subscribers.forEach(cb => cb(stats));
      if (isBrowserOnline()) {
        flushOutbox();
      }
    });
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    window.addEventListener('ic360-offline-queue-changed', handleStatusChange);
  }

  return () => {
    subscribers.delete(callback);
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
      window.removeEventListener('ic360-offline-queue-changed', handleStatusChange);
    }
  };
}

async function notifySubscribers() {
  const stats = await getSyncStats();
  subscribers.forEach(cb => cb(stats));
}

/**
 * Flush Outbox queue to Firestore with operationId Idempotency Check & Backoff con Jitter
 */
export async function flushOutbox(
  activeOrgId: string = '',
  activeProjectId: string = '',
  forceManual: boolean = false
): Promise<{ synced: number; failed: number; blocked: number; denied: number; successCount: number; failCount: number }> {
  if (!isBrowserOnline() || isSyncingActive) {
    return { synced: 0, failed: 0, blocked: 0, denied: 0, successCount: 0, failCount: 0 };
  }

  isSyncingActive = true;
  await notifySubscribers();

  let syncedCount = 0;
  let failedCount = 0;
  let blockedCount = 0;
  let deniedCount = 0;

  try {
    const outboxItems = await getPendingOutboxOperations();
    const syncOutboxFn = httpsCallable<any, { success: boolean; status: string; result?: any; message?: string }>(
      functionsInstance,
      'syncOutboxMutation'
    );

    const nowTime = Date.now();

    for (const item of outboxItems) {
      if (!item.id) continue;

      // Resiliencia: si el item está en 'failed' y tiene 'nextAttemptAt' en el futuro, omitir en auto-flush salvo fuerza manual
      if (!forceManual && item.nextAttemptAt) {
        const nextTime = new Date(item.nextAttemptAt).getTime();
        if (nowTime < nextTime) {
          logger.info(`[SyncEngine] Omitiendo item ${item.operationId} por backoff activo hasta ${item.nextAttemptAt}`);
          continue;
        }
      }

      try {
        await offlineDb.outbox.update(item.id, { 
          syncStatus: 'syncing',
          lastAttemptAt: new Date().toISOString()
        });

        const targetOrgId = item.orgId || activeOrgId;
        const targetProjectId = item.projectId || activeProjectId;

        if (!targetOrgId || !targetProjectId) {
          logger.warn(`[SyncEngine] Omitiendo item ${item.operationId}: faltan orgId/projectId`);
          await offlineDb.outbox.update(item.id, {
            syncStatus: 'failed',
            errorMessage: sanitizeErrorMessage('Parámetros obligatorios orgId o projectId ausentes')
          });
          failedCount++;
          continue;
        }

        const opTypeUpper = item.operationType.toUpperCase() as 'CREATE' | 'UPDATE' | 'DELETE';
        const entityTypeClean = item.collectionName.split('/').pop() || item.collectionName;

        // Invocación a Callable Function server-side con transacción atómica e idempotencia
        const response = await syncOutboxFn({
          orgId: targetOrgId,
          projectId: targetProjectId,
          entityType: entityTypeClean,
          operationType: opTypeUpper,
          operationId: item.operationId,
          entityId: item.docId,
          payload: item.payload,
        });

        const resData = response.data;

        if (resData.status === 'duplicate') {
          logger.info(`[SyncEngine] Operación duplicada confirmada por servidor: ${item.operationId}`);
          await offlineDb.syncLog.add({
            operationId: item.operationId,
            action: item.operationType,
            collectionName: item.collectionName,
            recordId: item.docId || 'duplicate_doc',
            timestamp: new Date().toISOString(),
            status: 'idempotent_duplicate',
            details: 'Operación idempotente duplicada confirmada por Cloud Function server-side.',
            orgId: targetOrgId,
            projectId: targetProjectId,
            category: item.category,
            sanitizedReason: 'Operación idempotente procesada previamente.'
          });
          await removeOutboxItem(item.id);
          syncedCount++;
        } else if (resData.status === 'conflict' || resData.success === false) {
          logger.warn(`[SyncEngine] Conflicto o bloqueo en servidor para ${item.operationId}: ${resData.message}`);
          const cleanReason = sanitizeErrorMessage(resData.message);
          await offlineDb.outbox.update(item.id, {
            syncStatus: 'conflict_blocked',
            errorMessage: cleanReason,
            conflictDetails: resData.message
          });
          await offlineDb.syncLog.add({
            operationId: item.operationId,
            action: item.operationType,
            collectionName: item.collectionName,
            recordId: item.docId || 'conflict_doc',
            timestamp: new Date().toISOString(),
            status: 'conflict_blocked',
            details: resData.message || 'Conflicto en servidor',
            orgId: targetOrgId,
            projectId: targetProjectId,
            category: item.category,
            sanitizedReason: cleanReason
          });
          blockedCount++;
        } else if (resData.success) {
          logger.info(`[SyncEngine] Operación ${item.operationId} sincronizada exitosamente vía syncOutboxMutation`);
          await offlineDb.syncLog.add({
            operationId: item.operationId,
            action: item.operationType,
            collectionName: item.collectionName,
            recordId: item.docId || resData.result?.entityId || 'processed_doc',
            timestamp: new Date().toISOString(),
            status: 'success',
            details: `Operación ${item.operationId} sincronizada exitosamente vía syncOutboxMutation`,
            orgId: targetOrgId,
            projectId: targetProjectId,
            category: item.category,
            sanitizedReason: 'Sincronizado con éxito.'
          });
          await removeOutboxItem(item.id);
          syncedCount++;
        }
      } catch (err: any) {
        logger.error(`Error procesando outbox item ${item.operationId} vía Cloud Function:`, err);
        const retries = (item.retries || 0) + 1;
        
        // Backoff exponencial con jitter: Math.min(300000, 2000 * 2^retries + Math.random() * 1000)
        const baseDelay = 2000;
        const jitter = Math.random() * 1000;
        const nextDelayMs = Math.min(300000, baseDelay * Math.pow(2, Math.min(retries, 6)) + jitter);
        const nextAttemptAt = new Date(Date.now() + nextDelayMs).toISOString();

        const errMsg = err?.message || String(err);
        const isPermission = errMsg.includes('permission-denied') || errMsg.includes('unauthenticated') || errMsg.includes('PERMISSION_DENIED');
        const finalStatus: OutboxSyncStatus = isPermission ? 'denied' : 'failed';
        const cleanReason = sanitizeErrorMessage(errMsg);

        await offlineDb.outbox.update(item.id, {
          syncStatus: finalStatus,
          errorMessage: cleanReason,
          retries,
          lastAttemptAt: new Date().toISOString(),
          nextAttemptAt
        });

        if (isPermission) {
          deniedCount++;
        } else {
          failedCount++;
        }
      }
    }

    // 7. Sincronizar tablas legacy de Dexie
    await syncLegacyDexieTables(activeOrgId, activeProjectId);

    // 8. Mantenimiento automático de retención TTL de logs
    await cleanupExpiredSyncLogs();

  } finally {
    isSyncingActive = false;
    await notifySubscribers();
  }

  return { synced: syncedCount, failed: failedCount, blocked: blockedCount, denied: deniedCount, successCount: syncedCount, failCount: failedCount };
}

async function syncLegacyDexieTables(activeOrgId: string, activeProjectId: string) {
  // Sync pendingReports
  const reports = await offlineDb.pendingReports.where('syncStatus').equals('pending').toArray();
  for (const item of reports) {
    if (!item.id) continue;
    try {
      await offlineDb.pendingReports.update(item.id, { syncStatus: 'syncing' });
      const { id, tempId, syncStatus, errorMessage, operationId, ...cleanData } = item;

      await queueOutboxOperation({
        collectionName: 'field_reports',
        operationType: 'create',
        payload: { ...cleanData, originalTempId: tempId },
        orgId: activeOrgId,
        projectId: item.projectId || activeProjectId,
        category: 'report'
      });

      await offlineDb.pendingReports.delete(item.id);
    } catch (err: any) {
      await offlineDb.pendingReports.update(item.id, { syncStatus: 'failed', errorMessage: sanitizeErrorMessage(err?.message) });
    }
  }

  // Sync pendingValuations
  const vals = await offlineDb.pendingValuations.where('syncStatus').equals('pending').toArray();
  for (const item of vals) {
    if (!item.id) continue;
    try {
      await offlineDb.pendingValuations.update(item.id, { syncStatus: 'syncing' });
      const { id, tempId, syncStatus, errorMessage, operationId, ...cleanData } = item;

      await queueOutboxOperation({
        collectionName: 'valuations',
        operationType: 'create',
        payload: { ...cleanData, originalTempId: tempId },
        orgId: activeOrgId,
        projectId: item.projectId || activeProjectId,
        category: 'valuation',
        conflictStrategy: 'BLOCKING'
      });

      await offlineDb.pendingValuations.delete(item.id);
    } catch (err: any) {
      await offlineDb.pendingValuations.update(item.id, { syncStatus: 'failed', errorMessage: sanitizeErrorMessage(err?.message) });
    }
  }

  // Sync pendingRoutes
  const routes = await offlineDb.pendingRoutes.where('syncStatus').equals('pending').toArray();
  for (const item of routes) {
    if (!item.id) continue;
    try {
      await offlineDb.pendingRoutes.update(item.id, { syncStatus: 'syncing' });
      const { id, tempId, syncStatus, errorMessage, operationId, ...cleanData } = item;

      await queueOutboxOperation({
        collectionName: 'routes',
        operationType: 'create',
        payload: { ...cleanData, originalTempId: tempId },
        orgId: activeOrgId,
        projectId: item.projectId || activeProjectId,
        category: 'route'
      });

      await offlineDb.pendingRoutes.delete(item.id);
    } catch (err: any) {
      await offlineDb.pendingRoutes.update(item.id, { syncStatus: 'failed', errorMessage: sanitizeErrorMessage(err?.message) });
    }
  }
}

/**
 * Eliminación de registros de sincronización antiguos (>30 días) según política TTL de retención
 */
export async function cleanupExpiredSyncLogs(): Promise<number> {
  try {
    const cutoffDate = new Date(Date.now() - RETENTION_TTL_MS).toISOString();
    const oldLogs = await offlineDb.syncLog.where('timestamp').below(cutoffDate).toArray();
    const idsToRemove = oldLogs.map(l => l.id).filter((id): id is number => typeof id === 'number');

    if (idsToRemove.length > 0) {
      await offlineDb.syncLog.bulkDelete(idsToRemove);
      logger.info(`[SyncEngine] Purga de retención TTL: eliminados ${idsToRemove.length} registros antiguos (>30 días).`);
    }
    return idsToRemove.length;
  } catch (err) {
    logger.warn('[SyncEngine] Error ejecutando purga TTL de syncLog:', err);
    return 0;
  }
}

export interface SyncCenterOperation {
  id: string;
  operationId: string;
  entidad: string;
  operationType: 'create' | 'update' | 'delete';
  docId?: string;
  momento: string;
  ultimoIntento?: string;
  retries: number;
  status: 'pending' | 'syncing' | 'synced' | 'duplicate' | 'conflict-blocked' | 'failed' | 'denied';
  motivoSanitizado: string;
  payload?: Record<string, any>;
  conflictStrategy: 'APPEND_ONLY' | 'FIELD_VISIBLE' | 'BLOCKING';
  orgId: string;
  projectId: string;
  remoteSnapshot?: Record<string, any>;
  canManualResolve: boolean;
  isOutboxItem: boolean;
  outboxDbId?: number;
}

/**
 * Consulta unificada para el Sync Center: combina ítems activos de Outbox e historial de SyncLogs.
 */
export async function getSyncCenterOperations(
  filterOrgId?: string,
  filterProjectId?: string
): Promise<SyncCenterOperation[]> {
  const activeOutbox = await offlineDb.outbox.toArray();
  const historicalLogs = await offlineDb.syncLog.toArray();

  const operations: SyncCenterOperation[] = [];

  // 1. Mapear cola outbox activa
  for (const item of activeOutbox) {
    if (filterOrgId && item.orgId && item.orgId !== filterOrgId) continue;
    if (filterProjectId && item.projectId && item.projectId !== filterProjectId) continue;

    let uiStatus: SyncCenterOperation['status'] = 'pending';
    if (item.syncStatus === 'syncing') uiStatus = 'syncing';
    else if (item.syncStatus === 'conflict_blocked') uiStatus = 'conflict-blocked';
    else if (item.syncStatus === 'failed') uiStatus = 'failed';
    else if (item.syncStatus === 'denied') uiStatus = 'denied';

    const strategy = item.conflictStrategy || determineConflictStrategy(item.collectionName, item.category);

    operations.push({
      id: `outbox_${item.id || item.operationId}`,
      operationId: item.operationId,
      entidad: item.collectionName,
      operationType: item.operationType,
      docId: item.docId,
      momento: new Date(item.timestamp).toISOString(),
      ultimoIntento: item.lastAttemptAt || new Date(item.timestamp).toISOString(),
      retries: item.retries || 0,
      status: uiStatus,
      motivoSanitizado: sanitizeErrorMessage(item.errorMessage || item.conflictDetails),
      payload: item.payload,
      conflictStrategy: strategy,
      orgId: item.orgId,
      projectId: item.projectId,
      remoteSnapshot: item.remoteSnapshot,
      canManualResolve: strategy !== 'BLOCKING' || uiStatus === 'conflict-blocked' || uiStatus === 'failed',
      isOutboxItem: true,
      outboxDbId: item.id
    });
  }

  // 2. Mapear historial completado (synced, duplicate) desde syncLog
  for (const log of historicalLogs) {
    if (filterOrgId && log.orgId && log.orgId !== filterOrgId) continue;
    if (filterProjectId && log.projectId && log.projectId !== filterProjectId) continue;

    // Evitar duplicar en UI si ya está en outbox activo
    if (operations.some(op => op.operationId === log.operationId)) continue;

    let uiStatus: SyncCenterOperation['status'] = 'synced';
    if (log.status === 'idempotent_duplicate') uiStatus = 'duplicate';
    else if (log.status === 'conflict_blocked') uiStatus = 'conflict-blocked';
    else if (log.status === 'denied') uiStatus = 'denied';
    else if (log.status === 'failed') uiStatus = 'failed';

    operations.push({
      id: `synclog_${log.id || log.operationId}`,
      operationId: log.operationId,
      entidad: log.collectionName,
      operationType: log.action,
      docId: log.recordId,
      momento: log.timestamp,
      ultimoIntento: log.timestamp,
      retries: 0,
      status: uiStatus,
      motivoSanitizado: sanitizeErrorMessage(log.sanitizedReason || log.details),
      conflictStrategy: determineConflictStrategy(log.collectionName, log.category),
      orgId: log.orgId || '',
      projectId: log.projectId || '',
      canManualResolve: false,
      isOutboxItem: false
    });
  }

  // Ordenar descendente por momento (más reciente primero)
  return operations.sort((a, b) => new Date(b.momento).getTime() - new Date(a.momento).getTime());
}

/**
 * Reintento manual individual de una operación
 */
export async function retryOperation(operationId: string, activeOrgId: string = '', activeProjectId: string = ''): Promise<boolean> {
  const items = await offlineDb.outbox.where('operationId').equals(operationId).toArray();
  if (items.length === 0) return false;

  for (const item of items) {
    if (!item.id) continue;
    await offlineDb.outbox.update(item.id, {
      syncStatus: 'pending',
      errorMessage: undefined,
      nextAttemptAt: undefined,
      retries: 0
    });
  }

  await flushOutbox(activeOrgId, activeProjectId, true);
  return true;
}

/**
 * Resolver Conflicto — Mantener Local (sobreescribir versión remota)
 */
export async function resolveConflictKeepLocal(operationId: string, activeOrgId: string = '', activeProjectId: string = ''): Promise<boolean> {
  const items = await offlineDb.outbox.where('operationId').equals(operationId).toArray();
  if (items.length === 0) return false;

  for (const item of items) {
    if (!item.id) continue;
    await offlineDb.outbox.update(item.id, {
      payload: { ...item.payload, _forceLocalOverride: true, _resolvedAt: new Date().toISOString() },
      syncStatus: 'pending',
      errorMessage: undefined,
      nextAttemptAt: undefined,
      retries: 0
    });
  }

  await flushOutbox(activeOrgId, activeProjectId, true);
  return true;
}

/**
 * Resolver Conflicto — Mantener Servidor (descartar item local)
 */
export async function resolveConflictKeepRemote(operationId: string): Promise<boolean> {
  const items = await offlineDb.outbox.where('operationId').equals(operationId).toArray();
  if (items.length === 0) return false;

  for (const item of items) {
    if (!item.id) continue;
    await offlineDb.syncLog.add({
      operationId: item.operationId,
      action: item.operationType,
      collectionName: item.collectionName,
      recordId: item.docId || 'remote_kept',
      timestamp: new Date().toISOString(),
      status: 'success',
      details: 'Conflicto resuelto manualmente conservando versión del servidor.',
      orgId: item.orgId,
      projectId: item.projectId,
      sanitizedReason: 'Resuelto a favor del servidor.'
    });
    await removeOutboxItem(item.id);
  }

  await notifySubscribers();
  return true;
}

/**
 * Resolver Conflicto — Combinar Manualmente
 */
export async function resolveConflictMerge(
  operationId: string, 
  mergedPayload: Record<string, any>, 
  activeOrgId: string = '', 
  activeProjectId: string = ''
): Promise<boolean> {
  const items = await offlineDb.outbox.where('operationId').equals(operationId).toArray();
  if (items.length === 0) return false;

  for (const item of items) {
    if (!item.id) continue;
    await offlineDb.outbox.update(item.id, {
      payload: { ...mergedPayload, _mergedAt: new Date().toISOString() },
      syncStatus: 'pending',
      errorMessage: undefined,
      nextAttemptAt: undefined,
      retries: 0
    });
  }

  await flushOutbox(activeOrgId, activeProjectId, true);
  return true;
}

/**
 * Descartar / eliminar operación de la cola
 */
export async function discardOperation(operationId: string): Promise<boolean> {
  const items = await offlineDb.outbox.where('operationId').equals(operationId).toArray();
  if (items.length === 0) return false;

  for (const item of items) {
    if (item.id) {
      await removeOutboxItem(item.id);
    }
  }

  await notifySubscribers();
  return true;
}

// Backward Compatibility API for queueing
export async function queueOfflineOperation(
  collectionName: string,
  operationType: 'create' | 'update' | 'delete',
  payload: Record<string, any>,
  docId?: string
) {
  const item = await queueOutboxOperation({
    collectionName,
    operationType,
    payload,
    docId,
    category: payload.category || undefined
  });

  if (isBrowserOnline()) {
    flushOutbox().catch(err => logger.error('Error auto-flushing outbox:', err));
  }

  return {
    id: item.operationId,
    collectionName: item.collectionName,
    operationType: item.operationType,
    docId: item.docId,
    payload: item.payload,
    timestamp: item.timestamp,
    retries: item.retries,
    status: item.syncStatus
  };
}

export async function getPendingOfflineOperations() {
  const outbox = await getPendingOutboxOperations();
  return outbox.map(item => ({
    id: item.operationId,
    collectionName: item.collectionName,
    operationType: item.operationType,
    docId: item.docId,
    payload: item.payload,
    timestamp: item.timestamp,
    retries: item.retries,
    status: item.syncStatus === 'conflict_blocked' ? 'failed' : item.syncStatus,
    errorMessage: item.errorMessage
  }));
}

export const flushOfflineQueue = flushOutbox;
export const syncOfflineStoreToFirestore = flushOutbox;
export const syncPendingRecords = flushOutbox;

export async function saveReportOffline(reportData: Omit<PendingReport, 'id' | 'tempId' | 'syncStatus' | 'operationId'>): Promise<string> {
  const tempId = `off_rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const opId = generateOperationId();

  await offlineDb.pendingReports.add({
    ...reportData,
    tempId,
    operationId: opId,
    syncStatus: 'pending'
  });

  await queueOutboxOperation({
    collectionName: 'field_reports',
    operationType: 'create',
    payload: { ...reportData, tempId },
    orgId: (reportData as any).orgId || '',
    projectId: reportData.projectId || '',
    category: 'report'
  });

  if (isBrowserOnline()) {
    flushOutbox().catch(err => logger.error('Error auto-flushing outbox on saveReportOffline:', err));
  }

  return tempId;
}

export async function saveValuationOffline(valuationData: Omit<PendingValuation, 'id' | 'tempId' | 'syncStatus' | 'operationId'>): Promise<string> {
  const tempId = `off_val_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const opId = generateOperationId();

  await offlineDb.pendingValuations.add({
    ...valuationData,
    tempId,
    operationId: opId,
    syncStatus: 'pending'
  });

  await queueOutboxOperation({
    collectionName: 'valuations',
    operationType: 'create',
    payload: { ...valuationData, tempId },
    orgId: (valuationData as any).orgId || '',
    projectId: valuationData.projectId || '',
    category: 'valuation',
    conflictStrategy: 'BLOCKING'
  });

  if (isBrowserOnline()) {
    flushOutbox().catch(err => logger.error('Error auto-flushing outbox on saveValuationOffline:', err));
  }

  return tempId;
}

export async function saveRouteOffline(routeData: Omit<PendingRoute, 'id' | 'tempId' | 'syncStatus' | 'operationId'>): Promise<string> {
  const tempId = `off_route_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const opId = generateOperationId();

  await offlineDb.pendingRoutes.add({
    ...routeData,
    tempId,
    operationId: opId,
    syncStatus: 'pending'
  });

  await queueOutboxOperation({
    collectionName: 'routes',
    operationType: 'create',
    payload: { ...routeData, tempId },
    orgId: (routeData as any).orgId || '',
    projectId: routeData.projectId || '',
    category: 'route'
  });

  if (isBrowserOnline()) {
    flushOutbox().catch(err => logger.error('Error auto-flushing outbox on saveRouteOffline:', err));
  }

  return tempId;
}

/**
 * Custom React Hook: useOfflineStatus
 * Provee estado reactivo de red, conteo de cola, bloqueados, fallidos y método de disparo.
 */
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(isBrowserOnline());
  const [pendingOps, setPendingOps] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [blockedCount, setBlockedCount] = useState<number>(0);
  const [failedCount, setFailedCount] = useState<number>(0);
  const [deniedCount, setDeniedCount] = useState<number>(0);
  const [lastSyncResult, setLastSyncResult] = useState<{ synced: number; failed: number; blocked: number; denied: number } | null>(null);

  const refreshPendingQueue = useCallback(async () => {
    const pending = await getPendingOfflineOperations();
    const stats = await getSyncStats();
    setPendingOps(pending);
    setBlockedCount(stats.blockedCount);
    setFailedCount(stats.failedCount);
    setDeniedCount(stats.deniedCount);
  }, []);

  const triggerSync = useCallback(async (activeOrgId: string = '', activeProjectId: string = '') => {
    if (!isBrowserOnline() || isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await flushOutbox(activeOrgId, activeProjectId, true);
      setLastSyncResult(res);
      await refreshPendingQueue();
      if (res.failed === 0 && res.blocked === 0 && res.denied === 0) {
        await clearLocalDrafts();
      }
    } catch (err) {
      logger.error('Error flushing offline outbox queue:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshPendingQueue]);

  useEffect(() => {
    refreshPendingQueue();

    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleQueueChanged = () => {
      refreshPendingQueue();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      window.addEventListener('ic360-offline-queue-changed', handleQueueChanged);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('ic360-offline-queue-changed', handleQueueChanged);
      }
    };
  }, [refreshPendingQueue, triggerSync]);

  return {
    isOnline,
    pendingCount: pendingOps.length,
    blockedCount,
    failedCount,
    deniedCount,
    pendingOps,
    isSyncing,
    lastSyncResult,
    triggerSync,
    refreshPendingQueue
  };
}

/**
 * Setup global auto-sync listeners & resiliencia (incluyendo iOS Safari y SW Sync)
 */
export function initOfflineAutoSync() {
  if (typeof window === 'undefined') return;

  const handleReconnect = () => {
    logger.info('[IC360 PWA] Evento de reconexión/visibilidad detectado. Procesando cola outbox...');
    flushOutbox().catch(err => logger.error('Error flushing outbox on reconnect:', err));
  };

  // 1. Listeners de reconexión estándar
  window.addEventListener('online', handleReconnect);
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isBrowserOnline()) {
      handleReconnect();
    }
  });
  window.addEventListener('focus', () => {
    if (isBrowserOnline()) {
      handleReconnect();
    }
  });

  // 2. Service Worker Message Listener
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'IC360_TRIGGER_SYNC') {
        logger.info('[IC360 Service Worker] Mensaje de sincronización recibido.');
        flushOutbox().catch(err => logger.error('Error flushing outbox on SW message:', err));
      }
    });

    // 3. Registrar Background Sync Tag si es soportado por el navegador
    navigator.serviceWorker.ready.then((reg: any) => {
      if (reg && 'sync' in reg) {
        reg.sync.register('sync-offline-queue').catch((err: any) => {
          logger.warn('[SyncEngine] Background Sync registration fallback:', err);
        });
      }
    }).catch(() => {
      // Background Sync no soportado (ej. iOS Safari), se usa fallback de eventos arriba
    });
  }
}

