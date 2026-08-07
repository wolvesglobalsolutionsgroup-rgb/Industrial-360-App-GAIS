import { describe, it, expect, vi, beforeEach } from 'vitest';

// Store en memoria para mockear Firestore Admin SDK
const store = new Map<string, any>();

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
  }),
});

vi.mock('firebase-admin/app', () => ({
  getApps: vi.fn(() => [{ name: '[DEFAULT]' }]),
  initializeApp: vi.fn(),
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({
    verifyIdToken: vi.fn(),
  }),
}));

vi.mock('firebase-admin/firestore', () => {
  return {
    getFirestore: () => ({
      doc: (path: string) => createMockDocRef(path),
      collection: (path: string) => ({
        doc: (id?: string) => {
          const docId = id || `mock_id_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          return createMockDocRef(`${path}/${docId}`);
        },
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
          },
        };
        return await updateFunction(transactionMock);
      }),
    }),
    FieldValue: {
      serverTimestamp: () => 'SERVER_TIMESTAMP',
    },
    FieldPath: {
      documentId: () => '__name__',
    },
  };
});

vi.mock('../middleware/requireAuth', () => ({
  requireAuth: vi.fn((req: any, res: any, next: any) => next()),
}));

vi.mock('../../src/lib/geminiServer', () => ({
  handleGeminiProxy: vi.fn().mockResolvedValue({ responseText: 'IA mock response' }),
}));

import { resolveAuthorizedOrgId, authorizeServerSideRequest } from '../middleware/authorizer';
import { reserveQuota } from '../finops/quotaService';
import { callGeminiProxy, reserveExportQuotaProxy, sendEmail } from '../index';

describe('Sprint F-MT.1 — Global Tenant Isolation Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.clear();
  });

  describe('1. Authoritative Server-Side Tenant Resolver (resolveAuthorizedOrgId)', () => {
    it('1.1 Retorna el tenant de los claims cuando no se especifica requestedOrgId', () => {
      const authContext: any = { uid: 'usr_orgA', orgId: 'orgA' };
      const res = resolveAuthorizedOrgId({ authContext });
      expect(res.effectiveOrgId).toBe('orgA');
      expect(res.isPlatformAdmin).toBe(false);
    });

    it('1.2 Retorna el tenant cuando requestedOrgId coincide exactamente con claims', () => {
      const authContext: any = { uid: 'usr_orgA', orgId: 'orgA' };
      const res = resolveAuthorizedOrgId({ authContext, requestedOrgId: 'orgA' });
      expect(res.effectiveOrgId).toBe('orgA');
    });

    it('1.3 Rechaza con permission-denied cuando requestedOrgId (orgB) difiere de los claims (orgA)', () => {
      const authContext: any = { uid: 'usr_orgA', orgId: 'orgA' };
      expect(() =>
        resolveAuthorizedOrgId({ authContext, requestedOrgId: 'orgB' })
      ).toThrow("Acceso denegado: El usuario pertenece a la organización 'orgA', pero solicitó operar en 'orgB'.");
    });

    it('1.4 Rechaza con unauthenticated si falta el objeto de autenticación', () => {
      expect(() =>
        resolveAuthorizedOrgId({ authContext: undefined, requestedOrgId: 'orgA' })
      ).toThrow('Se requiere un usuario autenticado para determinar la organización.');
    });

    it('1.5 Rechaza si el token no contiene claim orgId', () => {
      const authContext: any = { uid: 'usr_no_org' };
      expect(() =>
        resolveAuthorizedOrgId({ authContext, requestedOrgId: 'orgA' })
      ).toThrow('El token de autenticación no contiene claims de organización (orgId).');
    });

    it('1.6 Permite override de platformAdmin SOLO cuando allowPlatformAdminOverride === true', () => {
      const authContext: any = { uid: 'admin_1', platformAdmin: true, orgId: 'system_org' };
      const res = resolveAuthorizedOrgId({
        authContext,
        requestedOrgId: 'client_org_99',
        allowPlatformAdminOverride: true,
      });
      expect(res.effectiveOrgId).toBe('client_org_99');
      expect(res.isPlatformAdmin).toBe(true);
    });

    it('1.7 Deniega override de platformAdmin cuando allowPlatformAdminOverride === false', () => {
      const authContext: any = { uid: 'admin_1', platformAdmin: true, orgId: 'system_org' };
      expect(() =>
        resolveAuthorizedOrgId({
          authContext,
          requestedOrgId: 'client_org_99',
          allowPlatformAdminOverride: false,
        })
      ).toThrow("Acceso denegado: El usuario pertenece a la organización 'system_org', pero solicitó operar en 'client_org_99'.");
    });
  });

  describe('2. Multi-Tenant FinOps Quota Service (reserveQuota)', () => {
    it('2.1 Aprueba reserva de cuota para orgId alineado con claims del token', async () => {
      const authContext = { uid: 'usr_1', orgId: 'orgA' };
      const res = await reserveQuota({
        orgId: 'orgA',
        operation: 'IA_INVOCATION',
        authContext,
      });

      expect(res.allowed).toBe(true);
      expect(res.orgId).toBe('orgA');
    });

    it('2.2 Rechaza reserva de cuotas con error multi-tenant si requestedOrgId (orgB) difiere de token.orgId (orgA)', async () => {
      const authContext = { uid: 'usr_1', orgId: 'orgA' };

      await expect(
        reserveQuota({
          orgId: 'orgB',
          operation: 'IA_INVOCATION',
          authContext,
        })
      ).rejects.toThrow("Acceso denegado: El usuario pertenece a la organización 'orgA', pero solicitó operar en 'orgB'.");
    });
  });

  describe('3. Multi-Tenant Protection on Cloud Function Endpoints', () => {
    it('3.1 callGeminiProxy rechaza con 403 cuando el body suplanta orgId (orgA token -> orgB body)', async () => {
      const req: any = {
        method: 'POST',
        headers: { authorization: 'Bearer token_orgA' },
        user: { uid: 'usr_a', orgId: 'orgA', role: 'gerente' },
        body: { orgId: 'orgB', prompt: 'Hola Gemini' },
      };

      let responseStatus: number = 200;
      let responseBody: any = {};

      const res: any = {
        headersSent: false,
        set: vi.fn(),
        status: vi.fn((code: number) => {
          responseStatus = code;
          return res;
        }),
        json: vi.fn((data: any) => {
          responseBody = data;
          return res;
        }),
      };

      await callGeminiProxy(req, res);

      expect(responseStatus).toBe(403);
      expect(responseBody.code).toBe('PERMISSION_DENIED');
      expect(responseBody.error).toContain("El usuario pertenece a la organización 'orgA', pero solicitó operar en 'orgB'.");
    });

    it('3.2 reserveExportQuotaProxy rechaza con 403 ante intento de suplantación de orgId', async () => {
      const req: any = {
        method: 'POST',
        headers: { authorization: 'Bearer token_orgA' },
        user: { uid: 'usr_a', orgId: 'orgA', role: 'gerente' },
        body: { orgId: 'orgB', formats: ['pdf'] },
      };

      let responseStatus: number = 200;
      let responseBody: any = {};

      const res: any = {
        headersSent: false,
        set: vi.fn(),
        status: vi.fn((code: number) => {
          responseStatus = code;
          return res;
        }),
        json: vi.fn((data: any) => {
          responseBody = data;
          return res;
        }),
      };

      await reserveExportQuotaProxy(req, res);

      expect(responseStatus).toBe(403);
      expect(responseBody.code).toBe('PERMISSION_DENIED');
      expect(responseBody.error).toContain("El usuario pertenece a la organización 'orgA', pero solicitó operar en 'orgB'.");
    });

    it('3.3 sendEmail rechaza con 403 ante inconsistencias de tenant', async () => {
      const req: any = {
        method: 'POST',
        headers: { authorization: 'Bearer token_orgA' },
        user: { uid: 'usr_a', orgId: 'orgA', role: 'gerente' },
        body: { orgId: 'orgB', to: 'test@example.com' },
      };

      let responseStatus: number = 200;
      let responseBody: any = {};

      const res: any = {
        headersSent: false,
        set: vi.fn(),
        status: vi.fn((code: number) => {
          responseStatus = code;
          return res;
        }),
        json: vi.fn((data: any) => {
          responseBody = data;
          return res;
        }),
      };

      await sendEmail(req, res);

      expect(responseStatus).toBe(403);
      expect(responseBody.code).toBe('PERMISSION_DENIED');
    });
  });

  describe('4. Server-Side Authorizer Cross-Tenant Block (authorizeServerSideRequest)', () => {
    it('4.1 Bloquea acceso cruzado de organizaciones en authorizeServerSideRequest', async () => {
      const authContext: any = { uid: 'usr_a', token: { role: 'gerente', orgId: 'orgA' } };

      await expect(
        authorizeServerSideRequest(authContext, { orgId: 'orgB' })
      ).rejects.toThrow("Acceso denegado: El usuario pertenece a la organización 'orgA', pero solicitó operar en 'orgB'.");
    });
  });
});
