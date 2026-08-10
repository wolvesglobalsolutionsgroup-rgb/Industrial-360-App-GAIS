import { z } from 'zod';
import { WorkflowDefinition } from '../../lib/workflows/contracts';
import { createDocumentViewModel } from '../../lib/documentViewModel';
import { freezeDocumentMetadata } from '../../lib/documentPolicy';
import { Bim3dWeldingCapture } from './components/Bim3dWeldingCapture';

export interface Bim3dWeldingIntegrityData {
  spoolId: string;
  pipeDiameterInches: number;
  wallThicknessMm: number;
  minRadiusD: number;
  ovalityPercentage: number;
  coldBendAngleDeg: number;
  coldBendApprovedPDVSA: boolean;
  pigNavigable: boolean;
  defectCountILI: number;
  inspectorNotes: string;
}

export const Bim3dWeldingIntegritySchema = z.object({
  spoolId: z.string().min(3, 'El ID de Spool BIM 3D debe tener al menos 3 caracteres'),
  pipeDiameterInches: z.number().positive('El diámetro nominal de tubería debe ser positivo'),
  wallThicknessMm: z.number().positive('El espesor de pared nominal debe ser positivo'),
  minRadiusD: z.number().min(3, 'El radio mínimo de curvatura debe ser mayor o igual a 3D para navegabilidad PIG'),
  ovalityPercentage: z.number().min(0).max(10, 'La ovalidad debe estar entre 0% y 10%'),
  coldBendAngleDeg: z.number().min(0).max(90, 'El ángulo de doblez en frío debe estar entre 0º y 90º'),
  coldBendApprovedPDVSA: z.boolean(),
  pigNavigable: z.boolean(),
  defectCountILI: z.number().int().min(0),
  inspectorNotes: z.string().min(5, 'Las observaciones de integridad deben tener al menos 5 caracteres'),
});

export function createDefaultBim3dWeldingData(): Bim3dWeldingIntegrityData {
  return {
    spoolId: '',
    pipeDiameterInches: 0,
    wallThicknessMm: 0,
    minRadiusD: 0,
    ovalityPercentage: 0,
    coldBendAngleDeg: 0,
    coldBendApprovedPDVSA: false,
    pigNavigable: false,
    defectCountILI: 0,
    inspectorNotes: '',
  };
}

export const wf066Definition: WorkflowDefinition<Bim3dWeldingIntegrityData> = {
  id: 'wf-066-bim3d-integridad-soldadura',
  title: 'Integridad de Soldadura, Modelo BIM 3D y Navegabilidad ILI (GPG Fase 5)',
  description: 'Control de spooling digital 3D, inspección de curva en frío bajo PDVSA H-221 y factibilidad de corrida de rascador inteligente PIG.',
  phase: 5,
  rolesAllowed: ['superadmin', 'gerente', 'supervisor', 'inspector'],
  captureComponent: Bim3dWeldingCapture,
  schema: Bim3dWeldingIntegritySchema,
  hardGates: [
    {
      id: 'GATE_PIG_NAVIGABILITY',
      name: 'Navegabilidad de Rascador Inteligente (PIG Navigability)',
      description: 'Bloquea la aprobación si la ovalidad supera el 3% o si el radio de curvatura es menor a 3D.',
      evaluator: (_context, data) => {
        if (!data.pigNavigable || data.ovalityPercentage > 3.0 || data.minRadiusD < 3.0) {
          return {
            passed: false,
            message: `BLOQUEO DE NAVEGABILIDAD ILI: La geometría del spool presenta ovalidad del ${data.ovalityPercentage}% (>3%) o radio de curvatura (${data.minRadiusD}D < 3D), impidiendo el paso del rascador inteligente.`,
          };
        }
        return { passed: true };
      },
    },
    {
      id: 'GATE_COLD_BEND_PDVSA',
      name: 'Conformidad de Doblez en Frío (Norma PDVSA H-221 / ASME B31.4)',
      description: 'Valida que la curvado en frío cumple con las restricciones dimensionales y ausencia de arrugas.',
      evaluator: (_context, data) => {
        if (!data.coldBendApprovedPDVSA) {
          return {
            passed: false,
            message: 'RECHAZO DE CURVADO EN FRÍO: La geometría del doblez no cuenta con el certificado de no corrugación y ovalidad bajo norma PDVSA H-221.',
          };
        }
        return { passed: true };
      },
    },
  ],
  deliverable: {
    id: 'deliv-066-certificado-integridad',
    title: 'Certificado de Integridad Geométrica de Soldadura y BIM 3D',
    type: 'certificate',
    factory: (context, data) => {
      const signers = [
        {
          id: 'sig-066-1',
          role: 'INSPECTOR' as const,
          name: '',
          title: 'Inspector NDT Nivel III / Integridad Operativa',
          organization: context.contractorBrand.companyName || '',
          status: 'PENDING' as const,
          signedAt: undefined,
        },
        {
          id: 'sig-066-2',
          role: 'CONTRACTOR' as const,
          name: '',
          title: 'Modelador / Especialista Spooling',
          organization: context.contractorBrand.companyName || '',
          status: 'PENDING' as const,
          signedAt: undefined,
        },
        {
          id: 'sig-066-3',
          role: 'OPERATOR' as const,
          name: '',
          title: 'Gerente de Integridad de Activos',
          organization: context.operatorBrand.companyName || '',
          status: 'PENDING' as const,
          signedAt: undefined,
        },
      ];

      return createDocumentViewModel({
        documentId: `CERT-BIM-INTEGRIDAD-${data.spoolId || 'PENDIENTE'}`,
        title: 'CERTIFICADO DE INTEGRIDAD DE SOLDADURA Y NAVEGABILIDAD ILI BIM 3D',
        code: `CERT-BIM-${data.spoolId || 'PENDIENTE'}`,
        date: '',
        status: 'DRAFT',
        contractorBrand: context.contractorBrand,
        operatorBrand: context.operatorBrand,
        signers,
        metadata: freezeDocumentMetadata(signers),
        sections: [
          {
            id: 'sec-bim-1',
            title: '1. PARÁMETROS GEOMÉTRICOS Y EVALUACIÓN DE NAVEGABILIDAD',
            content: [
              `ID Spool / Elemento BIM: ${data.spoolId || 'PENDIENTE'}`,
              `Diámetro Nominal: ${data.pipeDiameterInches} pulgadas`,
              `Espesor de Pared: ${data.wallThicknessMm} mm`,
              `Radio Mínimo Curvatura: ${data.minRadiusD}D`,
              `Porcentaje de Ovalidad: ${data.ovalityPercentage}% (Límite máximo 3.0%)`,
              `Ángulo de Doblez en Frío: ${data.coldBendAngleDeg}°`,
              `Conformidad Norma PDVSA H-221: ${data.coldBendApprovedPDVSA ? 'APROBADO' : 'NO APROBADO'}`,
              `Factibilidad de Paso de PIG: ${data.pigNavigable ? 'GARANTIZADO Y CERTIFICADO' : 'NO NAVEGABLE'}`,
              `Anomalías ILI Detectadas: ${data.defectCountILI}`,
            ],
          },
          {
            id: 'sec-bim-2',
            title: '2. DICTAMEN DE INSPECCIÓN Y TRAZABILIDAD 3D',
            content: [data.inspectorNotes || 'Sin observaciones registradas.'],
          },
        ],
      });
    },
  },
};
