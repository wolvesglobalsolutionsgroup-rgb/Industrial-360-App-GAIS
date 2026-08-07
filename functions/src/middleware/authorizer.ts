import { CallableContext, HttpsError } from 'firebase-functions/v1/https';
import { getFirestore } from 'firebase-admin/firestore';
import { DecodedIdToken } from 'firebase-admin/auth';
import { logger } from '../logger';

export interface AuthorizeOptions {
  /**
   * Identificador único de la organización.
   */
  orgId: string;
  /**
   * Identificador opcional o requerido del proyecto.
   */
  projectId?: string;
  /**
   * Indica si projectId es obligatorio para la operación.
   * Por defecto true si se provee projectId.
   */
  requireProject?: boolean;
  /**
   * Lista de roles permitidos para ejecutar la función.
   */
  allowedRoles?: string[];
  /**
   * Parámetros opcionales provenientes de la ruta para validar inconsistencias.
   */
  routeOrgId?: string;
  routeProjectId?: string;
}

export interface AuthorizeResult {
  uid: string;
  email?: string;
  orgId: string;
  projectId?: string;
  role: string;
  membershipStatus: string;
  decodedToken: DecodedIdToken;
}

export interface ResolveAuthorizedOrgIdParams {
  /**
   * Objeto de autenticación proveniente de context.auth (Callable) o req.user / DecodedIdToken (Express).
   */
  authContext: CallableContext['auth'] | DecodedIdToken | undefined;
  /**
   * Identificador de organización solicitado opcionalmente en body, query o params.
   */
  requestedOrgId?: string;
  /**
   * Permite anulaciones administrativas de plataforma únicamente si el token posee claim platformAdmin === true.
   */
  allowPlatformAdminOverride?: boolean;
}

export interface ResolvedTenantResult {
  effectiveOrgId: string;
  isPlatformAdmin: boolean;
  claimOrgId: string;
}

/**
 * Resuelve e impone la identidad autoritativa del tenant (orgId) a partir de Custom Claims del servidor.
 *
 * REGLA FUNDAMENTAL DE SEGURIDAD MULTI-TENANT (Sprint F-MT.1):
 * 1. Para cualquier solicitud autenticada: effectiveOrgId = orgId derivado de claims/token verificado por el servidor.
 * 2. NUNCA acepta orgId como autoridad si proviene únicamente del cliente (body, query, params, headers).
 * 3. Si requestedOrgId no coincide con el tenant autorizado del token (custom claims),
 *    rechaza inmediatamente con error de autorización estructurado (permission-denied).
 * 4. Permite override de plataforma ÚNICAMENTE si token.platformAdmin === true y allowPlatformAdminOverride === true.
 */
export function resolveAuthorizedOrgId(
  params: ResolveAuthorizedOrgIdParams
): ResolvedTenantResult {
  const { authContext, requestedOrgId, allowPlatformAdminOverride = false } = params;

  if (!authContext) {
    throw new HttpsError(
      'unauthenticated',
      'Acceso denegado: Se requiere un usuario autenticado para determinar la organización.'
    );
  }

  const decodedToken: DecodedIdToken =
    'token' in authContext && authContext.token
      ? (authContext.token as DecodedIdToken)
      : (authContext as DecodedIdToken);

  const claimOrgId = typeof decodedToken.orgId === 'string' ? decodedToken.orgId.trim() : '';
  const isPlatformAdmin = decodedToken.platformAdmin === true;

  const cleanRequested = typeof requestedOrgId === 'string' ? requestedOrgId.trim() : '';

  if (cleanRequested) {
    if (claimOrgId && cleanRequested !== claimOrgId) {
      if (isPlatformAdmin && allowPlatformAdminOverride) {
        return {
          effectiveOrgId: cleanRequested,
          isPlatformAdmin,
          claimOrgId,
        };
      }
      throw new HttpsError(
        'permission-denied',
        `Acceso denegado: El usuario pertenece a la organización '${claimOrgId}', pero solicitó operar en '${cleanRequested}'.`
      );
    }

    if (!claimOrgId) {
      if (isPlatformAdmin && allowPlatformAdminOverride) {
        return {
          effectiveOrgId: cleanRequested,
          isPlatformAdmin,
          claimOrgId,
        };
      }
      throw new HttpsError(
        'permission-denied',
        'Acceso denegado: El token de autenticación no contiene claims de organización (orgId).'
      );
    }

    return {
      effectiveOrgId: claimOrgId,
      isPlatformAdmin,
      claimOrgId,
    };
  }

  if (!claimOrgId) {
    throw new HttpsError(
      'permission-denied',
      'Acceso denegado: El token de autenticación no contiene claims de organización (orgId).'
    );
  }

  return {
    effectiveOrgId: claimOrgId,
    isPlatformAdmin,
    claimOrgId,
  };
}

/**
 * Autorizador Server-Side Reusable para Cloud Functions e Integraciones (Sprint 14.2 & Sprint F-MT.1)
 *
 * Aplica reglas estrictas de seguridad multi-tenant:
 * 1. Exige usuario autenticado.
 * 2. Impone resolución estricta de orgId desde claims del servidor mediante resolveAuthorizedOrgId.
 * 3. Valida presencia de orgId (y projectId si requireProject = true).
 * 4. Rechaza inconsistencias entre claims JWT, cuerpo de la petición y ruta HTTP.
 * 5. Consulta membership activa autoritativa en /organizations/{orgId}/memberships/{uid}.
 * 6. Valida roles permitidos.
 * 7. Verifique que el proyecto exista y pertenezca a la organización.
 */
