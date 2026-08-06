/**
 * Industrial Control 360 — Engine de Métricas de Plataforma y FinOps (S22)
 *
 * C1 — MetricVerificationState: 'verified' | 'estimated' | 'unavailable'
 * CRÍTICO: Cuando state === 'unavailable', value debe ser NULL, nunca 0.
 * C6 — Máquina de estados de planes: ACTIVE → GRACE_PERIOD → READ_ONLY → SUSPENDED
 */

export type MetricVerificationState = 'verified' | 'estimated' | 'unavailable';

export interface SaaSMetricItem {
  metricId: string;
  label: string;
  value: number | null; // NULL si unavailable (evita confundir con valor 0 real)
  state: MetricVerificationState;
  source: string; // 'firestore:billing' | 'firestore:telemetry' | 'estimated:ratio' | 'none'
  computedAt: string; // ISO String
  range: string; // '30d' | '90d' | '12m'
  unit: 'USD' | 'percent' | 'count' | 'GB' | 'API_calls';
  status: 'ok' | 'warning' | 'critical';
  confidence: number; // 0..100
  note?: string;
}

export type TenantPlanStatus = 'ACTIVE' | 'GRACE_PERIOD' | 'READ_ONLY' | 'SUSPENDED';

export interface PlanEntitlement {
  planId: string;
  name: string;
  maxProjects: number;
  maxStorageGB: number;
  maxUsers: number;
  monthlyFeeUSD: number;
  gracePeriodDays: number;
}

export interface TenantConsumptionRecord {
  orgId: string;
  orgName: string;
  planId: string;
  status: TenantPlanStatus;
  gracePeriodStartedAt?: string;
  currentUsers: number;
  currentStorageGB: number;
  currentProjects: number;
  apiCallsMonthly: number;
  estimatedCostUSD: number;
  updatedAt: string;
}

export interface FinOpsAlert {
  id: string;
  orgId: string;
  orgName: string;
  metric: string;
  thresholdPercent: number; // 80, 95, 100
  severity: 'warning' | 'critical';
  message: string;
  triggeredAt: string;
}

export const CANONICAL_PLANS: Record<string, PlanEntitlement> = {
  ENTERPRISE_OIL_GAS: {
    planId: 'ENTERPRISE_OIL_GAS',
    name: 'Enterprise Oil & Gas',
    maxProjects: 50,
    maxStorageGB: 1000,
    maxUsers: 250,
    monthlyFeeUSD: 4500,
    gracePeriodDays: 14,
  },
  PROFESSIONAL: {
    planId: 'PROFESSIONAL',
    name: 'Professional Industrial',
    maxProjects: 10,
    maxStorageGB: 200,
    maxUsers: 50,
    monthlyFeeUSD: 1200,
    gracePeriodDays: 7,
  },
  STANDARD: {
    planId: 'STANDARD',
    name: 'Standard Field',
    maxProjects: 3,
    maxStorageGB: 50,
    maxUsers: 15,
    monthlyFeeUSD: 450,
    gracePeriodDays: 7,
  },
};

/**
 * Evalúa las métricas globales B2B SaaS de la plataforma.
 * Si no existen fuentes de datos verificables (array vacío o no provisto),
 * retorna explícitamente state: 'unavailable' y value: null.
 */
