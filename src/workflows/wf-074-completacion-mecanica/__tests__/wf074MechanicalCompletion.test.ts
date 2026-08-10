import { describe, it, expect } from 'vitest';
import {
  wf074Definition,
  MechanicalCompletionSchema,
  createDefaultMechanicalCompletionData,
} from '../definition';

describe('Workflow wf-074: Completación Mecánica y Dossier de Calidad MC', () => {
  const dummyContext = {
    user: { email: 'inspector.mc@ic360.io' },
    contractorBrand: { companyName: 'CONTRATISTA MONTAJE C.A.' },
    operatorBrand: { companyName: 'PDVSA GAS S.A.' },
  };

  it('1. La factory devuelve defaults vacíos/deterministas', () => {
    const initialData = createDefaultMechanicalCompletionData();

    expect(initialData.subsystemCode).toBe('');
    expect(initialData.subsystemName).toBe('');
    expect(initialData.categoryAPunchCount).toBe(0);
    expect(initialData.categoryBPunchCount).toBe(0);
    expect(initialData.databookComplete).toBe(false);
    expect(initialData.hydrotestCertified).toBe(false);
    expect(initialData.completionDate).toBe('');
    expect(initialData.inspectorNotes).toBe('');
  });

  it('2. La factory no genera fechas, códigos, nombres ni datos ficticios', () => {
    const initialData = createDefaultMechanicalCompletionData();

    expect(initialData.subsystemCode).not.toContain('MC-SUB-');
    expect(initialData.inspectorNotes).not.toContain('Ing.');
    expect(initialData.completionDate).toBe('');
  });

  it('3. Los datos incompletos no pasan el esquema Zod', () => {
    const initialData = createDefaultMechanicalCompletionData();

    const parseResult = MechanicalCompletionSchema.safeParse(initialData);
    expect(parseResult.success).toBe(false);
    if (!parseResult.success) {
      const issuePaths = parseResult.error.issues.map((i) => i.path.join('.'));
      expect(issuePaths).toContain('subsystemCode');
      expect(issuePaths).toContain('subsystemName');
      expect(issuePaths).toContain('completionDate');
      expect(issuePaths).toContain('inspectorNotes');
    }
  });

  it('4. Los datos completos válidos pasan el esquema Zod', () => {
    const validData = {
      subsystemCode: 'SUB-101-MC',
      subsystemName: 'Subsistema de Compresión de Gas Principal',
      categoryAPunchCount: 0,
      categoryBPunchCount: 2,
      databookComplete: true,
      hydrotestCertified: true,
      completionDate: '2026-08-10',
      inspectorNotes: 'Caminata de inspección completada y pruebas hidrostáticas certificadas conforme a norma.',
    };

    const parseResult = MechanicalCompletionSchema.safeParse(validData);
    expect(parseResult.success).toBe(true);
  });

  it('5. El control de Punchlist Cat A detecta pendientes con mensaje advisory', () => {
    const punchGate = wf074Definition.hardGates.find((g) => g.id === 'PUNCHLIST_CRITICAL_ITEMS');
    expect(punchGate).toBeDefined();

    const invalidData = {
      ...createDefaultMechanicalCompletionData(),
      categoryAPunchCount: 3,
    };

    const result = punchGate!.evaluator(dummyContext, invalidData);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('REVISIÓN REQUERIDA DE PUNCHLIST CATEGORÍA A');
    expect(result.message).not.toContain('BLOQUEO');
    expect(result.message).not.toContain('RECHAZO AUTOMÁTICO');
    expect(result.message).not.toContain('NO SE PUEDE CONTINUAR');
  });

  it('6. El control de Databook detecta dossier o pruebas incompletas con mensaje advisory', () => {
    const databookGate = wf074Definition.hardGates.find((g) => g.id === 'DATABOOK_INCOMPLETE');
    expect(databookGate).toBeDefined();

    const unapprovedData = {
      ...createDefaultMechanicalCompletionData(),
      databookComplete: false,
      hydrotestCertified: false,
    };

    const result = databookGate!.evaluator(dummyContext, unapprovedData);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('ADVERTENCIA DE DATABOOK DE CALIDAD');
    expect(result.message).not.toContain('BLOQUEO');
    expect(result.message).not.toContain('RECHAZO AUTOMÁTICO');
    expect(result.message).not.toContain('NO SE PUEDE CONTINUAR');
  });

  it('7. El entregable inicial no aparece como APPROVED ni contiene fecha autoasignada', () => {
    const validData = {
      subsystemCode: 'SUB-101-MC',
      subsystemName: 'Subsistema de Compresión',
      categoryAPunchCount: 0,
      categoryBPunchCount: 0,
      databookComplete: true,
      hydrotestCertified: true,
      completionDate: '2026-08-10',
      inspectorNotes: 'Subsistema verificado.',
    };

    const docVM = wf074Definition.deliverable.factory(dummyContext, validData);

    expect(docVM.status).toBe('DRAFT');
    expect(docVM.code).toBe('SUB-101-MC');
    expect(docVM.date).toBe('2026-08-10');
  });

  it('8. Los firmantes iniciales no aparecen como SIGNED ni con fecha de firma', () => {
    const validData = {
      subsystemCode: 'SUB-101-MC',
      subsystemName: 'Subsistema de Compresión',
      categoryAPunchCount: 0,
      categoryBPunchCount: 0,
      databookComplete: true,
      hydrotestCertified: true,
      completionDate: '2026-08-10',
      inspectorNotes: 'Subsistema verificado.',
    };

    const docVM = wf074Definition.deliverable.factory(dummyContext, validData);

    expect(docVM.signers.length).toBe(3);
    docVM.signers.forEach((s) => {
      expect(s.status).toBe('PENDING');
      expect(s.signedAt).toBeUndefined();
    });
  });

  it('9. Los firmantes no contienen nombres ficticios autoasignados', () => {
    const validData = {
      subsystemCode: 'SUB-101-MC',
      subsystemName: 'Subsistema de Compresión',
      categoryAPunchCount: 0,
      categoryBPunchCount: 0,
      databookComplete: true,
      hydrotestCertified: true,
      completionDate: '2026-08-10',
      inspectorNotes: 'Subsistema verificado.',
    };

    const docVM = wf074Definition.deliverable.factory(dummyContext, validData);

    docVM.signers.forEach((s) => {
      expect(s.name).toBe('');
      expect(s.name).not.toContain('Ing.');
    });
  });

  it('10. El contexto de tenant/branding es dinámico', () => {
    const customContext = {
      user: { email: 'custom@test.com' },
      contractorBrand: { companyName: 'CONTRATISTA PETRÓLEO SUR C.A.' },
      operatorBrand: { companyName: 'PETROBOSCÁN S.A.' },
    };

    const validData = {
      subsystemCode: 'SUB-999-MC',
      subsystemName: 'Subsistema de Separación',
      categoryAPunchCount: 0,
      categoryBPunchCount: 0,
      databookComplete: true,
      hydrotestCertified: true,
      completionDate: '2026-08-10',
      inspectorNotes: 'Trazabilidad validada.',
    };

    const docVM = wf074Definition.deliverable.factory(customContext, validData);

    expect(docVM.contractorBrand?.companyName).toBe('CONTRATISTA PETRÓLEO SUR C.A.');
    expect(docVM.operatorBrand?.companyName).toBe('PETROBOSCÁN S.A.');
    expect(docVM.signers[0].organization).toBe('CONTRATISTA PETRÓLEO SUR C.A.');
    expect(docVM.signers[2].organization).toBe('PETROBOSCÁN S.A.');
  });

  it('11. No se introducen fallbacks hardcodeados', () => {
    const emptyBrandContext = {
      user: { email: 'test@ic360.io' },
      contractorBrand: { companyName: '' },
      operatorBrand: { companyName: '' },
    };

    const validData = {
      subsystemCode: 'SUB-100',
      subsystemName: 'Subsistema genérico',
      categoryAPunchCount: 0,
      categoryBPunchCount: 0,
      databookComplete: true,
      hydrotestCertified: true,
      completionDate: '2026-08-10',
      inspectorNotes: 'Sin fallbacks hardcodeados.',
    };

    const docVM = wf074Definition.deliverable.factory(emptyBrandContext, validData);

    expect(docVM.signers[0].organization).toBe('');
    expect(docVM.signers[2].organization).toBe('');
    expect(docVM.signers[0].organization).not.toContain('PROINTECA');
    expect(docVM.signers[2].organization).not.toContain('PDVSA');
  });
});
