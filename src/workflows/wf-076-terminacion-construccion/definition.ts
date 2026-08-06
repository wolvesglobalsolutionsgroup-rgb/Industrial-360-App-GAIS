import { z } from 'zod';
import { WorkflowDefinition } from '../../lib/workflows/contracts';
import { createDocumentViewModel } from '../../lib/documentViewModel';
import { freezeDocumentMetadata } from '../../lib/documentPolicy';
import { ConstructionTerminationCapture } from './components/ConstructionTerminationCapture';

export interface ConstructionTerminationData {
  transferCertificateCode: string;
  facilityArea: string;
  psvCalibrated: boolean;
  psvExpirationDate: string;
  walkthroughCompleted: boolean;
  asBuiltDrawingsApproved: boolean;
  transferDate: string;
  inspectorNotes: string;
}

export const ConstructionTerminationSchema = z.object({
  transferCertificateCode: z.string().min(3, 'El código de acta de transferencia es obligatorio'),
  facilityArea: z.string().min(3, 'El área o instalación es obligatoria'),
  psvCalibrated: z.boolean(),
  psvExpirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha de vencimiento PSV formato YYYY-MM-DD'),
  walkthroughCompleted: z.boolean(),
  asBuiltDrawingsApproved: z.boolean(),
  transferDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha de transferencia formato YYYY-MM-DD'),
  inspectorNotes: z.string().min(5, 'Las observaciones de transferencia deben tener al menos 5 caracteres'),
});

export const wf076Definition: WorkflowDefinition<ConstructionTerminationData> = {
  id: 'wf-076-terminacion-construccion',
  title: 'Acta de Terminación de Construcción y Transferencia de Custodia (GPG Fase 7)',
  description: 'Acta formal de entrega de la instalación a Operaciones PDVSA, verificación de planos As-Built y calibración de Válvulas PSV.',
  phase: 7,
  rolesAllowed: ['superadmin', 'gerente', 'supervisor', 'inspector'],
  captureComponent: ConstructionTerminationCapture,
  schema: ConstructionTerminationSchema,
  hardGates: [
    {
      id: 'PSV_CALIBRATION_EXPIRED',
      name: 'Vigencia de Calibración de Válvulas de Seguridad (PSV)',
      description: 'Bloquea la transferencia de custodia si las válvulas de alivio/seguridad tienen calibración vencida o no certificada.',
      evaluator: (_context, data) => {
        if (!data.psvCalibrated) {
          return {
            passed: false,
            message: 'BLOQUEO DE SEGURIDAD OPERATIVA: Las válvulas PSV de la instalación no cuentan con certificado de calibración vigente.',
          };
        }
        const expDate = new Date(data.psvExpirationDate);
        if (isNaN(expDate.getTime()) || expDate < new Date()) {
          return {
            passed: false,
            message: `BLOQUEO DE SEGURIDAD: La calibración de las Válvulas PSV expiró el ${data.psvExpirationDate}. Se requiere recalibración en banco de pruebas autorizado.`,
          };
        }
        return { passed: true };
      },
    },
  ],
  deliverable: {
    id: 'deliv-076-acta-transferencia',
    title: 'Acta Oficial de Terminación de Construcción y Transferencia Operativa',
    type: 'certificate',
    factory: (context, data) => {
      const signers = [
        {
          id: 'sig-076-1',
          role: 'INSPECTOR' as const,
          name: context.user.email,
          title: 'Inspector de Seguridad y Construcción',
          organization: context.contractorBrand.companyName || 'PROINTECA C.A.',
          status: 'SIGNED' as const,
          signedAt: new Date().toISOString(),
        },
        {
          id: 'sig-076-2',
          role: 'CONTRACTOR' as const,
          name: 'Ing. Gerente del Proyecto Contratista',
          title: 'Director de Obra',
          organization: context.contractorBrand.companyName || 'PROINTECA C.A.',
          status: 'SIGNED' as const,
          signedAt: new Date().toISOString(),
        },
        {
          id: 'sig-076-3',
          role: 'OPERATOR' as const,
          name: 'Ing. Gerente General de Operaciones y Planta',
          title: 'Custodio Final de Activo PDVSA',
          organization: context.operatorBrand.companyName || 'PDVSA PETRÓLEO S.A.',
          status: 'SIGNED' as const,
          signedAt: new Date().toISOString(),
        },
      ];

      return createDocumentViewModel({
        documentId: `TRF-CUSTODIA-${data.transferCertificateCode}`,
        title: 'ACTA OFICIAL DE TERMINACIÓN DE CONSTRUCCIÓN Y TRANSFERENCIA DE CUSTODIA',
        code: data.transferCertificateCode,
        date: data.transferDate,
        status: 'APPROVED',
        contractorBrand: context.contractorBrand,
        operatorBrand: context.operatorBrand,
        signers,
        metadata: freezeDocumentMetadata(signers),
        sections: [
          {
            id: 'sec-trf-1',
            title: '1. DECLARACIÓN DE TRANSFERENCIA DE CUSTODIA OPERATIVA',
            content: [
              `Código de Acta: ${data.transferCertificateCode}`,
              `Instalación / Área: ${data.facilityArea}`,
              `Fecha de Transferencia: ${data.transferDate}`,
              `Certificación PSV: ${data.psvCalibrated ? 'CALIBRADO Y VIGENTE' : 'VENCIDO O PENDIENTE'}`,
              `Fecha Vencimiento PSV: ${data.psvExpirationDate}`,
              `Caminata de Entrega (Walkthrough): ${data.walkthroughCompleted ? 'CONFORME' : 'PENDIENTE'}`,
              `Planos As-Built: ${data.asBuiltDrawingsApproved ? 'ENTREGADOS Y APROBADOS' : 'PENDIENTES'}`,
            ],
          },
          {
            id: 'sec-trf-2',
            title: '2. OBSERVACIONES Y TÉRMINOS DE ENTREGA',
            content: [data.inspectorNotes],
          },
        ],
      });
    },
  },
};
