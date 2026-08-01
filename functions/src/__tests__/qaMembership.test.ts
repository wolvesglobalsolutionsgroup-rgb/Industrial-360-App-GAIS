import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetDoc = vi.fn();
const mockSet = vi.fn();
const mockUpdate = vi.fn();
const mockBatchCommit = vi.fn().mockResolvedValue(true);
const mockBatchSet = vi.fn();
const mockBatchUpdate = vi.fn();

const mockSetCustomUserClaims = vi.fn().mockResolvedValue(undefined);
const mockRevokeRefreshTokens = vi.fn().mockResolvedValue(undefined);
const mockGetUser = vi.fn().mockResolvedValue({
  uid: 'target_123',
  customClaims: { orgId: 'qa_tenant_1', role: 'gerente' }
});

vi.mock('firebase-admin/app', () => ({
  getApps: () => [{}],
  initializeApp: vi.fn(),
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({
    setCustomUserClaims: mockSetCustomUserClaims,
    revokeRefreshTokens: mockRevokeRefreshTokens,
    getUser: mockGetUser,
  }),
}));

vi.mock('firebase-admin/firestore', () => {
  return {
    getFirestore: () => ({
      doc: (path: string) => ({
        get: mockGetDoc,
        set: mockSet,
        update: mockUpdate,
        path,
      }),
      collection: (path: string) => ({
        doc: () => ({
          path: `${path}/mock_audit_id`,
        }),
      }),
      batch: () => ({
        set: mockBatchSet,
        update: mockBatchUpdate,
        commit: mockBatchCommit,
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

import { provisionQaMembership, revokeQaMembership } from '../index';

describe('S14.2A - QA Membership Provisioning and Revocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('provisionQaMembership', () => {
    it('1. Rechaza usuarios no autenticados', async () => {
      const context: any = { auth: null };
      await expect(
        (provisionQaMembership as any).run({ targetUid: 'u1', targetOrgId: 'org1', requestedRole: 'gerente', reason: 'QA Test' }, context)
      ).rejects.toThrow('El usuario debe estar autenticado.');
    });

    it('2. Rechaza usuarios sin platformAdmin === true', async () => {
      const context: any = { auth: { uid: 'caller_1', token: { role: 'superadmin' } } };
      await expect(
        (provisionQaMembership as any).run({ targetUid: 'u1', targetOrgId: 'org1', requestedRole: 'gerente', reason: 'QA Test' }, context)
      ).rejects.toThrow('Acceso denegado: Se requiere autoridad de plataforma');
    });

    it('3. Rechaza cuando faltan parámetros o reason está vacío', async () => {
      const context: any = { auth: { uid: 'caller_1', token: { platformAdmin: true } } };
      await expect(
        (provisionQaMembership as any).run({ targetUid: 'u1', targetOrgId: 'org1', requestedRole: 'gerente', reason: '' }, context)
      ).rejects.toThrow('Parámetros requeridos: targetUid, targetOrgId, requestedRole, reason');
    });

    it('4. Rechaza si requestedRole es platformAdmin o no está en allow-list', async () => {
      const context: any = { auth: { uid: 'caller_1', token: { platformAdmin: true } } };
      await expect(
        (provisionQaMembership as any).run({ targetUid: 'u1', targetOrgId: 'org1', requestedRole: 'platformAdmin', reason: 'QA Test' }, context)
      ).rejects.toThrow('Rol solicitado no permitido para QA Preview');
    });

    it('5. Rechaza si la organización no existe', async () => {
      const context: any = { auth: { uid: 'caller_1', token: { platformAdmin: true } } };
      mockGetDoc.mockResolvedValueOnce({ exists: false });

      await expect(
        (provisionQaMembership as any).run({ targetUid: 'u1', targetOrgId: 'org_missing', requestedRole: 'gerente', reason: 'QA Test' }, context)
      ).rejects.toThrow("Organización no encontrada: 'org_missing'");
    });

    it('6. Rechaza si la organización no es un entorno QA (environment !== qa)', async () => {
      const context: any = { auth: { uid: 'caller_1', token: { platformAdmin: true } } };
      mockGetDoc.mockResolvedValueOnce({
        exists: true,
        data: () => ({ name: 'Org Producción', environment: 'production' }),
      });

      await expect(
        (provisionQaMembership as any).run({ targetUid: 'u1', targetOrgId: 'org_prod', requestedRole: 'gerente', reason: 'QA Test' }, context)
      ).rejects.toThrow("no es un entorno QA autorizado (environment !== 'qa')");
    });

    it('7. Responde alreadyProvisioned si la membresía QA activa ya existe con el mismo rol (Idempotencia)', async () => {
      const context: any = { auth: { uid: 'caller_1', token: { platformAdmin: true } } };
      mockGetDoc.mockResolvedValueOnce({
        exists: true,
        data: () => ({ name: 'Org QA', environment: 'qa' }),
      });
      mockGetDoc.mockResolvedValueOnce({
        exists: true,
        data: () => ({ status: 'active', role: 'gerente' }),
      });

      const res = await (provisionQaMembership as any).run(
        { targetUid: 'u1', targetOrgId: 'org_qa', requestedRole: 'gerente', reason: 'QA Test' },
        context
      );

      expect(res.status).toBe('alreadyProvisioned');
      expect(res.success).toBe(true);
      expect(mockBatchCommit).not.toHaveBeenCalled();
    });

    it('8. Aprovisiona exitosamente en tenant QA con rol gerente, emite claims y revoca refresh tokens', async () => {
      const context: any = { auth: { uid: 'caller_1', token: { platformAdmin: true } } };
      mockGetDoc.mockResolvedValueOnce({
        exists: true,
        data: () => ({ name: 'Org QA', environment: 'qa' }),
      });
      mockGetDoc.mockResolvedValueOnce({ exists: false });

      const res = await (provisionQaMembership as any).run(
        { targetUid: 'target_usr_1', targetOrgId: 'org_qa_1', requestedRole: 'gerente', reason: 'Provisión Founder QA' },
        context
      );

      expect(res.success).toBe(true);
      expect(res.status).toBe('provisioned');
      expect(res.targetUid).toBe('target_usr_1');
      expect(res.targetOrgId).toBe('org_qa_1');
      expect(res.role).toBe('gerente');

      expect(mockBatchSet).toHaveBeenCalledTimes(2);
      expect(mockBatchCommit).toHaveBeenCalledTimes(1);
      expect(mockSetCustomUserClaims).toHaveBeenCalledWith('target_usr_1', { orgId: 'org_qa_1', role: 'gerente' });
      expect(mockRevokeRefreshTokens).toHaveBeenCalledWith('target_usr_1');
    });
  });

  describe('revokeQaMembership', () => {
    it('1. Responde alreadyRevoked si la membresía QA no existe o ya está revocada', async () => {
      const context: any = { auth: { uid: 'caller_1', token: { platformAdmin: true } } };
      mockGetDoc.mockResolvedValueOnce({
        exists: true,
        data: () => ({ name: 'Org QA', environment: 'qa' }),
      });
      mockGetDoc.mockResolvedValueOnce({
        exists: true,
        data: () => ({ status: 'revoked', role: 'gerente' }),
      });

      const res = await (revokeQaMembership as any).run(
        { targetUid: 'u1', targetOrgId: 'org_qa', reason: 'Revocación Test' },
        context
      );

      expect(res.status).toBe('alreadyRevoked');
      expect(res.success).toBe(true);
      expect(mockBatchCommit).not.toHaveBeenCalled();
    });

    it('2. Revoca exitosamente la membresía QA, limpia claims de tenant y revoca refresh tokens', async () => {
      const context: any = { auth: { uid: 'caller_1', token: { platformAdmin: true } } };
      mockGetDoc.mockResolvedValueOnce({
        exists: true,
        data: () => ({ name: 'Org QA', environment: 'qa' }),
      });
      mockGetDoc.mockResolvedValueOnce({
        exists: true,
        data: () => ({ status: 'active', role: 'gerente' }),
      });

      mockGetUser.mockResolvedValueOnce({
        uid: 'target_123',
        customClaims: { orgId: 'org_qa_1', role: 'gerente' }
      });

      const res = await (revokeQaMembership as any).run(
        { targetUid: 'target_123', targetOrgId: 'org_qa_1', reason: 'Fin de revisión QA' },
        context
      );

      expect(res.success).toBe(true);
      expect(res.status).toBe('revoked');
      expect(mockBatchUpdate).toHaveBeenCalledTimes(1);
      expect(mockBatchSet).toHaveBeenCalledTimes(1);
      expect(mockBatchCommit).toHaveBeenCalledTimes(1);
      expect(mockSetCustomUserClaims).toHaveBeenCalledWith('target_123', {});
      expect(mockRevokeRefreshTokens).toHaveBeenCalledWith('target_123');
    });
  });
});
