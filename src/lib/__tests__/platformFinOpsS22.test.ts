import { describe, it, expect } from 'vitest';
import { 
  computePlatformSaaSMetrics, 
  evaluateTenantPlanLifecycle, 
  TenantConsumptionRecord, 
  CANONICAL_PLANS 
} from '../finops/platformMetricsEngine';
import { 
  createAuditBlock, 
  verifyChainIntegrity, 
  GENESIS_HASH_PREV, 
  sanitizePII 
} from '../audit/tamperProofChain';

describe('S22 — Platform FinOps, SaaS Metrics & Audit Chain Tests', () => {

  // C1 — MetricVerificationState: state: 'unavailable' returns value: null (never 0)
  it('1. C1 — Si no hay fuentes de datos, la métrica retorna state: unavailable y value: null', () => {
    const metrics = computePlatformSaaSMetrics(undefined);

    expect(metrics.mrr.state).toBe('unavailable');
    expect(metrics.mrr.value).toBeNull();
    expect(metrics.arr.state).toBe('unavailable');
    expect(metrics.arr.value).toBeNull();
    expect(metrics.churn.state).toBe('unavailable');
    expect(metrics.churn.value).toBeNull();
  });

  it('2. C1 — Calcula métricas verificadas de MRR y ARR cuando existen suscripciones', () => {
    const subs = [
      { orgId: 'org1', monthlyFeeUSD: 4500, active: true, createdAt: '2025-01-01' },
      { orgId: 'org2', monthlyFeeUSD: 1200, active: true, createdAt: '2025-01-01' },
      { orgId: 'org3', monthlyFeeUSD: 450, active: false, cancelledAt: '2025-02-01', createdAt: '2025-01-01' },
    ];

    const metrics = computePlatformSaaSMetrics(subs);

    expect(metrics.mrr.state).toBe('verified');
    expect(metrics.mrr.value).toBe(5700); // 4500 + 1200
    expect(metrics.arr.state).toBe('verified');
    expect(metrics.arr.value).toBe(5700 * 12); // 68400
    expect(metrics.churn.state).toBe('verified');
    expect(metrics.churn.value).toBeCloseTo(33.33, 1);
  });

  // C2 — Bloque génesis hashPrev '0'.repeat(64) y verificación de integridad
  it('3. C2 — Crea y verifica una cadena de auditoría criptográfica con bloque génesis', () => {
    const b0 = createAuditBlock({
      orgId: 'prointeca',
      actor: 'platformAdmin@consorcioog.com',
      requestId: 'req-001',
      action: 'PLATFORM_INIT',
      details: { env: 'production' }
    });

    expect(b0.hashPrev).toBe(GENESIS_HASH_PREV);
    expect(b0.hashPrev.length).toBe(64);
    expect(b0.hashActual.length).toBe(64);

    const b1 = createAuditBlock({
      orgId: 'prointeca',
      actor: 'user1@consorcioog.com',
      requestId: 'req-002',
      action: 'TENANT_UPDATED',
      details: { status: 'ACTIVE' },
      prevBlock: b0
    });

    expect(b1.hashPrev).toBe(b0.hashActual);

    const verification = verifyChainIntegrity([b0, b1]);
    expect(verification.valid).toBe(true);
  });

  it('4. C2 — Detecta alteración mala fe en el contenido de un bloque intermedio', () => {
    const b0 = createAuditBlock({
      orgId: 'prointeca',
      actor: 'admin',
      requestId: 'req-001',
      action: 'ACTION_0',
      details: { count: 1 }
    });

    const b1 = createAuditBlock({
      orgId: 'prointeca',
      actor: 'admin',
      requestId: 'req-002',
      action: 'ACTION_1',
      details: { count: 2 },
      prevBlock: b0
    });

    // Alteración maliciosa
    const tamperedB1 = { ...b1, details: { count: 9999 } };

    const verification = verifyChainIntegrity([b0, tamperedB1]);
    expect(verification.valid).toBe(false);
    expect(verification.brokenAtBlockIndex).toBe(1);
    expect(verification.reason).toContain('Alteración detectada');
  });

  // C4 — Sanitización PII configurable
  it('5. C4 — Sanitiza campos PII configurados redactando emails y teléfonos', () => {
    const payload = {
      username: 'jdoe',
      email: 'jdoe@petro.com',
      phone: '+584141234567',
      metadata: {
        cedula: 'V-12345678',
        role: 'inspector'
      }
    };

    const sanitized = sanitizePII(payload);

    expect(sanitized.username).toBe('jdoe');
    expect(sanitized.email).toBe('[REDACTED_PII]');
    expect(sanitized.phone).toBe('[REDACTED_PII]');
    expect(sanitized.metadata.cedula).toBe('[REDACTED_PII]');
    expect(sanitized.metadata.role).toBe('inspector');
  });

  // C6 — Máquina de estados de plan (ACTIVE → GRACE_PERIOD → READ_ONLY → SUSPENDED)
  it('6. C6 — Transición de plan al exceder 80% (GRACE_PERIOD) y 95% (READ_ONLY)', () => {
    const tenant: TenantConsumptionRecord = {
      orgId: 'techpetro',
      orgName: 'TechPetro C.A.',
      planId: 'STANDARD', // 50 GB, 15 usuarios
      status: 'ACTIVE',
      currentUsers: 13, // 86.6% usuarios -> GRACE_PERIOD
      currentStorageGB: 20,
      currentProjects: 2,
      apiCallsMonthly: 5000,
      estimatedCostUSD: 450,
      updatedAt: new Date().toISOString()
    };

    const eval80 = evaluateTenantPlanLifecycle(tenant);
    expect(eval80.updatedTenant.status).toBe('GRACE_PERIOD');
    expect(eval80.alert?.severity).toBe('warning');

    // Consumo crítico (>95%)
    const tenant95: TenantConsumptionRecord = {
      ...tenant,
      currentStorageGB: 48 // 96% storage -> READ_ONLY
    };

    const eval95 = evaluateTenantPlanLifecycle(tenant95);
    expect(eval95.updatedTenant.status).toBe('READ_ONLY');
    expect(eval95.alert?.severity).toBe('critical');
  });

  it('7. C6 — Permite a platformAdmin forzar suspensión y restauración de tenant', () => {
    const tenant: TenantConsumptionRecord = {
      orgId: 'orgA',
      orgName: 'Org A',
      planId: 'PROFESSIONAL',
      status: 'ACTIVE',
      currentUsers: 5,
      currentStorageGB: 10,
      currentProjects: 1,
      apiCallsMonthly: 1000,
      estimatedCostUSD: 1200,
      updatedAt: new Date().toISOString()
    };

    const suspended = evaluateTenantPlanLifecycle(tenant, 'FORCE_SUSPEND');
    expect(suspended.updatedTenant.status).toBe('SUSPENDED');

    const restored = evaluateTenantPlanLifecycle(suspended.updatedTenant, 'RESTORE_ACTIVE');
    expect(restored.updatedTenant.status).toBe('ACTIVE');
  });
});
