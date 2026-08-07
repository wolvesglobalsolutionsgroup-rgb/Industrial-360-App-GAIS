import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logger } from '../logger';
import {
  QuotaOperationType,
  QuotaCheckResult,
  QuotaExceededError,
  FinOpsAlert,
  getQuotaPolicy,
} from '../../../src/lib/finops/platformMetricsEngine';

export interface ReserveQuotaOptions {
  orgId: string;
  operation: QuotaOperationType | string;
  planId?: string;
  increment?: number;
  requestId?: string;
  now?: string | Date;
  throwOnExceeded?: boolean;
  customLimit?: number;
}

/**
 * Reserva cuota de manera atómica, durable e idempotente en Firestore Serverless (Admin SDK).
 * Persiste consumo en: organizations/{orgId}/quotaUsage/{YYYY-MM-DD}_{operation}
 */
export async function reserveQuota(options: ReserveQuotaOptions): Promise<QuotaCheckResult> {
  const {
    orgId,
    operation,
    planId,
    increment = 1,
    requestId,
    now,
    throwOnExceeded = false,
    customLimit,
  } = options;

  if (!orgId) {
    throw new Error('Parámetro requerido: orgId es obligatorio para verificar cuota FinOps.');
  }

  const d = now ? new Date(now) : new Date();
  const dateStr = d.toISOString().split('T')[0]; // UTC YYYY-MM-DD
  const docPath = `organizations/${orgId}/quotaUsage/${dateStr}_${operation}`;

  const dbAdmin = getFirestore();
  const quotaRef = dbAdmin.doc(docPath);

  return await dbAdmin.runTransaction(async (transaction) => {
    const snap = await transaction.get(quotaRef);

    let currentUsage = 0;
    let processedRequests: string[] = [];

    if (snap.exists) {
      const data = snap.data() || {};
      currentUsage = typeof data.usage === 'number' ? data.usage : 0;
      processedRequests = Array.isArray(data.processedRequests) ? data.processedRequests : [];
    }

    const policy = getQuotaPolicy(orgId, planId);
    const opLimitInfo = policy.limits[operation];
    const limit = customLimit ?? (opLimitInfo ? opLimitInfo.dailyLimit : 100);

    // Idempotencia: Si la solicitud ya fue procesada anteriormente con el mismo requestId
    if (requestId && processedRequests.includes(requestId)) {
      logger.info(`[QuotaService] Solicitud duplicada detectada (idempotente): requestId=${requestId}, orgId=${orgId}, op=${operation}`);
      const remaining = Math.max(0, limit - currentUsage);
      const thresholdPercent = limit > 0 ? Math.round((currentUsage / limit) * 100) : 100;
      return {
        allowed: currentUsage <= limit,
        operation,
        limit,
        currentUsage,
        newUsage: currentUsage,
        remaining,
        orgId,
        thresholdPercent,
      };
    }

    const proposedUsage = currentUsage + increment;
    const thresholdPercent = limit > 0 ? Math.round((proposedUsage / limit) * 100) : 100;

    // Degradación explícita a partir del 95% para operaciones intensivas (IA, exportación, heavy workflows)
    // Se bloquea si el consumo actual o el consumo propuesto alcanza o supera el 95% del límite diario
    const IS_HEAVY_OP = ['IA_INVOCATION', 'EXPORT_DOCUMENT', 'HEAVY_WORKFLOW'].includes(operation);
    let allowed = proposedUsage <= limit;
    if (IS_HEAVY_OP && (currentUsage >= limit * 0.95 || proposedUsage >= limit * 0.95)) {
      allowed = false;
    }

    let thresholdReached: '50%' | '80%' | '95%' | '100%' | undefined;
    let alert: FinOpsAlert | undefined;

    const alertId = `alt-quota-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    if (!allowed) {
      thresholdReached = proposedUsage > limit ? '100%' : '95%';
      alert = {
        id: alertId,
        orgId,
        orgName: orgId,
        metric: `QUOTA_${operation}`,
        thresholdPercent: proposedUsage > limit ? 100 : 95,
        severity: 'critical',
        message: `Cuota restringida (${thresholdPercent}%) para la operación '${operation}' en '${orgId}'. Límite diario: ${limit}, Solicitado: ${proposedUsage}.`,
        triggeredAt: nowIso,
      };
    } else if (thresholdPercent >= 95) {
      thresholdReached = '95%';
      alert = {
        id: alertId,
        orgId,
        orgName: orgId,
        metric: `QUOTA_${operation}`,
        thresholdPercent: 95,
        severity: 'critical',
        message: `Consumo crítico de cuota (${thresholdPercent}%) para '${operation}' en '${orgId}'. Límite diario: ${limit}.`,
        triggeredAt: nowIso,
      };
    } else if (thresholdPercent >= 80) {
      thresholdReached = '80%';
      alert = {
        id: alertId,
        orgId,
        orgName: orgId,
        metric: `QUOTA_${operation}`,
        thresholdPercent: 80,
        severity: 'warning',
        message: `Consumo alto de cuota (${thresholdPercent}%) para '${operation}' en '${orgId}'. Límite diario: ${limit}.`,
        triggeredAt: nowIso,
      };
    } else if (thresholdPercent >= 50) {
      thresholdReached = '50%';
    }

    let newUsage = currentUsage;

    if (allowed) {
      newUsage = proposedUsage;
      const updatedRequests = requestId ? [...processedRequests.slice(-499), requestId] : processedRequests;
      transaction.set(
        quotaRef,
        {
          orgId,
          date: dateStr,
          operation,
          usage: newUsage,
          processedRequests: updatedRequests,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    if (alert) {
      const alertRef = dbAdmin.collection(`organizations/${orgId}/finopsAlerts`).doc(alert.id);
      transaction.set(alertRef, {
        ...alert,
        createdAt: FieldValue.serverTimestamp(),
      });
      logger.warn(`[QuotaService Alert] orgId=${orgId} op=${operation} percent=${thresholdPercent}% msg=${alert.message}`);
    }

    const result: QuotaCheckResult = {
      allowed,
      operation,
      limit,
      currentUsage,
      newUsage,
      remaining: Math.max(0, limit - newUsage),
      orgId,
      thresholdPercent,
      thresholdReached,
      alert,
    };

    if (!allowed && throwOnExceeded) {
      throw new QuotaExceededError({
        operation,
        limit,
        currentUsage,
        orgId,
        message: alert?.message || `Cuota excedida para la operación '${operation}' en la organización '${orgId}'.`,
        recoverable: true,
      });
    }

    return result;
  });
}
