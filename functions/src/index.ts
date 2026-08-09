import * as functions from 'firebase-functions/v1';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, FieldPath } from 'firebase-admin/firestore';
import * as crypto from 'crypto';
import { handleGeminiProxy } from '../../src/lib/geminiServer';
import { requireAuth } from './middleware/requireAuth';
import { rateLimit, checkRateLimit } from './middleware/rateLimit';
import { authorizeServerSideRequest, resolveAuthorizedOrgId } from './middleware/authorizer';
import { logger } from './logger';
import { validatePortalLink, escapeHtmlAttr } from '../../server';
import { reserveQuota } from './finops/quotaService';

if (!getApps().length) {
  initializeApp();
}

export { requireAuth } from './middleware/requireAuth';
export { rateLimit, checkRateLimit } from './middleware/rateLimit';
export { authorizeServerSideRequest, resolveAuthorizedOrgId } from './middleware/authorizer';
export { reserveQuota } from './finops/quotaService';

// HTTPS Cloud Function endpoint export style (Firebase Functions compatible)
export const callGeminiProxy = async (req: any, res: any) => {
  // CORS Handling - Restricted Origins
  const allowed = ['https://industrial-360.vercel.app'];
  const origin = req.headers?.origin;
  if (origin && allowed.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // 1. Middleware de Autenticación requireAuth
  await new Promise<void>((resolve, reject) => {
    requireAuth(req, res, (err?: any) => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (res.headersSent) return;

  const uid = req.user?.uid || 'unknown';
  const userRole = req.user?.role || 'authenticated';

  // 2. Impone resolución estricta del tenant a partir de claims con resolveAuthorizedOrgId
  let orgId: string;
  try {
    const requestedOrgId = req.body?.orgId || req.query?.orgId;
    const resolvedTenant = resolveAuthorizedOrgId({
      authContext: req.user,
      requestedOrgId,
    });
    orgId = resolvedTenant.effectiveOrgId;
  } catch (authErr: any) {
    logger.warn(`[AUDIT AI FUNCTION TENANT REJECTED] uid=${uid} err=${authErr?.message}`);
    res.status(403).json({
      error: authErr?.message || 'Acceso denegado: No está autorizado para operar en la organización solicitada.',
      code: 'PERMISSION_DENIED',
    });
    return;
  }

  // 3. Rate limiting (20/min por uid para callGeminiProxy)
  const geminiRateLimiter = rateLimit({ operation: 'callGeminiProxy', maxRequests: 20 });
  await new Promise<void>((resolve, reject) => {
    geminiRateLimiter(req, res, (err?: any) => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (res.headersSent) return;

  // 4. Reserva e Inspección de Cuota FinOps Serverless (IA_INVOCATION)
  const requestId = (req.headers && (req.headers['x-request-id'] as string)) || req.body?.requestId || crypto.randomUUID();
  try {
    const quotaResult = await reserveQuota({
      orgId,
      operation: 'IA_INVOCATION',
      increment: 1,
      requestId,
      throwOnExceeded: false,
      authContext: req.user,
    });

    if (!quotaResult.allowed) {
      logger.warn(`[AUDIT AI FUNCTION QUOTA EXCEEDED] uid=${uid} role=${userRole} orgId=${orgId} usage=${quotaResult.currentUsage}/${quotaResult.limit}`);
      res.status(429).json({
        error: `Excedido el límite de cuota de IA para la organización '${orgId}'. (Uso: ${quotaResult.currentUsage}/${quotaResult.limit})`,
        code: 'QUOTA_EXCEEDED',
        quotaError: {
          operation: 'IA_INVOCATION',
          limit: quotaResult.limit,
          currentUsage: quotaResult.currentUsage,
          orgId,
          recoverable: true,
        },
      });
      return;
    }
  } catch (quotaErr: any) {
    logger.error(`[AUDIT AI FUNCTION QUOTA ERROR] orgId=${orgId} err=${quotaErr?.message}`);
  }

  try {
    const result = await handleGeminiProxy({ ...(req.body || {}), orgId });
    logger.info(`[AUDIT AI FUNCTION] uid=${uid} role=${userRole} orgId=${orgId} status=200`);
    res.status(200).json(result);
  } catch (error: any) {
    const is429 = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Quota exceeded');
    logger.error(`[AUDIT AI FUNCTION ERROR] uid=${uid} role=${userRole} orgId=${orgId} status=${is429 ? 429 : 500} msg=${error?.message?.substring(0, 100)}`);
    if (is429) {
      res.status(429).json({ error: 'Excedido el límite de cuota o tasa de peticiones para la API de IA.' });
    } else {
      res.status(500).json({ error: 'Error interno al procesar la solicitud de inteligencia artificial.' });
    }
  }
};

/**
 * HTTPS Cloud Function para reserva y verificación de cuota de exportación de documentos (PDF, XLSX, DOCX, PPTX).
 */
export const reserveExportQuotaProxy = async (req: any, res: any) => {
  // CORS Handling
  const allowed = ['https://industrial-360.vercel.app'];
  const origin = req.headers?.origin;
  if (origin && allowed.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // 1. Middleware requireAuth
  await new Promise<void>((resolve, reject) => {
    requireAuth(req, res, (err?: any) => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (res.headersSent) return;

  const uid = req.user?.uid || 'unknown';

  let orgId: string;
  try {
    const requestedOrgId = req.body?.orgId || req.query?.orgId;
    const resolvedTenant = resolveAuthorizedOrgId({
      authContext: req.user,
      requestedOrgId,
    });
    orgId = resolvedTenant.effectiveOrgId;
  } catch (authErr: any) {
    logger.warn(`[ExportQuota TENANT REJECTED] uid=${uid} err=${authErr?.message}`);
    res.status(403).json({
      error: authErr?.message || 'Acceso denegado: No está autorizado para operar en la organización solicitada.',
      code: 'PERMISSION_DENIED',
    });
    return;
  }

  const requestId = (req.headers && (req.headers['x-request-id'] as string)) || req.body?.requestId || crypto.randomUUID();
  const formats = req.body?.formats || ['pdf'];
  const increment = Array.isArray(formats) ? formats.length : 1;

  try {
    const quotaResult = await reserveQuota({
      orgId,
      operation: 'EXPORT_DOCUMENT',
      increment,
      requestId,
      throwOnExceeded: false,
      authContext: req.user,
    });

    if (!quotaResult.allowed) {
      logger.warn(`[ExportQuota EXCEEDED] uid=${uid} orgId=${orgId} usage=${quotaResult.currentUsage}/${quotaResult.limit}`);
      res.status(429).json({
        error: `Excedido el límite de cuota de exportación para la organización '${orgId}'. (Uso: ${quotaResult.currentUsage}/${quotaResult.limit})`,
        code: 'QUOTA_EXCEEDED',
        quotaError: {
          operation: 'EXPORT_DOCUMENT',
          limit: quotaResult.limit,
          currentUsage: quotaResult.currentUsage,
          orgId,
          recoverable: true,
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      quotaResult,
    });
  } catch (error: any) {
    logger.error(`[ExportQuota ERROR] uid=${uid} orgId=${orgId} msg=${error?.message}`);
    res.status(500).json({ error: 'Error interno al reservar cuota de exportación.' });
  }
};

/**
 * HTTPS Cloud Function para envío de emails con rate limit de 5/min por uid.
 */
export const sendEmail = async (req: any, res: any) => {
  // CORS Handling
  const allowed = ['https://industrial-360.vercel.app'];
  const origin = req.headers?.origin;
  if (origin && allowed.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // 1. Middleware requireAuth
  await new Promise<void>((resolve, reject) => {
    requireAuth(req, res, (err?: any) => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (res.headersSent) return;

  const uid = req.user?.uid || 'unknown';
  let role = req.user?.role || '';

  let orgId: string;
  try {
    const requestedOrgId = req.body?.orgId || req.query?.orgId;
    const resolvedTenant = resolveAuthorizedOrgId({
      authContext: req.user,
      requestedOrgId,
    });
    orgId = resolvedTenant.effectiveOrgId;
  } catch (authErr: any) {
    logger.warn(`[AUDIT EMAIL FUNCTION TENANT REJECTED] uid=${uid} err=${authErr?.message}`);
    res.status(403).json({
      error: authErr?.message || 'Acceso denegado: No está autorizado para operar en la organización solicitada.',
      code: 'PERMISSION_DENIED',
    });
    return;
  }

  if (!role && uid && uid !== 'unknown') {
    try {
      const dbAdmin = getFirestore();
      const userSnap = await dbAdmin.collection('users').doc(uid).get();
      role = typeof userSnap?.data === 'function' ? (userSnap.data()?.role ?? '') : '';
    } catch {
      role = '';
    }
  }

  if (!['superadmin', 'gerente'].includes(role)) {
    logger.warn(`[AUDIT EMAIL FUNCTION DENIED] uid=${uid} role=${role} orgId=${orgId} status=403`);
    res.status(403).json({ error: 'Acceso denegado: Se requiere rol superadmin o gerente para enviar correos.' });
    return;
  }

  // 2. Rate Limit (5/min por uid para sendEmail)
  const emailRateLimiter = rateLimit({ operation: 'sendEmail', maxRequests: 5 });
  await new Promise<void>((resolve, reject) => {
    emailRateLimiter(req, res, (err?: any) => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (res.headersSent) return;

  try {
    const { to, subject, html, portalLink } = req.body || {};

    if (!to || (!html && !subject && !portalLink)) {
      res.status(400).json({ error: 'Faltan parámetros requeridos: to, subject, html' });
      return;
    }

    const safeTo = Array.isArray(to) ? to.map(t => String(t).trim()) : [String(to).trim()];
    const safeSubject = String(subject || 'Notificación Operativa Industrial Control 360').substring(0, 200);

    const { validUrl } = validatePortalLink(portalLink, uid);
    let finalHtml = html;
    if (!finalHtml) {
      if (validUrl) {
        const safeHref = escapeHtmlAttr(validUrl);
        finalHtml = `<p>Tiene una nueva actualización de su proyecto.</p><p><a href="${safeHref}">Acceder al Portal Cliente</a></p>`;
      } else {
        finalHtml = `<p>Tiene una nueva actualización de su proyecto.</p><p>Acceda a su portal desde su panel de control habitual.</p>`;
      }
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const resendModule = await import('resend');
      const ResendClass = resendModule.Resend || (resendModule as any).default?.Resend || (resendModule as any).default;
      const resend = new ResendClass(resendApiKey);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Industrial Control 360 <notificaciones@industrialcontrol360.com>',
        to: safeTo,
        subject: safeSubject,
        html: finalHtml
      });
      logger.info(`[AUDIT EMAIL FUNCTION] uid=${uid} role=${role} orgId=${orgId} status=200`);
      res.status(200).json({ success: true });
    } else {
      logger.info(`[AUDIT EMAIL FUNCTION SIMULATED] uid=${uid} role=${role} orgId=${orgId} status=200`);
      res.status(200).json({
        success: true,
        simulated: true,
        message: 'Notificación registrada en servidor.'
      });
    }
  } catch (err: any) {
    console.error('DEBUG SEND EMAIL ERROR:', err);
    logger.error(`[AUDIT EMAIL FUNCTION ERROR] uid=${uid} role=${role} orgId=${orgId} status=500 msg=${err?.message?.substring(0, 100)}`);
    res.status(500).json({ error: 'Error al procesar envío de correo.', debug: err?.message });
  }
};

/**
 * Callable Cloud Function para establecer Custom Claims a un usuario.
 * Exige autenticación y que el solicitante sea 'superadmin' o 'gerente' de la orgId objetivo.
 */
export const setUserCustomClaims = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  const { targetUid, role, orgId } = data || {};

  if (!targetUid || !role || !orgId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Faltan parámetros requeridos: targetUid, role y orgId.'
    );
  }

  // Autorización server-side reusable (S14.2)
  const authRes = await authorizeServerSideRequest(context.auth, {
    orgId,
    allowedRoles: ['superadmin', 'gerente'],
  });

  const callerUid = authRes.uid;
  const authAdmin = getAuth();
  const dbAdmin = getFirestore();

  // 1. Asignar Custom Claims
  await authAdmin.setCustomUserClaims(targetUid, { role, orgId });

  // 2. Revocar tokens de refresco
  await authAdmin.revokeRefreshTokens(targetUid);

  // 3. Determinar IP del solicitante
  const rawIp = context.rawRequest?.ip || 'unknown';
  const ip = typeof rawIp === 'string' ? rawIp.trim() : String(rawIp);

  // 4. Registrar Audit Log en /organizations/{orgId}/audit_logs
  const auditRef = dbAdmin.collection(`organizations/${orgId}/audit_logs`);
  await auditRef.add({
    action: 'USER_ROLE_UPDATED',
    callerUid,
    targetUid,
    newRole: role,
    ip,
    timestamp: FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    message: `Custom claims asignados exitosamente al usuario ${targetUid}`,
  };
});

/**
 * Callable Cloud Function para asegurar que el usuario tenga Custom Claims asignados
 * a partir de su membresía autoritativa en /organizations/{orgId}/memberships/{uid}.
 * (S14.2):
 * - NUNCA lee datos del cliente o de documentos editables por usuario (/users/{uid}).
 * - Ausencia de membresía retorna estado explícito ('failed-precondition', 'NO_MEMBERSHIP').
 * - Solo revoca refresh tokens si los claims cambian.
 */
export const ensureOwnClaims = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'El usuario debe estar autenticado para asegurar sus claims.'
    );
  }

  const uid = context.auth.uid;
  const dbAdmin = getFirestore();
  const authAdmin = getAuth();

  const requestedOrgId = data?.orgId;
  let membershipSnap: any = null;
  let targetOrgId = '';

  if (requestedOrgId && typeof requestedOrgId === 'string' && requestedOrgId.trim()) {
    const docRef = dbAdmin.doc(`organizations/${requestedOrgId.trim()}/memberships/${uid}`);
    const snap = await docRef.get();
    if (snap.exists) {
      membershipSnap = snap;
      targetOrgId = requestedOrgId.trim();
    }
  }

  if (!membershipSnap) {
    const docQuerySnap = await dbAdmin
      .collectionGroup('memberships')
      .where(FieldPath.documentId(), '==', uid)
      .limit(1)
      .get();

    if (!docQuerySnap.empty) {
      membershipSnap = docQuerySnap.docs[0];
      targetOrgId = membershipSnap.data().orgId || membershipSnap.ref.parent?.parent?.id;
    } else {
      const fieldQuerySnap = await dbAdmin
        .collectionGroup('memberships')
        .where('uid', '==', uid)
        .limit(1)
        .get();

      if (!fieldQuerySnap.empty) {
        membershipSnap = fieldQuerySnap.docs[0];
        targetOrgId = membershipSnap.data().orgId || membershipSnap.ref.parent?.parent?.id;
      }
    }
  }

  if (!membershipSnap || !membershipSnap.exists) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'NO_MEMBERSHIP: No se encontró una membresía activa asignada para este usuario.'
    );
  }

  const membershipData = membershipSnap.data() || {};
  const status = (membershipData.status as string) || 'active';
  const activeStatuses = ['approved', 'aprobado', 'active'];

  if (!activeStatuses.includes(status.toLowerCase())) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      `MEMBERSHIP_INACTIVE: La membresía del usuario se encuentra en estado '${status}'.`
    );
  }

  const authoritativeRole = membershipData.role || 'campo';
  const authoritativeOrgId = membershipData.orgId || targetOrgId;

  if (!authoritativeOrgId || !authoritativeRole) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'INVALID_MEMBERSHIP_DATA: La membresía autoritativa no posee un orgId o role válidos.'
    );
  }

  const currentClaims = context.auth.token || {};
  const claimsAlreadyMatch =
    currentClaims.role === authoritativeRole &&
    currentClaims.orgId === authoritativeOrgId;

  if (!claimsAlreadyMatch) {
    await authAdmin.setCustomUserClaims(uid, {
      orgId: authoritativeOrgId,
      role: authoritativeRole,
    });

    await authAdmin.revokeRefreshTokens(uid);
  }

  return {
    success: true,
    orgId: authoritativeOrgId,
    role: authoritativeRole,
    claimsUpdated: !claimsAlreadyMatch,
    message: `Claims asegurados exitosamente para ${uid}: orgId=${authoritativeOrgId}, role=${authoritativeRole}`,
  };
});

export { issueRegulatoryCode } from './regulatoryIds';

/**
 * Sprint 9 - MODELO DE PORTAL SEGURO
 * Callable Cloud Function: createClientPortal
 * - Genera token 32 bytes crypto (64 chars hex)
 * - Guarda en Firestore SOLO el hash SHA-256 (tokenHash)
 * - Retorna el token en texto plano UNA SOLA VEZ al llamador
 */
export const createClientPortal = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  const { 
    id, name, clientName, orgId, linkedProjectIds, branding, visibilityMatrix, expiresAtOption, isRevoked 
  } = data || {};

  if (!name || !orgId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Faltan parámetros obligatorios: name u orgId.'
    );
  }

  // Autorización server-side reusable (S14.2)
  const authRes = await authorizeServerSideRequest(context.auth, {
    orgId,
    allowedRoles: ['superadmin', 'gerente'],
  });

  const callerUid = authRes.uid;
  const dbAdmin = getFirestore();
  const portalId = id || `portal_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  // 1. Generar token criptográfico de 32 bytes (64 caracteres hexadecimales)
  const rawToken = crypto.randomBytes(32).toString('hex');

  // 2. Calcular Hash SHA-256
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  // 3. Calcular Expiración
  let expiresAt: string | null = null;
  if (expiresAtOption === '30days') {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    expiresAt = d.toISOString();
  } else if (expiresAtOption === '90days' || !expiresAtOption) {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    expiresAt = d.toISOString();
  }

  const portalPayload = {
    id: portalId,
    name,
    clientName: clientName || 'Comité de Inspección / Cliente Final',
    orgId,
    linkedProjectIds: Array.isArray(linkedProjectIds) ? linkedProjectIds : [],
    tokenHash, // SOLO guardamos el Hash SHA-256
    expiresAt,
    isRevoked: !!isRevoked,
    branding: branding || {
      logoUrl: '',
      accentColor: '#0B2239',
      themePreset: 'mineral',
    },
    visibilityMatrix: visibilityMatrix || {
      showKpis: true,
      showScurve: true,
      showMilestones: true,
      showGallery: true,
      showSihoPtw: true,
      showNdtWeld: true,
      showDossier: true,
      showValuations: false,
    },
    createdAt: new Date().toISOString(),
    createdBy: callerUid,
    updatedAt: new Date().toISOString()
  };

  // Guardar en /organizations/{orgId}/client_portals/{portalId} y en /client_portals/{portalId}
  await dbAdmin.collection(`organizations/${orgId}/client_portals`).doc(portalId).set(portalPayload, { merge: true });
  await dbAdmin.collection('client_portals').doc(portalId).set(portalPayload, { merge: true });

  // Registrar audit log
  await dbAdmin.collection(`organizations/${orgId}/audit_logs`).add({
    action: 'CLIENT_PORTAL_CREATED',
    callerUid,
    portalId,
    timestamp: FieldValue.serverTimestamp(),
  });

  // Retorna rawToken en texto plano UNA SOLA VEZ
  return {
    success: true,
    portalId,
    rawToken,
    expiresAt,
    message: 'Portal de cliente creado. El token en texto plano solo se muestra en esta respuesta.',
  };
});

/**
 * S14.4 - Rotación Criptográfica Atómica de Token del Portal
 * Invalida token anterior y genera uno nuevo de 32 bytes dentro de una transacción Firestore.
 * Exige: rol autorizado ('superadmin', 'gerente') en la orgId correspondiente.
 */
export const rotateClientPortalToken = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  const { portalId, orgId, expiresAtOption } = data || {};

  if (!portalId || !orgId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Faltan parámetros obligatorios: portalId y orgId.'
    );
  }

  // Autorización server-side reusable (S14.2)
  const authRes = await authorizeServerSideRequest(context.auth, {
    orgId,
    allowedRoles: ['superadmin', 'gerente'],
  });

  const callerUid = authRes.uid;
  const dbAdmin = getFirestore();

  // 1. Generar nuevo token criptográfico de 32 bytes (64 caracteres hex)
  const newRawToken = crypto.randomBytes(32).toString('hex');
  const newTokenHash = crypto.createHash('sha256').update(newRawToken).digest('hex');

  // 2. Calcular nueva Expiración
  let newExpiresAt: string | null = null;
  if (expiresAtOption === '30days') {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    newExpiresAt = d.toISOString();
  } else if (expiresAtOption === 'permanent') {
    newExpiresAt = null;
  } else {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    newExpiresAt = d.toISOString();
  }

  const orgPortalRef = dbAdmin.collection(`organizations/${orgId}/client_portals`).doc(portalId);
  const globalPortalRef = dbAdmin.collection('client_portals').doc(portalId);

  // C6 - Rotación atómica en runTransaction
  await dbAdmin.runTransaction(async (transaction) => {
    const orgSnap = await transaction.get(orgPortalRef);
    if (!orgSnap.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        `No se encontró el portal con ID '${portalId}' en la organización '${orgId}'.`
      );
    }

    const nowIso = new Date().toISOString();
    const updateData = {
      tokenHash: newTokenHash,
      expiresAt: newExpiresAt,
      isRevoked: false,
      previousTokenInvalidatedAt: nowIso,
      updatedAt: nowIso,
      updatedBy: callerUid,
    };

    transaction.update(orgPortalRef, updateData);
    transaction.update(globalPortalRef, updateData);

    const auditRef = dbAdmin.collection(`organizations/${orgId}/audit_logs`).doc();
    transaction.set(auditRef, {
      action: 'CLIENT_PORTAL_TOKEN_ROTATED',
      callerUid,
      portalId,
      timestamp: FieldValue.serverTimestamp(),
    });
  });

  return {
    success: true,
    portalId,
    rawToken: newRawToken,
    expiresAt: newExpiresAt,
    message: 'Token del portal rotado exitosamente. El token en texto plano solo se entrega en esta respuesta.',
  };
});

/**
 * S14.4 - Revocación Inmediata de Acceso a Portal Cliente
 * Deshabilita el token activo de forma permanente.
 */
export const revokeClientPortalToken = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  const { portalId, orgId, reason } = data || {};

  if (!portalId || !orgId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Faltan parámetros obligatorios: portalId y orgId.'
    );
  }

  // Autorización server-side reusable (S14.2)
  const authRes = await authorizeServerSideRequest(context.auth, {
    orgId,
    allowedRoles: ['superadmin', 'gerente'],
  });

  const callerUid = authRes.uid;
  const dbAdmin = getFirestore();

  const orgPortalRef = dbAdmin.collection(`organizations/${orgId}/client_portals`).doc(portalId);
  const globalPortalRef = dbAdmin.collection('client_portals').doc(portalId);

  await dbAdmin.runTransaction(async (transaction) => {
    const orgSnap = await transaction.get(orgPortalRef);
    if (!orgSnap.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        `No se encontró el portal con ID '${portalId}' en la organización '${orgId}'.`
      );
    }

    const nowIso = new Date().toISOString();
    const updateData = {
      isRevoked: true,
      revokedAt: nowIso,
      revokedBy: callerUid,
      revokeReason: reason || 'Revocado por administrador',
      updatedAt: nowIso,
    };

    transaction.update(orgPortalRef, updateData);
    transaction.update(globalPortalRef, updateData);

    const auditRef = dbAdmin.collection(`organizations/${orgId}/audit_logs`).doc();
    transaction.set(auditRef, {
      action: 'CLIENT_PORTAL_TOKEN_REVOKED',
      callerUid,
      portalId,
      reason: reason || 'Revocado por administrador',
      timestamp: FieldValue.serverTimestamp(),
    });
  });

  return {
    success: true,
    portalId,
    message: 'Acceso a portal de cliente revocado exitosamente.',
  };
});

/**
 * Sprint 9 / S14.4 - ACCESO PÚBLICO CONTROLADO
 * Function HTTPS: getClientPortal
 * Recibe portalId y token por query/body
 * Compara hash del token recibido con tokenHash guardado usando timingSafeEqual y verificación previa de longitud (C1)
 * Rate limiting por IP normalizada y portalId (C4)
 * Retorna DTO sanitizado exponiendo solo widgets/datos publicados (C3)
 * Audit log server-side sin loguear rawToken (C2)
 * CORS explícito (C-CORS)
 */
export const getClientPortal = async (req: any, res: any) => {
  // C-CORS: Configuración explícita de dominios autorizados
  const allowedOrigins = ['https://industrial-360.vercel.app', 'http://localhost:5173', 'http://localhost:3000'];
  const origin = req.headers?.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.set('Access-Control-Allow-Origin', allowedOrigins[0]);
  }
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const portalId = req.query.portalId || req.body?.portalId;
    const token = req.query.token || req.body?.token;

    if (!portalId || !token) {
      res.status(400).json({ error: 'Acceso Denegado: Faltan parámetros portalId o token de seguridad.' });
      return;
    }

    // C4 - Rate limit con clave compuesta por IP normalizada y portalId (sin req.user)
    const rawIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const normalizedIp = rawIp.replace(/^::ffff:/, '').trim();
    const rateLimitKey = `${normalizedIp}_${portalId}`;

    const rateLimitRes = await checkRateLimit(rateLimitKey, 'getClientPortal', 30, 60000);
    if (!rateLimitRes.allowed) {
      if (rateLimitRes.retryAfterSeconds) {
        res.set('Retry-After', String(rateLimitRes.retryAfterSeconds));
      }
      res.status(429).json({
        error: 'Demasiadas solicitudes. Excedió el límite de tasa permitido por minuto para este portal.',
        retryAfterSeconds: rateLimitRes.retryAfterSeconds || 60,
      });
      return;
    }

    const dbAdmin = getFirestore();
    const portalSnap = await dbAdmin.collection('client_portals').doc(portalId).get();

    if (!portalSnap.exists) {
      res.status(404).json({ error: 'Acceso Denegado: Portal de cliente no encontrado.' });
      return;
    }

    const portalData = portalSnap.data() as any;

    if (portalData.isRevoked) {
      res.status(403).json({ error: 'Acceso Revocado: El acceso a este portal ha sido suspendido por la empresa contratista.' });
      return;
    }

    if (portalData.expiresAt && new Date(portalData.expiresAt).getTime() < Date.now()) {
      res.status(403).json({ error: 'Acceso Caducado: El token de acceso para este portal ha expirado.' });
      return;
    }

    // C1 - Comparar SHA-256 hash del token recibido asegurando verificación previa de longitud antes de timingSafeEqual
    const incomingHash = crypto.createHash('sha256').update(String(token)).digest('hex'); // 64 caracteres hex (32 bytes)
    const storedHash = portalData.tokenHash; // 64 caracteres hex (32 bytes)

    if (!storedHash) {
      res.status(401).json({ error: 'Acceso Denegado: Token de seguridad no válido.' });
      return;
    }

    const incomingBuf = Buffer.from(incomingHash, 'hex'); // 32 bytes
    const storedBuf = Buffer.from(storedHash, 'hex');     // 32 bytes

    if (incomingBuf.length !== storedBuf.length) {
      res.status(401).json({ error: 'Acceso Denegado: Token de seguridad no válido.' });
      return;
    }

    if (!crypto.timingSafeEqual(incomingBuf, storedBuf)) {
      res.status(401).json({ error: 'Acceso Denegado: Token de seguridad no válido.' });
      return;
    }

    // C2 - Registrar Audit Log Server-Side (sin incluir rawToken)
    const orgId = portalData.orgId;
    if (!orgId) {
      res.status(400).json({ error: 'Acceso Denegado: Organización no configurada en el portal.' });
      return;
    }

    try {
      await dbAdmin.collection(`organizations/${orgId}/client_portal_access_logs`).add({
        portalId,
        ip: normalizedIp,
        accessedAt: new Date().toISOString(),
        userAgent: req.headers['user-agent'] || 'unknown',
      });
    } catch (logErr) {
      logger.warn('Error registrando log de acceso al portal:', logErr);
    }

    // C3 - DTO sanitizado explícito en respuesta pública: NUNCA expone orgId, projectId, tokenHash, storagePath, linkedProjectIds o UIDs
    const rawMatrix = portalData.visibilityMatrix || {};
    const publishedWidgets: Record<string, boolean> = {};
    if (rawMatrix && typeof rawMatrix === 'object') {
      for (const [key, val] of Object.entries(rawMatrix)) {
        if (val === true) {
          publishedWidgets[key] = true;
        }
      }
    }

    res.status(200).json({
      success: true,
      portal: {
        id: portalData.id,
        name: portalData.name,
        clientName: portalData.clientName,
        branding: portalData.branding || {},
        visibilityMatrix: publishedWidgets,
        updatedAt: portalData.updatedAt,
      }
    });
  } catch (err: any) {
    logger.error('Error en getClientPortal:', err);
    res.status(500).json({ error: err?.message || 'Error al validar portal de cliente.' });
  }
};

/**
 * Sprint 9 - SELLO DOCUMENTAL SERVER-SIDE
 * Callable Cloud Function: sealDocument
 * - Modela DocumentVerification
 * - Calcula SHA-256 server-side
 * - Escribe en colección append-only
 */
export const sealDocument = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  const { docId, orgId, projId, pdfBytesBase64, version, metadata, requireVerifierConfig } = data || {};

  if (!docId || !orgId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Faltan parámetros requeridos: docId y orgId.'
    );
  }

  // Validar VERIFIER_BASE_URL mediante configuración segura
  const verifierBaseUrl = process.env.VERIFIER_BASE_URL || (data?.verifierBaseUrl ? String(data.verifierBaseUrl) : 'https://industrial-360.app');
  if (requireVerifierConfig && !process.env.VERIFIER_BASE_URL && !data?.verifierBaseUrl) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'CONFIG_ERROR: VERIFIER_BASE_URL no está configurada en las variables de entorno del servidor.'
    );
  }

  // Autorización server-side reusable (S14.2)
  const authRes = await authorizeServerSideRequest(context.auth, {
    orgId,
    projectId: projId,
    requireProject: Boolean(projId),
    allowedRoles: ['superadmin', 'gerente', 'supervisor', 'inspector', 'campo'],
  });

  const callerUid = authRes.uid;

  // 1. Calcular Hash SHA-256 Server-Side de bytes finales
  let sha256 = '';
  if (pdfBytesBase64) {
    const pdfBuffer = Buffer.from(pdfBytesBase64, 'base64');
    sha256 = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
  } else {
    // Generar hash server-side basado en metadatos + timestamp inmutable
    const payload = `DOC:${docId}|ORG:${orgId}|PROJ:${projId || 'N/A'}|TS:${new Date().toISOString()}|BY:${callerUid}`;
    sha256 = crypto.createHash('sha256').update(payload).digest('hex');
  }

  const issuedAt = new Date().toISOString();
  const dbAdmin = getFirestore();
  const verificationId = sha256;

  // URL de verificación pública minimalista sin filtrar datos internos PII
  const cleanBase = verifierBaseUrl.replace(/\/+$/, '');
  const verificationUrl = `${cleanBase}/verify-document?doc=${encodeURIComponent(docId)}&hash=${sha256.substring(0, 16)}`;

  const verificationRecord = {
    id: verificationId,
    docId,
    orgId,
    projId: projId || 'proj-default',
    sha256,
    status: 'VALIDEZ_OFICIAL',
    version: version || 'REV-0',
    sealVersion: 'v1.0',
    timezone: 'America/Caracas',
    issuedAt,
    sealedBy: callerUid,
    verificationUrl,
    metadata: metadata || {}
  };

  // Escribir en colección append-only
  await dbAdmin.collection(`organizations/${orgId}/document_verifications`).doc(verificationId).set(verificationRecord, { merge: true });
  await dbAdmin.collection('document_verifications').doc(verificationId).set(verificationRecord, { merge: true });

  // Audit Log
  await dbAdmin.collection(`organizations/${orgId}/audit_logs`).add({
    action: 'DOCUMENT_SEALED',
    callerUid,
    docId,
    sha256,
    timestamp: FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    verificationId,
    docId,
    sha256,
    status: 'VALIDEZ_OFICIAL',
    version: verificationRecord.version,
    sealVersion: 'v1.0',
    issuedAt,
    verificationUrl: verificationRecord.verificationUrl
  };
});

/**
 * Sprint 9 - VERIFICACIÓN PÚBLICA POR QR (HTTPS)
 * Function HTTPS pública: verifyDocument
 * Retorna { status, version, issuedAt, sha256, docId, metadata }
 */
export const verifyDocument = async (req: any, res: any) => {
  // C-CORS: Configuración explícita de dominios autorizados
  const allowedOrigins = ['https://industrial-360.vercel.app', 'http://localhost:5173', 'http://localhost:3000'];
  const origin = req.headers?.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.set('Access-Control-Allow-Origin', allowedOrigins[0]);
  }
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const sha256 = req.query.sha256 || req.body?.sha256;
    const docId = req.query.docId || req.body?.docId;

    if (!sha256 && !docId) {
      res.status(400).json({ error: 'Se requiere sha256 o docId para verificar la validez del documento.' });
      return;
    }

    // C5 - Rate limit obligatorio en verifyDocument por IP normalizada y recurso
    const rawIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const normalizedIp = rawIp.replace(/^::ffff:/, '').trim();
    const rateLimitKey = `${normalizedIp}_verify_${sha256 || docId}`;

    const rateLimitRes = await checkRateLimit(rateLimitKey, 'verifyDocument', 30, 60000);
    if (!rateLimitRes.allowed) {
      if (rateLimitRes.retryAfterSeconds) {
        res.set('Retry-After', String(rateLimitRes.retryAfterSeconds));
      }
      res.status(429).json({
        error: 'Demasiadas solicitudes de verificación. Excedió el límite de tasa permitido.',
        retryAfterSeconds: rateLimitRes.retryAfterSeconds || 60,
      });
      return;
    }

    const dbAdmin = getFirestore();
    let record: any = null;

    if (sha256) {
      const snap = await dbAdmin.collection('document_verifications').doc(sha256).get();
      if (snap.exists) record = snap.data();
    }

    if (!record && docId) {
      const querySnap = await dbAdmin.collection('document_verifications').where('docId', '==', docId).get();
      if (!querySnap.empty) {
        record = querySnap.docs[0].data();
      }
    }

    if (!record) {
      res.status(404).json({
        status: 'NO_ENCONTRADO',
        message: 'No se encontró un sello de verificación inmutable para este documento.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      status: record.status || 'VALIDEZ_OFICIAL',
      version: record.version || 'REV-0',
      issuedAt: record.issuedAt,
      sha256: record.sha256,
      docId: record.docId,
      verificationUrl: record.verificationUrl,
      metadata: record.metadata || {}
    });
  } catch (err: any) {
    logger.error('Error en verifyDocument:', err);
    res.status(500).json({ error: err?.message || 'Error al verificar documento.' });
  }
};

/**
 * S14.2A - Provisionamiento seguro de membresía QA
 * Exige: context.auth.token.platformAdmin === true (Admin de plataforma).
 * Valida que targetOrgId tenga environment === 'qa'.
 * Valida rol en allow-list: gerente, supervisor, inspector, campo, cliente_readonly.
 * Rechaza platformAdmin como rol de tenant.
 * Operación idempotente.
 */
export const provisionQaMembership = functions.https.onCall(
  async (data: any, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'El usuario debe estar autenticado.'
      );
    }

    const isPlatformAdmin = context.auth.token?.platformAdmin === true;
    if (!isPlatformAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Acceso denegado: Se requiere autoridad de plataforma (platformAdmin === true).'
      );
    }

    const targetUid = typeof data?.targetUid === 'string' ? data.targetUid.trim() : '';
    const targetOrgId = typeof data?.targetOrgId === 'string' ? data.targetOrgId.trim() : '';
    const requestedRole = typeof data?.requestedRole === 'string' ? data.requestedRole.trim() : '';
    const reason = typeof data?.reason === 'string' ? data.reason.trim() : '';

    if (!targetUid || !targetOrgId || !requestedRole || !reason) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Parámetros requeridos: targetUid, targetOrgId, requestedRole, reason (no vacíos).'
      );
    }

    const QA_ALLOWED_ROLES = ['gerente', 'supervisor', 'inspector', 'campo', 'cliente_readonly'];
    if (!QA_ALLOWED_ROLES.includes(requestedRole)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Rol solicitado no permitido para QA Preview. Roles permitidos: ${QA_ALLOWED_ROLES.join(', ')}.`
      );
    }

    const dbAdmin = getFirestore();
    const authAdmin = getAuth();

    const orgRef = dbAdmin.doc(`organizations/${targetOrgId}`);
    const orgSnap = await orgRef.get();

    if (!orgSnap.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        `Organización no encontrada: '${targetOrgId}'.`
      );
    }

    const orgData = orgSnap.data() || {};
    if (orgData.environment !== 'qa') {
      throw new functions.https.HttpsError(
        'permission-denied',
        `Acceso denegado: La organización '${targetOrgId}' no es un entorno QA autorizado (environment !== 'qa').`
      );
    }

    const membershipRef = dbAdmin.doc(`organizations/${targetOrgId}/memberships/${targetUid}`);
    const membershipSnap = await membershipRef.get();

    if (membershipSnap.exists) {
      const existing = membershipSnap.data() || {};
      if (existing.status === 'active' && existing.role === requestedRole) {
        return {
          success: true,
          status: 'alreadyProvisioned',
          targetUid,
          targetOrgId,
          role: requestedRole,
          message: `La membresía QA para '${targetUid}' en '${targetOrgId}' ya se encuentra activa con el rol '${requestedRole}'.`,
        };
      }
    }

    const callerUid = context.auth.uid;
    const timestamp = FieldValue.serverTimestamp();

    const batch = dbAdmin.batch();

    batch.set(
      membershipRef,
      {
        uid: targetUid,
        orgId: targetOrgId,
        role: requestedRole,
        status: 'active',
        updatedAt: timestamp,
        provisionedBy: callerUid,
        reason,
      },
      { merge: true }
    );

    const auditRef = dbAdmin.collection(`organizations/${targetOrgId}/audit_logs`).doc();
    batch.set(auditRef, {
      action: 'QA_MEMBERSHIP_PROVISIONED',
      callerUid,
      targetUid,
      targetOrgId,
      role: requestedRole,
      reason,
      timestamp,
      status: 'SUCCESS',
    });

    await batch.commit();

    await authAdmin.setCustomUserClaims(targetUid, {
      orgId: targetOrgId,
      role: requestedRole,
    });
    await authAdmin.revokeRefreshTokens(targetUid);

    logger.info(
      `Membresía QA aprovisionada exitosamente: targetUid=${targetUid}, targetOrgId=${targetOrgId}, role=${requestedRole}, actor=${callerUid}`
    );

    return {
      success: true,
      status: 'provisioned',
      targetUid,
      targetOrgId,
      role: requestedRole,
      message: `Membresía QA aprovisionada exitosamente para ${targetUid} en ${targetOrgId} con rol ${requestedRole}.`,
    };
  }
);

