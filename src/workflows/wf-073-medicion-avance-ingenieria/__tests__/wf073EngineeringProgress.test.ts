import { describe, it, expect } from 'vitest';
import {
  wf073Definition,
  EngineeringProgressSchema,
  createInitialEngineeringProgressData,
} from '../definition';

describe('Workflow wf-073: Medición de Avance de Ingeniería EVM', () => {
  const dummyContext = {
    user: { email: 'inspector.evm@ic360.io' },
    contractorBrand: { companyName: 'CONTRATISTA EVM S.A.' },
    operatorBrand: { companyName: 'OPERADOR PETRÓLEO S.A.' },
  };

  it('1. Genera capturas iniciales por defecto completamente vacías / sin pre-aprobación', () => {
    const initialData = createInitialEngineeringProgressData();

    expect(initialData.reportCode).toBe('');
    expect(initialData.reportDate).toBe('');
    expect(initialData.plannedProgressPct).toBe(0);
    expect(initialData.actualProgressPct).toBe(0);
    expect(initialData.plannedValueUSD).toBe(0);
    expect(initialData.earnedValueUSD).toBe(0);
    expect(initialData.actualCostUSD).toBe(0);
    expect(initialData.deliverables).toEqual([]);
    expect(initialData.notes).toBe('');
  });

  it('2. Bloquea mediante Hard Gate la ausencia de entregables de ingeniería', () => {
    const emptyDeliverablesGate = wf073Definition.hardGates.find((g) => g.id === 'EMPTY_DELIVERABLES');
    expect(emptyDeliverablesGate).toBeDefined();

    const initialData = createInitialEngineeringProgressData();
    const result = emptyDeliverablesGate!.evaluator(dummyContext, initialData);

    expect(result.passed).toBe(false);
    expect(result.message).toContain('BLOQUEO TÉCNICO');
  });

  it('3. Bloquea mediante Hard Gate cuando SPI o CPI son inferiores a 0.85', () => {
    const efficiencyGate = wf073Definition.hardGates.find((g) => g.id === 'EFFICIENCY_BELOW_085');
    expect(efficiencyGate).toBeDefined();

    const lowEfficiencyData = {
      ...createInitialEngineeringProgressData(),
      reportCode: 'REP-EVM-001',
      reportDate: '2026-08-09',
      plannedValueUSD: 100000,
      earnedValueUSD: 50000, // SPI = 0.5 < 0.85
      actualCostUSD: 80000, // CPI = 0.625 < 0.85
      deliverables: [{ code: 'DEL-01', title: 'Diseño Mecánico', weight: 100, progressPct: 50 }],
    };

    const result = efficiencyGate!.evaluator(dummyContext, lowEfficiencyData);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('BLOQUEO DE EFICIENCIA EVM');
  });

  it('4. Permite el paso del Hard Gate cuando SPI y CPI son >= 0.85', () => {
    const efficiencyGate = wf073Definition.hardGates.find((g) => g.id === 'EFFICIENCY_BELOW_085');

    const goodEfficiencyData = {
      ...createInitialEngineeringProgressData(),
      reportCode: 'REP-EVM-002',
      reportDate: '2026-08-09',
      plannedValueUSD: 100000,
      earnedValueUSD: 95000, // SPI = 0.95 >= 0.85
      actualCostUSD: 100000, // CPI = 0.95 >= 0.85
      deliverables: [{ code: 'DEL-01', title: 'Diseño Mecánico', weight: 100, progressPct: 95 }],
    };

    const result = efficiencyGate!.evaluator(dummyContext, goodEfficiencyData);
    expect(result.passed).toBe(true);
  });

  it('5. Valida esquema Zod ante campos incompletos o inválidos', () => {
    const invalidData = {
      reportCode: 'A', // min 3
      reportDate: 'invalid-date',
      plannedProgressPct: -10, // min 0
      actualProgressPct: 120, // max 100
      plannedValueUSD: -1,
      earnedValueUSD: -1,
      actualCostUSD: -1,
      deliverables: [], // min 1
    };

    const parseResult = EngineeringProgressSchema.safeParse(invalidData);
    expect(parseResult.success).toBe(false);
  });

  it('6. Genera un DocumentViewModel con estado DRAFT y firmantes en estado PENDING', () => {
    const validData = {
      reportCode: 'REP-EVM-100',
      reportDate: '2026-08-09',
      plannedProgressPct: 80,
      actualProgressPct: 85,
      plannedValueUSD: 100000,
      earnedValueUSD: 85000,
      actualCostUSD: 90000,
      deliverables: [{ code: 'ING-PIPE-01', title: 'Isométricos de Tubería', weight: 100, progressPct: 85 }],
    };

    const docVM = wf073Definition.deliverable.factory(dummyContext, validData);

    expect(docVM.status).toBe('DRAFT');
    expect(docVM.code).toBe('REP-EVM-100');
    expect(docVM.signers.length).toBe(3);

    docVM.signers.forEach((s) => {
      expect(s.status).toBe('PENDING');
      expect(s.signedAt).toBeUndefined();
    });
  });
});
