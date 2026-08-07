import { z } from 'zod';
import { WorkflowDefinition } from '../../lib/workflows/contracts';
import { createDocumentViewModel } from '../../lib/documentViewModel';
import { freezeDocumentMetadata } from '../../lib/documentPolicy';
import {
  LotoIsolationCapture,
  LotoIsolationData,
  LOTO_ENERGY_TYPES,
  LOTO_LOCK_COLORS,
  LOTO_STATUS_TYPES,
} from './components/LotoIsolationCapture';

export const LotoPointSchema = z.object({
  id: z.string(),
  tagEquipment: z.string().min(3),
  systemName: z.string(),
  energyType: z.enum(LOTO_ENERGY_TYPES),
  isolationMethod: z.string().min(3),
  lockTagId: z.string().min(3),
  lockColor: z.enum(LOTO_LOCK_COLORS),
  ptwNumber: z.string(),
  responsibleSupervisor: z.string(),
  isolationDate: z.string(),
  status: z.enum(LOTO_STATUS_TYPES),
  chkDeenergized: z.boolean(),
  chkPhysicalLock: z.boolean(),
  chkTagPlaced: z.boolean(),
  chkZeroEnergyVerified: z.boolean(),
  chkSignaturesApproved: z.boolean(),
  zeroEnergyTestDetails: z.string().optional(),
  notes: z.string().optional(),
});

export const LotoIsolationWorkflowSchema = z.object({
  lotoPoints: z.array(LotoPointSchema),
  summaryNotes: z.string().optional(),
});

export const wf051Definition: WorkflowDefinition<LotoIsolationData> = {
  id: 'wf-051-control-aislamiento-loto',
  title: 'Control de Aislamiento de Energías Peligrosas LOTO (PDVSA SI-S-28)',
  description:
    'Procedimiento seguro de Bloqueo, Etiquetado y Prueba de Energía Cero previo a la intervención de equipos e instalaciones.',
  phase: 4,
  rolesAllowed: ['superadmin', 'gerente', 'supervisor', 'inspector', 'campo'],
  captureComponent: LotoIsolationCapture,
  schema: LotoIsolationWorkflowSchema,
  hardGates: [
    {
      id: 'gate-loto-zero-energy',
      name: 'Verificación Obligatoria de Prueba de Energía Cero (PDVSA SI-S-28)',
      description:
        'Bloquea la autorización del trabajo si no se ha ejecutado y registrado explícitamente la Prueba de Energía Cero (0 V, 0 PSI, 0 PPM).',
      evaluator: (_context, data) => {
        if (!data.lotoPoints || data.lotoPoints.length === 0) {
          return { passed: true };
        }
        const unverified = data.lotoPoints.find(
          (p) =>
            !p.chkZeroEnergyVerified ||
            !p.zeroEnergyTestDetails ||
            p.zeroEnergyTestDetails.trim().length < 5
        );
        if (unverified) {
          return {
            passed: false,
            message: `BLOQUEO DE SEGURIDAD LOTO: El punto de aislamiento "${unverified.tagEquipment}" no cuenta con la comprobación de Prueba de Energía Cero obligatoria según PDVSA SI-S-28.`,
          };
        }
        return { passed: true };
      },
    },
    {
      id: 'gate-loto-physical-lock',
      name: 'Instalación de Candado y Tarjeta Física de Bloqueo',
      description:
        'Garantiza que la energía esté físicamente interrumpida con candado y tarjeta identificada.',
      evaluator: (_context, data) => {
        if (!data.lotoPoints || data.lotoPoints.length === 0) {
          return { passed: true };
        }
        const noLock = data.lotoPoints.find((p) => !p.chkPhysicalLock || !p.chkTagPlaced);
        if (noLock) {
          return {
            passed: false,
            message: `BLOQUEO DE SEGURIDAD LOTO: El equipo "${noLock.tagEquipment}" carece de candado físico o tarjeta de advertencia colocada.`,
          };
        }
        return { passed: true };
      },
    },
  ],
  deliverable: {
    id: 'deliv-051-certificado-loto',
    title: 'Certificado de Aislamiento y Prueba de Energía Cero LOTO',
    type: 'certificate',
    factory: (context, data) => {
      const points = data.lotoPoints || [];

      if (points.length === 0) {
        throw new Error(
          'Error de Dominio: No se pueden generar certificados LOTO sin puntos de aislamiento o bloqueo registrados.'
        );
      }

      const signers = [
        {
          id: 'sig-051-1',
          role: 'INSPECTOR' as const,
          name: context.user.email,
          title: 'Inspector SIHO-A / Custodio de Aislamiento LOTO',
          organization: 'PROINTECA C.A.',
          status: 'PENDING' as const,
        },
      ];

      return createDocumentViewModel({
        documentId: `CERT-LOTO-${Date.now().toString().slice(-5)}`,
        title: 'CERTIFICADO DE AISLAMIENTO Y PRUEBA DE ENERGÍA CERO (LOTO)',
        code: `PDVSA-SI-S-28-${context.projectId}`,
        date: new Date().toISOString().split('T')[0],
        status: 'DRAFT',
        contractorBrand: context.contractorBrand,
        operatorBrand: context.operatorBrand,
        signers,
        metadata: freezeDocumentMetadata(signers),
        sections: [
          {
            id: 'sec-1',
            title: '1. PUNTOS DE AISLAMIENTO Y TARJETAS LOTO REGISTRADAS',
            content: points.map(
              (p) =>
                `Equipo: ${p.tagEquipment} | Energía: ${p.energyType} | Candado: ${p.lockTagId} | Permiso: ${p.ptwNumber} | Estado: ${p.status}`
            ),
          },
          {
            id: 'sec-2',
            title: '2. COMPROBACIÓN DE PRUEBA DE ENERGÍA CERO',
            content: points.map(
              (p) =>
                `Equipo: ${p.tagEquipment} | Detalles Prueba Cero: ${p.zeroEnergyTestDetails} | Verificado: ${p.chkZeroEnergyVerified ? 'SÍ (0.0 V / 0.0 PSI)' : 'NO'}`
            ),
          },
          {
            id: 'sec-3',
            title: '3. OBSERVACIONES DE NORMALIZACIÓN Y SEGURIDAD',
            content: [data.summaryNotes || 'Aislamiento seguro conforme a PDVSA SI-S-28.'],
          },
        ],
      });
    },
  },
};