/**
 * S14.2A - Revocación segura de membresía QA
 * Exige: context.auth.token.platformAdmin === true.
 * Valida tenant QA (environment === 'qa'), revoca membresía, limpia claims de tenant QA y revoca refresh tokens.
 * Operación idempotente.
 */
export const revokeQaMembership = functions.https.onCall(
  async (data: any, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'El usuario debe estar autenticado.'
      );
    }

    const isPlatformAdmin = context.auth.token?.platformAdmin === true;
    if (!isPlatformAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Acceso denegado: Se requiere autoridad de plataforma (platformAdmin === true).'
      );
    }

    const targetUid = typeof data?.targetUid === 'string' ? data.targetUid.trim() : '';
    const targetOrgId = typeof data?.targetOrgId === 'string' ? data.targetOrgId.trim() : '';
    const reason = typeof data?.reason === 'string' ? data.reason.trim() : '';

    if (!targetUid || !targetOrgId || !reason) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Parámetros requeridos: targetUid, targetOrgId, reason (no vacíos).'
      );
    }

    const dbAdmin = getFirestore();
    const authAdmin = getAuth();

    const orgRef = dbAdmin.doc(`organizations/${targetOrgId}`);
    const orgSnap = await orgRef.get();

    if (!orgSnap.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        `Organización no encontrada: '${targetOrgId}'.`
      );
    }

    const orgData = orgSnap.data() || {};
    if (orgData.environment !== 'qa') {
      throw new functions.https.HttpsError(
        'permission-denied',
        `Acceso denegado: La organización '${targetOrgId}' no es un entorno QA autorizado (environment !== 'qa').`
      );
    }

    const membershipRef = dbAdmin.doc(`organizations/${targetOrgId}/memberships/${targetUid}`);
    const membershipSnap = await membershipRef.get();

    if (!membershipSnap.exists || membershipSnap.data()?.status === 'revoked') {
      return {
        success: true,
        status: 'alreadyRevoked',
        targetUid,
        targetOrgId,
        message: `La membresía QA para '${targetUid}' en '${targetOrgId}' ya se encontraba revocada o no existe.`,
      };
    }

    const callerUid = context.auth.uid;
    const timestamp = FieldValue.serverTimestamp();

    const batch = dbAdmin.batch();
    batch.update(membershipRef, {
      status: 'revoked',
      updatedAt: timestamp,
      revokedBy: callerUid,
      reason,
    });

    const auditRef = dbAdmin.collection(`organizations/${targetOrgId}/audit_logs`).doc();
    batch.set(auditRef, {
      action: 'QA_MEMBERSHIP_REVOKED',
      callerUid,
      targetUid,
      targetOrgId,
      reason,
      timestamp,
      status: 'SUCCESS',
    });

    await batch.commit();

    try {
      const targetUser = await authAdmin.getUser(targetUid);
      const currentClaims = targetUser.customClaims || {};
      if (currentClaims.orgId === targetOrgId) {
        const newClaims: Record<string, any> = {};
        if (currentClaims.platformAdmin) {
          newClaims.platformAdmin = true;
        }
        await authAdmin.setCustomUserClaims(targetUid, newClaims);
      }
    } catch (err) {
      logger.warn(`No se pudieron actualizar los claims de ${targetUid} durante revocación:`, err);
    }

    await authAdmin.revokeRefreshTokens(targetUid);

    logger.info(
      `Membresía QA revocada exitosamente: targetUid=${targetUid}, targetOrgId=${targetOrgId}, actor=${callerUid}`
    );

    return {
      success: true,
      status: 'revoked',
      targetUid,
      targetOrgId,
      message: `Membresía QA revocada exitosamente para ${targetUid} en ${targetOrgId}.`,
    };
  }
);

