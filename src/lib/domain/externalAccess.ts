import {
  ExternalParticipant,
  ParticipantRole,
  AuditEvent,
} from './types';
import { ExternalParticipantSchema } from './schemas';

export interface ExternalAccessCheckRequest {
  participant: ExternalParticipant;
  targetOwnerOrgId: string;
  targetContractId: string;
  targetServiceId?: string;
  targetWorkOrderId?: string;
  nowISO?: string;
}

export interface ExternalAccessResult {
  granted: boolean;
  reason?: string;
  code?: 'EXPIRED' | 'REVOKED' | 'SCOPE_MISMATCH' | 'TENANT_MISMATCH' | 'VALID';
}

/**
 * Evaluates whether an ExternalParticipant is authorized to access a given Contract, Service, or Work Order.
 * STRICT SECURITY: An external participant NEVER gains global tenant access to targetOwnerOrgId.
 */
export function verifyExternalAccess(req: ExternalAccessCheckRequest): ExternalAccessResult {
  const { participant, targetOwnerOrgId, targetContractId, targetServiceId, targetWorkOrderId } = req;
  const now = req.nowISO ? new Date(req.nowISO) : new Date();

  // 1. Verify target tenant match
  if (participant.targetOrgId !== targetOwnerOrgId) {
    return {
      granted: false,
      code: 'TENANT_MISMATCH',
      reason: `Acceso denegado: El participante externo está registrado para la organización '${participant.targetOrgId}', no para '${targetOwnerOrgId}'.`,
    };
  }

  // 2. Check if access is explicitly revoked
  if (participant.revoked) {
    return {
      granted: false,
      code: 'REVOKED',
      reason: `Acceso denegado: La acreditación de acceso del participante externo fue revocada el ${participant.revokedAt || 'previamente'} por ${participant.revokedBy || 'administración'}. Motivo: ${participant.revocationReason || 'No especificado'}.`,
    };
  }

  // 3. Check expiration
  const expiresAtDate = new Date(participant.expiresAt);
  if (expiresAtDate <= now) {
    return {
      granted: false,
      code: 'EXPIRED',
      reason: `Acceso denegado: La acreditación de acceso del participante expiró el ${participant.expiresAt}.`,
    };
  }

  // 4. Check Contract scope
  if (participant.contractId !== targetContractId) {
    return {
      granted: false,
      code: 'SCOPE_MISMATCH',
      reason: `Acceso denegado fuera de alcance: El participante sólo tiene permiso sobre el contrato '${participant.contractId}', no sobre '${targetContractId}'.`,
    };
  }

  // 5. Check Service scope if participant scope is restricted to a specific service
  if (participant.serviceId && targetServiceId && participant.serviceId !== targetServiceId) {
    return {
      granted: false,
      code: 'SCOPE_MISMATCH',
      reason: `Acceso denegado fuera de alcance: El participante está acotado al servicio '${participant.serviceId}', no a '${targetServiceId}'.`,
    };
  }

  // 6. Check WorkOrder scope if participant scope is restricted to a specific work order
  if (participant.workOrderId && targetWorkOrderId && participant.workOrderId !== targetWorkOrderId) {
    return {
      granted: false,
      code: 'SCOPE_MISMATCH',
      reason: `Acceso denegado fuera de alcance: El participante está acotado a la orden de trabajo '${participant.workOrderId}', no a '${targetWorkOrderId}'.`,
    };
  }

  return {
    granted: true,
    code: 'VALID',
  };
}

/**
 * Grants acotado (scoped) access to an external participant
 */
export function createExternalParticipant(params: {
  email: string;
  fullName: string;
  externalOrgId: string;
  targetOrgId: string;
  contractId: string;
  serviceId?: string;
  workOrderId?: string;
  role: ParticipantRole;
  grantedByUid: string;
  grantedByEmail: string;
  grantedByRole: ParticipantRole;
  durationDays?: number; // default 30 days
}): { participant: ExternalParticipant; auditEvent: AuditEvent } {
  const now = new Date();
  const duration = params.durationDays ?? 30;
  const expiresAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000).toISOString();
  const participantId = `part_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const participant: ExternalParticipant = {
    id: participantId,
    email: params.email,
    fullName: params.fullName,
    externalOrgId: params.externalOrgId,
    targetOrgId: params.targetOrgId,
    contractId: params.contractId,
    serviceId: params.serviceId,
    workOrderId: params.workOrderId,
    role: params.role,
    grantedBy: params.grantedByUid,
    grantedAt: now.toISOString(),
    expiresAt,
    revoked: false,
  };

  // Validate created participant schema
  ExternalParticipantSchema.parse(participant);

  const auditEvent: AuditEvent = {
    id: auditId,
    entityType: 'ExternalParticipant',
    entityId: participantId,
    contractId: params.contractId,
    ownerOrgId: params.targetOrgId,
    contractorOrgId: params.externalOrgId,
    actorUid: params.grantedByUid,
    actorEmail: params.grantedByEmail,
    actorOrgId: params.targetOrgId,
    effectiveRole: params.grantedByRole,
    action: 'GRANT_EXTERNAL_ACCESS',
    motive: `Otorgado acceso externo acotado a ${params.email} para contrato ${params.contractId} con vigencia de ${duration} días.`,
    timestamp: now.toISOString(),
  };

  return { participant, auditEvent };
}

/**
 * Explicitly revokes access for an external participant
 */
export function revokeExternalParticipant(params: {
  participant: ExternalParticipant;
  revokedByUid: string;
  revokedByEmail: string;
  revokedByOrgId: string;
  revokedByRole: ParticipantRole;
  reason: string;
}): { participant: ExternalParticipant; auditEvent: AuditEvent } {
  const now = new Date().toISOString();
  const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const updatedParticipant: ExternalParticipant = {
    ...params.participant,
    revoked: true,
    revokedAt: now,
    revokedBy: params.revokedByUid,
    revocationReason: params.reason,
  };

  const auditEvent: AuditEvent = {
    id: auditId,
    entityType: 'ExternalParticipant',
    entityId: params.participant.id,
    contractId: params.participant.contractId,
    ownerOrgId: params.participant.targetOrgId,
    contractorOrgId: params.participant.externalOrgId,
    actorUid: params.revokedByUid,
    actorEmail: params.revokedByEmail,
    actorOrgId: params.revokedByOrgId,
    effectiveRole: params.revokedByRole,
    action: 'REVOKE_EXTERNAL_ACCESS',
    motive: `Revocado acceso externo para ${params.participant.email}. Motivo: ${params.reason}`,
    timestamp: now,
  };

  return { participant: updatedParticipant, auditEvent };
}
