import { describe, it, expect } from 'vitest';
import { getWorkflow } from '../workflows/registry';
import { WorkflowRunner } from '../workflows/runner';
import { ensureWorkflowsRegistered } from '../../workflows';
ensureWorkflowsRegistered();

describe('F-H1 & F-D2 — Data Integrity & Negative Tests (wf-048, wf-050, wf-051)', () => {
  const dummyContext = {
    projectId: 'PRJ-TEST-2026',
    user: { id: 'usr-1', email: 'inspector@pdvsa.com', roles: ['inspector'] },
    contractorBrand: {
      companyName: 'PROINTECA INDUSTRIAL C.A.',
      taxId: 'RIF J-30123456-0',
      primaryColor: '#0B2239',
      secondaryColor: '#059669',
      address: 'Anaco, Venezuela',
    },
    operatorBrand: {
      companyName: 'PDVSA PETRÓLEO S.A.',
      taxId: 'RIF J-00000000-0',
      primaryColor: '#DC2626',
      secondaryColor: '#1E293B',
      address: 'Caracas, Venezuela',
    },
  };

  describe('1. wf-048-gestion-ambiental-siho Data Integrity', () => {
    const def = getWorkflow('wf-048-gestion-ambiental-siho')!;

    it('debe existir la definición en el registry', () => {
      expect(def).toBeDefined();
    });

    it('debe lanzar un Error de Dominio si la fábrica se invoca sin aspectos ni manifiestos', async () => {
      const emptyData = { aspects: [], manifests: [], summaryNotes: '' };
      await expect(
        WorkflowRunner.generateDeliverable(def, dummyContext as any, emptyData)
      ).rejects.toThrow('Error de Dominio');
    });

    it('debe generar entregable con status DRAFT y firmante PENDING cuando hay datos válidos', async () => {
      const validData = {
        aspects: [
          {
            id: 'asp-1',
            activity: 'Limpieza de Válvulas',
            aspect: 'Generación de Trapos',
            environmentalImpact: 'Contaminación Suelo',
            significance: 'Bajo' as const,
            mitigationMeasure: 'Disposición en tambores',
            normRef: 'PDVSA MA-01',
            responsible: 'SIHO',
            status: 'Implementado' as const,
          },
        ],
        manifests: [],
      };

      const doc = await WorkflowRunner.generateDeliverable(def, dummyContext as any, validData);
      expect(doc.status).toBe('DRAFT');
      expect(doc.signers[0].status).toBe('PENDING');
      expect(doc.signers[0].signedAt).toBeUndefined();
    });
  });

  describe('2. wf-050-ensayos-civiles-suelos Data Integrity', () => {
    const def = getWorkflow('wf-050-ensayos-civiles-suelos')!;

    it('debe existir la definición en el registry', () => {
      expect(def).toBeDefined();
    });

    it('debe lanzar un Error de Dominio si la fábrica se invoca sin registros de ensayo', async () => {
      const emptyData = { records: [], summaryNotes: '' };
      await expect(
        WorkflowRunner.generateDeliverable(def, dummyContext as any, emptyData)
      ).rejects.toThrow('Error de Dominio');
    });

    it('debe generar entregable con status DRAFT y firmante PENDING cuando hay datos válidos', async () => {
      const validData = {
        records: [
          {
            id: 'rec-1',
            testCode: 'ENS-SUELO-001',
            testType: 'Densidad_Campo_Cono_Arena' as const,
            testDate: '2026-08-06',
            normRef: 'COVENIN 2000-92',
            inspectorName: 'Ing. Test',
            laboratoryName: 'Lab Central',
            status: 'Aprobado' as const,
            sandConeData: {
              location: 'Fundación 1',
              layerDepthCm: 30,
              moisturePercent: 8,
              wetDensityGcm3: 2.1,
              dryDensityGcm3: 1.95,
              proctorMaxDryDensityGcm3: 2.0,
              compactionPercent: 97.5,
              requiredCompactionPercent: 95.0,
              passed: true,
            },
          },
        ],
      };

      const doc = await WorkflowRunner.generateDeliverable(def, dummyContext as any, validData);
      expect(doc.status).toBe('DRAFT');
      expect(doc.signers[0].status).toBe('PENDING');
    });
  });

  describe('3. wf-051-control-aislamiento-loto Data Integrity', () => {
    const def = getWorkflow('wf-051-control-aislamiento-loto')!;

    it('debe existir la definición en el registry', () => {
      expect(def).toBeDefined();
    });

    it('debe lanzar un Error de Dominio si la fábrica se invoca sin puntos LOTO', async () => {
      const emptyData = { lotoPoints: [], summaryNotes: '' };
      await expect(
        WorkflowRunner.generateDeliverable(def, dummyContext as any, emptyData)
      ).rejects.toThrow('Error de Dominio');
    });

    it('debe generar entregable con status DRAFT y firmante PENDING cuando hay datos válidos', async () => {
      const validData = {
        lotoPoints: [
          {
            id: 'loto-1',
            tagEquipment: 'K-101 Compress',
            systemName: 'Gas System',
            energyType: 'Eléctrica' as const,
            isolationMethod: 'Apertura Breaker CCMD',
            lockTagId: 'LOCK-001',
            lockColor: 'Rojo - Personal' as const,
            ptwNumber: 'PTW-2026-100',
            responsibleSupervisor: 'SIHO Lead',
            isolationDate: '2026-08-06',
            status: 'Prueba Cero Realizada' as const,
            chkDeenergized: true,
            chkPhysicalLock: true,
            chkTagPlaced: true,
            chkZeroEnergyVerified: true,
            chkSignaturesApproved: true,
            zeroEnergyTestDetails: '0.0 VAC en bornes L1-L2-L3',
          },
        ],
      };

      const doc = await WorkflowRunner.generateDeliverable(def, dummyContext as any, validData);
      expect(doc.status).toBe('DRAFT');
      expect(doc.signers[0].status).toBe('PENDING');
    });
  });
});