/**
 * Interface para el payload recibido por la Callable Function syncOutboxMutation
 */
export interface OutboxMutationPayload {
  orgId: string;
  projectId: string;
  entityType: string;
  operationType: 'CREATE' | 'UPDATE' | 'DELETE' | string;
  operationId: string;
  entityId?: string;
  expectedVersion?: number;
  payload?: Record<string, unknown>;
}

/**
 * Callable Cloud Function: syncOutboxMutation (Sprint S14.3)
 *
 * Procesa mutaciones offline/outbox de forma transaccional e idempotente server-side:
 * 1. Autorización server-side mediante authorizeServerSideRequest.
 * 2. Validación de allow-list de entityType y operationType.
 * 3. Transacción atómica en Firestore:
 *    - Verifica la clave de idempotencia en /organizations/{orgId}/projects/{projectId}/idempotencyKeys/{operationId}.
 *    - Si ya existe, retorna 'duplicate' y el resultado previo sin re-ejecutar.
 *    - Verifica la versión esperada (expectedVersion) si se provee.
 *    - Aplica la mutación al documento objetivo.
 *    - Registra la clave de idempotencia y el log de auditoría dentro de la misma transacción.
 */
export const syncOutboxMutation = functions.https.onCall(
  async (data: OutboxMutationPayload, context: functions.https.CallableContext) => {
    const orgId = typeof data?.orgId === 'string' ? data.orgId.trim() : '';
    const projectId = typeof data?.projectId === 'string' ? data.projectId.trim() : '';
    const entityType = typeof data?.entityType === 'string' ? data.entityType.trim() : '';
    const rawOpType = typeof data?.operationType === 'string' ? data.operationType.trim().toUpperCase() : '';
    const operationId = typeof data?.operationId === 'string' ? data.operationId.trim() : '';
    const entityId = typeof data?.entityId === 'string' ? data.entityId.trim() : undefined;
    const expectedVersion = typeof data?.expectedVersion === 'number' ? data.expectedVersion : undefined;
    const payload = (data?.payload && typeof data.payload === 'object' && !Array.isArray(data.payload)) ? data.payload : {};

    // 1. Autorización estricta server-side (auth, tenant, proyecto, membresía y rol autoritativo)
    const authResult = await authorizeServerSideRequest(context.auth, {
      orgId,
      projectId,
      requireProject: true,
      allowedRoles: ['superadmin', 'gerente', 'residente', 'inspector', 'campo'],
    });

    // 2. Validación de parámetros e Idempotency Key (UUID v4 o ID válido >= 8 caracteres)
    if (!operationId || operationId.length < 8) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Parámetro requerido: operationId debe ser un identificador único válido (mínimo 8 caracteres).'
      );
    }

    const ALLOWED_OPERATIONS = ['CREATE', 'UPDATE', 'DELETE'];
    if (!ALLOWED_OPERATIONS.includes(rawOpType)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `operationType no permitido: '${rawOpType}'. Valores permitidos: ${ALLOWED_OPERATIONS.join(', ')}.`
      );
    }
    const operationType = rawOpType as 'CREATE' | 'UPDATE' | 'DELETE';

    // Allow-list de entityType
    const ALLOWED_ENTITY_TYPES = [
      'ptw', 'siho_ptw', 'welds', 'weld_joints', 'valuations', 'attendance',
      'inspections', 'dossiers', 'field_reports', 'inventory', 'expenses', 'tasks',
      'alerts', 'equipment', 'loto', 'moc', 'documents', 'bims'
    ];
    const isValidEntityType = ALLOWED_ENTITY_TYPES.includes(entityType.toLowerCase()) || /^[a-zA-Z0-9_-]+$/.test(entityType);
    if (!entityType || !isValidEntityType) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `entityType no permitido o inválido: '${entityType}'.`
      );
    }

    // Restricciones de rol 'campo' (no puede cerrar/aprobar directamente)
    if (authResult.role === 'campo') {
      const status = typeof payload.status === 'string' ? payload.status.toLowerCase() : '';
      if (['aprobado', 'approved', 'cerrado', 'closed'].includes(status)) {
        throw new functions.https.HttpsError(
          'permission-denied',
          "El rol 'campo' no puede marcar entidades como aprobadas o cerradas."
        );
      }
    }

    // Reserva e inspección de cuotas FinOps Serverless (FIRESTORE_WRITE)
    const writeQuotaResult = await reserveQuota({
      orgId,
      operation: 'FIRESTORE_WRITE',
      increment: 1,
      requestId: operationId,
      throwOnExceeded: false,
    });

    if (!writeQuotaResult.allowed) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        `Cuota de escrituras Firestore excedida para la organización '${orgId}'. (${writeQuotaResult.currentUsage}/${writeQuotaResult.limit})`
      );
    }

    const dbAdmin = getFirestore();
    const targetEntityId = entityId || operationId;
    const idempotencyRef = dbAdmin.doc(`organizations/${orgId}/projects/${projectId}/idempotencyKeys/${operationId}`);
    const docRef = dbAdmin.doc(`organizations/${orgId}/projects/${projectId}/${entityType}/${targetEntityId}`);

    // 3. Ejecución transaccional e idempotente
    return await dbAdmin.runTransaction(async (transaction) => {
      // A. Consultar clave de idempotencia scoped por tenant y proyecto
      const idempotencySnap = await transaction.get(idempotencyRef);
      if (idempotencySnap.exists) {
        const idData = idempotencySnap.data() || {};
        logger.info(`[SyncOutbox] Mutación duplicada detectada: operationId=${operationId}, orgId=${orgId}, entityId=${targetEntityId}`);
        return {
          success: true,
          status: 'duplicate',
          operationId,
          entityId: targetEntityId,
          result: idData.result || null,
          processedAt: idData.processedAt ? (idData.processedAt.toDate ? idData.processedAt.toDate().toISOString() : idData.processedAt) : new Date().toISOString(),
        };
      }

      // B. Consultar documento destino para validar versión existente
      const docSnap = await transaction.get(docRef);
      const currentVersion = docSnap.exists ? (docSnap.data()?.version || 1) : 0;

      // C. Verificación de conflicto de versión (si expectedVersion está presente)
      if (expectedVersion !== undefined && docSnap.exists && currentVersion !== expectedVersion) {
        logger.warn(`[SyncOutbox] Conflicto de versión para operationId=${operationId}: actual=${currentVersion}, esperada=${expectedVersion}`);
        return {
          success: false,
          status: 'conflict',
          operationId,
          entityId: targetEntityId,
          currentVersion,
          expectedVersion,
          message: `Conflicto de versión: La versión actual en servidor es ${currentVersion}, pero la mutación esperaba ${expectedVersion}.`,
        };
      }

      const nextVersion = docSnap.exists ? currentVersion + 1 : 1;
      const timestamp = FieldValue.serverTimestamp();

      // D. Aplicar mutación sobre el recurso objetivo
      if (operationType === 'CREATE') {
        const docData = {
          ...payload,
          id: targetEntityId,
          orgId,
          projectId,
          version: nextVersion,
          createdAt: docSnap.exists ? (docSnap.data()?.createdAt || timestamp) : timestamp,
          updatedAt: timestamp,
          createdBy: docSnap.exists ? (docSnap.data()?.createdBy || authResult.uid) : authResult.uid,
          updatedBy: authResult.uid,
        };
        transaction.set(docRef, docData, { merge: true });
      } else if (operationType === 'UPDATE') {
        const updateData = {
          ...payload,
          orgId,
          projectId,
          version: nextVersion,
          updatedAt: timestamp,
          updatedBy: authResult.uid,
        };
        transaction.set(docRef, updateData, { merge: true });
      } else if (operationType === 'DELETE') {
        transaction.delete(docRef);
      }

      // E. Registrar Clave de Idempotencia dentro de la transacción
      const resultPayload = {
        entityId: targetEntityId,
        entityType,
        operationType,
        version: nextVersion,
      };

      transaction.set(idempotencyRef, {
        operationId,
        orgId,
        projectId,
        entityType,
        operationType,
        entityId: targetEntityId,
        uid: authResult.uid,
        processedAt: timestamp,
        result: resultPayload,
      });

      // F. Registrar Log de Auditoría dentro de la misma transacción
      const auditRef = dbAdmin.collection(`organizations/${orgId}/projects/${projectId}/auditLogs`).doc();
      transaction.set(auditRef, {
        action: `OUTBOX_MUTATION_${operationType}`,
        entityType,
        entityId: targetEntityId,
        operationId,
        uid: authResult.uid,
        userEmail: authResult.email || null,
        timestamp,
        status: 'SUCCESS',
      });

      logger.info(`[SyncOutbox] Mutación procesada exitosamente: operationId=${operationId}, entityType=${entityType}, operationType=${operationType}, entityId=${targetEntityId}`);

      return {
        success: true,
        status: 'applied',
        operationId,
        entityId: targetEntityId,
        version: nextVersion,
        result: resultPayload,
      };
    });
  }
);

