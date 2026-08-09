import { describe, it, expect } from 'vitest';
import { wf054Definition, FleetWorkflowSchema } from '../definition';
import { exportDocument } from '../../../lib/exporters/exportDocument';

describe('wf-054-flota-equipos-pesados Workflow Suite', () => {
  const validContext = {
    projectId: 'proj_test_054',
    orgId: 'org_test_054',
    user: { email: 'mantenimiento_flota@ic360.io', role: 'inspector' },
    contractorBrand: 'PROINTECA C.A.',
    operatorBrand: 'PDVSA GAS',
  };

  const validEquipmentData = {
    id: 'fleet_101',
    tag: 'GRU-80T-01',
    name: 'Grúa Terex 80T',
    type: 'Grúa Telescópica',
    brandModel: 'Terex RT-780',
    currentHorometer: 1200,
    lastServiceHorometer: 1000,
    nextServiceHorometer: 1250,
    maintenanceIntervalHours: 250,
    status: 'OPERATIONAL' as const,
    preOpChecklist: {
      checkEngineOil: true,
      checkHydraulicLeaks: true,
      checkBrakesAlerts: true,
      checkFireExtinguisher: true,
      checkEmergencyStop: true,
      passedAll: true,
    },
  };

  it('1. Debe estar correctamente registrado con ID "wf-054-flota-equipos-pesados"', () => {
    expect(wf054Definition.id).toBe('wf-054-flota-equipos-pesados');
  });

  it('2. Debe tener un título y fase 4 válidos', () => {
    expect(wf054Definition.title).toContain('Flota');
    expect(wf054Definition.phase).toBe(4);
  });

  it('3. Debe validar el esquema Zod con datos válidos', () => {
    const validData = { equipment: [validEquipmentData] };
    const result = FleetWorkflowSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('4. Debe rechazar datos con arreglo de equipos vacío en la factory de entregable', () => {
    expect(() =>
      wf054Definition.deliverable!.factory(validContext, { equipment: [] })
    ).toThrow('Error de Dominio');
  });

  it('5. Debe aceptar datos válidos y generar un DocumentViewModel DRAFT', () => {
    const doc = wf054Definition.deliverable!.factory(validContext, {
      equipment: [validEquipmentData],
    });

    expect(doc.status).toBe('DRAFT');
    expect(doc.signers[0].status).toBe('PENDING');
    expect((doc.signers[0] as any).signedAt).toBeUndefined();
  });

  it('6. El Hard Gate pre-operativo debe pasar con checklist aprobado', () => {
    const gate = wf054Definition.hardGates.find((g) => g.id === 'gate-preop-checklist');
    const res = gate!.evaluator(validContext as any, { equipment: [validEquipmentData] });
    expect(res.passed).toBe(true);
  });

  it('7. El Hard Gate pre-operativo debe fallar si el checklist pre-operativo no pasó', () => {
    const failedPreOp = {
      ...validEquipmentData,
      preOpChecklist: { ...validEquipmentData.preOpChecklist, checkEmergencyStop: false, passedAll: false },
    };
    const gate = wf054Definition.hardGates.find((g) => g.id === 'gate-preop-checklist');
    const res = gate!.evaluator(validContext as any, { equipment: [failedPreOp] });
    expect(res.passed).toBe(false);
    expect(res.message).toContain('BLOQUEO DE MAQUINARIA');
  });

  it('8. El Hard Gate de horómetro de mantenimiento debe fallar si horómetro >= próximo servicio', () => {
    const overdueEquipment = { ...validEquipmentData, currentHorometer: 1300 };
    const gate = wf054Definition.hardGates.find((g) => g.id === 'gate-maintenance-due');
    const res = gate!.evaluator(validContext as any, { equipment: [overdueEquipment] });
    expect(res.passed).toBe(false);
    expect(res.message).toContain('BLOQUEO DE MANTENIMIENTO');
  });

  it('9. Debe exportar a PDF correctamente sin errores', async () => {
    const doc = wf054Definition.deliverable!.factory(validContext, {
      equipment: [validEquipmentData],
    });
    const result = await exportDocument(doc, ['pdf']);
    expect(result.pdf).toBeDefined();
    expect(result.pdf?.type).toBe('application/pdf');
    expect(result.pdf?.size).toBeGreaterThan(0);
  });

  it('10. Debe exportar a DOCX correctamente sin errores', async () => {
    const doc = wf054Definition.deliverable!.factory(validContext, {
      equipment: [validEquipmentData],
    });
    const result = await exportDocument(doc, ['docx']);
    expect(result.docx).toBeDefined();
    expect(result.docx?.type).toContain('wordprocessingml');
    expect(result.docx?.size).toBeGreaterThan(0);
  });

  it('11. Debe exportar a XLSX correctamente sin errores', async () => {
    const doc = wf054Definition.deliverable!.factory(validContext, {
      equipment: [validEquipmentData],
    });
    const result = await exportDocument(doc, ['xlsx']);
    expect(result.xlsx).toBeDefined();
    expect(result.xlsx?.type).toContain('spreadsheetml');
    expect(result.xlsx?.size).toBeGreaterThan(0);
  });

  it('12. Debe exportar a PPTX correctamente sin errores', async () => {
    const doc = wf054Definition.deliverable!.factory(validContext, {
      equipment: [validEquipmentData],
    });
    const result = await exportDocument(doc, ['pptx']);
    expect(result.pptx).toBeDefined();
    expect(result.pptx?.type).toContain('presentationml');
    expect(result.pptx?.size).toBeGreaterThan(0);
  });
});