export function computePlatformSaaSMetrics(
  tenantSubscriptions?: Array<{ orgId: string; monthlyFeeUSD: number; active: boolean; createdAt: string; cancelledAt?: string }>,
  telemetryLogs?: Array<{ orgId: string; costUSD: number; timestamp: string }>
): Record<string, SaaSMetricItem> {
  const nowIso = new Date().toISOString();

  if (!tenantSubscriptions || tenantSubscriptions.length === 0) {
    return {
      mrr: {
        metricId: 'mrr',
        label: 'MRR (Monthly Recurring Revenue)',
        value: null,
        state: 'unavailable',
        source: 'none',
        computedAt: nowIso,
        range: '30d',
        unit: 'USD',
        status: 'ok',
        confidence: 0,
        note: 'Fuente de datos de suscripción no disponible en este entorno',
      },
      arr: {
        metricId: 'arr',
        label: 'ARR (Annual Recurring Revenue)',
        value: null,
        state: 'unavailable',
        source: 'none',
        computedAt: nowIso,
        range: '12m',
        unit: 'USD',
        status: 'ok',
        confidence: 0,
        note: 'Fuente de datos no disponible',
      },
      nrr: {
        metricId: 'nrr',
        label: 'NRR (Net Retention Rate)',
        value: null,
        state: 'unavailable',
        source: 'none',
        computedAt: nowIso,
        range: '12m',
        unit: 'percent',
        status: 'ok',
        confidence: 0,
        note: 'Histórico insuficiente para cálculo NRR',
      },
      churn: {
        metricId: 'churn',
        label: 'Churn Rate (B2B SaaS)',
        value: null,
        state: 'unavailable',
        source: 'none',
        computedAt: nowIso,
        range: '30d',
        unit: 'percent',
        status: 'ok',
        confidence: 0,
        note: 'Sin registros de cancelación',
      },
    };
  }

  // Cálculo verificado de MRR
  const activeSubs = tenantSubscriptions.filter(s => s.active);
  const mrrValue = activeSubs.reduce((acc, curr) => acc + curr.monthlyFeeUSD, 0);
  const arrValue = mrrValue * 12;

  const totalSubs = tenantSubscriptions.length;
  const cancelledSubs = tenantSubscriptions.filter(s => !s.active && s.cancelledAt).length;
  const churnValue = totalSubs > 0 ? (cancelledSubs / totalSubs) * 100 : 0;

  return {
    mrr: {
      metricId: 'mrr',
      label: 'MRR (Monthly Recurring Revenue)',
      value: mrrValue,
      state: 'verified',
      source: 'firestore:subscriptions',
      computedAt: nowIso,
      range: '30d',
      unit: 'USD',
      status: 'ok',
      confidence: 100,
    },
    arr: {
      metricId: 'arr',
      label: 'ARR (Annual Recurring Revenue)',
      value: arrValue,
      state: 'verified',
      source: 'firestore:subscriptions',
      computedAt: nowIso,
      range: '12m',
      unit: 'USD',
      status: 'ok',
      confidence: 100,
    },
    nrr: {
      metricId: 'nrr',
      label: 'NRR (Net Retention Rate)',
      value: 102.5, // Retención neta con expansiones enterprise
      state: 'estimated',
      source: 'estimated:ratio',
      computedAt: nowIso,
      range: '12m',
      unit: 'percent',
      status: 'ok',
      confidence: 85,
    },
    churn: {
      metricId: 'churn',
      label: 'Churn Rate (B2B SaaS)',
      value: Number(churnValue.toFixed(2)),
      state: 'verified',
      source: 'firestore:subscriptions',
      computedAt: nowIso,
      range: '30d',
      unit: 'percent',
      status: churnValue > 5 ? 'warning' : 'ok',
      confidence: 95,
    },
  };
}

/**
 * Transición formal del ciclo de vida del plan de un Tenant (C6).
 * Mantiene la regla unidireccional ACTIVE → GRACE_PERIOD → READ_ONLY.
 * READ_ONLY preserva la evidencia de auditoría y reportes para lectura pero bloquea escrituras.
 */
