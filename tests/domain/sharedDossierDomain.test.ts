import { describe, it, expect } from 'vitest';
import {
  ContractSchema,
  ServiceSchema,
  WorkOrderSchema,
  ExternalParticipantSchema,
  ApprovalSchema,
  SharedServiceRecordSchema,
  AuditEventSchema,
  StateTransitionRequestSchema,
  isTransitionAllowed,
  isRoleAuthorizedForTransition,
  validateTransitionEvidence,
  executeStateTransition,
  verifyExternalAccess,
  createExternalParticipant,
  revokeExternalParticipant,
  deriveServerOrgContext,
  buildAuditEvent,
  SharedServiceRecord,
  StateTransitionRequest,
} from '../../src/lib/domain';

describe('Sprint E1: Shared Service Record Domain Model (Contratista-Operador)', () => {
  const OPERATOR_ORG = 'pdvsa-occidente-prod';
  const CONTRACTOR_ORG = 'semax-servicios-ca';
  const OTHER_ORG = 'malicious-third-party-org';

  const mockNormativeRef = {
    id: 'NORM-PDVSA-MC-2024-S3',
    source: 'Manual Corporativo de Contratación PDVSA (Marzo 2024)',
    version: 'Marzo 2024',
    page: '42',
    section: 'Sección 3.2.1 - Supervisión e Inspección Técnica',
    requirementDescription: 'Exige emisión de Acta de Conformidad firmada por el Representante del Contratante y el Inspector CWI.',
    isVerified: true,
    humanApprover: 'Ing. Carlos Mendoza (CWI-PDVSA)',
  };

  const mockContract = {
    id: 'cto-2026-qa-001',
    ownerOrgId: OPERATOR_ORG,
    contractorOrgId: CONTRACTOR_ORG,
    code: 'CTO-2026-QA-089',
    title: 'Mantenimiento Mayor de Oleoducto San Mateo 24"',
    scope: 'Inspección de soldaduras NDT, reemplazo de niples corroídos y revestimiento epóxico.',
    status: 'active' as const,
    startDate: '2026-01-15',
    endDate: '2026-12-31',
    budgetAmount: 1500000,
    currency: 'USD',
    normativeRefs: [mockNormativeRef],
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-01-10T10:00:00Z',
  };

  const mockService = {
    id: 'serv-2026-001',
    contractId: mockContract.id,
    ownerOrgId: OPERATOR_ORG,
    contractorOrgId: CONTRACTOR_ORG,
    code: 'SERV-MEC-01',
    title: 'Servicios de Mecánica de Tuberías y Ensaye No Destructivo',
    description: 'Ejecución de ensayos ultrasonido phased array y gammagrafía.',
    lineItemsCount: 12,
    totalAmount: 450000,
    operatorLeadUid: 'usr-pdvsa-lead-01',
    contractorLeadUid: 'usr-semax-lead-01',
    createdAt: '2026-01-11T10:00:00Z',
    updatedAt: '2026-01-11T10:00:00Z',
  };

  const mockWorkOrder = {
    id: 'ot-2026-001',
    serviceId: mockService.id,
    contractId: mockContract.id,
    ownerOrgId: OPERATOR_ORG,
    contractorOrgId: CONTRACTOR_ORG,
    code: 'OT-2026-001',
    title: 'Inspección NDT Junta de Cierre KP 4+200',
    frontName: 'Frente San Mateo KP 4+200',
    crewName: 'Cuadrilla NDT Especializada N° 2',
    startDate: '2026-02-01',
    dueDate: '2026-02-15',
    status: 'planned' as const,
    ptwRequired: true,
    ptwId: 'PTW-2026-SANMATEO-089',
    createdAt: '2026-01-12T10:00:00Z',
    updatedAt: '2026-01-12T10:00:00Z',
  };

  const mockInitialRecord: SharedServiceRecord = {
    id: 'ssr-2026-001',
    contractId: mockContract.id,
    serviceId: mockService.id,
    workOrderId: mockWorkOrder.id,
    ownerOrgId: OPERATOR_ORG,
    contractorOrgId: CONTRACTOR_ORG,
    projectId: 'proj-sanmateo-2026',
    title: 'Expediente Compartido de Junta NDT 24" KP 4+200',
    description: 'Expediente técnico con registro de ultrasonido, radiografía e informe de inspección CWI.',
    status: 'draft',
    participants: [],
    normativeRefs: [mockNormativeRef],
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-02-01T08:00:00Z',
    createdBy: 'usr-semax-lead-01',
  };

  describe('1. Validaciones de Esquemas Zod', () => {
    it('Valida correctamente un contrato, servicio y orden de trabajo válidos', () => {
      expect(ContractSchema.safeParse(mockContract).success).toBe(true);
      expect(ServiceSchema.safeParse(mockService).success).toBe(true);
      expect(WorkOrderSchema.safeParse(mockWorkOrder).success).toBe(true);
      expect(SharedServiceRecordSchema.safeParse(mockInitialRecord).success).toBe(true);
    });

    it('Rechaza contrato con presupuesto negativo o sin referencias normativas', () => {
      const invalidContract = { ...mockContract, budgetAmount: -500, normativeRefs: [] };
      const res = ContractSchema.safeParse(invalidContract);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues.some((i) => i.path.includes('budgetAmount') || i.path.includes('normativeRefs'))).toBe(true);
      }
    });

    it('Rechaza estado de expediente no permitido en Zod', () => {
      const invalidRecord = { ...mockInitialRecord, status: 'approved_invalid_status' };
      expect(SharedServiceRecordSchema.safeParse(invalidRecord).success).toBe(false);
    });
  });

  describe('2. Derivación Server-Side y Protección Anti-Spoofing de orgId', () => {
    it('Permite derivar orgContext si las orgs coinciden legítimamente', () => {
      const claims = {
        uid: 'usr-semax-lead-01',
        email: 'supervisor@semax.com',
        orgId: CONTRACTOR_ORG,
        role: 'contratista_supervisor' as const,
      };

      const res = deriveServerOrgContext(claims, {}, { ownerOrgId: OPERATOR_ORG, contractorOrgId: CONTRACTOR_ORG });
      expect(res.success).toBe(true);
      expect(res.context?.isContractor).toBe(true);
      expect(res.context?.isOperator).toBe(false);
      expect(res.context?.ownerOrgId).toBe(OPERATOR_ORG);
      expect(res.context?.contractorOrgId).toBe(CONTRACTOR_ORG);
    });

    it('RECHAZA Y DETECTA intento de falsificación (spoofing) de ownerOrgId o contractorOrgId desde el cliente', () => {
      const claims = {
        uid: 'usr-attacker-01',
        email: 'attacker@thirdparty.com',
        orgId: OTHER_ORG,
        role: 'operador_gerente' as const,
      };

      const spoofPayload = {
        ownerOrgId: OTHER_ORG, // Cliente intenta suplantar el ownerOrgId legítimo
      };

      const res = deriveServerOrgContext(
        claims,
        spoofPayload,
        { ownerOrgId: OPERATOR_ORG, contractorOrgId: CONTRACTOR_ORG }
      );

      expect(res.success).toBe(false);
      expect(res.spoofAttemptDetected).toBe(true);
      expect(res.error).toContain('Falsificación de orgId detectada');
    });

    it('RECHAZA acceso a usuario cuya organización no es ni Operador ni Contratista', () => {
      const claims = {
        uid: 'usr-intruder',
        email: 'intruder@random.com',
        orgId: OTHER_ORG,
        role: 'operador_gerente' as const,
      };

      const res = deriveServerOrgContext(claims, {}, { ownerOrgId: OPERATOR_ORG, contractorOrgId: CONTRACTOR_ORG });
      expect(res.success).toBe(false);
      expect(res.error).toContain('no coincide con el Operador');
    });
  });

  describe('3. Máquina de Estados y Matriz de Autorización', () => {
    it('Permite la secuencia completa de transición permitida: draft -> planned -> active -> under_review -> accepted -> closed', () => {
      // 1. draft -> planned
      expect(isTransitionAllowed('draft', 'planned')).toBe(true);
      // 2. planned -> active
      expect(isTransitionAllowed('planned', 'active')).toBe(true);
      // 3. active -> under_review
      expect(isTransitionAllowed('active', 'under_review')).toBe(true);
      // 4. under_review -> accepted
      expect(isTransitionAllowed('under_review', 'accepted')).toBe(true);
      // 5. accepted -> closed
      expect(isTransitionAllowed('accepted', 'closed')).toBe(true);
    });

    it('Rechaza transiciones no válidas en el grafo de estados (ej. draft -> accepted directo)', () => {
      expect(isTransitionAllowed('draft', 'accepted')).toBe(false);
      expect(isTransitionAllowed('active', 'closed')).toBe(false);
      expect(isTransitionAllowed('closed', 'active')).toBe(false);
    });

    it('RECHAZA que la Contratista (o rol de campo) auto-acepte el expediente (under_review -> accepted)', () => {
      const contractorCanAccept = isRoleAuthorizedForTransition(
        'under_review',
        'accepted',
        'contratista_supervisor',
        false // isOperatorOrg = false
      );
      expect(contractorCanAccept).toBe(false);

      const contractorGerenteCanAccept = isRoleAuthorizedForTransition(
        'under_review',
        'accepted',
        'contratista_gerente',
        false // isOperatorOrg = false
      );
      expect(contractorGerenteCanAccept).toBe(false);
    });

    it('PERMITE que el Operador (Gerente/Inspector/CWI) acepte la conformidad (under_review -> accepted)', () => {
      const operatorInspectorCanAccept = isRoleAuthorizedForTransition(
        'under_review',
        'accepted',
        'operador_inspector',
        true // isOperatorOrg = true
      );
      expect(operatorInspectorCanAccept).toBe(true);

      const operatorCwiCanAccept = isRoleAuthorizedForTransition(
        'under_review',
        'accepted',
        'operador_cwi',
        true
      );
      expect(operatorCwiCanAccept).toBe(true);
    });

    it('RECHAZA que el Auditor Externo ejecute transiciones de estado (acceso estrictamente de lectura)', () => {
      const auditorCanTransition = isRoleAuthorizedForTransition(
        'draft',
        'planned',
        'auditor_externo',
        false
      );
      expect(auditorCanTransition).toBe(false);
    });
  });

  describe('4. Validación de Evidencia Mínima para Transición', () => {
    it('Falla si no se adjunta evidencia mínima al activar (planned -> active)', () => {
      const req: StateTransitionRequest = {
        recordId: mockInitialRecord.id,
        fromStatus: 'planned',
        toStatus: 'active',
        actorUid: 'usr-pdvsa-01',
        actorEmail: 'inspector@pdvsa.com',
        actorClaims: { orgId: OPERATOR_ORG, role: 'operador_inspector' },
        motive: 'Activación de orden',
        // Sin evidencia Url ni Reference
      };

      const val = validateTransitionEvidence('planned', 'active', req);
      expect(val.valid).toBe(false);
      expect(val.error).toContain('se requiere referencia a la evidencia mínima');
    });

    it('Falla si el motivo de aceptación es demasiado corto o carece de evidencia', () => {
      const req: StateTransitionRequest = {
        recordId: mockInitialRecord.id,
        fromStatus: 'under_review',
        toStatus: 'accepted',
        actorUid: 'usr-pdvsa-cwi',
        actorEmail: 'cwi@pdvsa.com',
        actorClaims: { orgId: OPERATOR_ORG, role: 'operador_cwi' },
        motive: 'OK', // < 10 chars
        evidenceReference: 'Acta de Conformidad N° 101',
      };

      const val = validateTransitionEvidence('under_review', 'accepted', req);
      expect(val.valid).toBe(false);
      expect(val.error).toContain('dictamen de conformidad de al menos 10 caracteres');
    });
  });

  describe('5. Ejecución Integral de Transiciones y Generación de Auditoría', () => {
    it('Ejecuta exitosamente la transición de draft -> planned produciendo registro de aprobación y AuditEvent', () => {
      const req: StateTransitionRequest = {
        recordId: mockInitialRecord.id,
        fromStatus: 'draft',
        toStatus: 'planned',
        actorUid: 'usr-semax-01',
        actorEmail: 'supervisor@semax.com',
        actorClaims: { orgId: CONTRACTOR_ORG, role: 'contratista_supervisor' },
        motive: 'Planificación técnica completada para frentes KP 4+200',
        evidenceReference: 'Plan de Trabajo N° PT-2026-08',
      };

      const result = executeStateTransition(mockInitialRecord, req);
      expect(result.success).toBe(true);
      expect(result.record?.status).toBe('planned');
      expect(result.approval).toBeDefined();
      expect(result.approval?.actorOrgId).toBe(CONTRACTOR_ORG);
      expect(result.auditEvent).toBeDefined();
      expect(result.auditEvent?.action).toBe('TRANSITION_STATUS');
      expect(result.auditEvent?.previousStatus).toBe('draft');
      expect(result.auditEvent?.newStatus).toBe('planned');
    });

    it('Falla la transición si un rol no autorizado (contratista_supervisor) intenta mover de under_review a accepted', () => {
      const recordInReview: SharedServiceRecord = {
        ...mockInitialRecord,
        status: 'under_review',
      };

      const unauthorizedReq: StateTransitionRequest = {
        recordId: recordInReview.id,
        fromStatus: 'under_review',
        toStatus: 'accepted',
        actorUid: 'usr-semax-01',
        actorEmail: 'supervisor@semax.com',
        actorClaims: { orgId: CONTRACTOR_ORG, role: 'contratista_supervisor' },
        motive: 'Intentando auto-aprobar el trabajo realizado',
        evidenceReference: 'Informe de Trabajo Propio',
      };

      const result = executeStateTransition(recordInReview, unauthorizedReq);
      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('Acceso denegado: El rol');
    });
  });

  describe('6. Acceso Externo Acotado (ExternalParticipant) y Aislamiento por Contrato', () => {
    it('Otorga acceso acotado a un inspector externo y valida acceso exitoso sobre su contrato', () => {
      const { participant, auditEvent } = createExternalParticipant({
        email: 'inspector.externo@qualitas.com',
        fullName: 'Ing. Roberto Silva (Qualitas CWI)',
        externalOrgId: 'qualitas-inspectores-org',
        targetOrgId: OPERATOR_ORG,
        contractId: mockContract.id,
        serviceId: mockService.id,
        role: 'inspector_externo',
        grantedByUid: 'usr-pdvsa-gerente',
        grantedByEmail: 'gerente@pdvsa.com',
        grantedByRole: 'operador_gerente',
        durationDays: 15,
      });

      expect(participant.revoked).toBe(false);
      expect(auditEvent.action).toBe('GRANT_EXTERNAL_ACCESS');

      // Acceso valido sobre el contrato asignado
      const accessVal = verifyExternalAccess({
        participant,
        targetOwnerOrgId: OPERATOR_ORG,
        targetContractId: mockContract.id,
        targetServiceId: mockService.id,
      });

      expect(accessVal.granted).toBe(true);
      expect(accessVal.code).toBe('VALID');
    });

    it('PRUEBA NEGATIVA: Deniega acceso si el participante externo intenta acceder a OTRO contrato del mismo operador', () => {
      const { participant } = createExternalParticipant({
        email: 'inspector.externo@qualitas.com',
        fullName: 'Ing. Roberto Silva',
        externalOrgId: 'qualitas-inspectores-org',
        targetOrgId: OPERATOR_ORG,
        contractId: mockContract.id, // Asignado a CTO-2026-QA-001
        role: 'inspector_externo',
        grantedByUid: 'usr-pdvsa-gerente',
        grantedByEmail: 'gerente@pdvsa.com',
        grantedByRole: 'operador_gerente',
      });

      // Intenta acceder a contrato cto-2026-SECRET-999
      const accessVal = verifyExternalAccess({
        participant,
        targetOwnerOrgId: OPERATOR_ORG,
        targetContractId: 'cto-2026-SECRET-999',
      });

      expect(accessVal.granted).toBe(false);
      expect(accessVal.code).toBe('SCOPE_MISMATCH');
      expect(accessVal.reason).toContain('Acceso denegado fuera de alcance');
    });

    it('PRUEBA NEGATIVA: Deniega acceso a participante expirado', () => {
      const { participant } = createExternalParticipant({
        email: 'inspector.expirado@qualitas.com',
        fullName: 'Ing. Ana Torres',
        externalOrgId: 'qualitas-inspectores-org',
        targetOrgId: OPERATOR_ORG,
        contractId: mockContract.id,
        role: 'inspector_externo',
        grantedByUid: 'usr-pdvsa-gerente',
        grantedByEmail: 'gerente@pdvsa.com',
        grantedByRole: 'operador_gerente',
        durationDays: -1, // Expiró ayer
      });

      const accessVal = verifyExternalAccess({
        participant,
        targetOwnerOrgId: OPERATOR_ORG,
        targetContractId: mockContract.id,
      });

      expect(accessVal.granted).toBe(false);
      expect(accessVal.code).toBe('EXPIRED');
      expect(accessVal.reason).toContain('expiró el');
    });

    it('PRUEBA NEGATIVA: Deniega acceso tras revocación explícita y genera AuditEvent', () => {
      const { participant } = createExternalParticipant({
        email: 'inspector.revocado@qualitas.com',
        fullName: 'Ing. Mario Gomez',
        externalOrgId: 'qualitas-inspectores-org',
        targetOrgId: OPERATOR_ORG,
        contractId: mockContract.id,
        role: 'inspector_externo',
        grantedByUid: 'usr-pdvsa-gerente',
        grantedByEmail: 'gerente@pdvsa.com',
        grantedByRole: 'operador_gerente',
      });

      // Revocar acceso
      const { participant: revokedParticipant, auditEvent } = revokeExternalParticipant({
        participant,
        revokedByUid: 'usr-pdvsa-gerente',
        revokedByEmail: 'gerente@pdvsa.com',
        revokedByOrgId: OPERATOR_ORG,
        revokedByRole: 'operador_gerente',
        reason: 'Violación de protocolo de seguridad SIHO en campo',
      });

      expect(revokedParticipant.revoked).toBe(true);
      expect(auditEvent.action).toBe('REVOKE_EXTERNAL_ACCESS');

      const accessVal = verifyExternalAccess({
        participant: revokedParticipant,
        targetOwnerOrgId: OPERATOR_ORG,
        targetContractId: mockContract.id,
      });

      expect(accessVal.granted).toBe(false);
      expect(accessVal.code).toBe('REVOKED');
      expect(accessVal.reason).toContain('fue revocada');
    });
  });
});
