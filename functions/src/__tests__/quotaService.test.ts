import { describe, it, expect, vi, beforeEach } from 'vitest';

// Store en memoria para mockear Firestore Admin SDK
const store = new Map<string, any>();
const createdAlerts: any[] = [];

const createMockDocRef = (docPath: string) => ({
  path: docPath,
  get: vi.fn().mockImplementation(async () => {
    const data = store.get(docPath);
    return {
      exists: Boolean(data),
      data: () => data,
      id: docPath.split('/').pop(),
    };
  }),
  set: vi.fn().mockImplementation(async (data: any, options?: any) => {
    if (options?.merge && store.has(docPath)) {
      store.set(docPath, { ...store.get(docPath), ...data });
    } else {
      store.set(docPath, data);
    }
    if (docPath.includes('/finopsAlerts/')) {
      createdAlerts.push(data);
    }
  }),
  update: vi.fn().mockImplementation(async (data: any) => {
    const existing = store.get(docPath) || {};
    store.set(docPath, { ...existing, ...data });
  }),
});

vi.mock('firebase-admin/app', () => ({
  getApps: () => [{}],
  initializeApp: vi.fn(),
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({
    getUser: vi.fn(),
    setCustomUserClaims: vi.fn(),
    revokeRefreshTokens: vi.fn(),
  }),
}));