export async function authorizeServerSideRequest(
  authContext: CallableContext['auth'] | DecodedIdToken | undefined,
  options: AuthorizeOptions
): Promise<AuthorizeResult> {
  // 1. Exigir autenticación y resolver tenant autoritativo mediante resolveAuthorizedOrgId
  if (!authContext) {
    throw new HttpsError(
      'unauthenticated',
      'Acceso denegado: Se requiere un usuario autenticado para realizar esta acción.'
    );
  }

  const uid = typeof authContext.uid === 'string' ? authContext.uid : (authContext as DecodedIdToken).uid;
  const decodedToken: DecodedIdToken = 'token' in authContext && authContext.token
    ? (authContext.token as DecodedIdToken)
    : (authContext as DecodedIdToken);

  const email = decodedToken.email;

  const { orgId, projectId, allowedRoles, requireProject, routeOrgId, routeProjectId } = options;

  // 2. Parámetros obligatorios orgId y projectId
  if (!orgId || typeof orgId !== 'string' || !orgId.trim()) {
    throw new HttpsError(
      'invalid-argument',
      'Parámetro requerido: orgId es obligatorio y debe ser una cadena válida.'
    );
  }

  // Resolver tenant autoritativo e imponer aislamiento estricto (Sprint F-MT.1)
  const resolvedTenant = resolveAuthorizedOrgId({
    authContext,
    requestedOrgId: orgId,
    allowPlatformAdminOverride: false,
  });

  const cleanOrgId = resolvedTenant.effectiveOrgId;

  const isProjectRequired = requireProject ?? Boolean(projectId);
  if (isProjectRequired) {
    if (!projectId || typeof projectId !== 'string' || !projectId.trim()) {
      throw new HttpsError(
        'invalid-argument',
        'Parámetro requerido: projectId es obligatorio para esta operación.'
      );
    }
  }

  const cleanProjectId = projectId?.trim();

  // 3. Rechazar inconsistencias entre claims, cuerpo y ruta
  if (routeOrgId && routeOrgId.trim() !== cleanOrgId) {
    throw new HttpsError(
      'permission-denied',
      `Inconsistencia de seguridad: orgId en ruta ('${routeOrgId}') no coincide con el cuerpo ('${cleanOrgId}').`
    );
  }

  if (routeProjectId && cleanProjectId && routeProjectId.trim() !== cleanProjectId) {
    throw new HttpsError(
      'permission-denied',
      `Inconsistencia de seguridad: projectId en ruta ('${routeProjectId}') no coincide con el cuerpo ('${cleanProjectId}').`
    );
  }

  // 4. Consultar membership activa autoritativa
  const dbAdmin = getFirestore();
  const membershipRef = dbAdmin.doc(`organizations/${cleanOrgId}/memberships/${uid}`);
  const membershipSnap = await membershipRef.get();

  if (!membershipSnap.exists) {
    throw new HttpsError(
      'permission-denied',
      `Membresía no encontrada: El usuario '${uid}' no posee registro de membresía en '/organizations/${cleanOrgId}/memberships/${uid}'.`
    );
  }

  const membershipData = membershipSnap.data() || {};
  const status = (membershipData.status as string) || 'active';
  const activeStatuses = ['approved', 'aprobado', 'active'];

  if (!activeStatuses.includes(status.toLowerCase())) {
    throw new HttpsError(
      'permission-denied',
      `Membresía inactiva: El estado de su membresía en '${cleanOrgId}' es '${status}'.`
    );
  }

  const membershipRole = (membershipData.role as string) || 'campo';
  if (membershipRole === 'platformAdmin') {
    throw new HttpsError(
      'permission-denied',
      "Acceso denegado: El rol 'platformAdmin' no puede ser concedido por una membresía de organización."
    );
  }

  const effectiveRole = membershipRole;
  const membershipStatus = status;

  // 5. Validar roles permitidos
  if (allowedRoles && allowedRoles.length > 0) {
    const isAllowed = allowedRoles.includes(effectiveRole) || effectiveRole === 'superadmin';
    if (!isAllowed) {
      throw new HttpsError(
        'permission-denied',
        `Permisos insuficientes: El rol '${effectiveRole}' no está autorizado para esta operación.`
      );
    }
  }

  // 6. Verificar que el proyecto exista y pertenezca a la organización
  if (cleanProjectId) {
    const projectRef = dbAdmin.doc(`organizations/${cleanOrgId}/projects/${cleanProjectId}`);
    const projectSnap = await projectRef.get();

    if (!projectSnap.exists) {
      throw new HttpsError(
        'not-found',
        `Proyecto no encontrado: El proyecto '${cleanProjectId}' no existe o no pertenece a la organización '${cleanOrgId}'.`
      );
    }

    const projectData = projectSnap.data();
    if (projectData?.orgId && projectData.orgId !== cleanOrgId) {
      throw new HttpsError(
        'permission-denied',
        `Inconsistencia de proyecto: El proyecto '${cleanProjectId}' no pertenece a la organización '${cleanOrgId}'.`
      );
    }
  }

  logger.info(`Autorización server-side exitosa: uid=${uid}, orgId=${cleanOrgId}, projId=${cleanProjectId || 'N/A'}, role=${effectiveRole}`);

  return {
    uid,
    email,
    orgId: cleanOrgId,
    projectId: cleanProjectId,
    role: effectiveRole,
    membershipStatus,
    decodedToken,
  };
}
