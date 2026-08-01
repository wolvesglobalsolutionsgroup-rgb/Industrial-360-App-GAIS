import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetDoc = vi.fn();
const mockRunTransaction = vi.fn();

vi.mock('firebase-admin/app', () => ({
  getApps: () => [{}],
  initializeApp: vi.fn(),
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({
    getUser: vi.fn().mockResolvedValue({
      uid: 'user_1',
      customClaims: { orgId: 'org_a' }
    }),
  }),
}));

vi.mock('firebase-admin/firestore', () => {
  return {
    getFirestore: () => ({
      doc: (path: string) => ({
        get: () => mockGetDoc(path),
        path,
      }),
      collection: (path: string) => ({
        doc: () => ({
          path: `${path}/mock_audit_id`,
        }),
      }),
      runTransaction: mockRunTransaction,
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

import { syncOutboxMutation } from '../index';

describe('S14.3 — Outbox e Idempotencia Transaccional Server-Side', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validContext: any = {
    auth: {
      uid: 'user_1',
      token: {
        orgId: 'org_a',
        email: 'user1@org-a.com',
      },
    },
  };

  it('1. Rechaza llamadas de usuarios no autenticados', async () => {
    const unauthedContext: any = { auth: null };
    const payload: any = {
      orgId: 'org_a',
      projectId: 'proj_1',
      entityType: 'tasks',
      operationType: 'CREATE',
      operationId: '12345678-1234-4234-8234-123456789012',
      payload: { title: 'Test Task' },
    };

    await expect((syncOutboxMutation as any).run(payload, unauthedContext)).rejects.toThrow(
      'Acceso denegado: Se requiere un usuario autenticado'
    );
  });

  it('2. Rechaza si el orgId solicitado no coincide con la organización del usuario', async () => {
    const payload: any = {
      orgId: 'org_b',
      projectId: 'proj_1',
      entityType: 'tasks',
      operationType: 'CREATE',
      operationId: '12345678-1234-4234-8234-123456789012',
      payload: { title: 'Test Task' },
    };

    await expect((syncOutboxMutation as any).run(payload, validContext)).rejects.toThrow(
      'Acceso denegado: El usuario pertenece a la organización'
    );
  });

  it('3. Rechaza operationType no permitido en allow-list', async () => {
    const payload: any = {
      orgId: 'org_a',
      projectId: 'proj_1',
      entityType: 'tasks',
      operationType: 'EXECUTE_RAW_SQL',
      operationId: '12345678-1234-4234-8234-123456789012',
      payload: { title: 'Test Task' },
    };

    mockGetDoc.mockImplementation((ref: any) => {
      const path = typeof ref === 'string' ? ref : (ref?.path || '');
      if (path.includes('memberships')) {
        return Promise.resolve({
          exists: true,
          data: () => ({ status: 'active', role: 'gerente' }),
        });
      }
      if (path.includes('projects/proj_1')) {
        return Promise.resolve({
          exists: true,
          data: () => ({ orgId: 'org_a' }),
        });
      }
      return Promise.resolve({ exists: false, data: () => ({}) });
    });

    await expect((syncOutboxMutation as any).run(payload, validContext)).rejects.toThrow(
      'operationType no permitido'
    );
  });

  it('4. Retorna "duplicate" cuando operationId ya existe en idempotencyKeys (idempotencia)', async () => {
    const payload: any = {
      orgId: 'org_a',
      projectId: 'proj_1',
      entityType: 'tasks',
      operationType: 'CREATE',
      operationId: '12345678-1234-4234-8234-123456789012',
      payload: { title: 'Test Task' },
    };

    mockGetDoc.mockImplementation((ref: any) => {
      const path = typeof ref === 'string' ? ref : (ref?.path || '');
      if (path.includes('memberships')) {
        return Promise.resolve({
          exists: true,
          data: () => ({ status: 'active', role: 'gerente' }),
        });
      }
      if (path.includes('projects/proj_1')) {
        return Promise.resolve({
          exists: true,
          data: () => ({ orgId: 'org_a' }),
        });
      }
      return Promise.resolve({ exists: false, data: () => ({}) });
    });

    mockRunTransaction.mockImplementation(async (transactionFn: any) => {
      const mockTx = {
        get: vi.fn().mockImplementation((ref: any) => {
          const path = typeof ref === 'string' ? ref : (ref?.path || '');
          if (path.includes('idempotencyKeys')) {
            return Promise.resolve({
              exists: true,
              data: () => ({
                operationId: '12345678-1234-4234-8234-123456789012',
                processedAt: '2026-08-01T10:00:00.000Z',
                result: { entityId: '12345678-1234-4234-8234-123456789012', version: 1 },
              }),
            });
          }
          return Promise.resolve({ exists: false, data: () => ({}) });
        }),
        set: vi.fn(),
        delete: vi.fn(),
      };
      return await transactionFn(mockTx);
    });

    const result = await (syncOutboxMutation as any).run(payload, validContext);
    expect(result.success).toBe(true);
    expect(result.status).toBe('duplicate');
    expect(result.operationId).toBe('12345678-1234-4234-8234-123456789012');
  });

  it('5. Detecta conflicto de versión si expectedVersion no coincide con la del servidor', async () => {
    const payload: any = {
      orgId: 'org_a',
      projectId: 'proj_1',
      entityType: 'tasks',
      operationType: 'UPDATE',
      operationId: '98765432-1234-4234-8234-123456789012',
      entityId: 'task_123',
      expectedVersion: 1,
      payload: { title: 'Updated Title' },
    };

    mockGetDoc.mockImplementation((ref: any) => {
      const path = typeof ref === 'string' ? ref : (ref?.path || '');
      if (path.includes('memberships')) {
        return Promise.resolve({
          exists: true,
          data: () => ({ status: 'active', role: 'gerente' }),
        });
      }
      if (path.includes('projects/proj_1')) {
        return Promise.resolve({
          exists: true,
          data: () => ({ orgId: 'org_a' }),
        });
      }
      return Promise.resolve({ exists: false, data: () => ({}) });
    });

    mockRunTransaction.mockImplementation(async (transactionFn: any) => {
      const mockTx = {
        get: vi.fn().mockImplementation((ref: any) => {
          const path = typeof ref === 'string' ? ref : (ref?.path || '');
          if (path.includes('idempotencyKeys')) {
            return Promise.resolve({ exists: false, data: () => ({}) });
          }
          if (path.includes('tasks/task_123')) {
            return Promise.resolve({
              exists: true,
              data: () => ({ version: 3, title: 'Server Title' }),
            });
          }
          return Promise.resolve({ exists: false, data: () => ({}) });
        }),
        set: vi.fn(),
        delete: vi.fn(),
      };
      return await transactionFn(mockTx);
    });

    const result = await (syncOutboxMutation as any).run(payload, validContext);
    expect(result.success).toBe(false);
    expect(result.status).toBe('conflict');
    expect(result.currentVersion).toBe(3);
    expect(result.expectedVersion).toBe(1);
  });

  it('6. Aplica mutación exitosamente, registra clave de idempotencia y log de auditoría', async () => {
    const payload: any = {
      orgId: 'org_a',
      projectId: 'proj_1',
      entityType: 'tasks',
      operationType: 'CREATE',
      operationId: 'abcdef12-1234-4234-8234-123456789012',
      entityId: 'task_new',
      payload: { title: 'Nueva Tarea de Campo' },
    };

    mockGetDoc.mockImplementation((ref: any) => {
      const path = typeof ref === 'string' ? ref : (ref?.path || '');
      if (path.includes('memberships')) {
        return Promise.resolve({
          exists: true,
          data: () => ({ status: 'active', role: 'residente' }),
        });
      }
      if (path.includes('projects/proj_1')) {
        return Promise.resolve({
          exists: true,
          data: () => ({ orgId: 'org_a' }),
        });
      }
      return Promise.resolve({ exists: false, data: () => ({}) });
    });

    const mockSet = vi.fn();
    mockRunTransaction.mockImplementation(async (transactionFn: any) => {
      const mockTx = {
        get: vi.fn().mockImplementation((ref: any) => {
          const path = typeof ref === 'string' ? ref : (ref?.path || '');
          if (path.includes('idempotencyKeys')) {
            return Promise.resolve({ exists: false, data: () => ({}) });
          }
          if (path.includes('tasks/task_new')) {
            return Promise.resolve({ exists: false, data: () => ({}) });
          }
          return Promise.resolve({ exists: false, data: () => ({}) });
        }),
        set: mockSet,
        delete: vi.fn(),
      };
      return await transactionFn(mockTx);
    });

    const result = await (syncOutboxMutation as any).run(payload, validContext);
    expect(result.success).toBe(true);
    expect(result.status).toBe('applied');
    expect(result.version).toBe(1);
    expect(mockSet).toHaveBeenCalledTimes(3);
  });
});