vi.mock('firebase-admin/firestore', () => {
  return {
    getFirestore: () => ({
      doc: (path: string) => createMockDocRef(path),
      collection: (path: string) => ({
        doc: (id?: string) => {
          const docId = id || `mock_alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          return createMockDocRef(`${path}/${docId}`);
        },
        get: vi.fn().mockImplementation(async () => {
          const docs: any[] = [];
          for (const [key, value] of store.entries()) {
            if (key.startsWith(path + '/')) {
              docs.push({
                id: key.split('/').pop(),
                data: () => value,
                exists: true,
              });
            }
          }
          return { empty: docs.length === 0, docs };
        }),
      }),
      runTransaction: vi.fn().mockImplementation(async (updateFunction: any) => {
        const transactionMock = {
          get: async (ref: any) => {
            const data = store.get(ref.path);
            return {
              exists: Boolean(data),
              data: () => data,
              id: ref.path.split('/').pop(),
            };
          },
          set: (ref: any, data: any, options?: any) => {
            if (options?.merge && store.has(ref.path)) {
              store.set(ref.path, { ...store.get(ref.path), ...data });
            } else {
              store.set(ref.path, data);
            }
            if (ref.path.includes('/finopsAlerts/')) {
              createdAlerts.push(data);
            }
          },
        };
        return await updateFunction(transactionMock);
      }),
    }),
    FieldValue: {
      serverTimestamp: () => 'MOCK_TIMESTAMP',
    },
    FieldPath: {
      documentId: () => '__name__',
    },
  };
});

vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { reserveQuota } from '../finops/quotaService';
import { QuotaExceededError } from '../../../src/lib/finops/platformMetricsEngine';

describe('FinOps Serverless QuotaService Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.clear();
    createdAlerts.length = 0;
  });

  it('1. Incrementar cuota atómicamente y persistir en el documento diario del tenant', async () => {
    const res = await reserveQuota({
      orgId: 'org_alpha',
      operation: 'IA_INVOCATION',
      planId: 'STANDARD', // Límite diario: 50
      increment: 5,
      now: '2026-08-07T10:00:00Z',
    });

    expect(res.allowed).toBe(true);
    expect(res.currentUsage).toBe(0);
    expect(res.newUsage).toBe(5);
    expect(res.limit).toBe(50);
    expect(res.remaining).toBe(45);

    const docKey = 'organizations/org_alpha/quotaUsage/2026-08-07_IA_INVOCATION';
    const stored = store.get(docKey);
    expect(stored).toBeDefined();
    expect(stored.usage).toBe(5);
    expect(stored.orgId).toBe('org_alpha');
    expect(stored.date).toBe('2026-08-07');
  });

  it('2. Idempotencia: Mismo requestId no incrementa cuota por segunda vez', async () => {
    const reqId = 'req_unique_12345';

    const res1 = await reserveQuota({
      orgId: 'org_alpha',
      operation: 'EXPORT_DOCUMENT',
      planId: 'STANDARD', // Límite: 20
      increment: 2,
      requestId: reqId,
      now: '2026-08-07T10:00:00Z',
    });

    expect(res1.allowed).toBe(true);
    expect(res1.newUsage).toBe(2);

    // Segunda invocación con la misma clave de idempotencia
    const res2 = await reserveQuota({
      orgId: 'org_alpha',
      operation: 'EXPORT_DOCUMENT',
      planId: 'STANDARD',
      increment: 2,
      requestId: reqId,
      now: '2026-08-07T10:00:00Z',
    });

    expect(res2.allowed).toBe(true);
    expect(res2.currentUsage).toBe(2);
    expect(res2.newUsage).toBe(2); // No incrementó a 4

    const stored = store.get('organizations/org_alpha/quotaUsage/2026-08-07_EXPORT_DOCUMENT');
    expect(stored.usage).toBe(2);
    expect(stored.processedRequests).toContain(reqId);
  });

  it('3. Aislamiento Multi-Tenant: Org A al 100% de cuota no bloquea ni afecta a Org B', async () => {
    // Org A acumula cuota de exportación hasta el 90% (18 de 20)
    await reserveQuota({
      orgId: 'org_A',
      operation: 'EXPORT_DOCUMENT',
      planId: 'STANDARD',
      increment: 18,
      now: '2026-08-07T10:00:00Z',
    });

    // Siguiente intento de Org A debe ser rechazado por alcanzar el umbral de degradación (95%+)
    const resA = await reserveQuota({
      orgId: 'org_A',
      operation: 'EXPORT_DOCUMENT',
      planId: 'STANDARD',
      increment: 2,
      now: '2026-08-07T10:00:00Z',
    });
    expect(resA.allowed).toBe(false);

    // Intento para Org B (misma fecha y operación) debe ser permitido independientemente
    const resB = await reserveQuota({
      orgId: 'org_B',
      operation: 'EXPORT_DOCUMENT',
      planId: 'STANDARD',
      increment: 1,
      now: '2026-08-07T10:00:00Z',
    });

    expect(resB.allowed).toBe(true);
    expect(resB.newUsage).toBe(1);
  });

  it('4. Reset Automático por Día UTC: Solicitud al día siguiente usa nuevo contador', async () => {
    // Consumo el 2026-08-07
    await reserveQuota({
      orgId: 'org_alpha',
      operation: 'IA_INVOCATION',
      planId: 'STANDARD', // Límite: 50
      increment: 47,
      now: '2026-08-07T23:59:00Z',
    });

    // Consumo el 2026-08-08 (nuevo día UTC)
    const resNextDay = await reserveQuota({
      orgId: 'org_alpha',
      operation: 'IA_INVOCATION',
      planId: 'STANDARD',
      increment: 5,
      now: '2026-08-08T00:01:00Z',
    });

    expect(resNextDay.allowed).toBe(true);
    expect(resNextDay.currentUsage).toBe(0); // Reiniciado
    expect(resNextDay.newUsage).toBe(5);

    // Verificar que existen 2 documentos distintos por día
    expect(store.has('organizations/org_alpha/quotaUsage/2026-08-07_IA_INVOCATION')).toBe(true);
    expect(store.has('organizations/org_alpha/quotaUsage/2026-08-08_IA_INVOCATION')).toBe(true);
  });

  it('5. Umbrales de Alerta (80%, 95%) y Degradación explícita para IA y Exportación', async () => {
    // Alcanzar el 80% de cuota (40 de 50)
    const res80 = await reserveQuota({
      orgId: 'org_alpha',
      operation: 'IA_INVOCATION',
      planId: 'STANDARD', // Límite: 50
      increment: 40,
      now: '2026-08-07T12:00:00Z',
    });

    expect(res80.allowed).toBe(true);
    expect(res80.thresholdPercent).toBe(80);
    expect(res80.thresholdReached).toBe('80%');
    expect(res80.alert?.severity).toBe('warning');
    expect(createdAlerts.length).toBeGreaterThanOrEqual(1);

    // Alcanzar el 96% de cuota (48 de 50) - Degradación explícita
    const res95 = await reserveQuota({
      orgId: 'org_alpha',
      operation: 'IA_INVOCATION',
      planId: 'STANDARD',
      increment: 8,
      now: '2026-08-07T12:05:00Z',
    });

    expect(res95.allowed).toBe(false); // Bloqueado/degradado al superar el 95%
    expect(res95.thresholdPercent).toBe(96);
    expect(res95.alert?.severity).toBe('critical');
    expect(createdAlerts.some((a) => a.thresholdPercent === 95 || a.thresholdPercent === 96)).toBe(true);
  });

  it('6. Opción throwOnExceeded lanza QuotaExceededError con metadata estructurada', async () => {
    await reserveQuota({
      orgId: 'org_alpha',
      operation: 'EXPORT_DOCUMENT',
      planId: 'STANDARD', // Límite: 20
      increment: 18,
      now: '2026-08-07T12:00:00Z',
    });

    await expect(
      reserveQuota({
        orgId: 'org_alpha',
        operation: 'EXPORT_DOCUMENT',
        planId: 'STANDARD',
        increment: 2,
        now: '2026-08-07T12:01:00Z',
        throwOnExceeded: true,
      })
    ).rejects.toThrowError(QuotaExceededError);

    try {
      await reserveQuota({
        orgId: 'org_alpha',
        operation: 'EXPORT_DOCUMENT',
        planId: 'STANDARD',
        increment: 1,
        now: '2026-08-07T12:01:00Z',
        throwOnExceeded: true,
      });
    } catch (err: any) {
      expect(err).toBeInstanceOf(QuotaExceededError);
      expect(err.operation).toBe('EXPORT_DOCUMENT');
      expect(err.limit).toBe(20);
      expect(err.currentUsage).toBe(18);
      expect(err.orgId).toBe('org_alpha');
      expect(err.recoverable).toBe(true);
    }
  });
});
