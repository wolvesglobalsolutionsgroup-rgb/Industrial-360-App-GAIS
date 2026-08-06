import { z } from 'zod';
import { WorkflowDefinition } from '../../lib/workflows/contracts';
import { createDocumentViewModel } from '../../lib/documentViewModel';
import { freezeDocumentMetadata } from '../../lib/documentPolicy';
import { EngineeringSupervisionCapture } from './components/EngineeringSupervisionCapture';

export interface EngineeringSupervisionData {
  packageCode: string;
  discipline: 'procesos' | 'mecanica' | 'tuberias' | 'civil' | 'electricidad' | 'instrumentacion';
  revisionNumber: string;
  orcCertificateIssued: boolean;
  orcCertificateCode?: string;
  calculationsApproved: boolean;
  supervisorNotes: string;
}

export const EngineeringSupervisionSchema = z.object({
  packageCode: z.string().min(3, 'El código de paquete de ingeniería es obligatorio'),
  discipline: z.enum(['procesos', 'mecanica', 'tuberias', 'civil', 'electricidad', 'instrumentacion']),
  revisionNumber: z.string().min(1, 'El número de revisión es obligatorio'),
  orcCertificateIssued: z.boolean(),
  orcCertificateCode: z.string().optional(),
  calculationsApproved: z.boolean(),
  supervisorNotes: z.string().min(5, 'Las observaciones de supervisión deben tener al menos 5 caracteres'),
});

export const wf077Definition: WorkflowDefinition<EngineeringSupervisionData> = {
  id: 'wf-077-supervision-ingenieria',
  title: 'Supervisión de Ingeniería de Detalle y Certificación ORC (GPG Fase 2)',
  description: 'Verificación técnica de planos, memorias de cálculo y aval de calidad emitido por la Oficina de Revisión y Control (ORC).',
  phase: 2,
  rolesAllowed: ['superadmin', 'gerente', 'supervisor', 'inspector'],
  captureComponent: EngineeringSupervisionCapture,
  schema: EngineeringSupervisionSchema,
  hardGates: [
    {
      id: 'ORC_QUALITY_CERTIFICATE_MISSING',
      name: 'Certificación de Calidad Oficina ORC de Ingeniería',
      description: 'Bloquea la aprobación de los entregables de ingeniería si no se cuenta con el Certificado de Calidad ORC emitido.',
      evaluator: (_context, data) => {
        if (!data.orcCertificateIssued) {
          return {
            passed: false,
            message: 'BLOQUEO TÉCNICO DE INGENIERÍA: Falta el Certificado de Calidad emitido por la Oficina de Revisión y Control (ORC).',
          };
        }
        return { passed: true };
      },
    },
  ],
  deliverable: {
    id: 'deliv-077-aval-supervision',
    title: 'Aval Técnico de Supervisión de Ingeniería y Conformidad ORC',
    type: 'report',
    factory: (context, data) => {
      const signers = [
        {
          id: 'sig-077-1',
          role: 'INSPECTOR' as const,
          name: context.user.email,
          title: 'Supervisor Principal de Ingeniería',
          organization: context.contractorBrand.companyName || 'PROINTECA C.A.',
          status: 'SIGNED' as const,
          signedAt: new Date().toISOString(),
        },
        {
          id: 'sig-077-2',
          role: 'CONTRACTOR' as const,
          name: 'Ing. Especialista de Disciplina',
          title: 'Líder Técnico de Especialidad',
          organization: context.contractorBrand.companyName || 'PROINTECA C.A.',
          status: 'SIGNED' as const,
          signedAt: new Date().toISOString(),
        },
        {
          id: 'sig-077-3',
          role: 'OPERATOR' as const,
          name: 'Ing. Jefe de la Oficina de Revisión y Control ORC',
          title: 'Auditor Técnico de Ingeniería PDVSA',
          organization: context.operatorBrand.companyName || 'PDVSA PETRÓLEO S.A.',
          status: 'SIGNED' as const,
          signedAt: new Date().toISOString(),
        },
      ];

      return createDocumentViewModel({
        documentId: `AVAL-ING-${data.packageCode}`,
        title: 'AVAL TÉCNICO DE SUPERVISIÓN DE INGENIERÍA DE DETALLE Y CONFORMIDAD ORC',
        code: data.packageCode,
        date: new Date().toISOString().split('T')[0],
        status: 'APPROVED',
        contractorBrand: context.contractorBrand,
        operatorBrand: context.operatorBrand,
        signers,
        metadata: freezeDocumentMetadata(signers),
        sections: [
          {
            id: 'sec-sup-1',
            title: '1. DATOS DEL PAQUETE DE INGENIERÍA Y EVALUACIÓN ORC',
            content: [
              `Código de Paquete: ${data.packageCode}`,
              `Disciplina: ${data.discipline.toUpperCase()}`,
              `Número de Revisión: ${data.revisionNumber}`,
              `Certificado de Calidad ORC: ${data.orcCertificateIssued ? 'EMITIDO Y CONFORME' : 'NO EMITIDO'}`,
              `Código Certificado ORC: ${data.orcCertificateCode || 'N/A'}`,
              `Memorias de Cálculo Verificadas: ${data.calculationsApproved ? 'SÍ' : 'NO'}`,
            ],
          },
          {
            id: 'sec-sup-2',
            title: '2. DICTAMEN DE CONSTRUCTIBILIDAD Y SUPERVISIÓN TÉCNICA',
            content: [data.supervisorNotes],
          },
        ],
      });
    },
  },
};