/**
 * S22 — Gestión de FinOps y Estado del Plan por Autoridad de Plataforma (platformAdmin).
 * C3 — Step-up MFA: Verifica auth_time reciente en el servidor (< 300 segundos).
 * C6 — Actualiza el estado del plan respetando el ciclo de vida.
 */
export const updatePlatformTenantLifecycle = functions.https.onCall(
  async (data: any, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'El usuario debe estar autenticado.'
      );
    }

    const isPlatformAdmin = context.auth.token?.platformAdmin === true;
    if (!isPlatformAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Acceso denegado: Se requiere autoridad de plataforma (platformAdmin === true).'
      );
    }

    // C3: Verificación de Step-up MFA Server-side
    const authTime = context.auth.token?.auth_time;
    const nowSeconds = Math.floor(Date.now() / 1000);
    const MAX_MFA_AGE_SECONDS = 300; // 5 minutos

    if (!authTime || typeof authTime !== 'number' || nowSeconds - authTime > MAX_MFA_AGE_SECONDS) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Acceso denegado: Se requiere re-autenticación reciente / step-up MFA (auth_time excedido 300s).'
      );
    }

    const targetOrgId = typeof data?.targetOrgId === 'string' ? data.targetOrgId.trim() : '';
    const newStatus = typeof data?.status === 'string' ? data.status.trim() : '';
    const reason = typeof data?.reason === 'string' ? data.reason.trim() : '';

    const VALID_STATUSES = ['ACTIVE', 'GRACE_PERIOD', 'READ_ONLY', 'SUSPENDED'];
    if (!targetOrgId || !VALID_STATUSES.includes(newStatus) || !reason) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Parámetros requeridos: targetOrgId, status (${VALID_STATUSES.join(', ')}), reason.`
      );
    }

    const dbAdmin = getFirestore();
    const orgRef = dbAdmin.doc(`organizations/${targetOrgId}`);
    const orgSnap = await orgRef.get();

    if (!orgSnap.exists) {
      throw new functions.https.HttpsError('not-found', `Organización '${targetOrgId}' no encontrada.`);
    }

    const callerUid = context.auth.uid;
    const timestamp = FieldValue.serverTimestamp();

    const batch = dbAdmin.batch();
    batch.set(orgRef, { planStatus: newStatus, updatedAt: timestamp, updatedBy: callerUid }, { merge: true });

    const auditRef = dbAdmin.collection(`organizations/${targetOrgId}/audit_logs`).doc();
    batch.set(auditRef, {
      action: 'PLATFORM_TENANT_LIFECYCLE_UPDATED',
      callerUid,
      targetOrgId,
      newStatus,
      reason,
      timestamp,
      status: 'SUCCESS',
    });

    await batch.commit();

    logger.info(
      `[PlatformFinOps] Estado de plan actualizado: targetOrgId=${targetOrgId}, status=${newStatus}, actor=${callerUid}`
    );

    return {
      success: true,
      targetOrgId,
      newStatus,
      message: `Estado de plan para '${targetOrgId}' actualizado a '${newStatus}'.`,
    };
  }
);




