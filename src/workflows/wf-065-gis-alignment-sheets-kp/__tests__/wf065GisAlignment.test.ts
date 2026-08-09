import { describe, it, expect } from 'vitest';
import {
  wf065Definition,
  GisAlignmentSchema,
  createInitialGisAlignmentData,
} from '../definition';

describe('Workflow wf-065: Alignment Sheets, KP y Georreferenciación GIS', () => {
  const dummyContext = {
    user: { email: 'inspector.gis@ic360.io' },
    contractorBrand: { companyName: 'CONTRATISTA TOPOGRAFÍA S.A.' },
    operatorBrand: { companyName: 'OPERADOR PETRÓLEO S.A.' },
  };

  it('1. Genera capturas iniciales por defecto completamente vacías / sin validación KMZ', () => {
    const initialData = createInitialGisAlignmentData();

    expect(initialData.sheetCode).toBe('');
    expect(initialData.pipelineSegment).toBe('');
    expect(initialData.startKp).toBe(0);
    expect(initialData.endKp).toBe(0);
    expect(initialData.kmzValidated).toBe(false);
    expect(initialData.coordinatesCount).toBe(0);
    expect(initialData.datum).toBe('REGVEN');
    expect(initialData.inspectorNotes).toBe('');
  });

  it('2. Bloquea mediante Hard Gate la discontinuidad topográfica de KP (endKp <= startKp)', () => {
    const kpGate = wf065Definition.hardGates.find((g) => g.id === 'GATE_KP_CONTINUITY');
    expect(kpGate).toBeDefined();

    const invalidKpData = {
      ...createInitialGisAlignmentData(),
      startKp: 10.5,
      endKp: 10.5, // Discontinuidad
    };

    const result = kpGate!.evaluator(dummyContext, invalidKpData);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('DISCONTINUIDAD TOPOGRÁFICA');
  });

  it('3. Bloquea mediante Hard Gate si el archivo KMZ no está validado espacialmente', () => {
    const kmzGate = wf065Definition.hardGates.find((g) => g.id === 'GATE_KMZ_VALIDATION');
    expect(kmzGate).toBeDefined();

    const unvalidatedData = {
      ...createInitialGisAlignmentData(),
      kmzValidated: false,
    };

    const result = kmzGate!.evaluator(dummyContext, unvalidatedData);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('BLOQUEO GIS');
  });

  it('4. Permite el paso de los Hard Gates cuando el KP es continuo y KMZ está validado', () => {
    const kpGate = wf065Definition.hardGates.find((g) => g.id === 'GATE_KP_CONTINUITY');
    const kmzGate = wf065Definition.hardGates.find((g) => g.id === 'GATE_KMZ_VALIDATION');

    const validData = {
      ...createInitialGisAlignmentData(),
      startKp: 0,
      endKp: 10.5,
      kmzValidated: true,
    };

    expect(kpGate!.evaluator(dummyContext, validData).passed).toBe(true);
    expect(kmzGate!.evaluator(dummyContext, validData).passed).toBe(true);
  });

  it('5. Valida esquema Zod ante campos incompletos o número de coordenadas insuficiente', () => {
    const invalidData = {
      sheetCode: 'AB', // min 3
      pipelineSegment: 'A', // min 3
      startKp: -1,
      endKp: -5,
      kmzValidated: false,
      coordinatesCount: 1, // min 2
      datum: 'INVALID_DATUM',
      inspectorNotes: '123', // min 5
    };

    const parseResult = GisAlignmentSchema.safeParse(invalidData);
    expect(parseResult.success).toBe(false);
  });

  it('6. Genera un DocumentViewModel con estado DRAFT y firmantes en estado PENDING', () => {
    const validData = {
      sheetCode: 'ALIGN-KP-000-010',
      pipelineSegment: 'Gasoducto Jusepín - San Joaquín 26"',
      startKp: 0.0,
      endKp: 10.0,
      kmzValidated: true,
      coordinatesCount: 25,
      datum: 'REGVEN' as const,
      inspectorNotes: 'Levantamiento geodésico verificado con estación total RTK en coordenadas REGVEN.',
    };

    const docVM = wf065Definition.deliverable.factory(dummyContext, validData);

    expect(docVM.status).toBe('DRAFT');
    expect(docVM.code).toBe('ALIGN-KP-000-010');
    expect(docVM.signers.length).toBe(3);

    docVM.signers.forEach((s) => {
      expect(s.status).toBe('PENDING');
      expect(s.signedAt).toBeUndefined();
    });
  });
});
