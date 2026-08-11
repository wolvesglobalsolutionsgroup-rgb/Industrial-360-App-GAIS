import { describe, it, expect } from 'vitest';
import { wf044ArtDefinition, ArtApprovalSchema } from '../definition';
import { exportDocument } from '../../../lib/exporters/exportDocument';

describe('WF-044 Análisis de Riesgos del Trabajo (ART PDVSA IR-S-17) Suite', () => {
  const validContext = {
    projectId: 'proj_art_test',
    orgId: 'org_art_test',
    user: { email: 'inspector_siho@pdvsa.com', role: 'inspector' },
    contractorBrand: 'SERVICIOS INDUSTRIALES PETROLEROS C.A.',
    operatorBrand: 'PDVSA GAS',
  };

  const validArtData = {
    numeroArt: 'ART-2026-001',
    tituloTrabajo: 'Mantenimiento Preventivo a Válvula de Alivio PSV-101',
    instalacionArea: 'Planta Compresora San Joaquín - Tren A',
    empresa: 'CONTRATISTA' as const,
    contratoNumero: 'CTR-2025-4491',
    ordenSapNumero: '40001892',
    fechaElaboracion: '2026-08-11',
    hojaNumero: '1 de 1',
    procedimientoRelacionado: 'PROC-SI-S-20-0012',
    siteVerified: true,
    siteVerificationLocation: 'Lat 9.6812, Lon -64.3411',
    pasos: [
      {
        pasoNumero: 1,
        pasoDescripcion: 'Despresurización y purga de línea de entrada a PSV-101',
        peligrosIdentificados: [
          { categoria: 'QUIMICO' as const, descripcion: 'Presencia de gases tóxicos H2S y vapores inflamables' },
          { categoria: 'MECANICO' as const, descripcion: 'Presión residual atrapada en cavidad de válvula' },
        ],
        evaluacionProbabilidad: 'MEDIA' as const,
        evaluacionSeveridad: 'CRITICA' as const,
        nivelRiesgoCalculado: 'ALTO' as const,
        medidasPreventivas: 'Uso de Detección Continua H2S/LEL, LOTO en válvulas de aislamiento, purga con N2',
        responsableEjecucionControl: 'Ing. SIHOA / Operador de Planta',
      },
    ],
    aprobadorEmisor: {
      nombre: 'Ing. Carlos Mendoza',
      ci: 'V-12345678',
      cargo: 'Superintendente de Operaciones',
      firma: 'FIRMA_DIGITAL_EMISOR',
    },
    aprobadorReceptor: {
      nombre: 'Téc. Luis Silva',
      ci: 'V-87654321',
      cargo: 'Supervisor de Mantenimiento',
      firma: 'FIRMA_DIGITAL_RECEPTOR',
    },
    aprobadorEjecutor: {
      nombre: 'Ing. Roberto Gómez',
      ci: 'V-11223344',
      cargo: 'Supervisor Contratista SIHOA',
      firma: 'FIRMA_DIGITAL_EJECUTOR',
    },
    workersAssignedCount: 2,
    divulgacionTrabajadores: [
      { nombre: 'Juan Pérez', ci: 'V-[REDACTED]', cargo: 'Mecánico I', firma: 'FIRMA_1', fecha: '2026-08-11' },
      { nombre: 'Pedro López', ci: 'V-[REDACTED]', cargo: 'Instrumentista', firma: 'FIRMA_2', fecha: '2026-08-11' },
    ],
    conditionsChanged: false,
    linkedPtwNumber: 'PTW-2026-8812',
    currentState: 'ACTIVE_IN_FIELD' as const,
  };

  it('1. Debe estar correctamente registrado con ID "wf-044-analisis-riesgos-trabajo"', () => {
    expect(wf044ArtDefinition.id).toBe('wf-044-analisis-riesgos-trabajo');
  });

  it('2. Debe validar el esquema Zod con datos conformes de ART', () => {
    const result = ArtApprovalSchema.safeParse(validArtData);
    expect(result.success).toBe(true);
  });

  it('3. RULE-HARD-01: Debe bloquear si no se ha verificado el trabajo en sitio (siteVerified = false)', () => {
    const gate = wf044ArtDefinition.hardGates.find((g) => g.id === 'gate-site-verified');
    const res = gate!.evaluator(validContext as any, { ...validArtData, siteVerified: false });
    expect(res.passed).toBe(false);
    expect(res.message).toContain('HARD_BLOCK (IR-S-17 §5.2)');
  });

  it('4. RULE-HARD-02: Debe bloquear si las firmas de divulgación son menores que los trabajadores asignados', () => {
    const gate = wf044ArtDefinition.hardGates.find((g) => g.id === 'gate-worker-disclosure');
    const resIncomplete = gate!.evaluator(validContext as any, {
      ...validArtData,
      workersAssignedCount: 5,
      divulgacionTrabajadores: [
        { nombre: 'Juan Pérez', ci: 'V-[REDACTED]', cargo: 'Mecánico I', firma: 'FIRMA_1', fecha: '2026-08-11' },
      ],
    });
    expect(resIncomplete.passed).toBe(false);
    expect(resIncomplete.message).toContain('HARD_BLOCK (IR-S-17 §5.3)');
  });

  it('5. RULE-HARD-03: Debe bloquear si falta alguna firma tripartita (Emisor, Receptor, Ejecutor)', () => {
    const gate = wf044ArtDefinition.hardGates.find((g) => g.id === 'gate-tripartite-signatures');
    const resMissingEmisor = gate!.evaluator(validContext as any, {
      ...validArtData,
      aprobadorEmisor: { nombre: '', ci: '', cargo: '', firma: '' },
    });
    expect(resMissingEmisor.passed).toBe(false);
    expect(resMissingEmisor.message).toContain('HARD_BLOCK (IR-S-17 Anexo A)');
  });

  it('6. RULE-HARD-04: Debe suspender/bloquear si se registran cambios de condiciones (conditionsChanged = true)', () => {
    const gate = wf044ArtDefinition.hardGates.find((g) => g.id === 'gate-condition-reevaluation');
    const resChanged = gate!.evaluator(validContext as any, {
      ...validArtData,
      conditionsChanged: true,
      changeReason: 'Lluvia intensa y vientos > 35 km/h',
    });
    expect(resChanged.passed).toBe(false);
    expect(resChanged.message).toContain('REVISION_REQUIRED');
  });

  it('7. Debe generar un DocumentViewModel según formato PDVSA IR-S-17 Anexo A', () => {
    const doc = wf044ArtDefinition.deliverable!.factory(validContext, validArtData);
    expect(doc.title).toContain('ANÁLISIS DE RIESGOS DEL TRABAJO');
    expect(doc.code).toContain('PDVSA-IR-S-17');
    expect(doc.signers.length).toBe(3);
    expect(doc.tables.length).toBeGreaterThan(0);
    expect(doc.tables[0].title).toContain('ANÁLISIS SECUENCIAL DE TAREAS');
  });

  it('8. Debe exportar a PDF correctamente sin errores', async () => {
    const doc = wf044ArtDefinition.deliverable!.factory(validContext, validArtData);
    const result = await exportDocument(doc, ['pdf']);
    expect(result.pdf).toBeDefined();
    expect(result.pdf?.type).toBe('application/pdf');
  });

  it('9. Debe exportar a DOCX, XLSX y PPTX correctamente', async () => {
    const doc = wf044ArtDefinition.deliverable!.factory(validContext, validArtData);
    const result = await exportDocument(doc, ['docx', 'xlsx', 'pptx']);
    expect(result.docx).toBeDefined();
    expect(result.xlsx).toBeDefined();
    expect(result.pptx).toBeDefined();
  });
});