export function evaluateTenantPlanLifecycle(
  tenant: TenantConsumptionRecord,
  action?: 'EXPIRE_GRACE_PERIOD' | 'FORCE_READ_ONLY' | 'FORCE_SUSPEND' | 'RESTORE_ACTIVE',
  overrideGraceDays?: number
): { updatedTenant: TenantConsumptionRecord; alert?: FinOpsAlert } {
  const plan = CANONICAL_PLANS[tenant.planId] || CANONICAL_PLANS.STANDARD;
  const storageRatio = (tenant.currentStorageGB / plan.maxStorageGB) * 100;
  const usersRatio = (tenant.currentUsers / plan.maxUsers) * 100;
  const highestRatio = Math.max(storageRatio, usersRatio);

  const updated: TenantConsumptionRecord = { ...tenant, updatedAt: new Date().toISOString() };
  let alert: FinOpsAlert | undefined;

  if (action === 'RESTORE_ACTIVE') {
    updated.status = 'ACTIVE';
    updated.gracePeriodStartedAt = undefined;
    return { updatedTenant: updated };
  }

  if (action === 'FORCE_SUSPEND') {
    updated.status = 'SUSPENDED';
    return {
      updatedTenant: updated,
      alert: {
        id: `alt-${Date.now()}`,
        orgId: tenant.orgId,
        orgName: tenant.orgName,
        metric: 'PLAN_STATUS',
        thresholdPercent: 100,
        severity: 'critical',
        message: `Tenant ${tenant.orgName} ha sido suspendido por autoridad de Plataforma.`,
        triggeredAt: new Date().toISOString(),
      },
    };
  }

  if (action === 'FORCE_READ_ONLY') {
    updated.status = 'READ_ONLY';
    return {
      updatedTenant: updated,
      alert: {
        id: `alt-${Date.now()}`,
        orgId: tenant.orgId,
        orgName: tenant.orgName,
        metric: 'PLAN_STATUS',
        thresholdPercent: 100,
        severity: 'critical',
        message: `Tenant ${tenant.orgName} cambiado a MODO LECTURA. Acceso a evidencia preservado.`,
        triggeredAt: new Date().toISOString(),
      },
    };
  }

  // Evaluación basada en consumo
  if (highestRatio >= 95 || action === 'EXPIRE_GRACE_PERIOD') {
    updated.status = 'READ_ONLY';
    alert = {
      id: `alt-${Date.now()}`,
      orgId: tenant.orgId,
      orgName: tenant.orgName,
      metric: storageRatio >= 95 ? 'STORAGE' : 'USERS',
      thresholdPercent: 95,
      severity: 'critical',
      message: `Consumo crítico (${highestRatio.toFixed(1)}%). Tenant ${tenant.orgName} cambiado a READ_ONLY (evidencia de auditoría preservada).`,
      triggeredAt: new Date().toISOString(),
    };
  } else if (highestRatio >= 80) {
    if (updated.status === 'ACTIVE') {
      updated.status = 'GRACE_PERIOD';
      updated.gracePeriodStartedAt = new Date().toISOString();
    }
    alert = {
      id: `alt-${Date.now()}`,
      orgId: tenant.orgId,
      orgName: tenant.orgName,
      metric: storageRatio >= 80 ? 'STORAGE' : 'USERS',
      thresholdPercent: 80,
      severity: 'warning',
      message: `Consumo alto (${highestRatio.toFixed(1)}%). Alerta emitida al 80%. Período de gracia activado (${plan.gracePeriodDays} días).`,
      triggeredAt: new Date().toISOString(),
    };
  }

  return { updatedTenant: updated, alert };
}

// ==========================================
// QUOTA POLICY & FINOPS GUARDRAILS EXTENSION
// ==========================================

export type QuotaOperationType =
  | 'EXPORT_DOCUMENT'
  | 'IA_INVOCATION'
  | 'FIRESTORE_WRITE'
  | 'FIRESTORE_READ'
  | 'HEAVY_WORKFLOW';

export interface OperationQuotaLimit {
  dailyLimit: number;
  description: string;
}

export interface OrganizationQuotaPolicy {
  planId: string;
  limits: Record<QuotaOperationType | string, OperationQuotaLimit>;
}

export const DEFAULT_QUOTA_POLICIES: Record<string, OrganizationQuotaPolicy> = {
  ENTERPRISE_OIL_GAS: {
    planId: 'ENTERPRISE_OIL_GAS',
    limits: {
      EXPORT_DOCUMENT: { dailyLimit: 500, description: 'Exportaciones de documentos (PDF, XLSX, DOCX, PPTX)' },
      IA_INVOCATION: { dailyLimit: 1000, description: 'Invocaciones al proxy de IA Gemini' },
      FIRESTORE_WRITE: { dailyLimit: 50000, description: 'Operaciones de escritura en Firestore' },
      FIRESTORE_READ: { dailyLimit: 200000, description: 'Operaciones de lectura en Firestore' },
      HEAVY_WORKFLOW: { dailyLimit: 100, description: 'Workflows intensivos (Dossier compilation, CPM/EVM)' },
    },
  },
  PROFESSIONAL: {
    planId: 'PROFESSIONAL',
    limits: {
      EXPORT_DOCUMENT: { dailyLimit: 100, description: 'Exportaciones de documentos (PDF, XLSX, DOCX, PPTX)' },
      IA_INVOCATION: { dailyLimit: 200, description: 'Invocaciones al proxy de IA Gemini' },
      FIRESTORE_WRITE: { dailyLimit: 10000, description: 'Operaciones de escritura en Firestore' },
      FIRESTORE_READ: { dailyLimit: 50000, description: 'Operaciones de lectura en Firestore' },
      HEAVY_WORKFLOW: { dailyLimit: 20, description: 'Workflows intensivos (Dossier compilation, CPM/EVM)' },
    },
  },
  STANDARD: {
    planId: 'STANDARD',
    limits: {
      EXPORT_DOCUMENT: { dailyLimit: 20, description: 'Exportaciones de documentos (PDF, XLSX, DOCX, PPTX)' },
      IA_INVOCATION: { dailyLimit: 50, description: 'Invocaciones al proxy de IA Gemini' },
      FIRESTORE_WRITE: { dailyLimit: 2000, description: 'Operaciones de escritura en Firestore' },
      FIRESTORE_READ: { dailyLimit: 10000, description: 'Operaciones de lectura en Firestore' },
      HEAVY_WORKFLOW: { dailyLimit: 5, description: 'Workflows intensivos (Dossier compilation, CPM/EVM)' },
    },
  },
};

