import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getFirestore } from 'firebase-admin/firestore';
import { handleGeminiProxy } from './src/lib/geminiServer';
import { verifyFirebaseToken } from './src/middleware/verifyFirebaseToken';
import { geminiLimiter, emailLimiter, publicLimiter } from './src/middleware/rateLimiter';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // CORS support
  app.use((req, res, next) => {
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
      return res.sendStatus(204);
    }
    next();
  });

  // Healthcheck endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Gemini Proxy API endpoints
  const proxyHandler = async (req: express.Request, res: express.Response) => {
    const uid = req.uid || 'anonymous';
    const decodedToken = req.user;
    const userRole = decodedToken?.role || 'authenticated';
    const validatedOrgId = decodedToken?.orgId || 'unassigned';

    try {
      const result = await handleGeminiProxy(req.body || {});

      console.log(`[AUDIT AI] uid=${uid} role=${userRole} orgId=${validatedOrgId} endpoint=/api/callGeminiProxy status=200 ts=${new Date().toISOString()}`);

      res.json(result);
    } catch (error: any) {
      const is429 = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Quota exceeded');

      console.error(`[AUDIT AI ERROR] uid=${uid} role=${userRole} orgId=${validatedOrgId} status=${is429 ? 429 : 500} ts=${new Date().toISOString()} msg=${error?.message?.substring(0, 100)}`);

      if (is429) {
        res.status(429).json({ error: 'Excedido el límite de cuota o tasa de peticiones para la API de IA.' });
      } else {
        res.status(500).json({ error: 'Error interno al procesar la solicitud de inteligencia artificial.' });
      }
    }
  };

  app.post('/api/gemini/proxy', verifyFirebaseToken, geminiLimiter, proxyHandler);
  app.post('/api/callGeminiProxy', verifyFirebaseToken, geminiLimiter, proxyHandler);

  // Resend Email API Endpoint
  app.post('/api/send-email', verifyFirebaseToken, emailLimiter, async (req, res) => {
    const uid = req.uid;
    const decodedToken = req.user;

    // Derive role and orgId strictly from validated JWT claims or Firestore user doc (NEVER from req.body)
    let role = decodedToken?.role ?? '';
    let validatedOrgId = decodedToken?.orgId ?? 'unassigned';

    if (!role) {
      const userDoc = await getFirestore().collection('users').doc(uid).get();
      if (userDoc.exists) {
        const uData = userDoc.data();
        role = uData?.role ?? '';
        validatedOrgId = uData?.orgId ?? validatedOrgId;
      }
    }

    if (!['superadmin', 'gerente'].includes(role)) {
      console.warn(`[AUDIT EMAIL DENIED] uid=${uid} role=${role} orgId=${validatedOrgId} status=403 ts=${new Date().toISOString()}`);
      return res.status(403).json({ error: 'Acceso denegado: Se requiere rol superadmin o gerente para enviar correos.' });
    }

    try {
      const { to, subject, event, portalLink } = req.body || {};
      const resendApiKey = process.env.RESEND_API_KEY;

      if (!to || !subject) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos: to, subject' });
      }

      const safeTo = Array.isArray(to) ? to.map(t => String(t).trim()) : [String(to).trim()];
      const safeSubject = String(subject).substring(0, 200);

      const safeHtml = `<p>Notificación de ${event ? String(event).replace(/[<>]/g, '') : 'proyecto'}.</p>
        ${portalLink ? `<p><a href="${encodeURI(String(portalLink))}">Ver Portal</a></p>` : ''}`;

      if (resendApiKey) {
        const { Resend } = await import('resend');
        const resend = new Resend(resendApiKey);
        const emailResult = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Industrial Control 360 <notificaciones@industrialcontrol360.com>',
          to: safeTo,
          subject: safeSubject,
          html: safeHtml
        });
        console.log(`[AUDIT EMAIL] uid=${uid} role=${role} orgId=${validatedOrgId} status=200 recipients=${safeTo.length} ts=${new Date().toISOString()}`);
        return res.json({ success: true, data: emailResult });
      } else {
        console.log(`[AUDIT EMAIL SIMULATED] uid=${uid} role=${role} orgId=${validatedOrgId} status=200 event=${event || 'notificacion'} ts=${new Date().toISOString()}`);
        return res.json({
          success: true,
          simulated: true,
          message: 'Notificación registrada exitosamente en servidor.',
          details: { to: safeTo, subject: safeSubject, event }
        });
      }
    } catch (err: any) {
      console.error(`[AUDIT EMAIL ERROR] uid=${uid} role=${role} orgId=${validatedOrgId} status=500 ts=${new Date().toISOString()} msg=${err?.message?.substring(0, 100)}`);
      return res.status(500).json({ error: 'Error interno al procesar el envío de correo.' });
    }
  });

  // Client Portal & Document Verification Endpoints
  app.all('/api/get-client-portal', publicLimiter, async (req, res) => {
    const { getClientPortal } = await import('./functions/src/index');
    await getClientPortal(req, res);
  });

  app.all('/api/verify-document', publicLimiter, async (req, res) => {
    const { verifyDocument } = await import('./functions/src/index');
    await verifyDocument(req, res);
  });

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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
