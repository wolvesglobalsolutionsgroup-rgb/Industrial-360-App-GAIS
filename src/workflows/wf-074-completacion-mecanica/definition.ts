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
      description: 'Bloquea la firma del acta de completación si existe algún ítem abierto de Punchlist Categoría A.',
      evaluator: (_context, data) => {
        if (data.categoryAPunchCount > 0) {
          return {
            passed: false,
            message: `BLOQUEO DE COMPLETACIÓN MECÁNICA: Existen ${data.categoryAPunchCount} pendientes de Punchlist Categoría A (críticos) sin solventar.`,
          };
        }
        return { passed: true };
      },
    },
    {
      id: 'DATABOOK_INCOMPLETE',
      name: 'Integridad del Databook de Calidad y Pruebas Hidrostáticas',
      description: 'Valida que el Dossier de Calidad y los certificados de pruebas hidrostáticas estén 100% archivados y firmados.',
      evaluator: (_context, data) => {
        if (!data.databookComplete || !data.hydrotestCertified) {
          return {
            passed: false,
            message: 'BLOQUEO TÉCNICO: El Dossier de Calidad (Databook) o las certificaciones de pruebas de presión se encuentran incompletas.',
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
          name: context.user.email,
          title: 'Líder de Inspección Mecánica y Equipos',
          organization: context.contractorBrand.companyName || 'PROINTECA C.A.',
          status: 'SIGNED' as const,
          signedAt: new Date().toISOString(),
        },
        {
          id: 'sig-074-2',
          role: 'CONTRACTOR' as const,
          name: 'Ing. Gerente de Construcción y Montaje',
          title: 'Superintendente de Obra Contratista',
          organization: context.contractorBrand.companyName || 'PROINTECA C.A.',
          status: 'SIGNED' as const,
          signedAt: new Date().toISOString(),
        },
        {
          id: 'sig-074-3',
          role: 'OPERATOR' as const,
          name: 'Ing. Presidente de Comisión de Precomisionado',
          title: 'Representante Operativo PDVSA',
          organization: context.operatorBrand.companyName || 'PDVSA PETRÓLEO S.A.',
          status: 'SIGNED' as const,
          signedAt: new Date().toISOString(),
        },
      ];

      return createDocumentViewModel({
        documentId: `ACTA-MC-${data.subsystemCode}`,
        title: 'ACTA DE COMPLETACIÓN MECÁNICA Y ACEPTACIÓN DE SUBSISTEMA',
        code: data.subsystemCode,
        date: data.completionDate,
        status: 'APPROVED',
        contractorBrand: context.contractorBrand,
        operatorBrand: context.operatorBrand,
        signers,
        metadata: freezeDocumentMetadata(signers),
        sections: [
          {
            id: 'sec-mc-1',
            title: '1. DECLARACIÓN DE COMPLETACIÓN MECÁNICA',
            content: [
              `Código de Subsistema: ${data.subsystemCode}`,
              `Nombre del Subsistema: ${data.subsystemName}`,
              `Fecha de Aceptación: ${data.completionDate}`,
              `Pendientes Punchlist Categoría A: ${data.categoryAPunchCount} (0 requeridos)`,
              `Pendientes Punchlist Categoría B: ${data.categoryBPunchCount}`,
              `Estado de Databook de Calidad: ${data.databookComplete ? 'COMPLETO Y CONFORME' : 'INCOMPLETO'}`,
              `Pruebas Hidrostáticas: ${data.hydrotestCertified ? 'CERTIFICADAS Y APROBADAS' : 'PENDIENTES'}`,
            ],
          },
          {
            id: 'sec-mc-2',
            title: '2. OBSERVACIONES DE LA COMISIÓN DE ACEPTACIÓN',
            content: [data.inspectorNotes],
          },
        ],
      });
    },
  },
};
