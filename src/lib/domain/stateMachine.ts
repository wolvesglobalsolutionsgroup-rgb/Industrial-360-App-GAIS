import {
  SharedRecordStatus,
  ParticipantRole,
  SharedServiceRecord,
  StateTransitionRequest,
  TransitionResult,
  Approval,
  AuditEvent,
} from './types';
import { StateTransitionRequestSchema } from './schemas';

/**
 * Allowed graph of state transitions for SharedServiceRecord
 */
const ALLOWED_TRANSITIONS: Record<SharedRecordStatus, SharedRecordStatus[]> = {
  draft: ['planned', 'cancelled'],
  planned: ['active', 'cancelled'],
  active: ['under_review', 'cancelled'],
  under_review: ['accepted', 'active', 'cancelled'],
  accepted: ['closed', 'cancelled'],
  closed: [],
  cancelled: [],
};

export function isTransitionAllowed(
  fromStatus: SharedRecordStatus,
  toStatus: SharedRecordStatus
): boolean {
  const allowedNext = ALLOWED_TRANSITIONS[fromStatus] || [];
  return allowedNext.includes(toStatus);
}

/**
 * Checks if a specific role + organization type is authorized to perform a state transition
 */
export function isRoleAuthorizedForTransition(
  fromStatus: SharedRecordStatus,
  toStatus: SharedRecordStatus,
  role: ParticipantRole,
  isOperatorOrg: boolean
): boolean {
  if (!isTransitionAllowed(fromStatus, toStatus)) {
    return false;
  }

  // Auditor Externo has read-only access
  if (role === 'auditor_externo') {
    return false;
  }

  // Cancellation rule
  if (toStatus === 'cancelled') {
    if (isOperatorOrg) {
      return role === 'operador_gerente';
    } else {
      // Contractor can only cancel in draft or planned
      return role === 'contratista_gerente' && (fromStatus === 'draft' || fromStatus === 'planned');
    }
  }

  // Transition: draft -> planned
  if (fromStatus === 'draft' && toStatus === 'planned') {
    return (
      role === 'operador_gerente' ||
      role === 'operador_inspector' ||
      role === 'contratista_gerente' ||
      role === 'contratista_supervisor'
    );
  }

  // Transition: planned -> active (requires start authorization)
  if (fromStatus === 'planned' && toStatus === 'active') {
    return (
      role === 'operador_gerente' ||
      role === 'operador_inspector' ||
      role === 'contratista_gerente' ||
      role === 'contratista_supervisor'
    );
  }

  // Transition: active -> under_review (submission by contractor/inspector)
  if (fromStatus === 'active' && toStatus === 'under_review') {
    return (
      role === 'contratista_gerente' ||
      role === 'contratista_supervisor' ||
      role === 'inspector_externo' ||
      role === 'operador_inspector'
    );
  }

  // Transition: under_review -> accepted (STRICT: OPERATOR ONLY, field role / contractor CANNOT accept!)
  if (fromStatus === 'under_review' && toStatus === 'accepted') {
    if (!isOperatorOrg) {
      return false; // Contractor cannot accept its own dossier/work
    }
    return role === 'operador_gerente' || role === 'operador_inspector' || role === 'operador_cwi';
  }

  // Transition: under_review -> active (rejection for correction: OPERATOR ONLY)
  if (fromStatus === 'under_review' && toStatus === 'active') {
    if (!isOperatorOrg) {
      return false;
    }
    return role === 'operador_gerente' || role === 'operador_inspector' || role === 'operador_cwi';
  }

  // Transition: accepted -> closed (OPERATOR GERENTE ONLY)
  if (fromStatus === 'accepted' && toStatus === 'closed') {
    return isOperatorOrg && role === 'operador_gerente';
  }

  return false;
}

/**
 * Validates whether the required minimum evidence is present for the transition
 */
export function validateTransitionEvidence(
  fromStatus: SharedRecordStatus,
  toStatus: SharedRecordStatus,
  request: StateTransitionRequest
): { valid: boolean; error?: string } {
  // 1. planned -> active requires PTW or SIHO clearance reference
  if (fromStatus === 'planned' && toStatus === 'active') {
    if (!request.evidenceReference && !request.evidenceUrl) {
      return {
        valid: false,
        error: 'Para activar un expediente se requiere referencia a la evidencia mínima (ej. Permiso de Trabajo PTW o Aval SIHO).',
      };
    }
  }

  // 2. active -> under_review requires submission evidence (dossier, report or valuation)
  if (fromStatus === 'active' && toStatus === 'under_review') {
    if (!request.evidenceReference && !request.evidenceUrl) {
      return {
        valid: false,
        error: 'Para enviar a revisión se requiere referencia o enlace a la evidencia del expediente (ej. Valuación o Informe de Campo).',
      };
    }
  }

  // 3. under_review -> accepted requires approval evidence & normative ref
  if (fromStatus === 'under_review' && toStatus === 'accepted') {
    if (!request.evidenceReference && !request.evidenceUrl) {
      return {
        valid: false,
        error: 'La conformidad/aceptación del expediente requiere evidencia documental (ej. Certificate de Aceptación o Reporte CWI/NDT).',
      };
    }
    if (!request.motive || request.motive.trim().length < 10) {
      return {
        valid: false,
        error: 'La aceptación requiere un dictamen de conformidad de al menos 10 caracteres.',
      };
    }
  }

  // 4. Cancellation requires detailed reason
  if (toStatus === 'cancelled') {
    if (!request.motive || request.motive.trim().length < 10) {
      return {
        valid: false,
        error: 'La cancelación requiere un motivo detallado de al menos 10 caracteres.',
      };
    }
  }

  // 5. Default motive length check for other transitions
  if (!request.motive || request.motive.trim().length < 5) {
    return {
      valid: false,
      error: 'Se requiere un motivo explicativo de al menos 5 caracteres para la transición de estado.',
    };
  }

  return { valid: true };
}

