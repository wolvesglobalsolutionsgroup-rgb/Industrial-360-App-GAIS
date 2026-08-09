import { describe, it, expect } from 'vitest';
import { wf052Definition, InstrumentationWorkflowSchema } from '../definition';
import { exportDocument } from '../../../lib/exporters/exportDocument';

describe('wf-052-instrumentacion-lazos-pid Workflow Suite', () => {
  const validContext = {
    projectId: 'proj_test_052',
    orgId: 'org_test_052',
    user: { email: 'inspector_inst@ic360.io', role: 'inspector' },
    contractorBrand: 'PROINTECA C.A.',
    operatorBrand: 'PDVSA GAS',
  };

  const validLoopData = {
    id: 'loop_101',
    tagNo: 'PT-101A',
    loopTag: 'LOOP-101',
    pidNumber: 'P&ID-SJ-101',
    instrumentType: 'PT' as const,
    description: 'Transmisor de Presión HART',
    location: 'Cabezal Entrada',
    rangeMin: 0,
    rangeMax: 1000,
    unit: 'PSI',
    toleranceFsPercent: 0.5,
    signalType: '4-20mA HART' as const,
    calibrationDate: '2026-08-01',
    nextCalibrationDate: '2027-08-01',
    calibratedBy: 'Téc. Luis Silva',
    status: 'Calibrado & Operativo' as const,
    calibrationPoints: [
      { inputPercent: 0, expectedVal: 0, measuredVal: 0.1, errorPercentFs: 0.01, passed: true },
      { inputPercent: 50, expectedVal: 500, measuredVal: 500.5, errorPercentFs: 0.05, passed: true },
      { inputPercent: 100, expectedVal: 1000, measuredVal: 1001.0, errorPercentFs: 0.1, passed: true },
    ],
  };

  it('1. Debe estar correctamente registrado con ID "wf-052-instrumentacion-lazos-pid"', () => {
    expect(wf052Definition.id).toBe('wf-052-instrumentacion-lazos-pid');
  });

  it('2. Debe tener un título y fase 3 válidos', () => {
    expect(wf052Definition.title).toContain('Instrumentación');
    expect(wf052Definition.phase).toBe(3);
  });

  it('3. Debe validar el esquema Zod con datos válidos', () => {
    const validData = { loops: [validLoopData] };
    const result = InstrumentationWorkflowSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('4. Debe rechazar datos con arreglo de lazos vacío en la factory de entregable', () => {
    expect(() =>
      wf052Definition.deliverable!.factory(validContext, { loops: [] })
    ).toThrow('Error de Dominio');
  });

  it('5. Debe rechazar lazos con tipo de instrumento no válido en Zod', () => {
    const invalidData = {
      loops: [{ ...validLoopData, instrumentType: 'INVALID_TYPE' }],
    };
    const result = InstrumentationWorkflowSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('6. Debe aceptar datos válidos y generar un DocumentViewModel DRAFT', () => {
    const doc = wf052Definition.deliverable!.factory(validContext, {
      loops: [validLoopData],
    });

    expect(doc.status).toBe('DRAFT');
    expect(doc.signers[0].status).toBe('PENDING');
    expect((doc.signers[0] as any).signedAt).toBeUndefined();
  });

  it('7. El Hard Gate de tolerancia debe pasar con datos conformes', () => {
    const gate = wf052Definition.hardGates.find((g) => g.id === 'gate-instrument-tolerance');
    const res = gate!.evaluator(validContext as any, { loops: [validLoopData] });
    expect(res.passed).toBe(true);
  });

  it('8. El Hard Gate de tolerancia debe fallar si hay un punto fuera de tolerancia', () => {
    const failedLoop = {
      ...validLoopData,
      calibrationPoints: [
        { inputPercent: 0, expectedVal: 0, measuredVal: 50, errorPercentFs: 5.0, passed: false },
      ],
    };
    const gate = wf052Definition.hardGates.find((g) => g.id === 'gate-instrument-tolerance');
    const res = gate!.evaluator(validContext as any, { loops: [failedLoop] });
    expect(res.passed).toBe(false);
    expect(res.message).toContain('BLOQUEO DE INSTRUMENTACIÓN');
  });

  it('9. El Hard Gate de puntos mínimos debe fallar con menos de 3 puntos', () => {
    const incompleteLoop = {
      ...validLoopData,
      calibrationPoints: [
        { inputPercent: 0, expectedVal: 0, measuredVal: 0, errorPercentFs: 0, passed: true },
      ],
    };
    const gate = wf052Definition.hardGates.find((g) => g.id === 'gate-calibration-points');
    const res = gate!.evaluator(validContext as any, { loops: [incompleteLoop] });
    expect(res.passed).toBe(false);
    expect(res.message).toContain('BLOQUEO NORMATIVO');
  });

  it('10. Debe exportar a PDF correctamente sin errores', async () => {
    const doc = wf052Definition.deliverable!.factory(validContext, {
      loops: [validLoopData],
    });
    const result = await exportDocument(doc, ['pdf']);
    expect(result.pdf).toBeDefined();
    expect(result.pdf?.type).toBe('application/pdf');
    expect(result.pdf?.size).toBeGreaterThan(0);
  });

  it('11. Debe exportar a DOCX correctamente sin errores', async () => {
    const doc = wf052Definition.deliverable!.factory(validContext, {
      loops: [validLoopData],
    });
    const result = await exportDocument(doc, ['docx']);
    expect(result.docx).toBeDefined();
    expect(result.docx?.type).toContain('wordprocessingml');
    expect(result.docx?.size).toBeGreaterThan(0);
  });

  it('12. Debe exportar a XLSX correctamente sin errores', async () => {
    const doc = wf052Definition.deliverable!.factory(validContext, {
      loops: [validLoopData],
    });
    const result = await exportDocument(doc, ['xlsx']);
    expect(result.xlsx).toBeDefined();
    expect(result.xlsx?.type).toContain('spreadsheetml');
    expect(result.xlsx?.size).toBeGreaterThan(0);
  });

  it('13. Debe exportar a PPTX correctamente sin errores', async () => {
    const doc = wf052Definition.deliverable!.factory(validContext, {
      loops: [validLoopData],
    });
    const result = await exportDocument(doc, ['pptx']);
    expect(result.pptx).toBeDefined();
    expect(result.pptx?.type).toContain('presentationml');
    expect(result.pptx?.size).toBeGreaterThan(0);
  });
});
