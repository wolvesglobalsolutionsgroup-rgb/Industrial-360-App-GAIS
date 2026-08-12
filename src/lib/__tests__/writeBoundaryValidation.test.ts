import 'fake-indexeddb/auto';
import { describe, it, expect, vi } from 'vitest';
import { BaseRepository } from '../repositories/baseRepo';
import { sihoPtwRepo } from '../repositories/sihoPtwRepo';
import { valuationsRepo } from '../repositories/valuationsRepo';
import { fieldReportsRepo } from '../repositories/fieldReportsRepo';
import { projectsRepo } from '../repositories/projectsRepo';
import { tasksRepo } from '../repositories/tasksRepo';
import { lotoIsolationsRepo } from '../repositories/lotoIsolationsRepo';
import { repositorySchemasMap, ValuationRecordSchema, SihoPtwRecordSchema } from '../domain/entitySchemas';
import { queueOutboxOperation } from '../offline/outbox';
import { WorkflowRunner } from '../workflows/runner';
import { getWorkflow } from '../workflows/registry';
import { ensureWorkflowsRegistered } from '../../workflows';
import { createDefaultPtwData } from '../../workflows/wf-043-aprobacion-ptw/types';

ensureWorkflowsRegistered();

// Mock Firebase firestore addDoc / updateDoc to prevent actual network calls in unit tests
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<any>('firebase/firestore');
  return {
    ...actual,
    addDoc: vi.fn().mockResolvedValue({ id: 'mocked-doc-id-123' }),
    updateDoc: vi.fn().mockResolvedValue(undefined),
    doc: vi.fn().mockReturnValue({ id: 'mocked-doc-ref' }),
    collection: vi.fn().mockReturnValue({ id: 'mocked-collection-ref' }),
  };
});

