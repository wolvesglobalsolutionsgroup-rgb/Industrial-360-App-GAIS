import { describe, it, expect } from 'vitest';
import { wf053Definition, WorkerQrWorkflowSchema } from '../definition';
import { createDefaultFieldWorker } from '../components/WorkerQrCapture';
import { exportDocument } from '../../../lib/exporters/exportDocument';

describe('wf-053-registro-personal-qr Workflow Suite', () => {
  const validContext = {
    projectId: 'proj_test_053',
    orgId: 'org_test_053',
    user: { email: 'rrhh_siho@ic360.io', role: 'supervisor' },
    contractorBrand: 'PROINTECA C.A.',
    operatorBrand: 'PDVSA PETRÓLEO',
  };

  const validWorkerData = {
    id: 'worker_101',
    credentialId: 'CRD_12345678',
    nationalId: 'V-18.492.102',
    fullName: 'Carlos Mendoza',
    role: 'Soldador GTAW 6G',
    contractor: 'Consorcio O&G',
    bloodType: 'O+',
    allergies: 'Ninguna',
    medicalCheckValidUntil: '2027-01-01',
    sihoInductionValidUntil: '2027-01-01',
    fitStatus: 'Apto' as const,
    totalHhtAccumulated: 450,
  };

  it('1. Debe estar correctamente registrado con ID "wf-053-registro-personal-qr"', () => {
    expect(wf053Definition.id).toBe('wf-053-registro-personal-qr');
  });

  it('2. Debe tener un título y fase 4 válidos', () => {
    expect(wf053Definition.title).toContain('Registro de Personal');
    expect(wf053Definition.phase).toBe(4);
  });

  it('3. Debe verificar los defaults iniciales al crear un nuevo trabajador', () => {
    const newWorker = createDefaultFieldWorker({
      nationalId: 'V-20.111.222',
      fullName: 'Juan Pérez',
    });

    expect(newWorker.fitStatus).toBe('Vencido');
    expect(newWorker.credentialId).toBe('');
    expect(newWorker.role).toBe('');
    expect(newWorker.contractor).toBe('');
    expect(newWorker.bloodType).toBe('');
    expect(newWorker.allergies).toBe('');
    expect(newWorker.medicalCheckValidUntil).toBe('');
    expect(newWorker.sihoInductionValidUntil).toBe('');
    expect(newWorker.totalHhtAccumulated).toBe(0);
  });

  it('4. Debe validar el esquema Zod con datos válidos', () => {
    const validData = { workers: [validWorkerData] };
    const result = WorkerQrWorkflowSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('5. Debe rechazar datos con arreglo de trabajadores vacío en la factory de entregable', () => {
    expect(() =>
      wf053Definition.deliverable!.factory(validContext, { workers: [] })
    ).toThrow('Error de Dominio');
  });

  it('6. Debe aceptar datos válidos y generar un DocumentViewModel DRAFT', () => {
    const doc = wf053Definition.deliverable!.factory(validContext, {
      workers: [validWorkerData],
    });

    expect(doc.status).toBe('DRAFT');
    expect(doc.signers[0].status).toBe('PENDING');
    expect((doc.signers[0] as any).signedAt).toBeUndefined();
  });

  it('7. El Hard Gate de aptitud SIHO debe bloquear arreglo vacío o trabajadores vencidos/incompletos', () => {
    const gate = wf053Definition.hardGates.find((g) => g.id === 'gate-siho-fit-status');
    const resEmpty = gate!.evaluator(validContext as any, { workers: [] });
    expect(resEmpty.passed).toBe(false);

    const newWorker = createDefaultFieldWorker({ nationalId: 'V-22.333.444', fullName: 'Pedro Rivas' });
    const resDefault = gate!.evaluator(validContext as any, { workers: [newWorker] });
    expect(resDefault.passed).toBe(false);
    expect(resDefault.message).toContain('BLOQUEO SIHO-A');
  });

  it('8. El Hard Gate de aptitud SIHO debe pasar con trabajador Apto', () => {
    const gate = wf053Definition.hardGates.find((g) => g.id === 'gate-siho-fit-status');
    const res = gate!.evaluator(validContext as any, { workers: [validWorkerData] });
    expect(res.passed).toBe(true);
  });

  it('9. El Hard Gate de aptitud SIHO debe fallar si hay un trabajador No Apto', () => {
    const unfitWorker = { ...validWorkerData, fitStatus: 'No Apto' as const };
    const gate = wf053Definition.hardGates.find((g) => g.id === 'gate-siho-fit-status');
    const res = gate!.evaluator(validContext as any, { workers: [unfitWorker] });
    expect(res.passed).toBe(false);
    expect(res.message).toContain('BLOQUEO SIHO-A');
  });

  it('10. El Hard Gate de inducción SIHO debe fallar si la inducción o examen está vencido o vacío', () => {
    const gate = wf053Definition.hardGates.find((g) => g.id === 'gate-siho-induction-validity');
    
    const resEmpty = gate!.evaluator(validContext as any, { workers: [] });
    expect(resEmpty.passed).toBe(false);

    const expiredWorker = { ...validWorkerData, sihoInductionValidUntil: '2020-01-01' };
    const resExpired = gate!.evaluator(validContext as any, { workers: [expiredWorker] });
    expect(resExpired.passed).toBe(false);
    expect(resExpired.message).toContain('BLOQUEO DE SEGURIDAD');
  });

  it('11. Debe exportar a PDF correctamente sin errores', async () => {
    const doc = wf053Definition.deliverable!.factory(validContext, {
      workers: [validWorkerData],
    });
    const result = await exportDocument(doc, ['pdf']);
    expect(result.pdf).toBeDefined();
    expect(result.pdf?.type).toBe('application/pdf');
    expect(result.pdf?.size).toBeGreaterThan(0);
  });

  it('12. Debe exportar a DOCX correctamente sin errores', async () => {
    const doc = wf053Definition.deliverable!.factory(validContext, {
      workers: [validWorkerData],
    });
    const result = await exportDocument(doc, ['docx']);
    expect(result.docx).toBeDefined();
    expect(result.docx?.type).toContain('wordprocessingml');
    expect(result.docx?.size).toBeGreaterThan(0);
  });

  it('13. Debe exportar a XLSX correctamente sin errores', async () => {
    const doc = wf053Definition.deliverable!.factory(validContext, {
      workers: [validWorkerData],
    });
    const result = await exportDocument(doc, ['xlsx']);
    expect(result.xlsx).toBeDefined();
    expect(result.xlsx?.type).toContain('spreadsheetml');
    expect(result.xlsx?.size).toBeGreaterThan(0);
  });

  it('14. Debe exportar a PPTX correctamente sin errores', async () => {
    const doc = wf053Definition.deliverable!.factory(validContext, {
      workers: [validWorkerData],
    });
    const result = await exportDocument(doc, ['pptx']);
    expect(result.pptx).toBeDefined();
    expect(result.pptx?.type).toContain('presentationml');
    expect(result.pptx?.size).toBeGreaterThan(0);
  });
});
