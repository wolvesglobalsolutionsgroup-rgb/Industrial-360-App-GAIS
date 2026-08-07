import { z } from 'zod';
import { WorkflowDefinition } from '../../lib/workflows/contracts';
import { createDocumentViewModel } from '../../lib/documentViewModel';
import { freezeDocumentMetadata } from '../../lib/documentPolicy';
import {
  CivilTestingCapture,
  CivilTestingData,
} from './components/CivilTestingCapture';

export const SandConeTestSchema = z.object({
  location: z.string().min(3),
  layerDepthCm: z.number().positive(),
  moisturePercent: z.number(),
  wetDensityGcm3: z.number().positive(),
  dryDensityGcm3: z.number().positive(),
  proctorMaxDryDensityGcm3: z.number().positive(),
  compactionPercent: z.number().positive(),
  requiredCompactionPercent: z.number().positive(),
  passed: z.boolean(),
});

export const ConcreteCylinderTestSchema = z.object({
  structureName: z.string().min(3),
  batchNumber: z.string(),
  fcDesignKgcm2: z.number().positive(),
  ageDays: z.custom<7 | 14 | 28>((val) => typeof val === 'number' && [7, 14, 28].includes(val)),
  measuredStrengthKgcm2: z.number().positive(),
  expectedPercentAtAge: z.number().positive(),
  attainedPercentOfFc: z.number().positive(),
  passed: z.boolean(),
});

export const CivilTestRecordSchema = z.object({
  id: z.string(),
  testCode: z.string().min(3),
  testType: z.enum(['Densidad_Campo_Cono_Arena', 'Compresion_Probetas_Concreto']),
  testDate: z.string(),
  normRef: z.string(),
  inspectorName: z.string(),
  laboratoryName: z.string(),
  status: z.enum(['Aprobado', 'Rechazado', 'En Proceso']),
  sandConeData: SandConeTestSchema.optional(),
  concreteData: ConcreteCylinderTestSchema.optional(),
  notes: z.string().optional(),
});

export const CivilTestingWorkflowSchema = z.object({
  records: z.array(CivilTestRecordSchema),
  summaryNotes: z.string().optional(),
});