describe('Sprint F-D1 — Database & Storage Write Boundary Zod Validation', () => {

  const testOrgId = 'ORG-TEST-001';
  const testProjectId = 'PROJ-TEST-001';

  describe('1. BaseRepository & Typed Repositories Zod Validation', () => {
    it('debe permitir la creación cuando el payload de Valuación es válido', async () => {
      const validValuation = {
        number: 1,
        periodStart: '2026-08-01',
        periodEnd: '2026-08-15',
        description: 'Valuación #1 Avance Físico 25%',
        grossAmount: 150000,
        netAmount: 135000,
        status: 'Borrador',
      };

      const result = await valuationsRepo.create(testOrgId, testProjectId, validValuation as any);
      expect(result).toBeDefined();
      expect(result.id).toBe('mocked-doc-id-123');
    });

    it('debe rechazar la creación cuando el monto de Valuación es negativo', async () => {
      const invalidValuation = {
        number: 1,
        description: 'Valuación inválida con monto negativo',
        grossAmount: -5000,
        netAmount: 100,
        status: 'Borrador',
      };

      await expect(
        valuationsRepo.create(testOrgId, testProjectId, invalidValuation as any)
      ).rejects.toThrow(/monto bruto debe ser mayor o igual a cero/i);
    });

    it('debe rechazar la creación cuando falta el código de PTW SIHO', async () => {
      const invalidPtw = {
        code: '', // Vacio - violacion min(1)
        status: 'DRAFT',
      };

      await expect(
        sihoPtwRepo.create(testOrgId, testProjectId, invalidPtw as any)
      ).rejects.toThrow(/Fallo de validación/i);
    });

    it('debe validar las actualizaciones parciales con Zod', async () => {
      const invalidUpdate = {
        grossAmount: -100, // Invalido para update
      };

      await expect(
        valuationsRepo.update(testOrgId, testProjectId, 'val-123', invalidUpdate as any)
      ).rejects.toThrow(/monto bruto debe ser mayor o igual a cero/i);
    });
  });

  describe('2. Offline Outbox Queue Zod Boundary Validation', () => {
    it('debe encolar correctamente en Outbox cuando el payload es válido', async () => {
      const validReport = {
        reportNo: 'REP-FIELD-2026-001',
        date: '2026-08-11',
        author: 'Ing. Carlos Mendoza',
        notes: 'Inspección de soldadura en tramo K10',
        status: 'Completado',
      };

      const item = await queueOutboxOperation({
        collectionName: 'field_reports',
        operationType: 'create',
        payload: validReport,
        orgId: testOrgId,
        projectId: testProjectId,
      });

      expect(item).toBeDefined();
      expect(item.collectionName).toBe('field_reports');
      expect(item.payload.reportNo).toBe('REP-FIELD-2026-001');
    });

    it('debe rechazar el encolado en Outbox cuando el payload de LOTO no posee número de etiqueta', async () => {
      const invalidLoto = {
        tagNumber: '', // Violación min(1)
        equipmentName: 'Bomba Principal B-101',
        status: 'ACTIVE',
      };

      await expect(
        queueOutboxOperation({
          collectionName: 'loto_isolations',
          operationType: 'create',
          payload: invalidLoto,
          orgId: testOrgId,
          projectId: testProjectId,
        })
      ).rejects.toThrow(/ZodOutboxValidationError/i);
    });
  });

  describe('3. Workflows Kernel Zod Validation (PTW, ART, PTS, Calibración)', () => {
    it('debe validar exitosamente el esquema Zod de PTW (wf-043)', () => {
      const wf = getWorkflow('wf-043-aprobacion-ptw');
      expect(wf).toBeDefined();

      const validPtwData = {
        ...createDefaultPtwData(),
        ptwCode: 'PTW-HOT-2026-099',
        installationArea: 'Planta Compresora TK-101',
        workDescription: 'Trabajo de corte y soldadura en caliente',
        contractorEligibility: {
          ...createDefaultPtwData().contractorEligibility,
          contractorName: 'SERVICIOS INDUSTRIALES VENEZUELA C.A.',
        },
        preStartReadiness: {
          ...createDefaultPtwData().preStartReadiness,
          artCode: 'ART-2026-001',
          procedureCode: 'PROC-SOLD-01',
        },
        gasTest: {
          ...createDefaultPtwData().gasTest,
          testTime: '08:00 AM',
          equipoMultigasSerial: 'SERIAL-MG-2026-X',
        },
        signers: {
          emisor: { name: 'Ing. Emisor', ci: 'V-12345678', certNumber: 'CERT-EM-01', role: 'EMISOR' as const, organization: 'PDVSA', status: 'PENDING' as const },
          receptor: { name: 'Ing. Receptor', ci: 'V-87654321', certNumber: 'CERT-REC-01', role: 'RECEPTOR' as const, organization: 'CONTRATISTA', status: 'PENDING' as const },
          ejecutor: { name: 'Ing. Ejecutor', ci: 'V-11223344', certNumber: 'CERT-EJ-01', role: 'EJECUTOR' as const, organization: 'CONTRATISTA', status: 'PENDING' as const },
        },
      };

      const validation = wf!.schema.safeParse(validPtwData);
      expect(validation.success).toBe(true);
    });

    it('debe rechazar datos de PTW con formato incorrecto', () => {
      const wf = getWorkflow('wf-043-aprobacion-ptw');

      const invalidPtwData = {
        ptwCode: '', // Inválido
      };

      const validation = wf!.schema.safeParse(invalidPtwData);
      expect(validation.success).toBe(false);
    });

    it('debe validar la estructura de ART en el kernel (wf-044-analisis-riesgos-trabajo)', () => {
      const wf = getWorkflow('wf-044-analisis-riesgos-trabajo');
      expect(wf).toBeDefined();

      const validArtData = {
        numeroArt: 'ART-2026-001',
        tituloTrabajo: 'Corte y soldadura en línea de gas 12"',
        instalacionArea: 'Planta Compresora',
        empresa: 'CONTRATISTA' as const,
        fechaElaboracion: '2026-08-11',
        hojaNumero: '1 de 1',
        siteVerified: true,
        pasos: [
          {
            pasoNumero: 1,
            pasoDescripcion: 'Verificación de atmósfera',
            peligrosIdentificados: [{ categoria: 'QUIMICO' as const, descripcion: 'Gas H2S' }],
            medidasPreventivas: 'Uso de detector de gas',
            responsableEjecucionControl: 'Inspector SIHO',
          },
        ],
        aprobadorEmisor: { nombre: 'Ing. Emisor', ci: 'V-12345678', cargo: 'Emisor', firma: 'FIRMA_1' },
        aprobadorReceptor: { nombre: 'Ing. Receptor', ci: 'V-87654321', cargo: 'Receptor', firma: 'FIRMA_2' },
        aprobadorEjecutor: { nombre: 'Ing. Ejecutor', ci: 'V-11223344', cargo: 'Ejecutor', firma: 'FIRMA_3' },
        workersAssignedCount: 1,
        divulgacionTrabajadores: [],
        conditionsChanged: false,
      };

      const validation = wf!.schema.safeParse(validArtData);
      expect(validation.success).toBe(true);
    });
  });

  describe('4. Central Repository Schema Map Integrity', () => {
    it('debe incluir mapeos de esquemas Zod para todas las 27 colecciones principales', () => {
      const requiredCollections = [
        'siho_ptw', 'loto_isolations', 'art', 'calibrations', 'valuations',
        'field_reports', 'tasks', 'weld_joints', 'projects', 'workers',
        'worker_attendance', 'fleet_equipment', 'procurement', 'inventory',
        'routes', 'alerts', 'client_portals', 'apus', 'civil_structures',
        'dossiers', 'expenses', 'hot_taps', 'instrument_loops', 'environmental',
        'standby_moc', 'wbs_snapshots', 'documents'
      ];

      requiredCollections.forEach(col => {
        expect(repositorySchemasMap[col]).toBeDefined();
      });
    });
  });

});
