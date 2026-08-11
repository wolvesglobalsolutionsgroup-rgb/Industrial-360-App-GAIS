import { describe, it, expect } from 'vitest';
import { wf043Definition } from '../definition';
import { createDefaultPtwData, PtwApprovalSchema } from '../types';

describe('Workflow wf-043: Permisos de Trabajo Seguro PTW (PDVSA IR-S-04)', () => {
  const dummyContext = {
    user: { email: 'inspector.siho@pdvsa.com' },
    contractorBrand: { companyName: 'PROINTECA C.A.', rif: 'J-30594821-0' },
    operatorBrand: { companyName: 'PDVSA PETRÓLEO S.A.', rnpfegriNumber: 'RNP-1029' },
  };

  it('1. Genera estructura de captura por defecto vacía y determinista sin datos ni nombres ficticios', () => {
    const initialData = createDefaultPtwData();

    expect(initialData.ptwCode).toBe('');
    expect(initialData.installationArea).toBe('');
    expect(initialData.workDescription).toBe('');
    expect(initialData.workType).toBe('frio');
    expect(initialData.maxDurationHours).toBe(8);
    expect(initialData.contractorEligibility.contractorName).toBe('');
    expect(initialData.contractorEligibility.contractorStatus).toBe('PENDING_EVALUATION');
    expect(initialData.contractorEligibility.sihoaPlanApproved).toBe(false);
    expect(initialData.preStartReadiness.artApproved).toBe(false);
    expect(initialData.preStartReadiness.procedureApproved).toBe(false);
    expect(initialData.signers.emisor.name).toBe('');
    expect(initialData.signers.receptor.name).toBe('');
    expect(initialData.signers.ejecutor.name).toBe('');
    expect(initialData.status).toBe('DRAFT');
  });

  it('2. El esquema Zod rechaza datos vacíos o incompletos', () => {
    const initialData = createDefaultPtwData();
    const result = PtwApprovalSchema.safeParse(initialData);

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('ptwCode');
      expect(paths).toContain('installationArea');
      expect(paths).toContain('workDescription');
    }
  });

  it('3. El esquema Zod acepta datos completos y válidos', () => {
    const validData = createDefaultPtwData();
    validData.ptwCode = 'PTW-2026-CRP-001';
    validData.installationArea = 'Planta de Fraccionamiento Ulé';
    validData.workDescription = 'Ajuste de brida y mantenimiento de válvula V-101';
    validData.contractorEligibility.contractorName = 'PROINTECA C.A.';
    validData.contractorEligibility.contractorStatus = 'APTA';
    validData.contractorEligibility.sihoaPlanApproved = true;
    validData.preStartReadiness.artCode = 'ART-2026-01';
    validData.preStartReadiness.artApproved = true;
    validData.preStartReadiness.procedureCode = 'PROC-MEC-01';
    validData.preStartReadiness.procedureApproved = true;
    validData.gasTest.testTime = '08:00';
    validData.gasTest.equipoMultigasSerial = 'MULTI-RAE-9021-X';
    validData.startTime = '08:00';
    validData.signers.emisor = { name: 'Ing. Carlos Mendoza', ci: '12345678', certNumber: 'CERT-EM-10', role: 'EMISOR', organization: 'PDVSA', status: 'SIGNED' };
    validData.signers.receptor = { name: 'Ing. Manuel Rivas', ci: '87654321', certNumber: 'CERT-REC-20', role: 'RECEPTOR', organization: 'PROINTECA', status: 'SIGNED' };
    validData.signers.ejecutor = { name: 'Jose Perez', ci: '11223344', certNumber: 'N/A', role: 'EJECUTOR', organization: 'PROINTECA', status: 'SIGNED' };

    const result = PtwApprovalSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('4. Hard Gate "gate-contractor-readiness" bloquea si la contratista no es APTA o falta Plan SIHOA', () => {
    const gate = wf043Definition.hardGates.find((g) => g.id === 'gate-contractor-readiness');
    expect(gate).toBeDefined();

    const dataNotApta = createDefaultPtwData();
    dataNotApta.contractorEligibility.contractorStatus = 'SUSPENDIDA';

    const res1 = gate!.evaluator(dummyContext, dataNotApta);
    expect(res1.passed).toBe(false);
    expect(res1.message).toContain('no posee estatus APTA');

    dataNotApta.contractorEligibility.contractorStatus = 'APTA';
    dataNotApta.contractorEligibility.sihoaPlanApproved = false;

    const res2 = gate!.evaluator(dummyContext, dataNotApta);
    expect(res2.passed).toBe(false);
    expect(res2.message).toContain('Plan SIHOA de la empresa contratista no está aprobado');
  });

  it('5. Hard Gate "gate-issuance-hard-blocks" bloquea trabajo en caliente con LEL > 0.0%', () => {
    const gate = wf043Definition.hardGates.find((g) => g.id === 'gate-issuance-hard-blocks');
    expect(gate).toBeDefined();

    const hotWorkWithLel = createDefaultPtwData();
    hotWorkWithLel.workType = 'caliente';
    hotWorkWithLel.gasTest.lelPercentage = 2.5; // > 0.0%
    hotWorkWithLel.gasTest.equipoMultigasSerial = 'MULTI-RAE-9021';
    hotWorkWithLel.startTime = '08:00';
    hotWorkWithLel.gasTest.testTime = '08:00';
    hotWorkWithLel.signers.emisor = { name: 'Emisor Test', ci: '123', certNumber: 'C1', role: 'EMISOR', organization: 'PDVSA', status: 'SIGNED' };
    hotWorkWithLel.signers.receptor = { name: 'Receptor Test', ci: '456', certNumber: 'C2', role: 'RECEPTOR', organization: 'CONTRATISTA', status: 'SIGNED' };
    hotWorkWithLel.signers.ejecutor = { name: 'Ejecutor Test', ci: '789', certNumber: 'N/A', role: 'EJECUTOR', organization: 'CONTRATISTA', status: 'SIGNED' };

    const result = gate!.evaluator(dummyContext, hotWorkWithLel);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('Trabajo en Caliente exige 0.0% v/v LEL');
  });

  it('6. Hard Gate "gate-issuance-hard-blocks" bloquea si Hora de Inicio y Hora de Gas Test no coinciden', () => {
    const gate = wf043Definition.hardGates.find((g) => g.id === 'gate-issuance-hard-blocks');

    const unmathcedTimeData = createDefaultPtwData();
    unmathcedTimeData.startTime = '08:00';
    unmathcedTimeData.gasTest.testTime = '08:30'; // Mismatch

    const result = gate!.evaluator(dummyContext, unmathcedTimeData);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('debe coincidir exactamente con la hora de la prueba inicial de gas');
  });

  it('7. Hard Gate "gate-issuance-hard-blocks" bloquea si la duración excede 8 horas en trabajo normal o 12 en parada', () => {
    const gate = wf043Definition.hardGates.find((g) => g.id === 'gate-issuance-hard-blocks');

    const excessDurationData = createDefaultPtwData();
    excessDurationData.isPlantShutdownOrMajorMaint = false;
    excessDurationData.maxDurationHours = 10; // > 8h

    const result = gate!.evaluator(dummyContext, excessDurationData);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('excede el máximo permitido de 8h');
  });

  it('8. Hard Gate "gate-closeout-verification" valida orden, limpieza y retiro de bloqueos LOTO', () => {
    const gate = wf043Definition.hardGates.find((g) => g.id === 'gate-closeout-verification');
    expect(gate).toBeDefined();

    const closeoutData = createDefaultPtwData();
    closeoutData.closeout.areaCleanAndOrderly = false;

    const res1 = gate!.evaluator(dummyContext, closeoutData);
    expect(res1.passed).toBe(false);
    expect(res1.message).toContain('orden y limpieza');

    closeoutData.closeout.areaCleanAndOrderly = true;
    closeoutData.closeout.locksRemovedAndReconnected = false;

    const res2 = gate!.evaluator(dummyContext, closeoutData);
    expect(res2.passed).toBe(false);
    expect(res2.message).toContain('bloqueos hayan sido retirados');

    closeoutData.closeout.locksRemovedAndReconnected = true;
    const res3 = gate!.evaluator(dummyContext, closeoutData);
    expect(res3.passed).toBe(true);
  });

  it('9. La fábrica de entregable genera un DocumentViewModel con estado y firmantes tripartitos', () => {
    const validData = createDefaultPtwData();
    validData.ptwCode = 'PTW-2026-VAL-09';
    validData.workType = 'caliente';
    validData.status = 'ISSUED';
    validData.signers.emisor = { name: 'Emisor Val', ci: '1', certNumber: 'E1', role: 'EMISOR', organization: 'PDVSA', status: 'SIGNED' };
    validData.signers.receptor = { name: 'Receptor Val', ci: '2', certNumber: 'R1', role: 'RECEPTOR', organization: 'PROINTECA', status: 'SIGNED' };
    validData.signers.ejecutor = { name: 'Ejecutor Val', ci: '3', certNumber: 'N/A', role: 'EJECUTOR', organization: 'PROINTECA', status: 'SIGNED' };

    const docVM = wf043Definition.deliverable.factory(dummyContext, validData);

    expect(docVM.documentId).toBe('PTW-DOC-PTW-2026-VAL-09');
    expect(docVM.code).toBe('PTW-2026-VAL-09');
    expect(docVM.status).toBe('APPROVED');
    expect(docVM.signers.length).toBe(3);
    expect(docVM.signers[0].role).toBe('OPERATOR');
    expect(docVM.signers[1].role).toBe('CONTRACTOR');
    expect(docVM.signers[2].role).toBe('CONTRACTOR');
    expect(docVM.sections.length).toBeGreaterThanOrEqual(4);
  });

  it('10. Maneja los parámetros externos pendientes sin valores ficticios ni falsas validaciones', () => {
    const dataWithPending = createDefaultPtwData();
    dataWithPending.pendingExternalParameters.push({
      parameterId: 'param-telemetry-gas',
      parameterName: 'Telemetría de Sensor Continuo H2S',
      expectedSource: 'MQTT / Modbus SCADA Ulé',
      warningMessage: 'Telemetría remota no conectada. Se requiere medición manual con explosímetro verificado.',
      status: 'PENDING_EXTERNAL_PARAMETER',
    });

    expect(dataWithPending.pendingExternalParameters.length).toBe(1);
    expect(dataWithPending.pendingExternalParameters[0].status).toBe('PENDING_EXTERNAL_PARAMETER');
    expect(dataWithPending.pendingExternalParameters[0].value).toBeUndefined();
  });

  it('11. DEV-02: Hard Gate bloquea la emisión de PTW si falta el Serial del Equipo Multigas', () => {
    const gate = wf043Definition.hardGates.find((g) => g.id === 'gate-issuance-hard-blocks');
    const dataWithoutSerial = createDefaultPtwData();
    dataWithoutSerial.gasTest.equipoMultigasSerial = ''; // Falta serial

    const res = gate!.evaluator(dummyContext, dataWithoutSerial);
    expect(res.passed).toBe(false);
    expect(res.message).toContain('Serial del Equipo Multigas');
  });

  it('12. DEV-03: Hard Gate bloquea prórroga de PTW si excede 2 horas o falta la firma del Emisor', () => {
    const gate = wf043Definition.hardGates.find((g) => g.id === 'gate-issuance-hard-blocks');
    const dataExcessExtension = createDefaultPtwData();
    dataExcessExtension.startTime = '08:00';
    dataExcessExtension.gasTest.testTime = '08:00';
    dataExcessExtension.gasTest.equipoMultigasSerial = 'MULTI-RAE-100';
    dataExcessExtension.signers.emisor = { name: 'E1', ci: '1', certNumber: 'C1', role: 'EMISOR', organization: 'PDVSA', status: 'SIGNED' };
    dataExcessExtension.signers.receptor = { name: 'R1', ci: '2', certNumber: 'C2', role: 'RECEPTOR', organization: 'CONTRATISTA', status: 'SIGNED' };
    dataExcessExtension.signers.ejecutor = { name: 'Ej1', ci: '3', certNumber: 'N/A', role: 'EJECUTOR', organization: 'CONTRATISTA', status: 'SIGNED' };

    dataExcessExtension.extension.requested = true;
    dataExcessExtension.extension.extensionHours = 3; // > 2h
    dataExcessExtension.extension.emisorSigned = false;

    const res1 = gate!.evaluator(dummyContext, dataExcessExtension);
    expect(res1.passed).toBe(false);
    expect(res1.message).toContain('no puede exceder las dos (2) horas');

    dataExcessExtension.extension.extensionHours = 2;
    const res2 = gate!.evaluator(dummyContext, dataExcessExtension);
    expect(res2.passed).toBe(false);
    expect(res2.message).toContain('firma digital obligatoria del EMISOR');
  });
});
