import { describe, it, expect } from 'vitest';
import {
  wf066Definition,
  Bim3dWeldingIntegritySchema,
  createDefaultBim3dWeldingData,
} from '../definition';

describe('Workflow wf-066: Integridad de Soldadura, BIM 3D y Navegabilidad ILI', () => {
  const dummyContext = {
    user: { email: 'inspector.bim@ic360.io' },
    contractorBrand: { companyName: 'CONTRATISTA PIPELINES C.A.' },
    operatorBrand: { companyName: 'PDVSA GAS S.A.' },
  };

  it('1. La factory devuelve defaults vacíos/deterministas', () => {
    const initialData = createDefaultBim3dWeldingData();

    expect(initialData.spoolId).toBe('');
    expect(initialData.pipeDiameterInches).toBe(0);
    expect(initialData.wallThicknessMm).toBe(0);
    expect(initialData.minRadiusD).toBe(0);
    expect(initialData.ovalityPercentage).toBe(0);
    expect(initialData.coldBendAngleDeg).toBe(0);
    expect(initialData.coldBendApprovedPDVSA).toBe(false);
    expect(initialData.pigNavigable).toBe(false);
    expect(initialData.defectCountILI).toBe(0);
    expect(initialData.inspectorNotes).toBe('');
  });

  it('2. La factory no genera fechas, códigos, nombres ni datos ficticios', () => {
    const initialData = createDefaultBim3dWeldingData();

    expect(initialData.spoolId).not.toContain('SPOOL-');
    expect(initialData.inspectorNotes).not.toContain('Ing.');
  });

  it('3. Los datos incompletos no pasan el esquema Zod', () => {
    const initialData = createDefaultBim3dWeldingData();

    const parseResult = Bim3dWeldingIntegritySchema.safeParse(initialData);
    expect(parseResult.success).toBe(false);
    if (!parseResult.success) {
      const issuePaths = parseResult.error.issues.map((i) => i.path.join('.'));
      expect(issuePaths).toContain('spoolId');
      expect(issuePaths).toContain('pipeDiameterInches');
      expect(issuePaths).toContain('wallThicknessMm');
      expect(issuePaths).toContain('minRadiusD');
      expect(issuePaths).toContain('inspectorNotes');
    }
  });

  it('4. Los datos completos válidos pasan el esquema Zod', () => {
    const validData = {
      spoolId: 'SPOOL-BIM-010',
      pipeDiameterInches: 24,
      wallThicknessMm: 12.7,
      minRadiusD: 3.5,
      ovalityPercentage: 1.2,
      coldBendAngleDeg: 12.5,
      coldBendApprovedPDVSA: true,
      pigNavigable: true,
      defectCountILI: 0,
      inspectorNotes: 'Spool con geometría verificada en modelo 3D y pase de PIG asegurado.',
    };

    const parseResult = Bim3dWeldingIntegritySchema.safeParse(validData);
    expect(parseResult.success).toBe(true);
  });

  it('5. El control de navegabilidad detecta condición inválida o incompleta', () => {
    const pigGate = wf066Definition.hardGates.find((g) => g.id === 'GATE_PIG_NAVIGABILITY');
    expect(pigGate).toBeDefined();

    const invalidData = {
      ...createDefaultBim3dWeldingData(),
      spoolId: 'SPOOL-001',
      pipeDiameterInches: 24,
      wallThicknessMm: 12.7,
      minRadiusD: 2.5, // menor a 3.0D
      ovalityPercentage: 4.0, // mayor a 3%
      pigNavigable: false,
    };

    const result = pigGate!.evaluator(dummyContext, invalidData);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('BLOQUEO DE NAVEGABILIDAD ILI');
  });

  it('6. El control de doblado en frío / PDVSA detecta ausencia de aprobación si aplica', () => {
    const coldBendGate = wf066Definition.hardGates.find((g) => g.id === 'GATE_COLD_BEND_PDVSA');
    expect(coldBendGate).toBeDefined();

    const unapprovedData = {
      ...createDefaultBim3dWeldingData(),
      coldBendApprovedPDVSA: false,
    };

    const result = coldBendGate!.evaluator(dummyContext, unapprovedData);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('RECHAZO DE CURVADO EN FRÍO');
  });

  it('7. El entregable inicial no aparece como APPROVED', () => {
    const validData = {
      spoolId: 'SPOOL-BIM-010',
      pipeDiameterInches: 24,
      wallThicknessMm: 12.7,
      minRadiusD: 3.5,
      ovalityPercentage: 1.2,
      coldBendAngleDeg: 12.5,
      coldBendApprovedPDVSA: true,
      pigNavigable: true,
      defectCountILI: 0,
      inspectorNotes: 'Spool con geometría verificada.',
    };

    const docVM = wf066Definition.deliverable.factory(dummyContext, validData);

    expect(docVM.status).toBe('DRAFT');
    expect(docVM.code).toBe('CERT-BIM-SPOOL-BIM-010');
    expect(docVM.date).toBe('');
  });

  it('8. Los firmantes iniciales no aparecen como SIGNED', () => {
    const validData = {
      spoolId: 'SPOOL-BIM-010',
      pipeDiameterInches: 24,
      wallThicknessMm: 12.7,
      minRadiusD: 3.5,
      ovalityPercentage: 1.2,
      coldBendAngleDeg: 12.5,
      coldBendApprovedPDVSA: true,
      pigNavigable: true,
      defectCountILI: 0,
      inspectorNotes: 'Spool verificado.',
    };

    const docVM = wf066Definition.deliverable.factory(dummyContext, validData);

    expect(docVM.signers.length).toBe(3);
    docVM.signers.forEach((s) => {
      expect(s.status).toBe('PENDING');
      expect(s.signedAt).toBeUndefined();
    });
  });

  it('9. Los firmantes no contienen nombres o títulos ficticios', () => {
    const validData = {
      spoolId: 'SPOOL-BIM-010',
      pipeDiameterInches: 24,
      wallThicknessMm: 12.7,
      minRadiusD: 3.5,
      ovalityPercentage: 1.2,
      coldBendAngleDeg: 12.5,
      coldBendApprovedPDVSA: true,
      pigNavigable: true,
      defectCountILI: 0,
      inspectorNotes: 'Spool verificado.',
    };

    const docVM = wf066Definition.deliverable.factory(dummyContext, validData);

    docVM.signers.forEach((s) => {
      expect(s.name).toBe('');
      expect(s.name).not.toContain('Ing.');
    });
  });

  it('10. El contexto de tenant/branding sigue siendo dinámico', () => {
    const customContext = {
      user: { email: 'custom@test.com' },
      contractorBrand: { companyName: 'CONTRATISTA SUR C.A.' },
      operatorBrand: { companyName: 'PETROBOSCÁN S.A.' },
    };

    const validData = {
      spoolId: 'SPOOL-999',
      pipeDiameterInches: 16,
      wallThicknessMm: 9.5,
      minRadiusD: 4.0,
      ovalityPercentage: 0.8,
      coldBendAngleDeg: 10,
      coldBendApprovedPDVSA: true,
      pigNavigable: true,
      defectCountILI: 0,
      inspectorNotes: 'Trazabilidad probada.',
    };

    const docVM = wf066Definition.deliverable.factory(customContext, validData);

    expect(docVM.contractorBrand?.companyName).toBe('CONTRATISTA SUR C.A.');
    expect(docVM.operatorBrand?.companyName).toBe('PETROBOSCÁN S.A.');
    expect(docVM.signers[0].organization).toBe('CONTRATISTA SUR C.A.');
    expect(docVM.signers[2].organization).toBe('PETROBOSCÁN S.A.');
  });

  it('11. No se introducen fallbacks hardcodeados', () => {
    const emptyBrandContext = {
      user: { email: 'test@ic360.io' },
      contractorBrand: { companyName: '' },
      operatorBrand: { companyName: '' },
    };

    const validData = {
      spoolId: 'SPOOL-100',
      pipeDiameterInches: 12,
      wallThicknessMm: 8.0,
      minRadiusD: 3.0,
      ovalityPercentage: 1.0,
      coldBendAngleDeg: 5,
      coldBendApprovedPDVSA: true,
      pigNavigable: true,
      defectCountILI: 0,
      inspectorNotes: 'Sin fallbacks hardcodeados.',
    };

    const docVM = wf066Definition.deliverable.factory(emptyBrandContext, validData);

    expect(docVM.signers[0].organization).toBe('');
    expect(docVM.signers[2].organization).toBe('');
    expect(docVM.signers[0].organization).not.toContain('PROINTECA');
    expect(docVM.signers[2].organization).not.toContain('PDVSA');
  });
});
