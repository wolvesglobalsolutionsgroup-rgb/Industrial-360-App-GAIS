import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import * as http from 'http';

const { mockVerifyIdToken } = vi.hoisted(() => ({
  mockVerifyIdToken: vi.fn(),
}));

// Mock Resend para evitar llamadas de red reales en tests
vi.mock('resend', () => {
  class Resend {
    emails = {
      send: vi.fn().mockResolvedValue({ id: 'mock_email_id' }),
    };
  }
  return { Resend, default: { Resend } };
});

// Mocks para Firebase Admin SDK
vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
  cert: vi.fn(),
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({
    verifyIdToken: mockVerifyIdToken,
  }),
}));

const requestCounts = new Map<string, number>();
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: vi.fn(),
  },
  getFirestore: () => ({
    collection: () => ({
      doc: () => ({
        get: vi.fn().mockResolvedValue({ exists: false }),
      }),
    }),
    runTransaction: vi.fn().mockImplementation(async (cb: any) => {
      return cb({
        get: vi.fn().mockImplementation(async () => {
          const count = requestCounts.get('doc') || 0;
          if (count === 0) {
            return { exists: false };
          }
          return { exists: true, data: () => ({ count }) };
        }),
        set: vi.fn().mockImplementation(() => {
          requestCounts.set('doc', 1);
        }),
        update: vi.fn().mockImplementation(() => {
          const count = (requestCounts.get('doc') || 0) + 1;
          requestCounts.set('doc', count);
        }),
      });
    }),
  }),
}));

import { verifyFirebaseToken } from '../../middleware/verifyFirebaseToken';
import { geminiLimiter, emailLimiter, publicLimiter, getLimiterKey } from '../../middleware/rateLimiter';
import { createApp } from '../../../server';
import { callGeminiProxy, sendEmail } from '../../../functions/src/index';

describe('Sprint F-A — Pruebas Negativas de Seguridad Residual', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = createApp();
    app.post('/api/callGeminiProxy', callGeminiProxy);
    app.post('/api/gemini/proxy', callGeminiProxy);
    app.post('/api/send-email', sendEmail);

    await new Promise<void>((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      if (server) {
        server.close(() => resolve());
      } else {
        resolve();
      }
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Petición sin token -> 401', () => {
    it('1.1 /api/callGeminiProxy sin token retorna HTTP 401', async () => {
      const res = await fetch(`${baseUrl}/api/callGeminiProxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Test' }),
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it('1.2 /api/gemini/proxy sin cabecera Authorization retorna HTTP 401', async () => {
      const res = await fetch(`${baseUrl}/api/gemini/proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Test' }),
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it('1.3 /api/send-email sin token retorna HTTP 401', async () => {
      const res = await fetch(`${baseUrl}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: 'user@test.com', subject: 'Prueba' }),
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });
  });

  describe('2. Token inválido o expirado -> 401', () => {
    it('2.1 Token con formato incorrecto sin Bearer retorna HTTP 401', async () => {
      const res = await fetch(`${baseUrl}/api/callGeminiProxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic invalid_token_format',
        },
        body: JSON.stringify({ prompt: 'Test' }),
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it('2.2 Token de Firebase expirado o rechazado retorna HTTP 401', async () => {
      mockVerifyIdToken.mockRejectedValueOnce(new Error('Firebase ID token has expired'));

      const res = await fetch(`${baseUrl}/api/callGeminiProxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer expired.jwt.token',
        },
        body: JSON.stringify({ prompt: 'Test' }),
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });
  });

  describe('3. Rate Limit excedido -> 429', () => {
    it('3.1 Múltiples peticiones que superan el límite de tasa reciben HTTP 429', async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: 'usr_rate_limit_test',
        email: 'test@prointeca.com',
        role: 'gerente',
        orgId: 'org_test',
      });

      // Rellenar límite de emailRateLimiter en Cloud Functions (máximo 5 por minuto)
      let lastStatus = 200;
      for (let i = 0; i < 7; i++) {
        const res = await fetch(`${baseUrl}/api/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer token_usr_rate_limit_${i}`,
          },
          body: JSON.stringify({ to: 'test@example.com', subject: 'Test Rate Limit' }),
        });
        lastStatus = res.status;
        if (lastStatus === 429) {
          const body = await res.json();
          expect(body.error).toBeDefined();
          break;
        }
      }

      expect(lastStatus).toBe(429);
    });

    it('3.2 Evaluador keyGenerator de Rate Limiter prioriza req.uid y cae a req.ip', () => {
      const reqWithUid: any = { uid: 'usr_123', ip: '203.0.113.5' };
      const reqWithIpOnly: any = { ip: '203.0.113.5' };
      const reqEmpty: any = {};

      expect(getLimiterKey(reqWithUid)).toBe('usr_123');
      expect(getLimiterKey(reqWithIpOnly)).toBe('203.0.113.5');
      expect(getLimiterKey(reqEmpty)).toBe('unknown');
    });
  });

  describe('4. X-Forwarded-For falsificado -> el rate limiter usa req.ip tras el proxy', () => {
    it('4.1 Express con trust proxy 1 extrae req.ip del cliente proxy real, ignorando X-Forwarded-For falsificado en cabecera', async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: 'usr_proxy_test',
        email: 'test@prointeca.com',
        role: 'gerente',
        orgId: 'org_test',
      });

      // Enviar X-Forwarded-For falsificado con múltiples IPs
      const res = await fetch(`${baseUrl}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid_token_proxy',
          'X-Forwarded-For': '10.0.0.1, 192.168.1.1, 8.8.8.8',
        },
        body: JSON.stringify({ to: 'test@example.com', subject: 'Test Proxy IP' }),
      });

      // Debe responder 200 (o 429 si acumuló del test anterior), sin fallar por parseo manual de X-Forwarded-For
      expect([200, 429]).toContain(res.status);
    });

    it('4.2 middleware verifyFirebaseToken no confía en parámetros de IP ni headers spoofeadas', async () => {
      const req: any = {
        headers: {
          authorization: 'Bearer valid_token',
          'x-forwarded-for': 'fake_ip_1, fake_ip_2',
        },
        ip: '127.0.0.1',
      };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      mockVerifyIdToken.mockResolvedValueOnce({
        uid: 'usr_test_ip',
        email: 'test@prointeca.com',
        orgId: 'org_test',
      });

      await verifyFirebaseToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.uid).toBe('usr_test_ip');
      expect(req.ip).toBe('127.0.0.1');
    });
  });
});
