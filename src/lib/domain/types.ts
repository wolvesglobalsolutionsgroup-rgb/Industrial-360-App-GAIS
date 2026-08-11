export type SharedRecordStatus =
  | 'draft'
  | 'planned'
  | 'active'
  | 'under_review'
  | 'accepted'
  | 'closed'
  | 'cancelled';

export type ParticipantRole =
  | 'operador_gerente'
  | 'operador_inspector'
  | 'operador_cwi'
  | 'contratista_gerente'
  | 'contratista_supervisor'
  | 'inspector_externo'
  | 'auditor_externo';

export interface NormativeReference {
  id: string;
  source: string; // e.g., 'Manual Corporativo de Contratación PDVSA (Marzo 2024)' or 'PDVSA SI-S-04'
  version: string; // e.g., 'Marzo 2024'
  page: string;
  section: string;
  requirementDescription: string;
  humanApprover?: string;
  isVerified: boolean;
}

export interface Contract {
  id: string;
  ownerOrgId: string; // Operador (e.g. PDVSA / Consorcio)
  contractorOrgId: string; // Empresa Contratista
  code: string; // e.g. CTO-2026-QA-089
  title: string;
  scope: string;
  status: 'draft' | 'active' | 'suspended' | 'closed' | 'terminated';
  startDate: string; // ISO Date YYYY-MM-DD
  endDate: string; // ISO Date YYYY-MM-DD
  budgetAmount: number;
  currency: string;
  normativeRefs: NormativeReference[];
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  contractId: string;
  ownerOrgId: string;
  contractorOrgId: string;
  code: string; // e.g. SERV-MEC-01
  title: string;
  description: string;
  lineItemsCount: number;
  totalAmount: number;
  operatorLeadUid: string;
  contractorLeadUid: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrder {
  id: string;
  serviceId: string;
  contractId: string;
  ownerOrgId: string;
  contractorOrgId: string;
  code: string; // e.g. OT-2026-001
  title: string;
  frontName: string; // e.g. Frente San Mateo KP 4+200
  crewName: string; // e.g. Cuadrilla Mecánica N° 1
  startDate: string;
  dueDate: string;
  status: SharedRecordStatus;
  ptwRequired: boolean;
  ptwId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExternalParticipant {
  id: string;
  email: string;
  fullName: string;
  externalOrgId: string; // Contractor or Audit firm orgId
  targetOrgId: string; // Operator ownerOrgId
  contractId: string;
  serviceId?: string;
  workOrderId?: string;
  role: ParticipantRole;
  grantedBy: string; // Operator user UID
  grantedAt: string; // ISO Timestamp
  expiresAt: string; // ISO Timestamp
  revoked: boolean;
  revokedAt?: string;
  revokedBy?: string;
  revocationReason?: string;
}

export interface Approval {
  id: string;
  recordId: string;
  fromStatus: SharedRecordStatus;
  toStatus: SharedRecordStatus;
  actorUid: string;
  actorEmail: string;
  actorOrgId: string; // Org represented
  actorRole: ParticipantRole;
  approved: boolean;
  motive: string;
  evidenceUrl?: string;
  evidenceReference?: string; // e.g. "Acta de Conformidad N° 104"
  normativeRefId?: string;
  timestamp: string;
}

export interface SharedServiceRecord {
  id: string;
  contractId: string;
  serviceId: string;
  workOrderId: string;
  ownerOrgId: string; // Operator
  contractorOrgId: string; // Contractor
  projectId: string;
  title: string;
  description: string;
  status: SharedRecordStatus;
  participants: ExternalParticipant[];
  latestApprovalId?: string;
  normativeRefs: NormativeReference[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface AuditEvent {
  id: string;
  entityType: 'Contract' | 'Service' | 'WorkOrder' | 'SharedServiceRecord' | 'ExternalParticipant' | 'Approval';
  entityId: string;
  contractId: string;
  ownerOrgId: string;
  contractorOrgId: string;
  actorUid: string;
  actorEmail: string;
  actorOrgId: string;
  effectiveRole: ParticipantRole;
  action: string; // e.g. 'TRANSITION_STATUS', 'GRANT_PARTICIPANT', 'REVOKE_PARTICIPANT', 'CREATE_CONTRACT'
  previousStatus?: SharedRecordStatus | string;
  newStatus?: SharedRecordStatus | string;
  motive: string;
  timestamp: string;
  ipAddress?: string;
}

export interface StateTransitionRequest {
  recordId: string;
  fromStatus: SharedRecordStatus;
  toStatus: SharedRecordStatus;
  actorUid: string;
  actorEmail: string;
  actorClaims: {
    orgId: string;
    role: ParticipantRole;
  };
  motive: string;
  evidenceUrl?: string;
  evidenceReference?: string;
  normativeRefId?: string;
}

export interface TransitionResult {
  success: boolean;
  record?: SharedServiceRecord;
  approval?: Approval;
  auditEvent?: AuditEvent;
  errorMessage?: string;
}

/*
 * =================================================================================
 * FORMATO MAESTRO DE ENTREGABLES (FORMATO-MAESTRO-DELIVERABLE.MD) - TYPES
 * =================================================================================
 */

export type DeliverableLifecycleStatus =
  | 'DRAFT'
  | 'FOR_REVIEW'
  | 'APPROVED_VIGENTE'
  | 'ISSUED_ACTIVE'
  | 'CLOSED_ARCHIVED';

export interface DeliverableDigitalSignature {
  signerUid: string;
  signerName: string;
  signerRole: string; // e.g. 'Elaboró', 'Revisó', 'Aprobó'
  signedAt: string;
  signatureHash?: string;
  motive?: string;
}

export interface DeliverableHeader {
  proyecto: string;
  workPackageId: string;
  codigoDocumento: string;
  titulo: string;
  normaAplicable: string;
  revision: string;
  fecha: string;
  estatus: DeliverableLifecycleStatus;
  operadorLogoVisible: boolean;
  contratistaLogoVisible: boolean;
  showOperatorLogo?: boolean;
  showContractorLogo?: boolean;
  operadorNombre?: string;
  contratistaNombre?: string;
  operadorLogoUrl?: string;
  contratistaLogoUrl?: string;
  tenantId: string;
  contractorOrgId?: string;
}

export interface DeliverableControlItem {
  checkId: string;
  checkName: string;
  status: 'CONFORME' | 'NO_CONFORME' | 'NO_APLICA' | 'PENDIENTE';
  normativeRef?: string;
  comments?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface DeliverableBody {
  datosOrigen: Record<string, any>;
  matrizControl: DeliverableControlItem[];
  seccionesEspecificas: Record<string, any>;
}

export interface DeliverableFooter {
  firmasDigitales: DeliverableDigitalSignature[];
  visualVersionHash: string;
  qrVerificationUrl: string;
  timestampRFC3161?: string;
  archivedAt?: string;
}

export interface MasterDeliverable {
  id: string;
  workflowId: string; // WF-043, WF-044, WF-046, WF-052, WF-053, WF-074, WF-075, etc.
  header: DeliverableHeader;
  body: DeliverableBody;
  footer: DeliverableFooter;
  createdAt: string;
  updatedAt: string;
}

