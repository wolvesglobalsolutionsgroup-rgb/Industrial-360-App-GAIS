import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkQuota,
  resetQuotaUsage,
  QuotaExceededError,
  guardExportDocument,
  guardIaInvocation,
  guardHeavyWorkflow,
  guardFirestoreWrite,
  guardFirestoreRead,
  setCustomQuotaPolicy,
  getQuotaUsage,
  DEFAULT_QUOTA_POLICIES,
} from '../finops/platformMetricsEngine';

describe('Sprint F-G — Guardas de Costos y Política de Cuotas FinOps', () => {
  beforeEach(() => {
    resetQuotaUsage();
  });

  it('1. Permite operaciones que se encuentran dentro de los límites de cuota', () => {
    const res = checkQuota({
      orgId: 'org_prointeca',
      operation: 'EXPORT_DOCUMENT',
      planId: 'STANDARD', // Límite diario: 20
      increment: 1,
    });

    expect(res.allowed).toBe(true);
    expect(res.operation).toBe('EXPORT_DOCUMENT');
    expect(res.limit).toBe(20);
    expect(res.currentUsage).toBe(0);
    expect(res.newUsage).toBe(1);
    expect(res.remaining).toBe(19);
    expect(res.thresholdPercent).toBe(5);
  });

  it('2. Bloquea operaciones que exceden el límite asignado y lanza QuotaExceededError si throwOnExceeded es true', () => {
    // Agotar la cuota de la org
    checkQuota({
      orgId: 'org_prointeca',
      operation: 'EXPORT_DOCUMENT',
      planId: 'STANDARD', // Límite 20
      increment: 20,
    });

    // Intentar una exportación adicional
    const checkNoThrow = checkQuota({
      orgId: 'org_prointeca',
      operation: 'EXPORT_DOCUMENT',
      planId: 'STANDARD',
      increment: 1,
      throwOnExceeded: false,
    });

    expect(checkNoThrow.allowed).toBe(false);
    expect(checkNoThrow.currentUsage).toBe(20);
    expect(checkNoThrow.limit).toBe(20);
    expect(checkNoThrow.thresholdReached).toBe('100%');
    expect(checkNoThrow.alert?.severity).toBe('critical');

    // Debe lanzar QuotaExceededError con throwOnExceeded: true
    expect(() => {
      checkQuota({
        orgId: 'org_prointeca',
        operation: 'EXPORT_DOCUMENT',
        planId: 'STANDARD',
        increment: 1,
        throwOnExceeded: true,
      });
    }).toThrowError(QuotaExceededError);

    try {
      checkQuota({
        orgId: 'org_prointeca',
        operation: 'EXPORT_DOCUMENT',
        planId: 'STANDARD',
        increment: 1,
        throwOnExceeded: true,
      });
    } catch (err: any) {
      expect(err).toBeInstanceOf(QuotaExceededError);
      expect(err.name).toBe('QuotaExceededError');
      expect(err.operation).toBe('EXPORT_DOCUMENT');
      expect(err.limit).toBe(20);
      expect(err.currentUsage).toBe(20);
      expect(err.orgId).toBe('org_prointeca');
      expect(err.recoverable).toBe(true);
    }
  });

  it('3. Mantiene aislamiento estricto multi-tenant (las cuotas de una org no afectan a otra)', () => {
    // Org A agota su cuota de invocación de IA
    checkQuota({
      orgId: 'org_alpha',
      operation: 'IA_INVOCATION',
      planId: 'STANDARD', // Límite 50
      increment: 50,
    });

    // Org A debe quedar bloqueada
    const resA = checkQuota({
      orgId: 'org_alpha',
      operation: 'IA_INVOCATION',
      planId: 'STANDARD',
      increment: 1,
    });
    expect(resA.allowed).toBe(false);

    // Org B no debe verse afectada y debe poder consumir IA
    const resB = checkQuota({
      orgId: 'org_beta',
      operation: 'IA_INVOCATION',
      planId: 'STANDARD',
      increment: 10,
    });
    expect(resB.allowed).toBe(true);
    expect(resB.currentUsage).toBe(0);
    expect(resB.newUsage).toBe(10);
  });

  it('4. Mantiene aislamiento por tipo de operación (exceder exportación no bloquea IA ni escrituras)', () => {
    const orgId = 'org_petrocedeno';

    // Agotar exportaciones
    checkQuota({
      orgId,
      operation: 'EXPORT_DOCUMENT',
      planId: 'STANDARD', // Límite 20
      increment: 20,
    });

    // Exportación bloqueada
    expect(checkQuota({ orgId, operation: 'EXPORT_DOCUMENT', planId: 'STANDARD', increment: 1 }).allowed).toBe(false);

    // Invocaciones de IA continúan permitidas
    const iaRes = checkQuota({ orgId, operation: 'IA_INVOCATION', planId: 'STANDARD', increment: 1 });
    expect(iaRes.allowed).toBe(true);

    // Escrituras de Firestore continúan permitidas
    const writeRes = checkQuota({ orgId, operation: 'FIRESTORE_WRITE', planId: 'STANDARD', increment: 5 });
    expect(writeRes.allowed).toBe(true);
  });

  it('5. Las guardas auxiliares ejecutan correctamente las restricciones y lanzan QuotaExceededError', () => {
    const orgId = 'org_vazquez';

    // Agotar workflow pesado usando guardHeavyWorkflow
    for (let i = 0; i < 5; i++) {
      guardHeavyWorkflow(orgId, 'STANDARD');
    }

    expect(getQuotaUsage(orgId, 'HEAVY_WORKFLOW')).toBe(5);

    // El 6to workflow debe lanzar QuotaExceededError
    expect(() => guardHeavyWorkflow(orgId, 'STANDARD')).toThrow(QuotaExceededError);

    // Probar guardExportDocument, guardIaInvocation, guardFirestoreWrite, guardFirestoreRead
    expect(() => guardExportDocument(orgId, 'STANDARD', 21)).toThrow(QuotaExceededError);
    expect(() => guardIaInvocation(orgId, 'STANDARD', 51)).toThrow(QuotaExceededError);
    expect(() => guardFirestoreWrite(orgId, 2001, 'STANDARD')).toThrow(QuotaExceededError);
    expect(() => guardFirestoreRead(orgId, 10001, 'STANDARD')).toThrow(QuotaExceededError);
  });

  it('6. Emite alertas de FinOps al alcanzar los umbrales del 80% y 95%', () => {
    const orgId = 'org_threshold_test';

    // 80% de cuota (80 de 100 en PROFESSIONAL export)
    const res80 = checkQuota({
      orgId,
      operation: 'EXPORT_DOCUMENT',
      planId: 'PROFESSIONAL',
      increment: 80,
    });
    expect(res80.allowed).toBe(true);
    expect(res80.thresholdReached).toBe('80%');
    expect(res80.alert).toBeDefined();
    expect(res80.alert?.severity).toBe('warning');

    // 95% de cuota (15 más = 95)
    const res95 = checkQuota({
      orgId,
      operation: 'EXPORT_DOCUMENT',
      planId: 'PROFESSIONAL',
      increment: 15,
    });
    expect(res95.allowed).toBe(true);
    expect(res95.thresholdReached).toBe('95%');
    expect(res95.alert).toBeDefined();
    expect(res95.alert?.severity).toBe('critical');
  });

  it('7. Soporta políticas personalizadas por organización y reseteo de consumo', () => {
    const orgId = 'org_custom';

    setCustomQuotaPolicy(orgId, {
      planId: 'CUSTOM',
      limits: {
        EXPORT_DOCUMENT: { dailyLimit: 3, description: 'Límite restringido personalizado' },
      },
    });

    guardExportDocument(orgId, 'CUSTOM', 3);
    expect(() => guardExportDocument(orgId, 'CUSTOM', 1)).toThrow(QuotaExceededError);

    // Resetear cuota de la organización
    resetQuotaUsage(orgId);
    expect(getQuotaUsage(orgId, 'EXPORT_DOCUMENT')).toBe(0);

    // Ahora debe volver a permitir la operación
    const retryRes = checkQuota({ orgId, operation: 'EXPORT_DOCUMENT', planId: 'CUSTOM', increment: 1 });
    expect(retryRes.allowed).toBe(true);
  });
});