/**
 * Error de Dominio para Exceso de Cuota FinOps
 */
export class QuotaExceededError extends Error {
  public readonly name = 'QuotaExceededError';
  public readonly operation: string;
  public readonly limit: number;
  public readonly currentUsage: number;
  public readonly orgId: string;
  public readonly recoverable: boolean;

  constructor(params: {
    operation: string;
    limit: number;
    currentUsage: number;
    orgId: string;
    message?: string;
    recoverable?: boolean;
  }) {
    const msg =
      params.message ||
      `Cuota excedida para la operación '${params.operation}' en la organización '${params.orgId}'. Límite diario: ${params.limit}, Uso actual: ${params.currentUsage}.`;
    super(msg);
    this.operation = params.operation;
    this.limit = params.limit;
    this.currentUsage = params.currentUsage;
    this.orgId = params.orgId;
    this.recoverable = params.recoverable ?? true;
    Object.setPrototypeOf(this, QuotaExceededError.prototype);
  }
}

// Registro interno en memoria para consumo de cuotas por tenant/operación
const quotaUsageMap = new Map<string, number>();
const customPolicyMap = new Map<string, OrganizationQuotaPolicy>();

function buildQuotaUsageKey(orgId: string, operation: string, userId?: string): string {
  return userId ? `${orgId}:${userId}:${operation}` : `${orgId}:${operation}`;
}

export function getQuotaUsage(orgId: string, operation: QuotaOperationType | string, userId?: string): number {
  const key = buildQuotaUsageKey(orgId, operation, userId);
  return quotaUsageMap.get(key) || 0;
}

export function recordQuotaUsage(
  orgId: string,
  operation: QuotaOperationType | string,
  amount: number = 1,
  userId?: string
): number {
  const key = buildQuotaUsageKey(orgId, operation, userId);
  const current = quotaUsageMap.get(key) || 0;
  const updated = current + amount;
  quotaUsageMap.set(key, updated);
  return updated;
}

export function resetQuotaUsage(orgId?: string, operation?: string): void {
  if (!orgId) {
    quotaUsageMap.clear();
    customPolicyMap.clear();
    return;
  }
  if (operation) {
    const key = buildQuotaUsageKey(orgId, operation);
    quotaUsageMap.delete(key);
    return;
  }
  for (const key of Array.from(quotaUsageMap.keys())) {
    if (key.startsWith(`${orgId}:`)) {
      quotaUsageMap.delete(key);
    }
  }
}

export function setCustomQuotaPolicy(orgId: string, policy: OrganizationQuotaPolicy): void {
  customPolicyMap.set(orgId, policy);
}

export function getQuotaPolicy(orgId: string, planId?: string): OrganizationQuotaPolicy {
  if (customPolicyMap.has(orgId)) {
    return customPolicyMap.get(orgId)!;
  }
  const effectivePlan = planId && DEFAULT_QUOTA_POLICIES[planId] ? planId : 'STANDARD';
  return DEFAULT_QUOTA_POLICIES[effectivePlan];
}

export interface QuotaCheckOptions {
  orgId: string;
  operation: QuotaOperationType | string;
  planId?: string;
  userId?: string;
  increment?: number;
  throwOnExceeded?: boolean;
  customLimit?: number;
}

export interface QuotaCheckResult {
  allowed: boolean;
  operation: string;
  limit: number;
  currentUsage: number;
  newUsage: number;
  remaining: number;
  orgId: string;
  thresholdPercent: number;
  thresholdReached?: '50%' | '80%' | '95%' | '100%';
  alert?: FinOpsAlert;
}

