import { z } from 'zod';

export const SharedRecordStatusSchema = z.enum([
  'draft',
  'planned',
  'active',
  'under_review',
  'accepted',
  'closed',
  'cancelled',
]);

export const ParticipantRoleSchema = z.enum([
  'operador_gerente',
  'operador_inspector',
  'operador_cwi',
  'contratista_gerente',
  'contratista_supervisor',
  'inspector_externo',
  'auditor_externo',
]);

export const NormativeReferenceSchema = z.object({
  id: z.string().min(1, 'ID de norma es obligatorio'),
  source: z.string().min(1, 'Fuente normativa es obligatoria'),
  version: z.string().min(1, 'Versión normativa es obligatoria'),
  page: z.string().min(1, 'Página es obligatoria'),
  section: z.string().min(1, 'Sección es obligatoria'),
  requirementDescription: z.string().min(1, 'Descripción del requisito es obligatoria'),
  humanApprover: z.string().optional(),
  isVerified: z.boolean().default(false),
});

export const ContractSchema = z.object({
  id: z.string().min(1),
  ownerOrgId: z.string().min(1, 'ownerOrgId (Operador) es obligatorio'),
  contractorOrgId: z.string().min(1, 'contractorOrgId (Contratista) es obligatorio'),
  code: z.string().min(3, 'Código de contrato debe tener al menos 3 caracteres'),
  title: z.string().min(5, 'Título de contrato debe tener al menos 5 caracteres'),
  scope: z.string().min(10, 'Alcance debe tener al menos 10 caracteres'),
  status: z.enum(['draft', 'active', 'suspended', 'closed', 'terminated']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha de inicio debe ser YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha de fin debe ser YYYY-MM-DD'),
  budgetAmount: z.number().nonnegative('Monto de presupuesto debe ser positivo o cero'),
  currency: z.string().default('USD'),
  normativeRefs: z.array(NormativeReferenceSchema).min(1, 'Debe incluir al menos una referencia normativa'),
  createdAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T/)),
  updatedAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T/)),
});

export const ServiceSchema = z.object({
  id: z.string().min(1),
  contractId: z.string().min(1, 'contractId es obligatorio'),
  ownerOrgId: z.string().min(1, 'ownerOrgId es obligatorio'),
  contractorOrgId: z.string().min(1, 'contractorOrgId es obligatorio'),
  code: z.string().min(3),
  title: z.string().min(3),
  description: z.string().min(5),
  lineItemsCount: z.number().int().nonnegative(),
  totalAmount: z.number().nonnegative(),
  operatorLeadUid: z.string().min(1),
  contractorLeadUid: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const WorkOrderSchema = z.object({
  id: z.string().min(1),
  serviceId: z.string().min(1),
  contractId: z.string().min(1),
  ownerOrgId: z.string().min(1),
  contractorOrgId: z.string().min(1),
  code: z.string().min(3),
  title: z.string().min(3),
  frontName: z.string().min(2),
  crewName: z.string().min(2),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: SharedRecordStatusSchema,
  ptwRequired: z.boolean().default(true),
  ptwId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ExternalParticipantSchema = z.object({
  id: z.string().min(1),
  email: z.string().email('Email inválido'),
  fullName: z.string().min(2, 'Nombre completo obligatorio'),
  externalOrgId: z.string().min(1, 'externalOrgId es obligatorio'),
  targetOrgId: z.string().min(1, 'targetOrgId es obligatorio'),
  contractId: z.string().min(1, 'contractId es obligatorio'),
  serviceId: z.string().optional(),
  workOrderId: z.string().optional(),
  role: ParticipantRoleSchema,
  grantedBy: z.string().min(1, 'Otorgado por UID es obligatorio'),
  grantedAt: z.string(),
  expiresAt: z.string(),
  revoked: z.boolean().default(false),
  revokedAt: z.string().optional(),
  revokedBy: z.string().optional(),
  revocationReason: z.string().optional(),
});

export const ApprovalSchema = z.object({
  id: z.string().min(1),
  recordId: z.string().min(1),
  fromStatus: SharedRecordStatusSchema,
  toStatus: SharedRecordStatusSchema,
  actorUid: z.string().min(1),
  actorEmail: z.string().email(),
  actorOrgId: z.string().min(1),
  actorRole: ParticipantRoleSchema,
  approved: z.boolean(),
  motive: z.string().min(5, 'El motivo debe tener al menos 5 caracteres'),
  evidenceUrl: z.string().url('URL de evidencia inválida').optional().or(z.literal('')),
  evidenceReference: z.string().optional(),
  normativeRefId: z.string().optional(),
  timestamp: z.string(),
});

export const SharedServiceRecordSchema = z.object({
  id: z.string().min(1),
  contractId: z.string().min(1),
  serviceId: z.string().min(1),
  workOrderId: z.string().min(1),
  ownerOrgId: z.string().min(1),
  contractorOrgId: z.string().min(1),
  projectId: z.string().min(1),
  title: z.string().min(5),
  description: z.string().min(10),
  status: SharedRecordStatusSchema,
  participants: z.array(ExternalParticipantSchema),
  latestApprovalId: z.string().optional(),
  normativeRefs: z.array(NormativeReferenceSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string().min(1),
});

export const AuditEventSchema = z.object({
  id: z.string().min(1),
  entityType: z.enum(['Contract', 'Service', 'WorkOrder', 'SharedServiceRecord', 'ExternalParticipant', 'Approval']),
  entityId: z.string().min(1),
  contractId: z.string().min(1),
  ownerOrgId: z.string().min(1),
  contractorOrgId: z.string().min(1),
  actorUid: z.string().min(1),
  actorEmail: z.string().email(),
  actorOrgId: z.string().min(1),
  effectiveRole: ParticipantRoleSchema,
  action: z.string().min(3),
  previousStatus: SharedRecordStatusSchema.optional(),
  newStatus: SharedRecordStatusSchema.optional(),
  motive: z.string().min(3),
  timestamp: z.string(),
  ipAddress: z.string().optional(),
});

export const StateTransitionRequestSchema = z.object({
  recordId: z.string().min(1),
  fromStatus: SharedRecordStatusSchema,
  toStatus: SharedRecordStatusSchema,
  actorUid: z.string().min(1),
  actorEmail: z.string().email(),
  actorClaims: z.object({
    orgId: z.string().min(1),
    role: ParticipantRoleSchema,
  }),
  motive: z.string().min(5, 'El motivo debe tener al menos 5 caracteres'),
  evidenceUrl: z.string().optional(),
  evidenceReference: z.string().optional(),
  normativeRefId: z.string().optional(),
});
