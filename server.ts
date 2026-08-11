import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

export function validatePortalLink(portalLinkCandidate: unknown, uid: string = 'unknown'): { validUrl: string | null; redactReason: string | null } {
  if (!portalLinkCandidate || typeof portalLinkCandidate !== 'string' || !portalLinkCandidate.trim()) {
    return { validUrl: null, redactReason: null };
  }

  const rawAllowlist = process.env.PORTAL_ALLOWED_HOSTS;
  if (!rawAllowlist || !rawAllowlist.trim()) {
    console.log(`[AUDIT EMAIL LINK OMITTED] uid=${uid} reason=missing_allowlist ts=${new Date().toISOString()}`);
    return { validUrl: null, redactReason: 'missing_allowlist' };
  }

  const allowedHosts = new Set(
    rawAllowlist
      .split(',')
      .map(h => h.trim().toLowerCase())
      .filter(Boolean)
  );

  if (allowedHosts.size === 0) {
    console.log(`[AUDIT EMAIL LINK OMITTED] uid=${uid} reason=missing_allowlist ts=${new Date().toISOString()}`);
    return { validUrl: null, redactReason: 'missing_allowlist' };
  }

  let parsed: URL;
  try {
    parsed = new URL(portalLinkCandidate);
  } catch {
    console.log(`[AUDIT EMAIL LINK OMITTED] uid=${uid} reason=invalid_url ts=${new Date().toISOString()}`);
    return { validUrl: null, redactReason: 'invalid_url' };
  }

  if (parsed.protocol !== 'https:') {
    console.log(`[AUDIT EMAIL LINK OMITTED] uid=${uid} reason=invalid_url ts=${new Date().toISOString()}`);
    return { validUrl: null, redactReason: 'invalid_url' };
  }

  if (parsed.username || parsed.password) {
    console.log(`[AUDIT EMAIL LINK OMITTED] uid=${uid} reason=invalid_url ts=${new Date().toISOString()}`);
    return { validUrl: null, redactReason: 'invalid_url' };
  }

  const normalizedHost = parsed.hostname.toLowerCase();
  if (!allowedHosts.has(normalizedHost)) {
    console.log(`[AUDIT EMAIL LINK OMITTED] uid=${uid} reason=disallowed_host ts=${new Date().toISOString()}`);
    return { validUrl: null, redactReason: 'disallowed_host' };
  }

  return { validUrl: parsed.toString(), redactReason: null };
}

export function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function createApp(): express.Express {
  const app = express();

  app.set('trust proxy', 1);

  app.use(express.json({ limit: '25mb' }));

  // CORS support
  app.use((req: Request, res: Response, next: NextFunction) => {
    const allowedOrigins = (
      process.env.CORS_ALLOWED_ORIGINS ?? 'https://industrial-360.vercel.app,http://localhost:5173,http://localhost:3000'
    ).split(',').map(o => o.trim());
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
      res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Healthcheck endpoint (Unica ruta API activa en server.ts - ADR-001)
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Local development endpoints mapping to Cloud Functions
  app.post('/api/callGeminiProxy', async (req: Request, res: Response) => {
    try {
      const { callGeminiProxy } = await import('./functions/src/index');
      await callGeminiProxy(req, res);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Error en proxy Gemini' });
    }
  });

  app.post('/api/reserveExportQuota', async (req: Request, res: Response) => {
    try {
      const { reserveExportQuotaProxy } = await import('./functions/src/index');
      await reserveExportQuotaProxy(req, res);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Error en proxy Export Quota' });
    }
  });

  app.get('/api/verify-document', async (req: Request, res: Response) => {
    try {
      const { verifyDocument } = await import('./functions/src/index');
      await verifyDocument(req, res);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Error al verificar documento' });
    }
  });

  app.post('/api/save-master-deliverable', async (req: Request, res: Response) => {
    try {
      const { saveMasterDeliverable } = await import('./functions/src/index');
      await saveMasterDeliverable(req, res);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Error al guardar entregable maestro' });
    }
  });


  /*
   * =================================================================================
   * ENDPOINTS MIGRADOS A FIREBASE CLOUD FUNCTIONS (ADR-001)
   * =================================================================================
   * La lógica de negocio para Gemini Proxy, envío de correos, portales cliente y
   * verificación de documentos ha sido consolidada exclusivamente en Cloud Functions
   * (functions/src/index.ts).
   *
   * En producción (Vercel CDN estático + Cloud Functions), las solicitudes son
   * atendidazas directamente por los endpoints serverless de Cloud Functions.
   * server.ts opera únicamente como servidor de desarrollo local (Vite middleware)
   * y contenedor de prueba estático.
   *
   * Rutas consolidadas en functions/src/index.ts:
   * - POST /api/callGeminiProxy (función callGeminiProxy)
   * - POST /api/gemini/proxy (función callGeminiProxy)
   * - POST /api/send-email (función sendEmail)
   * - GET/POST /api/get-client-portal (función getClientPortal)
   * - GET/POST /api/verify-document (función verifyDocument)
   * =================================================================================
   */

  return app;
}

export const createExpressApp = createApp;

async function startServer() {
  const app = createApp();
  const PORT = 3000;

  // Vite middleware in development mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  startServer();
}
