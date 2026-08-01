"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeServerSideRequest = authorizeServerSideRequest;
const https_1 = require("firebase-functions/v1/https");
const firestore_1 = require("firebase-admin/firestore");
const logger_1 = require("../logger");
/**
 * Autorizador Server-Side Reusable para Cloud Functions e Integraciones (Sprint 14.2)
 *
 * Aplica reglas estrictas de seguridad multi-tenant:
 * 1. Exige usuario autenticado.
 * 2. Valida presencia de orgId (y projectId si requireProject = true).
 * 3. Rechaza inconsistencias entre claims JWT, cuerpo de la petición y ruta HTTP.
 * 4. Consulta membership activa autoritativa en /organizations/{orgId}/memberships/{uid}.
 * 5. Valida roles permitidos.
 * 6. Verifique que el proyecto exista y pertenezca a la organización.
 */
async function authorizeServerSideRequest(authContext, options) {
    // 1. Exigir autenticación
    if (!authContext) {
        throw new https_1.HttpsError('unauthenticated', 'Acceso denegado: Se requiere un usuario autenticado para realizar esta acción.');
    }
    const uid = typeof authContext.uid === 'string' ? authContext.uid : authContext.uid;
    const decodedToken = 'token' in authContext && authContext.token
        ? authContext.token
        : authContext;
    const tokenOrgId = decodedToken.orgId || '';
    const email = decodedToken.email;
    const { orgId, projectId, allowedRoles, requireProject, routeOrgId, routeProjectId } = options;
    // 2. Parámetros obligatorios orgId y projectId
    if (!orgId || typeof orgId !== 'string' || !orgId.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'Parámetro requerido: orgId es obligatorio y debe ser una cadena válida.');
    }
    const cleanOrgId = orgId.trim();
    const isProjectRequired = requireProject ?? Boolean(projectId);
    if (isProjectRequired) {
        if (!projectId || typeof projectId !== 'string' || !projectId.trim()) {
            throw new https_1.HttpsError('invalid-argument', 'Parámetro requerido: projectId es obligatorio para esta operación.');
        }
    }
    const cleanProjectId = projectId?.trim();
    // 3. Rechazar inconsistencias entre claims, cuerpo y ruta
    if (routeOrgId && routeOrgId.trim() !== cleanOrgId) {
        throw new https_1.HttpsError('permission-denied', `Inconsistencia de seguridad: orgId en ruta ('${routeOrgId}') no coincide con el cuerpo ('${cleanOrgId}').`);
    }
    if (routeProjectId && cleanProjectId && routeProjectId.trim() !== cleanProjectId) {
        throw new https_1.HttpsError('permission-denied', `Inconsistencia de seguridad: projectId en ruta ('${routeProjectId}') no coincide con el cuerpo ('${cleanProjectId}').`);
    }
    if (tokenOrgId && tokenOrgId !== cleanOrgId) {
        throw new https_1.HttpsError('permission-denied', `Acceso denegado: El usuario pertenece a la organización '${tokenOrgId}', pero solicitó operar en '${cleanOrgId}'.`);
    }
    // 4. Consultar membership activa autoritativa
    const dbAdmin = (0, firestore_1.getFirestore)();
    const membershipRef = dbAdmin.doc(`organizations/${cleanOrgId}/memberships/${uid}`);
    const membershipSnap = await membershipRef.get();
    if (!membershipSnap.exists) {
        throw new https_1.HttpsError('permission-denied', `Membresía no encontrada: El usuario '${uid}' no posee registro de membresía en '/organizations/${cleanOrgId}/memberships/${uid}'.`);
    }
    const membershipData = membershipSnap.data() || {};
    const status = membershipData.status || 'active';
    const activeStatuses = ['approved', 'aprobado', 'active'];
    if (!activeStatuses.includes(status.toLowerCase())) {
        throw new https_1.HttpsError('permission-denied', `Membresía inactiva: El estado de su membresía en '${cleanOrgId}' es '${status}'.`);
    }
    const membershipRole = membershipData.role || 'campo';
    if (membershipRole === 'platformAdmin') {
        throw new https_1.HttpsError('permission-denied', "Acceso denegado: El rol 'platformAdmin' no puede ser concedido por una membresía de organización.");
    }
    const effectiveRole = membershipRole;
    const membershipStatus = status;
    // 5. Validar roles permitidos
    if (allowedRoles && allowedRoles.length > 0) {
        const isAllowed = allowedRoles.includes(effectiveRole) || effectiveRole === 'superadmin';
        if (!isAllowed) {
            throw new https_1.HttpsError('permission-denied', `Permisos insuficientes: El rol '${effectiveRole}' no está autorizado para esta operación.`);
        }
    }
    // 6. Verificar que el proyecto exista y pertenezca a la organización
    if (cleanProjectId) {
        const projectRef = dbAdmin.doc(`organizations/${cleanOrgId}/projects/${cleanProjectId}`);
        const projectSnap = await projectRef.get();
        if (!projectSnap.exists) {
            throw new https_1.HttpsError('not-found', `Proyecto no encontrado: El proyecto '${cleanProjectId}' no existe o no pertenece a la organización '${cleanOrgId}'.`);
        }
        const projectData = projectSnap.data();
        if (projectData?.orgId && projectData.orgId !== cleanOrgId) {
            throw new https_1.HttpsError('permission-denied', `Inconsistencia de proyecto: El proyecto '${cleanProjectId}' no pertenece a la organización '${cleanOrgId}'.`);
        }
    }
    logger_1.logger.info(`Autorización server-side exitosa: uid=${uid}, orgId=${cleanOrgId}, projId=${cleanProjectId || 'N/A'}, role=${effectiveRole}`);
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
//# sourceMappingURL=authorizer.js.map