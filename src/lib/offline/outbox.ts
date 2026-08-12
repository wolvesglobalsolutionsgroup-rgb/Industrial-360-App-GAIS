import { offlineDb, OutboxItem, LocalDraft } from './dexieDb';
import { determineConflictStrategy, ConflictStrategy } from './conflictPolicy';
import { logger } from '../logger';
import { repositorySchemasMap } from '../domain/entitySchemas';

/**
 * Generates RFC4122 compliant UUID v4 for operationId idempotency
 */
export function generateOperationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Clean undefined values recursively from payload
 */
export function cleanUndefinedValues<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        cleaned[key] = cleanUndefinedValues(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned as T;
}

export interface QueueParams {
  collectionName: string;
  operationType: 'create' | 'update' | 'delete';
  payload: Record<string, any>;
  docId?: string;
  orgId?: string;
  projectId?: string;
  category?: OutboxItem['category'];
  conflictStrategy?: ConflictStrategy;
}

/**
 * Queue an offline operation into Outbox with operationId (UUID v4) for idempotency
 */
export async function queueOutboxOperation({
  collectionName,
  operationType,
  payload,
  docId,
  orgId = '',
  projectId = '',
  category = 'general',
  conflictStrategy
}: QueueParams): Promise<OutboxItem> {
  const operationId = generateOperationId();
  const effectiveOrgId = payload.orgId || orgId;
  const effectiveProjectId = payload.projectId || projectId;

  const strategy = conflictStrategy || determineConflictStrategy(collectionName, category);

  const sanitizedPayload = cleanUndefinedValues({
    ...payload,
    _operationId: operationId,
    _offlineCapturedAt: new Date().toISOString(),
    _isOfflineRecord: true,
    orgId: effectiveOrgId,
    projectId: effectiveProjectId
  });

  // Validación de esquema Zod antes de encolar en Outbox IndexedDB
  const schema = repositorySchemasMap[collectionName];
  if (schema && operationType !== 'delete') {
    const isUpdate = operationType === 'update';
    const schemaToApply = isUpdate && 'partial' in schema && typeof (schema as any).partial === 'function'
      ? (schema as any).partial()
      : schema;
    const parseRes = schemaToApply.safeParse(sanitizedPayload);
    if (!parseRes.success) {
      const formatted = parseRes.error.issues
        .map((i: any) => `${i.path.join('.') || 'payload'}: ${i.message}`)
        .join('; ');
      const err = new Error(`[ZodOutboxValidationError] Payload inválido para cola offline en '${collectionName}': ${formatted}`);
      (err as any).zodIssues = parseRes.error.issues;
      throw err;
    }
  }

  const item: OutboxItem = {
    operationId,
    collectionName,
    operationType,
    docId,
    payload: sanitizedPayload,
    orgId: effectiveOrgId,
    projectId: effectiveProjectId,
    category,
    conflictStrategy: strategy,
    timestamp: Date.now(),
    retries: 0,
    syncStatus: 'pending'
  };

  await offlineDb.outbox.add(item);

  // Notify listeners
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ic360-offline-queue-changed'));
  }

  return item;
}

/**
 * Get pending operations in Outbox queue
 */
export async function getPendingOutboxOperations(): Promise<OutboxItem[]> {
  try {
    return await offlineDb.outbox.where('syncStatus').equals('pending').or('syncStatus').equals('failed').toArray();
  } catch (err) {
    logger.warn('Error reading outbox from Dexie:', err);
    return [];
  }
}

/**
 * Remove an item from Outbox by ID or operationId
 */
export async function removeOutboxItem(idOrOpId: number | string): Promise<void> {
  if (typeof idOrOpId === 'number') {
    await offlineDb.outbox.delete(idOrOpId);
  } else {
    await offlineDb.outbox.where('operationId').equals(idOrOpId).delete();
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ic360-offline-queue-changed'));
  }
}

/**
 * Clear all outbox operations
 */
export async function clearOutbox(): Promise<void> {
  await offlineDb.outbox.clear();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ic360-offline-queue-changed'));
  }
}

// Local Drafts API
export async function saveLocalDraft(
  category: LocalDraft['category'],
  id: string,
  title: string,
  data: Record<string, any>
): Promise<void> {
  const item: LocalDraft = {
    id,
    category,
    title,
    data,
    updatedAt: new Date().toISOString()
  };
  await offlineDb.localDrafts.put(item);
}

export async function getLocalDrafts(category?: LocalDraft['category']): Promise<LocalDraft[]> {
  if (category) {
    return await offlineDb.localDrafts.where('category').equals(category).toArray();
  }
  return await offlineDb.localDrafts.toArray();
}

export async function deleteLocalDraft(id: string): Promise<void> {
  await offlineDb.localDrafts.delete(id);
}

export async function clearLocalDrafts(): Promise<void> {
  await offlineDb.localDrafts.clear();
}