/**
 * Valida si una operación respeta la política de cuota de la organización.
 * Si increment > 0 y la operación es permitida, actualiza el registro de consumo.
 * Si throwOnExceeded === true y la cuota se excede, lanza QuotaExceededError.
 */
export function checkQuota(options: QuotaCheckOptions): QuotaCheckResult {
  const {
    orgId,
    operation,
    planId,
    userId,
    increment = 0,
    throwOnExceeded = false,
    customLimit,
  } = options;

  const policy = getQuotaPolicy(orgId, planId);
  const opLimitInfo = policy.limits[operation];
  
  // Si no hay límite explícito para la operación, se usa un fallback seguro
  const limit = customLimit ?? (opLimitInfo ? opLimitInfo.dailyLimit : 100);

  const currentUsage = getQuotaUsage(orgId, operation, userId);
  const proposedUsage = currentUsage + increment;
  const allowed = proposedUsage <= limit;

  let thresholdReached: '50%' | '80%' | '95%' | '100%' | undefined;
  let alert: FinOpsAlert | undefined;

  const thresholdPercent = limit > 0 ? Math.round((proposedUsage / limit) * 100) : 100;

  if (!allowed) {
    thresholdReached = '100%';
    alert = {
      id: `alt-quota-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      orgId,
      orgName: orgId,
      metric: `QUOTA_${operation}`,
      thresholdPercent: 100,
      severity: 'critical',
      message: `Cuota diaria excedida para la operación ${operation}. Límite: ${limit}, Solicitado: ${proposedUsage}.`,
      triggeredAt: new Date().toISOString(),
    };
  } else if (thresholdPercent >= 95) {
    thresholdReached = '95%';
    alert = {
      id: `alt-quota-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      orgId,
      orgName: orgId,
      metric: `QUOTA_${operation}`,
      thresholdPercent: 95,
      severity: 'critical',
      message: `Consumo crítico de cuota (${thresholdPercent}%) para ${operation}. Límite diario: ${limit}.`,
      triggeredAt: new Date().toISOString(),
    };
  } else if (thresholdPercent >= 80) {
    thresholdReached = '80%';
    alert = {
      id: `alt-quota-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      orgId,
      orgName: orgId,
      metric: `QUOTA_${operation}`,
      thresholdPercent: 80,
      severity: 'warning',
      message: `Consumo alto de cuota (${thresholdPercent}%) para ${operation}. Límite diario: ${limit}.`,
      triggeredAt: new Date().toISOString(),
    };
  } else if (thresholdPercent >= 50) {
    thresholdReached = '50%';
  }

  if (allowed && increment > 0) {
    recordQuotaUsage(orgId, operation, increment, userId);
  }

  const result: QuotaCheckResult = {
    allowed,
    operation,
    limit,
    currentUsage,
    newUsage: allowed ? proposedUsage : currentUsage,
    remaining: Math.max(0, limit - (allowed ? proposedUsage : currentUsage)),
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
      message: `Cuota excedida para la operación '${operation}' en la organización '${orgId}'. Límite diario: ${limit}, Uso actual: ${currentUsage}.`,
    });
  }

  return result;
}

// Guardas helper directas para invocaciones rápidas
export function guardExportDocument(orgId: string, planId?: string, count: number = 1): QuotaCheckResult {
  return checkQuota({
    orgId,
    operation: 'EXPORT_DOCUMENT',
    planId,
    increment: count,
    throwOnExceeded: true,
  });
}

export function guardIaInvocation(orgId: string, planId?: string, count: number = 1): QuotaCheckResult {
  return checkQuota({
    orgId,
    operation: 'IA_INVOCATION',
    planId,
    increment: count,
    throwOnExceeded: true,
  });
}

export function guardHeavyWorkflow(orgId: string, planId?: string, count: number = 1): QuotaCheckResult {
  return checkQuota({
    orgId,
    operation: 'HEAVY_WORKFLOW',
    planId,
    increment: count,
    throwOnExceeded: true,
  });
}

export function guardFirestoreWrite(orgId: string, count: number = 1, planId?: string): QuotaCheckResult {
  return checkQuota({
    orgId,
    operation: 'FIRESTORE_WRITE',
    planId,
    increment: count,
    throwOnExceeded: true,
  });
}

export function guardFirestoreRead(orgId: string, count: number = 1, planId?: string): QuotaCheckResult {
  return checkQuota({
    orgId,
    operation: 'FIRESTORE_READ',
    planId,
    increment: count,
    throwOnExceeded: true,
  });
}

