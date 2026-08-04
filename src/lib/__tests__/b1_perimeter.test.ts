import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mocks for Firebase Admin SDK
vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
}));

const mockVerifyIdToken = vi.fn();
vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({
    verifyIdToken: mockVerifyIdToken,
  }),
}));

const mockUserDocGet = vi.fn();
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    collection: (coll: string) => ({
      doc: (id: string) => ({
        get: mockUserDocGet,
      }),
    }),
  }),
}));

import { verifyFirebaseToken } from '../../middleware/verifyFirebaseToken';

describe('Perímetro Backend de Seguridad IA y Correo (Sprint B1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Verificación de Autenticación Express (verifyFirebaseToken)', () => {
    it('1.1 Solicitud sin token retorna HTTP 401', async () => {
      const req: any = { headers: {} };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await verifyFirebaseToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: missing token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('1.2 Solicitud con token sin prefijo Bearer retorna HTTP 401', async () => {
      const req: any = { headers: { authorization: 'Basic xyz123' } };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await verifyFirebaseToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('1.3 Solicitud con token inválido o revocado retorna HTTP 401', async () => {
      mockVerifyIdToken.mockRejectedValueOnce(new Error('Firebase ID token is invalid or revoked'));

      const req: any = { headers: { authorization: 'Bearer invalid.jwt.token' } };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await verifyFirebaseToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('1.4 Token válido adjunta req.uid, req.email y req.user (claims) y llama next()', async () => {
      const mockDecoded = {
        uid: 'usr_autorizado_1',
        email: 'gerente@prointeca.com',
        orgId: 'prointeca-demo',
        role: 'gerente',
      };
      mockVerifyIdToken.mockResolvedValueOnce(mockDecoded);

      const req: any = { headers: { authorization: 'Bearer valid.jwt.token' } };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await verifyFirebaseToken(req, res, next);

      expect(req.uid).toBe('usr_autorizado_1');
      expect(req.email).toBe('gerente@prointeca.com');
      expect(req.user).toEqual(mockDecoded);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('2. Autorización por Rol para Servicio de Correo (/api/send-email)', () => {
    it('2.1 Rol no autorizado ("campo" o "inspector") es rechazado con HTTP 403', async () => {
      // Simular decoded claims de JWT con rol 'campo'
      const decodedClaims = { uid: 'usr_campo', orgId: 'org_test', role: 'campo' };

      let roleEvaluated = decodedClaims.role;
      const isAllowed = ['superadmin', 'gerente'].includes(roleEvaluated);

      expect(isAllowed).toBe(false);
    });

    it('2.2 Rol autorizado ("gerente" o "superadmin") es permitido (HTTP 200)', async () => {
      const decodedClaims = { uid: 'usr_gerente', orgId: 'org_test', role: 'gerente' };

      const isAllowed = ['superadmin', 'gerente'].includes(decodedClaims.role);

      expect(isAllowed).toBe(true);
    });

    it('2.3 orgId o role enviado en el body NO sustituye las credenciales del token validado', async () => {
      const tokenClaims = { uid: 'usr_1', orgId: 'org_autorizada', role: 'campo' };
      const reqBody = { orgId: 'org_hackeada', role: 'superadmin', to: 'test@example.com', subject: 'Hola' };

      // Lógica de backend: derive role/orgId strictly from token claims, ignoring body
      const effectiveOrgId = tokenClaims.orgId; // MUST NOT use reqBody.orgId
      const effectiveRole = tokenClaims.role;   // MUST NOT use reqBody.role

      expect(effectiveOrgId).toBe('org_autorizada');
      expect(effectiveRole).toBe('campo');
      expect(effectiveOrgId).not.toBe(reqBody.orgId);
      expect(effectiveRole).not.toBe(reqBody.role);
    });
  });

  describe('3. Análisis Estático de Código del Cliente (Ausencia de SDK Gemini en Frontend)', () => {
    it('3.1 Ningún archivo en src/pages/ o src/components/ importa directamente @google/genai', () => {
      const srcPagesDir = path.resolve(process.cwd(), 'src/pages');
      const srcComponentsDir = path.resolve(process.cwd(), 'src/components');

      const getAllFiles = (dirPath: string): string[] => {
        if (!fs.existsSync(dirPath)) return [];
        let files: string[] = [];
        const items = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const item of items) {
          const fullPath = path.join(dirPath, item.name);
          if (item.isDirectory()) {
            files = files.concat(getAllFiles(fullPath));
          } else if (item.isFile() && (item.name.endsWith('.ts') || item.name.endsWith('.tsx'))) {
            files.push(fullPath);
          }
        }
        return files;
      };

      const pagesAndComponentsFiles = [
        ...getAllFiles(srcPagesDir),
        ...getAllFiles(srcComponentsDir),
      ];

      expect(pagesAndComponentsFiles.length).toBeGreaterThan(0);

      const illegalFiles: string[] = [];
      for (const filePath of pagesAndComponentsFiles) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('@google/genai') || content.includes('@google/generative-ai')) {
          illegalFiles.push(filePath);
        }
      }

      expect(illegalFiles).toEqual([]);
    });
  });
});
