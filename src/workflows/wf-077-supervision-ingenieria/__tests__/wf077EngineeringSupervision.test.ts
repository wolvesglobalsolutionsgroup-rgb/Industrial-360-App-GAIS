import { describe, it, expect } from 'vitest';
import {
  wf077Definition,
  EngineeringSupervisionSchema,
  createDefaultEngineeringSupervisionData,
} from '../definition';

describe('Workflow wf-077: Supervisión de Ingeniería y Certificación ORC', () => {
  const dummyContext = {
    user: { email: 'supervisor.ing@ic360.io' },
    contractorBrand: { companyName: 'SUPERVISIÓN Y PROYECTOS C.A.' },
    operatorBrand: { companyName: 'PDVSA GAS S.A.' },
  };

  it('1. Genera capturas iniciales por defecto completamente vacías y deterministas', () => {
    const initialData = createDefaultEngineeringSupervisionData();

    expect(initialData.packageCode).toBe('');
    expect(initialData.discipline).toBe('procesos');
    expect(initialData.revisionNumber).toBe('');
    expect(initialData.orcCertificateIssued).toBe(false);
    expect(initialData.orcCertificateCode).toBe('');
    expect(initialData.calculationsApproved).toBe(false);
    expect(initialData.supervisorNotes).toBe('');
  });

  it('2. La factory no genera fechas, códigos, nombres ni datos ficticios', () => {
    const initialData = createDefaultEngineeringSupervisionData();

    expect(initialData.packageCode).not.toContain('PKG-');
    expect(initialData.revisionNumber).not.toBe('REV-0');
    expect(initialData.orcCertificateCode).not.toContain('ORC-');
  });

  it('3. Valida que los datos incompletos no pasan el esquema Zod', () => {
    const initialData = createDefaultEngineeringSupervisionData();

    const parseResult = EngineeringSupervisionSchema.safeParse(initialData);
    expect(parseResult.success).toBe(false);
    if (!parseResult.success) {
      const issuePaths = parseResult.error.issues.map((i) => i.path.join('.'));
      expect(issuePaths).toContain('packageCode');
      expect(issuePaths).toContain('revisionNumber');
      expect(issuePaths).toContain('supervisorNotes');
    }
  });

  it('4. Valida que datos completos y válidos pasan el esquema Zod', () => {
    const validData = {
      packageCode: 'PKG-ING-DET-001',
      discipline: 'tuberias' as const,
      revisionNumber: 'REV-1',
      orcCertificateIssued: true,
      orcCertificateCode: 'ORC-2026-CERT-01',
      calculationsApproved: true,
      supervisorNotes: 'Memoria de cálculo de flexibilidad de tuberías conforme según ASME B31.3.',
    };

    const parseResult = EngineeringSupervisionSchema.safeParse(validData);
    expect(parseResult.success).toBe(true);
  });

  it('5. El control ORC detecta la ausencia de certificación (Hard Gate)', () => {
    const orcGate = wf077Definition.hardGates.find((g) => g.id === 'ORC_QUALITY_CERTIFICATE_MISSING');
    expect(orcGate).toBeDefined();

    const dataWithoutOrc = {
      ...createDefaultEngineeringSupervisionData(),
      packageCode: 'PKG-ING-DET-002',
      revisionNumber: 'REV-0',
      orcCertificateIssued: false,
    };

    const result = orcGate!.evaluator(dummyContext, dataWithoutOrc);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('Falta el Certificado de Calidad');
  });

  it('6. El control ORC acepta una certificación emitida y conforme', () => {
    const orcGate = wf077Definition.hardGates.find((g) => g.id === 'ORC_QUALITY_CERTIFICATE_MISSING');

    const dataWithOrc = {
      ...createDefaultEngineeringSupervisionData(),
      packageCode: 'PKG-ING-DET-002',
      revisionNumber: 'REV-0',
      orcCertificateIssued: true,
      orcCertificateCode: 'ORC-CERT-2026-05',
    };

    const result = orcGate!.evaluator(dummyContext, dataWithOrc);
    expect(result.passed).toBe(true);
  });

  it('7. Genera un DocumentViewModel inicial con estado DRAFT y fecha neutra vacía', () => {
    const validData = {
      packageCode: 'PKG-ING-DET-010',
      discipline: 'mecanica' as const,
      revisionNumber: 'REV-A',
      orcCertificateIssued: true,
      orcCertificateCode: 'ORC-CERT-10',
      calculationsApproved: true,
      supervisorNotes: 'Verificación mecánica completada sin objeciones.',
    };

    const docVM = wf077Definition.deliverable.factory(dummyContext, validData);

    expect(docVM.status).toBe('DRAFT');
    expect(docVM.code).toBe('PKG-ING-DET-010');
    expect(docVM.date).toBe('');
  });

  it('8. Los firmantes iniciales están en estado PENDING y sin fechas fijas de firma', () => {
    const validData = {
      packageCode: 'PKG-ING-DET-010',
      discipline: 'mecanica' as const,
      revisionNumber: 'REV-A',
      orcCertificateIssued: true,
      supervisorNotes: 'Verificación completada.',
    };

    const docVM = wf077Definition.deliverable.factory(dummyContext, validData);

    expect(docVM.signers.length).toBe(3);
    docVM.signers.forEach((s) => {
      expect(s.status).toBe('PENDING');
      expect(s.signedAt).toBeUndefined();
    });
  });

  it('9. Los firmantes no contienen nombres ni títulos de personas ficticias', () => {
    const validData = {
      packageCode: 'PKG-ING-DET-010',
      discipline: 'mecanica' as const,
      revisionNumber: 'REV-A',
      orcCertificateIssued: true,
      supervisorNotes: 'Verificación completada.',
    };

    const docVM = wf077Definition.deliverable.factory(dummyContext, validData);

    docVM.signers.forEach((s) => {
      expect(s.name).toBe('');
      expect(s.name).not.toContain('Ing.');
      expect(s.name).not.toContain('Especialista');
    });
  });

  it('10. Conserva el contexto de branding dinámico sin fallbacks hardcodeados', () => {
    const customContext = {
      user: { email: 'custom@test.com' },
      contractorBrand: { companyName: 'CONTRATISTA VENEZUELA C.A.' },
      operatorBrand: { companyName: 'PETROBOSCÁN S.A.' },
    };

    const validData = {
      packageCode: 'PKG-001',
      discipline: 'procesos' as const,
      revisionNumber: 'REV-1',
      orcCertificateIssued: true,
      supervisorNotes: 'Prueba de branding dinámico.',
    };

    const docVM = wf077Definition.deliverable.factory(customContext, validData);

    expect(docVM.contractorBrand?.companyName).toBe('CONTRATISTA VENEZUELA C.A.');
    expect(docVM.operatorBrand?.companyName).toBe('PETROBOSCÁN S.A.');
    expect(docVM.signers[0].organization).toBe('CONTRATISTA VENEZUELA C.A.');
    expect(docVM.signers[2].organization).toBe('PETROBOSCÁN S.A.');
  });
});
