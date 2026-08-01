export type ConflictStrategy = 'APPEND_ONLY' | 'FIELD_VISIBLE' | 'BLOCKING';

export interface ConflictCheckResult {
  hasConflict: boolean;
  canSync: boolean;
  strategy: ConflictStrategy;
  resolvedPayload?: Record<string, any>;
  reason?: string;
}

/**
 * Determines conflict strategy based on collection name or category
 */
export function determineConflictStrategy(
  collectionName: string,
  category?: string
): ConflictStrategy {
  const normCollection = collectionName.toLowerCase();
  const normCategory = (category || '').toLowerCase();

  if (
    normCategory === 'evidence' ||
    normCollection.includes('evidence') ||
    normCollection.includes('photos') ||
    normCollection.includes('attachments')
  ) {
    return 'APPEND_ONLY';
  }

  if (
    normCategory === 'report' ||
    normCollection.includes('field_reports') ||
    normCollection.includes('reports')
  ) {
    return 'FIELD_VISIBLE';
  }

  if (
    normCategory === 'ptw' ||
    normCategory === 'qa_qc' ||
    normCategory === 'valuation' ||
    normCategory === 'attendance' ||
    normCollection.includes('ptw') ||
    normCollection.includes('loto') ||
    normCollection.includes('valuations') ||
    normCollection.includes('attendance') ||
    normCollection.includes('civil_tests') ||
    normCollection.includes('welds') ||
    normCollection.includes('weld_joints') ||
    normCollection.includes('environmental_aspects') ||
    normCollection.includes('instrument_loops')
  ) {
    return 'BLOCKING';
  }

  return 'FIELD_VISIBLE';
}

/**
 * Evaluates conflict policy for an operation against existing remote document data.
 */
export function evaluateConflictPolicy(
  strategy: ConflictStrategy,
  localPayload: Record<string, any>,
  remoteDocData: Record<string, any> | null,
  operationType: 'create' | 'update' | 'delete'
): ConflictCheckResult {
  if (!remoteDocData) {
    return {
      hasConflict: false,
      canSync: true,
      strategy
    };
  }

  switch (strategy) {
    case 'APPEND_ONLY': {
      // Evidencia/Anexos: Append-only strategy.
      // Never overwrite existing data. Create a new timestamped record or attachment.
      const appendedPayload = {
        ...localPayload,
        _appendedAt: new Date().toISOString(),
        _isAppendedEvidence: true,
      };
      return {
        hasConflict: false,
        canSync: true,
        strategy,
        resolvedPayload: appendedPayload
      };
    }

    case 'FIELD_VISIBLE': {
      // Reportes de campo: Conflicto visible.
      // If remote document was updated after local capture, attach visible conflict flag.
      const remoteUpdatedAt = remoteDocData.updatedAt || remoteDocData._syncedAt || remoteDocData.createdAt;
      const localCapturedAt = localPayload._offlineCapturedAt || localPayload.createdAt;

      if (
        remoteUpdatedAt &&
        localCapturedAt &&
        new Date(remoteUpdatedAt).getTime() > new Date(localCapturedAt).getTime()
      ) {
        const flaggedPayload = {
          ...localPayload,
          hasConflict: true,
          conflictDetails: `Conflicto de sincronización: Registro modificado en servidor el ${new Date(
            remoteUpdatedAt
          ).toLocaleString()} después de la captura offline (${new Date(
            localCapturedAt
          ).toLocaleString()}).`,
          _conflictFlaggedAt: new Date().toISOString()
        };
        return {
          hasConflict: true,
          canSync: true,
          strategy,
          resolvedPayload: flaggedPayload,
          reason: 'Documento remoto modificado. Se conserva edición local con marca de conflicto visible.'
        };
      }

      return {
        hasConflict: false,
        canSync: true,
        strategy
      };
    }

    case 'BLOCKING': {
      // PTW, QA/QC, Valuaciones: Conflicto BLOQUEANTE.
      // Reject sync if remote doc was modified after local capture or status is locked/closed.
      const remoteStatus = (remoteDocData.status || '').toLowerCase();
      const localStatus = (localPayload.status || '').toLowerCase();

      const remoteTime = remoteDocData.updatedAt || remoteDocData._syncedAt || remoteDocData.createdAt;
      const localTime = localPayload._offlineCapturedAt || localPayload.createdAt;

      if (
        remoteTime &&
        localTime &&
        new Date(remoteTime).getTime() > new Date(localTime).getTime()
      ) {
        return {
          hasConflict: true,
          canSync: false,
          strategy,
          reason: `Bloqueo por integridad: El registro de PTW/QA/QC/Valuación fue actualizado en el servidor el ${new Date(
            remoteTime
          ).toLocaleString()}. Sincronización denegada.`
        };
      }

      if (
        remoteStatus &&
        localStatus &&
        remoteStatus !== localStatus &&
        ['cerrado', 'aprobado', 'firmado', 'cancelado'].includes(remoteStatus)
      ) {
        return {
          hasConflict: true,
          canSync: false,
          strategy,
          reason: `Bloqueo de seguridad: El estado remoto (${remoteStatus.toUpperCase()}) impida la sobreescritura desde el estado local (${localStatus.toUpperCase()}).`
        };
      }

      return {
        hasConflict: false,
        canSync: true,
        strategy
      };
    }
  }
}
