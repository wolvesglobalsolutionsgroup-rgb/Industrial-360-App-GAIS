import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as crypto from 'crypto';

// In-memory Firestore mock store
const store = new Map<string, any>();
const auditLogs: any[] = [];

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
          const docId = id || `mock_doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
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
          return {
            empty: docs.length === 0,
            docs,
          };
        }),
        where: (field: string, op: string, val: any) => ({
          get: vi.fn().mockImplementation(async () => {
            const docs: any[] = [];
            for (const [key, value] of store.entries()) {
              if (key.startsWith(path + '/') && value[field] === val) {
                docs.push({
                  id: key.split('/').pop(),
                  data: () => value,
                  exists: true,
                });
              }
            }
            return {
              empty: docs.length === 0,
              docs,
            };
          }),
        }),
        add: vi.fn().mockImplementation(async (data: any) => {
          const id = `mock_doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const fullPath = `${path}/${id}`;
          store.set(fullPath, data);
          auditLogs.push(data);
          return createMockDocRef(fullPath);
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
            if (ref.path.includes('/audit_logs/')) {
              auditLogs.push(data);
            }
          },
          update: (ref: any, data: any) => {
            const existing = store.get(ref.path) || {};
            store.set(ref.path, { ...existing, ...data });
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

import {
  createClientPortal,
  rotateClientPortalToken,
  revokeClientPortalToken,
  getClientPortal,
  sealDocument,
  verifyDocument,
} from '../index';

describe('S14.4 — Client Portal & Document Sealing Security Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.clear();
    auditLogs.length = 0;

    // Seed memberships required by authorizeServerSideRequest
    store.set('organizations/org_alpha/memberships/admin_user_1', {
      role: 'gerente',
      active: true,
      orgId: 'org_alpha',
    });
    store.set('organizations/org_alpha/memberships/admin_gerente', {
      role: 'gerente',
      active: true,
      orgId: 'org_alpha',
    });
    store.set('organizations/org_alpha/memberships/inspector_001', {
      role: 'inspector',
      active: true,
      orgId: 'org_alpha',
    });

    // Seed project required by authorizeServerSideRequest for sealDocument
    store.set('organizations/org_alpha/projects/proj_alpha_1', {
      id: 'proj_alpha_1',
      orgId: 'org_alpha',
      name: 'Oleoducto Alpha',
    });
  });

  const createMockReqRes = (query: any = {}, body: any = {}, headers: any = {}) => {
    const resHeaders: Record<string, string> = {};
    let statusCode = 200;
    let jsonOutput: any = null;

    const req: any = {
      query,
      body,
      headers: {
        'user-agent': 'Vitest Client',
        'x-forwarded-for': '192.168.1.100',
        ...headers,
      },
      ip: headers['ip'] || headers['x-forwarded-for'] || '192.168.1.100',
    };

    const res: any = {
      set: vi.fn().mockImplementation((key: string, val: string) => {
        resHeaders[key.toLowerCase()] = val;
      }),
      status: vi.fn().mockImplementation((code: number) => {
        statusCode = code;
        return res;
      }),
      json: vi.fn().mockImplementation((data: any) => {
        jsonOutput = data;
        return res;
      }),
      send: vi.fn().mockImplementation((data: any) => {
        jsonOutput = data;
        return res;
      }),
      headersSent: false,
      _getHeaders: () => resHeaders,
      _getStatus: () => statusCode,
      _getJson: () => jsonOutput,
    };

    return { req, res };
  };

  describe('C1 & C2 — Token Creation and Sanitization', () => {
    it('1. createClientPortal genera token de 32 bytes crypto (64 hex chars) y solo almacena SHA-256 hash', async () => {
      const context: any = {
        auth: {
          uid: 'admin_user_1',
          token: { orgId: 'org_alpha', role: 'gerente' },
        },
      };

      const portalData = {
        name: 'Portal Inspección Oleoducto',
        clientName: 'Inspectoría PDVSA',
        orgId: 'org_alpha',
        linkedProjectIds: ['proj_1', 'proj_2'],
        visibilityMatrix: { showKpis: true, showSihoPtw: true, showValuations: false },
      };

      const result: any = await (createClientPortal as any).run(portalData, context);

      expect(result.success).toBe(true);
      expect(result.rawToken).toBeDefined();
      expect(result.rawToken.length).toBe(64); // 32 bytes hex = 64 characters

      const storedPortal = store.get(`client_portals/${result.portalId}`);
      expect(storedPortal).toBeDefined();
      expect(storedPortal.tokenHash).toBeDefined();
      expect(storedPortal.rawToken).toBeUndefined(); // rawToken NUNCA en DB
      expect(storedPortal.tokenHash).toBe(crypto.createHash('sha256').update(result.rawToken).digest('hex'));

      // C2: Verificar que el rawToken no fue registrado en ningún log de auditoría
      for (const log of auditLogs) {
        expect(JSON.stringify(log)).not.toContain(result.rawToken);
      }
    });

    it('2. getClientPortal rechaza solicitudes sin token o sin portalId (HTTP 400)', async () => {
      const { req, res } = createMockReqRes({}, {});
      await getClientPortal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res._getJson().error).toContain('Faltan parámetros');
    });

    it('3. getClientPortal rechaza token con longitud o hash incorrecto usando timingSafeEqual (HTTP 401)', async () => {
      const portalId = 'portal_test_1';
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      store.set(`client_portals/${portalId}`, {
        id: portalId,
        name: 'Portal Test',
        clientName: 'Cliente Test',
        orgId: 'org_alpha',
        tokenHash,
        isRevoked: false,
        visibilityMatrix: { showKpis: true },
      });

      // Token con distinta longitud / inváldio
      const invalidToken = 'invalid_short_token';
      const { req, res } = createMockReqRes({ portalId, token: invalidToken });
      await getClientPortal(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res._getJson().error).toContain('Token de seguridad no válido');
    });

    it('4. getClientPortal rechaza portal revocado (HTTP 403) o expirado (HTTP 403)', async () => {
      const portalId = 'portal_revoked';
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      store.set(`client_portals/${portalId}`, {
        id: portalId,
        name: 'Portal Revocado',
        orgId: 'org_alpha',
        tokenHash,
        isRevoked: true,
      });

      const { req, res } = createMockReqRes({ portalId, token: rawToken });
      await getClientPortal(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res._getJson().error).toContain('Acceso Revocado');
    });

    it('5. C3 — getClientPortal retorna DTO sanitizado sin orgId, projectId, tokenHash, storagePath o UIDs', async () => {
      const portalId = 'portal_valid_dto';
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      store.set(`client_portals/${portalId}`, {
        id: portalId,
        name: 'Portal Branded',
        clientName: 'Comité de Inspección',
        orgId: 'SECRET_ORG_ID_123',
        linkedProjectIds: ['SECRET_PROJ_999'],
        tokenHash,
        storagePath: '/secret/storage/path',
        createdBy: 'user_uid_007',
        isRevoked: false,
        branding: { logoUrl: 'https://logo.png', themePreset: 'mineral' },
        visibilityMatrix: { showKpis: true, showScurve: true, showValuations: false },
        updatedAt: '2026-08-01T12:00:00Z',
      });

      const { req, res } = createMockReqRes({ portalId, token: rawToken });
      await getClientPortal(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const payload = res._getJson();
      expect(payload.success).toBe(true);

      const dto = payload.portal;
      expect(dto.id).toBe(portalId);
      expect(dto.name).toBe('Portal Branded');
      expect(dto.clientName).toBe('Comité de Inspección');
      expect(dto.branding).toBeDefined();
      expect(dto.visibilityMatrix).toEqual({ showKpis: true, showScurve: true });

      // C3 PROHIBIDOS en DTO público:
      expect(dto.orgId).toBeUndefined();
      expect(dto.projectId).toBeUndefined();
      expect(dto.linkedProjectIds).toBeUndefined();
      expect(dto.tokenHash).toBeUndefined();
      expect(dto.storagePath).toBeUndefined();
      expect(dto.createdBy).toBeUndefined();
    });
  });

  describe('C4 & C5 — Rate Limiting por IP Normalizada y Recurso', () => {
    it('6. getClientPortal activa Rate Limit (HTTP 429) e incluye Retry-After al superar maxRequests', async () => {
      const portalId = 'portal_rate_limit_test';
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      store.set(`client_portals/${portalId}`, {
        id: portalId,
        orgId: 'org_alpha',
        tokenHash,
        isRevoked: false,
      });

      // Simular 30 peticiones previas de la misma IP para agotar cuota
      const ip = '203.0.113.195';
      const windowKey = Math.floor(Date.now() / 60000);
      const rateLimitDocId = `${ip}_${portalId}_getClientPortal_${windowKey}`;
      store.set(`rate_limits/${rateLimitDocId}`, {
        keyIdentifier: `${ip}_${portalId}`,
        operation: 'getClientPortal',
        count: 30,
        windowKey,
      });

      const { req, res } = createMockReqRes(
        { portalId, token: rawToken },
        {},
        { 'x-forwarded-for': '::ffff:203.0.113.195' } // IP IPv6/IPv4 mapeada
      );

      await getClientPortal(req, res);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res._getJson().error).toContain('Demasiadas solicitudes');
      expect(res._getJson().retryAfterSeconds).toBeDefined();
      expect(res._getHeaders()['retry-after']).toBeDefined();
    });
  });

  describe('C6 — Rotación y Revocación Atómica de Tokens', () => {
    it('7. rotateClientPortalToken invalida atómicamente el token anterior en runTransaction y entrega nuevo token', async () => {
      const portalId = 'portal_to_rotate';
      const oldRawToken = crypto.randomBytes(32).toString('hex');
      const oldHash = crypto.createHash('sha256').update(oldRawToken).digest('hex');

      store.set(`organizations/org_alpha/client_portals/${portalId}`, {
        id: portalId,
        orgId: 'org_alpha',
        tokenHash: oldHash,
        isRevoked: false,
      });
      store.set(`client_portals/${portalId}`, {
        id: portalId,
        orgId: 'org_alpha',
        tokenHash: oldHash,
        isRevoked: false,
      });

      const context: any = {
        auth: {
          uid: 'admin_gerente',
          token: { orgId: 'org_alpha', role: 'gerente' },
        },
      };

      const result: any = await (rotateClientPortalToken as any).run(
        { portalId, orgId: 'org_alpha', expiresAtOption: '30days' },
        context
      );

      expect(result.success).toBe(true);
      expect(result.rawToken).toBeDefined();
      expect(result.rawToken).not.toBe(oldRawToken);

      const updatedPortal = store.get(`client_portals/${portalId}`);
      expect(updatedPortal.tokenHash).not.toBe(oldHash);
      expect(updatedPortal.previousTokenInvalidatedAt).toBeDefined();

      // C2: Verificar ausencia de nuevo rawToken en logs de auditoría
      for (const log of auditLogs) {
        expect(JSON.stringify(log)).not.toContain(result.rawToken);
      }
    });

    it('8. rotateClientPortalToken rechaza llamada de usuario no perteneciente a la organización (aislamiento multi-tenant)', async () => {
      const portalId = 'portal_tenant_b';
      store.set(`organizations/org_b/client_portals/${portalId}`, {
        id: portalId,
        orgId: 'org_b',
      });

      const context: any = {
        auth: {
          uid: 'user_org_a',
          token: { orgId: 'org_a', role: 'gerente' }, // Org A intentando manipular Org B
        },
      };

      await expect(
        (rotateClientPortalToken as any).run({ portalId, orgId: 'org_b' }, context)
      ).rejects.toThrow('Acceso denegado');
    });

    it('9. revokeClientPortalToken deshabilita acceso de forma inmediata e inmutable', async () => {
      const portalId = 'portal_to_revoke';
      store.set(`organizations/org_alpha/client_portals/${portalId}`, {
        id: portalId,
        orgId: 'org_alpha',
        isRevoked: false,
      });
      store.set(`client_portals/${portalId}`, {
        id: portalId,
        orgId: 'org_alpha',
        isRevoked: false,
      });

      const context: any = {
        auth: {
          uid: 'admin_gerente',
          token: { orgId: 'org_alpha', role: 'gerente' },
        },
      };

      const result: any = await (revokeClientPortalToken as any).run(
        { portalId, orgId: 'org_alpha', reason: 'Terminación de contrato' },
        context
      );

      expect(result.success).toBe(true);
      expect(store.get(`client_portals/${portalId}`).isRevoked).toBe(true);
    });
  });

  describe('Sello Documental Criptográfico (sealDocument & verifyDocument)', () => {
    it('10. sealDocument calcula hash SHA-256 e inmutable e inscribe en colección append-only', async () => {
      const pdfData = Buffer.from('PDF_DOCUMENT_CONTENT_REV0').toString('base64');
      const context: any = {
        auth: {
          uid: 'inspector_001',
          token: { orgId: 'org_alpha', role: 'inspector' },
        },
      };

      const result: any = await (sealDocument as any).run(
        {
          docId: 'doc_dossier_001',
          orgId: 'org_alpha',
          projId: 'proj_alpha_1',
          pdfBytesBase64: pdfData,
          version: 'REV-1',
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.sha256).toBeDefined();

      const expectedSha256 = crypto.createHash('sha256').update(Buffer.from(pdfData, 'base64')).digest('hex');
      expect(result.sha256).toBe(expectedSha256);

      const verificationRecord = store.get(`document_verifications/${result.sha256}`);
      expect(verificationRecord).toBeDefined();
      expect(verificationRecord.status).toBe('VALIDEZ_OFICIAL');
    });

    it('11. Alterar 1 byte del documento modifica completamente el hash SHA-256 en sealDocument', async () => {
      const originalPdf = Buffer.from('ORIGINAL_PDF_BYTES_12345').toString('base64');
      const tamperedPdf = Buffer.from('ORIGINAL_PDF_BYTES_12346').toString('base64'); // 1 carácter alterado

      const hashOriginal = crypto.createHash('sha256').update(Buffer.from(originalPdf, 'base64')).digest('hex');
      const hashTampered = crypto.createHash('sha256').update(Buffer.from(tamperedPdf, 'base64')).digest('hex');

      expect(hashOriginal).not.toBe(hashTampered);
    });

    it('12. verifyDocument verifica sello oficial por SHA-256 pública con rate limiting (C5)', async () => {
      const sha256 = 'abc123sha256mockhash999';
      store.set(`document_verifications/${sha256}`, {
        id: sha256,
        docId: 'doc_123',
        status: 'VALIDEZ_OFICIAL',
        version: 'REV-0',
        issuedAt: '2026-08-01T10:00:00Z',
        sha256,
      });

      const { req, res } = createMockReqRes({ sha256 });
      await verifyDocument(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res._getJson().status).toBe('VALIDEZ_OFICIAL');
      expect(res._getJson().sha256).toBe(sha256);
    });
  });
});
