import { ParticipantRole, AuditEvent } from './types';

export interface VerifiedAuthClaims {
  uid: string;
  email: string;
  orgId: string;
  role: ParticipantRole;
  isSuperAdmin?: boolean;
}

export interface ClientPayloadWithOrgs {
  ownerOrgId?: string;
  contractorOrgId?: string;
  [key: string]: any;
}

export interface DerivedOrgContext {
  ownerOrgId: string;
  contractorOrgId: string;
  actorOrgId: string;
  isOperator: boolean;
  isContractor: boolean;
}

/**
 * Derives and validates ownerOrgId and contractorOrgId server-side from verified token claims
 * and target contract metadata. Fails if client attempts to spoof orgId.
 */
export function deriveServerOrgContext(
  claims: VerifiedAuthClaims,
  payload: ClientPayloadWithOrgs,
  contractMetadata: { ownerOrgId: string; contractorOrgId: string }
): { success: boolean; context?: DerivedOrgContext; error?: string; spoofAttemptDetected?: boolean } {
  // 1. Check if client payload attempted to override ownerOrgId or contractorOrgId with mismatched values
  let spoofAttemptDetected = false;
  if (payload.ownerOrgId && payload.ownerOrgId !== contractMetadata.ownerOrgId) {
    spoofAttemptDetected = true;
  }
  if (payload.contractorOrgId && payload.contractorOrgId !== contractMetadata.contractorOrgId) {
    spoofAttemptDetected = true;
  }

  if (spoofAttemptDetected) {
    return {
      success: false,
      spoofAttemptDetected: true,
      error: `Falsificación de orgId detectada: El cliente intentó enviar ownerOrgId '${payload.ownerOrgId}' o contractorOrgId '${payload.contractorOrgId}', lo cual no coincide con el registro legítimo del contrato ('${contractMetadata.ownerOrgId}' / '${contractMetadata.contractorOrgId}').`,
    };
  }

  // 2. Validate actor belongs to either the operator or contractor org
  const isOperator = claims.orgId === contractMetadata.ownerOrgId;
  const isContractor = claims.orgId === contractMetadata.contractorOrgId;

  if (!isOperator && !isContractor && !claims.isSuperAdmin) {
    return {
      success: false,
      error: `Acceso denegado: La organización del usuario autenticado ('${claims.orgId}') no coincide con el Operador ('${contractMetadata.ownerOrgId}') ni con la Contratista ('${contractMetadata.contractorOrgId}').`,
    };
  }

  return {
    success: true,
    context: {
      ownerOrgId: contractMetadata.ownerOrgId,
      contractorOrgId: contractMetadata.contractorOrgId,
      actorOrgId: claims.orgId,
      isOperator,
      isContractor,
    },
  };
}

/**
 * Helper to construct an AuditEvent for entity creation/mutation
 */
export function buildAuditEvent(params: {
  entityType: 'Contract' | 'Service' | 'WorkOrder' | 'SharedServiceRecord' | 'ExternalParticipant' | 'Approval';
  entityId: string;
  contractId: string;
  ownerOrgId: string;
  contractorOrgId: string;
  claims: VerifiedAuthClaims;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  motive: string;
}): AuditEvent {
  const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return {
    id: auditId,
    entityType: params.entityType,
    entityId: params.entityId,
    contractId: params.contractId,
    ownerOrgId: params.ownerOrgId,
    contractorOrgId: params.contractorOrgId,
    actorUid: params.claims.uid,
    actorEmail: params.claims.email,
    actorOrgId: params.claims.orgId,
    effectiveRole: params.claims.role,
    action: params.action,
    previousStatus: params.previousStatus as any,
    newStatus: params.newStatus as any,
    motive: params.motive,
    timestamp: new Date().toISOString(),
  };
}
