import { z } from 'zod';
import { WorkflowDefinition } from '../../lib/workflows/contracts';
import { createDocumentViewModel } from '../../lib/documentViewModel';
import { freezeDocumentMetadata } from '../../lib/documentPolicy';
import { MechanicalCompletionCapture } from './components/MechanicalCompletionCapture';

export interface MechanicalCompletionData {
  subsystemCode: string;
  subsystemName: string;
  categoryAPunchCount: number;
  categoryBPunchCount: number;
  databookComplete: boolean;
  hydrotestCertified: boolean;
  completionDate: string;
  inspectorNotes: string;
}

export const MechanicalCompletionSchema = z.object({
  subsystemCode: z.string().min(3, 'El código de subsistema es obligatorio'),
  subsystemName: z.string().min(3, 'El nombre del subsistema es obligatorio'),
  categoryAPunchCount: z.number().int().min(0),
  categoryBPunchCount: z.number().int().min(0),
  databookComplete: z.boolean(),
  hydrotestCertified: z.boolean(),
  completionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD'),
  inspectorNotes: z.string().min(5, 'Las observaciones de completación deben tener al menos 5 caracteres'),
});

export function createDefaultMechanicalCompletionData(): MechanicalCompletionData {
  return {
    subsystemCode: '',
    subsystemName: '',
    categoryAPunchCount: 0,
    categoryBPunchCount: 0,
    databookComplete: false,
    hydrotestCertified: false,
    completionDate: '',
    inspectorNotes: '',
  };
}

export const wf074Definition: WorkflowDefinition<MechanicalCompletionData> = {
  id: 'wf-074-completacion-mecanica',
  title: 'Acta de Completación Mecánica y Dossier de Calidad MC (GPG Fase 7)',
  description: 'Certificación de finalización de montaje mecánico, verificación de Punchlist Categoría A y cierre de pruebas hidrostáticas.',
  phase: 7,
  rolesAllowed: ['superadmin', 'gerente', 'supervisor', 'inspector'],
  captureComponent: MechanicalCompletionCapture,
  schema: MechanicalCompletionSchema,
  hardGates: [
    {
      id: 'PUNCHLIST_CRITICAL_ITEMS',
      name: 'Ausencia de Pendientes Críticos (Punchlist Categoría A)',
      description: 'Evalúa la presencia de pendientes críticos de Punchlist Categoría A.',
      evaluator: (_context, data) => {
        if (data.categoryAPunchCount > 0) {
          return {
            passed: false,
            message: `REVISIÓN REQUERIDA DE PUNCHLIST CATEGORÍA A: Existen ${data.categoryAPunchCount} pendientes de Punchlist Categoría A (críticos) sin solventar.`,
          };
        }
        return { passed: true };
      },
    },
    {
      id: 'DATABOOK_INCOMPLETE',
      name: 'Integridad del Databook de Calidad y Pruebas Hidrostáticas',
      description: 'Valida la integridad del Dossier de Calidad y certificados de pruebas hidrostáticas.',
      evaluator: (_context, data) => {
        if (!data.databookComplete || !data.hydrotestCertified) {
          return {
            passed: false,
            message: 'ADVERTENCIA DE DATABOOK DE CALIDAD: El Dossier de Calidad (Databook) o las certificaciones de pruebas de presión se encuentran pendientes de completar.',
          };
        }
        return { passed: true };
      },
    },
  ],
  deliverable: {
    id: 'deliv-074-acta-completacion',
    title: 'Acta Oficial de Completación Mecánica (MC Certificate)',
    type: 'certificate',
    factory: (context, data) => {
      const signers = [
        {
          id: 'sig-074-1',
          role: 'INSPECTOR' as const,
          name: '',
          title: 'Líder de Inspección Mecánica y Equipos',
          organization: context.contractorBrand.companyName || '',
          status: 'PENDING' as const,
          signedAt: undefined,
        },
        {
          id: 'sig-074-2',
          role: 'CONTRACTOR' as const,
          name: '',
          title: 'Superintendente de Obra Contratista',
          organization: context.contractorBrand.companyName || '',
          status: 'PENDING' as const,
          signedAt: undefined,
        },
        {
          id: 'sig-074-3',
          role: 'OPERATOR' as const,
          name: '',
          title: 'Representante Operativo PDVSA',
          organization: context.operatorBrand.companyName || '',
          status: 'PENDING' as const,
          signedAt: undefined,
        },
      ];

      return createDocumentViewModel({
        documentId: `ACTA-MC-${data.subsystemCode || 'PENDIENTE'}`,
        title: 'ACTA DE COMPLETACIÓN MECÁNICA Y ACEPTACIÓN DE SUBSISTEMA',
        code: data.subsystemCode || 'PENDIENTE',
        date: data.completionDate || '',
        status: 'DRAFT',
        contractorBrand: context.contractorBrand,
        operatorBrand: context.operatorBrand,
        signers,
        metadata: freezeDocumentMetadata(signers),
        sections: [
          {
            id: 'sec-mc-1',
            title: '1. DECLARACIÓN DE COMPLETACIÓN MECÁNICA',
            content: [
              `Código de Subsistema: ${data.subsystemCode || 'PENDIENTE'}`,
              `Nombre del Subsistema: ${data.subsystemName || 'PENDIENTE'}`,
              `Fecha de Aceptación: ${data.completionDate || 'PENDIENTE'}`,
              `Pendientes Punchlist Categoría A: ${data.categoryAPunchCount} (0 requeridos)`,
              `Pendientes Punchlist Categoría B: ${data.categoryBPunchCount}`,
              `Estado de Databook de Calidad: ${data.databookComplete ? 'COMPLETO Y CONFORME' : 'INCOMPLETO'}`,
              `Pruebas Hidrostáticas: ${data.hydrotestCertified ? 'CERTIFICADAS Y APROBADAS' : 'PENDIENTES'}`,
            ],
          },
          {
            id: 'sec-mc-2',
            title: '2. OBSERVACIONES DE LA COMISIÓN DE ACEPTACIÓN',
            content: [data.inspectorNotes || 'Sin observaciones registradas.'],
          },
        ],
      });
    },
  },
};
