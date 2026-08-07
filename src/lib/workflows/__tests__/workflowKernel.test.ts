import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowRegistry } from '../registry';
import { WorkflowRunner } from '../runner';
import { wf042Definition } from '../../../workflows/wf-042-inspeccion-izaje/definition';
import { wf043Definition } from '../../../workflows/wf-043-aprobacion-ptw/definition';
import { wf044Definition } from '../../../workflows/wf-044-reporte-tabular/definition';
import { WorkflowRouteContext } from '../contracts';

describe('Plugin-Kernel / WorkflowRegistry Engine (Sprint F-D)', () => {
  const dummyContext: WorkflowRouteContext = {
    orgId: 'org_prointeca',
    projectId: 'PROJ-PILOT-PROINTECA',
    workflowId: 'wf-042-inspeccion-izaje',
    instanceId: 'inst-001',
    user: {
      uid: 'usr_inspector_01',
      email: 'inspector@prointeca.com',
      role: 'inspector',
      orgId: 'org_prointeca',
    },
    contractorBrand: {
      companyName: 'PROINTECA C.A.',
      taxId: 'RIF J-12345678-0',
      address: 'Caracas, Venezuela',
      phone: '+58 212 1234567',
      email: 'contacto@prointeca.com',
      website: 'www.prointeca.com',
      logoUrl: '',
      primaryColor: '#0066cc',
      secondaryColor: '#ff9900',
      headerText: 'PROINTECA C.A.',
      footerText: 'DOCUMENTO PROINTECA',
      digitalSignatureUrl: '',
      authorizedSignerName: 'Gerente General',
      authorizedSignerTitle: 'Dirección Técnica',
    },
    operatorBrand: {
      companyName: 'PDVSA Refinación',
      taxId: 'RIF J-00000000-0',
      address: 'La Campiña, Caracas',
      phone: '+58 212 7084111',
      email: 'calidad@pdvsa.com',
      website: 'www.pdvsa.com',
      logoUrl: '',
      primaryColor: '#003366',
      secondaryColor: '#cc0000',
      headerText: 'PDVSA OPERACIONES',
      footerText: 'DOCUMENTO PDVSA',
      digitalSignatureUrl: '',
      authorizedSignerName: 'Inspector PDVSA',
      authorizedSignerTitle: 'Inspección de Obra',
    },
  };

  beforeEach(() => {
    WorkflowRegistry.clearRegistryForTesting();
  });

  describe('1. WorkflowRegistry Unit Tests', () => {
    it('1.1 Registra exitosamente workflows válidos', () => {
      WorkflowRegistry.registerWorkflow(wf042Definition);
      const retrieved = WorkflowRegistry.getWorkflow('wf-042-inspeccion-izaje');
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('wf-042-inspeccion-izaje');
      expect(retrieved?.title).toBe(wf042Definition.title);
    });

    it('1.2 Rechaza registros con ID duplicado lanzando excepción', () => {
      WorkflowRegistry.registerWorkflow(wf042Definition);
      expect(() => {
        WorkflowRegistry.registerWorkflow(wf042Definition);
      }).toThrowError(/ya está registrado/);
    });

    it('1.3 Filtra workflows correctamente por Fase (1-7)', () => {
      WorkflowRegistry.registerWorkflow(wf042Definition); // Phase 4
      WorkflowRegistry.registerWorkflow(wf043Definition); // Phase 4
      WorkflowRegistry.registerWorkflow(wf044Definition); // Phase 5

      const phase4 = WorkflowRegistry.listWorkflowsByPhase(4);
      expect(phase4.length).toBe(2);
      expect(phase4.map((w) => w.id)).toEqual(['wf-042-inspeccion-izaje', 'wf-043-aprobacion-ptw']);

      const phase5 = WorkflowRegistry.listWorkflowsByPhase(5);
      expect(phase5.length).toBe(1);
      expect(phase5[0].id).toBe('wf-044-reporte-tabular');

      const all = WorkflowRegistry.listWorkflows();
      expect(all.length).toBe(3);
    });

    it('1.4 Bloquea el registro inmutable tras invocar lockRegistry()', () => {
      WorkflowRegistry.registerWorkflow(wf042Definition);
      WorkflowRegistry.lockRegistry();
      expect(() => {
        WorkflowRegistry.registerWorkflow(wf043Definition);
      }).toThrowError(/bloqueado e inmutable/);
    });
  });

  describe('2. WorkflowRunner Engine Tests', () => {
    it('2.1 Valida permisos por rol de usuario (incluye superadmin bypass)', () => {
      expect(WorkflowRunner.checkUserPermissions(wf042Definition, 'inspector')).toBe(true);
      expect(WorkflowRunner.checkUserPermissions(wf042Definition, 'campo')).toBe(true);
      expect(WorkflowRunner.checkUserPermissions(wf042Definition, 'superadmin')).toBe(true);
      expect(WorkflowRunner.checkUserPermissions(wf042Definition, 'cliente')).toBe(false);
    });

    it('2.2 Valida esquemas Zod correctamente (Piloto 1: wf-042)', () => {
      const validData = {
        craneCode: 'GRU-TEREX-004',
        capacityTons: 120,
        inspectionDate: '2026-08-06',
        slingCondition: 'operativa',
        hookLatchIntact: true,
        hydraulicLeakDetected: false,
        inspectorNotes: 'Prueba realizada en norma ASME B30.5.',
      };

      const val = WorkflowRunner.validateWorkflowData(wf042Definition, validData);
      expect(val.success).toBe(true);

      const invalidData = {
        craneCode: 'GR', // min 3 chars
        capacityTons: -10, // positive
        inspectionDate: 'invalid-date',
      };

      const valInvalid = WorkflowRunner.validateWorkflowData(wf042Definition, invalidData);
      expect(valInvalid.success).toBe(false);
      expect(valInvalid.errorMessage).toContain('Error de validación');
    });

    it('2.3 Evalúa Hard Gates correctamente (Piloto 1: hookLatchIntact === false bloquea)', async () => {
      const failingData = {
        craneCode: 'GRU-TEREX-004',
        capacityTons: 120,
        inspectionDate: '2026-08-06',
        slingCondition: 'operativa',
        hookLatchIntact: false, // FAIL GATE
        hydraulicLeakDetected: false,
        inspectorNotes: 'Pestillo roto',
      };

      const report = await WorkflowRunner.evaluateHardGates(wf042Definition, dummyContext, failingData);
      expect(report.allPassed).toBe(false);
      expect(report.failedGates.length).toBe(1);
      expect(report.failedGates[0].id).toBe('gate-hook-latch');
      expect(report.failedGates[0].message).toContain('BLOQUEO DE SEGURIDAD');

      const passingData = { ...failingData, hookLatchIntact: true };
      const reportPass = await WorkflowRunner.evaluateHardGates(wf042Definition, dummyContext, passingData);
      expect(reportPass.allPassed).toBe(true);
      expect(reportPass.failedGates.length).toBe(0);
    });

    it('2.4 Evalúa Hard Gates atmosféricos de PTW SIHO-A (Piloto 2: wf-043)', async () => {
      const unsafeGasData = {
        ptwCode: 'PTW-2026-001',
        workType: 'caliente',
        lelPercentage: 5.0, // > 0% LEL -> FAIL
        o2Percentage: 20.9,
        h2sPpm: 0,
        lotoVerified: true,
        supervisorName: 'Ing. Rivas',
        safetyInspectorName: 'Ing. Mendoza',
        status: 'draft',
      };

      const report = await WorkflowRunner.evaluateHardGates(wf043Definition, dummyContext, unsafeGasData);
      expect(report.allPassed).toBe(false);
      expect(report.failedGates[0].message).toContain('explosividad detectada');

      const safeGasData = { ...unsafeGasData, lelPercentage: 0.0 };
      const reportSafe = await WorkflowRunner.evaluateHardGates(wf043Definition, dummyContext, safeGasData);
      expect(reportSafe.allPassed).toBe(true);
    });

    it('2.5 Genera DocumentViewModel normalizado con tablas para Piloto 3 (wf-044)', async () => {
      const tabularData = {
        reportCode: 'REP-NDT-2026-001',
        welderId: 'W-CIV-1845236',
        pipeDiameterInches: 6,
        inspectorName: 'Tec. Roberto Gómez',
        items: [
          { jointId: 'J-001', kpHour: 'KP 12+100', ndtResult: 'APPROVED' as const, ultrasonicThicknessMm: 7.1 },
          { jointId: 'J-002', kpHour: 'KP 12+105', ndtResult: 'APPROVED' as const, ultrasonicThicknessMm: 7.0 },
        ],
      };

      const doc = await WorkflowRunner.generateDeliverable(wf044Definition, dummyContext, tabularData);
      expect(doc).not.toBeNull();
      expect(doc?.title).toContain('INFORME TABULAR DE CONTROL DE CALIDAD');
      expect(doc?.code).toBe('REP-NDT-2026-001');
      expect(doc?.tables.length).toBe(1);
      expect(doc?.tables[0].headers).toEqual(['Junta N°', 'Ubicación / KP', 'Espesor UT (mm)', 'Dictamen NDT']);
      expect(doc?.tables[0].rows.length).toBe(2);
      expect(doc?.tables[0].summaryRow?.cells[3].value).toBe('Tasa: 100.0%');
    });

    it('2.6 Verifica transiciones autorizadas en máquina de estados de PTW (wf-043)', () => {
      // draft -> submitted (supervisor allowed)
      const trans1 = WorkflowRunner.canTransition(wf043Definition, 'draft', 'submitted', 'supervisor');
      expect(trans1.allowed).toBe(true);

      // submitted -> safety_approved (inspector allowed)
      const trans2 = WorkflowRunner.canTransition(wf043Definition, 'submitted', 'safety_approved', 'inspector');
      expect(trans2.allowed).toBe(true);

      // submitted -> safety_approved (supervisor NOT allowed)
      const trans3 = WorkflowRunner.canTransition(wf043Definition, 'submitted', 'safety_approved', 'supervisor');
      expect(trans3.allowed).toBe(false);
    });
  });
});
