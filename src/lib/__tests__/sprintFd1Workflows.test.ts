import { describe, it, expect } from 'vitest';
import { getWorkflow, listWorkflows } from '../workflows/registry';
import { WorkflowRunner } from '../workflows/runner';
import { exportDocument } from '../exporters/exportDocument';
import { ensureWorkflowsRegistered } from '../../workflows';
ensureWorkflowsRegistered();

describe('Sprint F-D1 — Prioritized Workflows (7 Workflows)', () => {

  const dummyContext = {
    user: { id: 'usr-1', email: 'inspector@pdvsa.com', roles: ['inspector'] },
    contractorBrand: {
      companyName: 'PROINTECA INDUSTRIAL C.A.',
      taxId: 'RIF J-30123456-0',
      primaryColor: '#0B2239',
      secondaryColor: '#059669',
      address: 'Anaco, Venezuela',
    },
    operatorBrand: {
      companyName: 'PDVSA PETRÓLEO S.A.',
      taxId: 'RIF J-00000000-0',
      primaryColor: '#DC2626',
      secondaryColor: '#1E293B',
      address: 'Caracas, Venezuela',
    },
  };

  const workflowIds = [
    'wf-073-medicion-avance-ingenieria',
    'wf-075-libro-de-obra',
    'wf-065-gis-alignment-sheets-kp',
    'wf-066-bim3d-integridad-soldadura',
    'wf-074-completacion-mecanica',
    'wf-076-terminacion-construccion',
    'wf-077-supervision-ingenieria',
  ];

  describe('1. Registro e Identificación en Kernel', () => {
    it('debe registrar los 7 nuevos workflows en el WorkflowRegistry', () => {
      const allDefs = listWorkflows();
      const allIds = allDefs.map(d => d.id);

      workflowIds.forEach(id => {
        expect(allIds).toContain(id);
        const def = getWorkflow(id);
        expect(def).toBeDefined();
        expect(def?.captureComponent).toBeDefined();
        expect(def?.schema).toBeDefined();
        expect(def?.deliverable).toBeDefined();
      });
    });
  });

  describe('2. wf-073-medicion-avance-ingenieria (EVM y Hard Gate EFFICIENCY_BELOW_085)', () => {
    const def = getWorkflow('wf-073-medicion-avance-ingenieria')!;

    const validData = {
      reportCode: 'REP-ING-2026-001',
      reportDate: '2026-08-06',
      plannedProgressPct: 50,
      actualProgressPct: 48,
      plannedValueUSD: 100000,
      earnedValueUSD: 96000,
      actualCostUSD: 95000,
      deliverables: [
        { code: 'DEL-01', title: 'Planos P&ID', weight: 50, progressPct: 100 },
        { code: 'DEL-02', title: 'Cálculos Hidráulicos', weight: 50, progressPct: 96 },
      ],
    };

    it('debe validar el schema Zod para datos correctos', () => {
      const result = def.schema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('debe aprobar Hard Gate si SPI >= 0.85 y CPI >= 0.85', async () => {
      const gateResult = await WorkflowRunner.evaluateHardGates(def, dummyContext as any, validData);
      expect(gateResult.allPassed).toBe(true);
    });

    it('debe bloquear Hard Gate EFFICIENCY_BELOW_085 si SPI < 0.85', async () => {
      const lowSpiData = {
        ...validData,
        earnedValueUSD: 70000, // SPI = 70000 / 100000 = 0.70 (< 0.85)
      };
      const gateResult = await WorkflowRunner.evaluateHardGates(def, dummyContext as any, lowSpiData);
      expect(gateResult.allPassed).toBe(false);
      expect(gateResult.failedGates[0]?.id).toBe('EFFICIENCY_BELOW_085');
    });

    it('debe generar entregable DocumentViewModel con 3 signers', async () => {
      const vm = await WorkflowRunner.generateDeliverable(def, dummyContext as any, validData);
      expect(vm).toBeDefined();
      expect(vm?.signers).toHaveLength(3);
      expect(vm?.signers.map(s => s.role)).toEqual(['INSPECTOR', 'CONTRACTOR', 'OPERATOR']);
    });
  });

  describe('3. wf-075-libro-de-obra (Hard Gates UNSEALED_BOOK y MISSING_DAILY_ENTRIES)', () => {
    const def = getWorkflow('wf-075-libro-de-obra')!;

    const validData = {
      bookCode: 'LO-2026-01',
      startDate: '2026-08-01',
      endDate: '2026-08-06',
      contractorName: 'PROINTECA C.A.',
      residentEngineer: 'Ing. Carlos Mendoza',
      inspectorName: 'Ing. Roberto Gómez',
      sectionsCount: 16,
      dailyEntries: [
        {
          entryNumber: 1,
          date: '2026-08-01',
          description: 'Inicio de vaciado de concreto en fundación F-01',
          weatherCondition: 'bueno' as const,
          manpowerCount: 15,
          incidentsReported: false,
        },
      ],
      isSealed: true,
    };

    it('debe bloquear si el libro no está sellado (UNSEALED_BOOK)', async () => {
      const unsealedData = { ...validData, isSealed: false };
      const gateResult = await WorkflowRunner.evaluateHardGates(def, dummyContext as any, unsealedData);
      expect(gateResult.allPassed).toBe(false);
      expect(gateResult.failedGates.some(g => g.id === 'UNSEALED_BOOK')).toBe(true);
    });

    it('debe bloquear si no existen asientos diarios (MISSING_DAILY_ENTRIES)', async () => {
      const emptyEntriesData = { ...validData, dailyEntries: [] };
      const gateResult = await WorkflowRunner.evaluateHardGates(def, dummyContext as any, emptyEntriesData);
      expect(gateResult.allPassed).toBe(false);
      expect(gateResult.failedGates.some(g => g.id === 'MISSING_DAILY_ENTRIES')).toBe(true);
    });

    it('debe aprobar si está sellado y con asientos diarios', async () => {
      const gateResult = await WorkflowRunner.evaluateHardGates(def, dummyContext as any, validData);
      expect(gateResult.allPassed).toBe(true);
    });
  });

  describe('4. wf-065-gis-alignment-sheets-kp (Hard Gates GATE_KP_CONTINUITY y GATE_KMZ_VALIDATION)', () => {
    const def = getWorkflow('wf-065-gis-alignment-sheets-kp')!;

    const validData = {
      sheetCode: 'ALIGN-01',
      pipelineSegment: 'Gasoducto 26"',
      startKp: 0.0,
      endKp: 10.5,
      kmzValidated: true,
      coordinatesCount: 25,
      datum: 'REGVEN' as const,
      inspectorNotes: 'Levantamiento topográfico conforme',
    };

    it('debe bloquear si KP final <= KP inicial (GATE_KP_CONTINUITY)', async () => {
      const badKpData = { ...validData, endKp: 0.0 };
      const gateResult = await WorkflowRunner.evaluateHardGates(def, dummyContext as any, badKpData);
      expect(gateResult.allPassed).toBe(false);
      expect(gateResult.failedGates.some(g => g.id === 'GATE_KP_CONTINUITY')).toBe(true);
    });

    it('debe bloquear si KMZ no está validado (GATE_KMZ_VALIDATION)', async () => {
      const unvalidatedKmzData = { ...validData, kmzValidated: false };
      const gateResult = await WorkflowRunner.evaluateHardGates(def, dummyContext as any, unvalidatedKmzData);
      expect(gateResult.allPassed).toBe(false);
      expect(gateResult.failedGates.some(g => g.id === 'GATE_KMZ_VALIDATION')).toBe(true);
    });
  });

  describe('5. wf-066-bim3d-integridad-soldadura (Hard Gates GATE_PIG_NAVIGABILITY y GATE_COLD_BEND_PDVSA)', () => {
    const def = getWorkflow('wf-066-bim3d-integridad-soldadura')!;

    const validData = {
      spoolId: 'SPOOL-BIM-01',
      pipeDiameterInches: 26,
      wallThicknessMm: 12.7,
      minRadiusD: 3.0,
      ovalityPercentage: 1.5,
      coldBendAngleDeg: 15,
      coldBendApprovedPDVSA: true,
      pigNavigable: true,
      defectCountILI: 0,
      inspectorNotes: 'Geometría y soldaduras conformes',
    };

    it('debe bloquear si ovalidad > 3% o no es navegable (GATE_PIG_NAVIGABILITY)', async () => {
      const badOvalityData = { ...validData, ovalityPercentage: 4.5 };
      const gateResult = await WorkflowRunner.evaluateHardGates(def, dummyContext as any, badOvalityData);
      expect(gateResult.allPassed).toBe(false);
      expect(gateResult.failedGates.some(g => g.id === 'GATE_PIG_NAVIGABILITY')).toBe(true);
    });

    it('debe bloquear si curva en frío no está aprobada por PDVSA H-221 (GATE_COLD_BEND_PDVSA)', async () => {
      const unapprovedBendData = { ...validData, coldBendApprovedPDVSA: false };
      const gateResult = await WorkflowRunner.evaluateHardGates(def, dummyContext as any, unapprovedBendData);
      expect(gateResult.allPassed).toBe(false);
      expect(gateResult.failedGates.some(g => g.id === 'GATE_COLD_BEND_PDVSA')).toBe(true);
    });
  });

  describe('6. wf-074-completacion-mecanica (Hard Gates PUNCHLIST_CRITICAL_ITEMS y DATABOOK_INCOMPLETE)', () => {
    const def = getWorkflow('wf-074-completacion-mecanica')!;

    const validData = {
      subsystemCode: 'MC-SUB-01',
      subsystemName: 'Planta Compresora',
      categoryAPunchCount: 0,
      categoryBPunchCount: 3,
      databookComplete: true,
      hydrotestCertified: true,
      completionDate: '2026-08-06',
      inspectorNotes: 'Completación mecánica aprobada',
    };

    it('debe bloquear si existen ítems Categoría A (PUNCHLIST_CRITICAL_ITEMS)', async () => {
      const punchAData = { ...validData, categoryAPunchCount: 2 };
      const gateResult = await WorkflowRunner.evaluateHardGates(def, dummyContext as any, punchAData);
      expect(gateResult.allPassed).toBe(false);
      expect(gateResult.failedGates.some(g => g.id === 'PUNCHLIST_CRITICAL_ITEMS')).toBe(true);
    });

    it('debe bloquear si databook o pruebas hidrostáticas están incompletos (DATABOOK_INCOMPLETE)', async () => {
      const incompleteData = { ...validData, databookComplete: false };
      const gateResult = await WorkflowRunner.evaluateHardGates(def, dummyContext as any, incompleteData);
      expect(gateResult.allPassed).toBe(false);
      expect(gateResult.failedGates.some(g => g.id === 'DATABOOK_INCOMPLETE')).toBe(true);
    });
  });

  describe('7. wf-076-terminacion-construccion (Hard Gate PSV_CALIBRATION_EXPIRED)', () => {
    const def = getWorkflow('wf-076-terminacion-construccion')!;

    const validData = {
      transferCertificateCode: 'TRF-01',
      facilityArea: 'Estación de Flujo',
      psvCalibrated: true,
      psvExpirationDate: '2027-12-31',
      walkthroughCompleted: true,
      asBuiltDrawingsApproved: true,
      transferDate: '2026-08-06',
      inspectorNotes: 'Transferencia de custodia aprobada',
    };

    it('debe bloquear si PSV no está calibrada o expiró (PSV_CALIBRATION_EXPIRED)', async () => {
      const expiredPsvData = { ...validData, psvExpirationDate: '2020-01-01' };
      const gateResult = await WorkflowRunner.evaluateHardGates(def, dummyContext as any, expiredPsvData);
      expect(gateResult.allPassed).toBe(false);
      expect(gateResult.failedGates.some(g => g.id === 'PSV_CALIBRATION_EXPIRED')).toBe(true);
    });
  });

  describe('8. wf-077-supervision-ingenieria (Hard Gate ORC_QUALITY_CERTIFICATE_MISSING)', () => {
    const def = getWorkflow('wf-077-supervision-ingenieria')!;

    const validData = {
      packageCode: 'PKG-ING-01',
      discipline: 'mecanica' as const,
      revisionNumber: 'REV-0',
      orcCertificateIssued: true,
      orcCertificateCode: 'ORC-2026-100',
      calculationsApproved: true,
      supervisorNotes: 'Memorias de cálculo y planos aprobados',
    };

    it('debe bloquear si falta certificado ORC (ORC_QUALITY_CERTIFICATE_MISSING)', async () => {
      const noOrcData = { ...validData, orcCertificateIssued: false };
      const gateResult = await WorkflowRunner.evaluateHardGates(def, dummyContext as any, noOrcData);
      expect(gateResult.allPassed).toBe(false);
      expect(gateResult.failedGates.some(g => g.id === 'ORC_QUALITY_CERTIFICATE_MISSING')).toBe(true);
    });
  });

  describe('9. Exportación Canónica Multiformato de Entregables', () => {
    it('debe exportar entregable a PDF, DOCX, XLSX y PPTX sin errores', async () => {
      const def = getWorkflow('wf-073-medicion-avance-ingenieria')!;
      const data = {
        reportCode: 'REP-001',
        reportDate: '2026-08-06',
        plannedProgressPct: 50,
        actualProgressPct: 50,
        plannedValueUSD: 100000,
        earnedValueUSD: 100000,
        actualCostUSD: 90000,
        deliverables: [{ code: 'D-1', title: 'Plano', weight: 100, progressPct: 50 }],
      };

      const vm = await WorkflowRunner.generateDeliverable(def, dummyContext as any, data);
      expect(vm).toBeDefined();

      if (vm) {
        const res = await exportDocument(vm, ['pdf', 'docx', 'xlsx', 'pptx']);
        expect(res.pdf.size).toBeGreaterThan(0);
        expect(res.docx.size).toBeGreaterThan(0);
        expect(res.xlsx.size).toBeGreaterThan(0);
        expect(res.pptx.size).toBeGreaterThan(0);
      }
    });
  });

});