export const wf050Definition: WorkflowDefinition<CivilTestingData> = {
  id: 'wf-050-ensayos-civiles-suelos',
  title: 'Ensayos Civiles: Compactación de Suelos & Concreto (COVENIN / ASTM)',
  description:
    'Registro de pruebas de laboratorio y campo para mecánica de suelos (Cono de Arena) y resistencia a compresión de probetas de concreto.',
  phase: 4,
  rolesAllowed: ['superadmin', 'gerente', 'supervisor', 'inspector', 'campo'],
  captureComponent: CivilTestingCapture,
  schema: CivilTestingWorkflowSchema,
  hardGates: [
    {
      id: 'gate-compaction-95',
      name: 'Grado Mínimo de Compactación de Suelos (COVENIN 2000-92)',
      description:
        'Verifica que las pruebas de densidad de campo por Cono de Arena cumplan el grado de compactación especificado (≥ 95% o 98% Proctor).',
      evaluator: (_context, data) => {
        if (!data.records || data.records.length === 0) {
          return { passed: true };
        }
        const failedSuelos = data.records.find(
          (r) =>
            r.testType === 'Densidad_Campo_Cono_Arena' &&
            r.sandConeData &&
            r.sandConeData.compactionPercent < r.sandConeData.requiredCompactionPercent
        );
        if (failedSuelos && failedSuelos.sandConeData) {
          return {
            passed: false,
            message: `BLOQUEO GEOTÉCNICO: El ensayo ${failedSuelos.testCode} en ${failedSuelos.sandConeData.location} alcanzó ${failedSuelos.sandConeData.compactionPercent}% de compactación (requerido: ${failedSuelos.sandConeData.requiredCompactionPercent}%). Re-compactación requerida.`,
          };
        }
        return { passed: true };
      },
    },
    {
      id: 'gate-concrete-strength',
      name: 'Resistencia Mínima Aceptable de Probetas de Concreto',
      description:
        'Bloquea la aprobación si la resistencia medida a la edad de prueba no satisface la curva de madurez esperada de f\'c.',
      evaluator: (_context, data) => {
        if (!data.records || data.records.length === 0) {
          return { passed: true };
        }
        const failedConc = data.records.find(
          (r) =>
            r.testType === 'Compresion_Probetas_Concreto' &&
            r.concreteData &&
            r.concreteData.attainedPercentOfFc < r.concreteData.expectedPercentAtAge
        );
        if (failedConc && failedConc.concreteData) {
          return {
            passed: false,
            message: `BLOQUEO ESTRUCTURAL: La mezcla ${failedConc.concreteData.batchNumber} alcanzó ${failedConc.concreteData.attainedPercentOfFc}% de f'c a los ${failedConc.concreteData.ageDays} días (requerido: ${failedConc.concreteData.expectedPercentAtAge}%). No cumple COVENIN 1753.`,
          };
        }
        return { passed: true };
      },
    },
  ],
  deliverable: {
    id: 'deliv-050-informe-ensayos-civiles',
    title: 'Informe Técnico Certificado de Ensayos Civiles y Suelos',
    type: 'report',
    factory: (context, data) => {
      const recordsList = data.records || [];

      if (recordsList.length === 0) {
        throw new Error(
          'Error de Dominio: No se pueden generar entregables de ensayos civiles sin registros de pruebas de laboratorio o campo.'
        );
      }

      const signers = [
        {
          id: 'sig-050-1',
          role: 'INSPECTOR' as const,
          name: context.user.email,
          title: 'Inspector de Calidad Civil / Laboratorio Geotécnico',
          organization: 'PROINTECA C.A.',
          status: 'PENDING' as const,
        },
      ];

      return createDocumentViewModel({
        documentId: `INF-CIV-${Date.now().toString().slice(-5)}`,
        title: 'INFORME TÉCNICO CERTIFICADO DE ENSAYOS CIVILES Y SUELOS',
        code: `CERT-CIV-COVENIN-${context.projectId}`,
        date: new Date().toISOString().split('T')[0],
        status: 'DRAFT',
        contractorBrand: context.contractorBrand,
        operatorBrand: context.operatorBrand,
        signers,
        metadata: freezeDocumentMetadata(signers),
        sections: [
          {
            id: 'sec-1',
            title: '1. RESULTADOS DE DENSIDAD DE CAMPO Y COMPACTACIÓN DE SUELOS',
            content: recordsList
              .filter((r) => r.testType === 'Densidad_Campo_Cono_Arena' && r.sandConeData)
              .map(
                (r) =>
                  `Código: ${r.testCode} | Ubicación: ${r.sandConeData?.location} | Compactación: ${r.sandConeData?.compactionPercent}% (Mín: ${r.sandConeData?.requiredCompactionPercent}%) | Dictamen: ${r.status}`
              ),
          },
          {
            id: 'sec-2',
            title: '2. RESULTADOS DE RESISTENCIA A COMPRESIÓN DE PROBETAS DE CONCRETO',
            content: recordsList
              .filter((r) => r.testType === 'Compresion_Probetas_Concreto' && r.concreteData)
              .map(
                (r) =>
                  `Código: ${r.testCode} | Estructura: ${r.concreteData?.structureName} | Edad: ${r.concreteData?.ageDays} días | Esfuerzo Medido: ${r.concreteData?.measuredStrengthKgcm2} kg/cm² (${r.concreteData?.attainedPercentOfFc}% de f'c) | Dictamen: ${r.status}`
              ),
          },
          {
            id: 'sec-3',
            title: '3. CONCLUSIONES Y RECOMENDACIONES DE INGENIERÍA CIVIL',
            content: [
              data.summaryNotes ||
                'Los ensayos civiles presentados cumplen con los criterios especificados en COVENIN 2000-92 y ACI 318.',
            ],
          },
        ],
      });
    },
  },
};