/**
 * Core state transition executor that updates record, produces Approval, and returns AuditEvent
 */
export function executeStateTransition(
  record: SharedServiceRecord,
  request: StateTransitionRequest
): TransitionResult {
  // 1. Validate request payload schema
  const parsedReq = StateTransitionRequestSchema.safeParse(request);
  if (!parsedReq.success) {
    return {
      success: false,
      errorMessage: `Payload de transición inválido: ${parsedReq.error.issues.map((i) => i.message).join(', ')}`,
    };
  }

  // 2. Verify current status matches request
  if (record.status !== request.fromStatus) {
    return {
      success: false,
      errorMessage: `El estado actual del expediente (${record.status}) no coincide con el estado de origen solicitado (${request.fromStatus}).`,
    };
  }

  // 3. Verify valid graph transition
  if (!isTransitionAllowed(request.fromStatus, request.toStatus)) {
    return {
      success: false,
      errorMessage: `Transición de estado no permitida: de '${request.fromStatus}' a '${request.toStatus}'.`,
    };
  }

  // 4. Verify role authorization and org representation
  const isOperatorOrg = request.actorClaims.orgId === record.ownerOrgId;
  const isContractorOrg = request.actorClaims.orgId === record.contractorOrgId;

  if (!isOperatorOrg && !isContractorOrg) {
    return {
      success: false,
      errorMessage: `Acceso denegado: La organización '${request.actorClaims.orgId}' no representa ni al Operador ni a la Contratista de este expediente.`,
    };
  }

  const isAuthorized = isRoleAuthorizedForTransition(
    request.fromStatus,
    request.toStatus,
    request.actorClaims.role,
    isOperatorOrg
  );

  if (!isAuthorized) {
    return {
      success: false,
      errorMessage: `Acceso denegado: El rol '${request.actorClaims.role}' (${isOperatorOrg ? 'Operador' : 'Contratista'}) no está autorizado para realizar la transición de '${request.fromStatus}' a '${request.toStatus}'.`,
    };
  }

  // 5. Validate evidence
  const evidenceVal = validateTransitionEvidence(request.fromStatus, request.toStatus, request);
  if (!evidenceVal.valid) {
    return {
      success: false,
      errorMessage: evidenceVal.error,
    };
  }

  // 6. Generate IDs and Timestamps
  const now = new Date().toISOString();
  const approvalId = `appr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 7. Create Approval record
  const approval: Approval = {
    id: approvalId,
    recordId: record.id,
    fromStatus: request.fromStatus,
    toStatus: request.toStatus,
    actorUid: request.actorUid,
    actorEmail: request.actorEmail,
    actorOrgId: request.actorClaims.orgId,
    actorRole: request.actorClaims.role,
    approved: request.toStatus !== 'cancelled' && request.toStatus !== 'active' || request.fromStatus !== 'under_review',
    motive: request.motive,
    evidenceUrl: request.evidenceUrl,
    evidenceReference: request.evidenceReference,
    normativeRefId: request.normativeRefId,
    timestamp: now,
  };

  // 8. Create AuditEvent record
  const auditEvent: AuditEvent = {
    id: auditId,
    entityType: 'SharedServiceRecord',
    entityId: record.id,
    contractId: record.contractId,
    ownerOrgId: record.ownerOrgId,
    contractorOrgId: record.contractorOrgId,
    actorUid: request.actorUid,
    actorEmail: request.actorEmail,
    actorOrgId: request.actorClaims.orgId,
    effectiveRole: request.actorClaims.role,
    action: 'TRANSITION_STATUS',
    previousStatus: request.fromStatus,
    newStatus: request.toStatus,
    motive: request.motive,
    timestamp: now,
  };

  // 9. Update record
  const updatedRecord: SharedServiceRecord = {
    ...record,
    status: request.toStatus,
    latestApprovalId: approvalId,
    updatedAt: now,
  };

  return {
    success: true,
    record: updatedRecord,
    approval,
    auditEvent,
  };
}
