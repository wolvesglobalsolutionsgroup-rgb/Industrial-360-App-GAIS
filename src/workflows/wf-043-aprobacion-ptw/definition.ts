import { z } from 'zod';
import { WorkflowDefinition } from '../../lib/workflows/contracts';
import { createDocumentViewModel } from '../../lib/documentViewModel';
import { freezeDocumentMetadata } from '../../lib/documentPolicy';
import { PtwApprovalCapture, PtwApprovalData } from './components/PtwApprovalCapture';

export const PtwApprovalSchema = z.object({
  ptwCode: z.string().min(3, 'El código PTW debe tener al menos 3 caracteres'),
  workType: z.enum(['caliente', 'frio', 'espacio_confinado', 'excavacion', 'altura']),
  lelPercentage: z.number().min(0).max(100),
  o2Percentage: z.number().min(0).max(100),
  h2sPpm: z.number().min(0),
  lotoVerified: z.boolean(),
  supervisorName: z.string().min(2, 'Nombre del supervisor es obligatorio'),
  safetyInspectorName: z.string().min(2, 'Nombre del inspector SIHO es obligatorio'),
  status: z.enum(['draft', 'submitted', 'safety_approved', 'rejected']).default('draft'),
});

export const wf043Definition: WorkflowDefinition<PtwApprovalData> = {
  id: 'wf-043-aprobacion-ptw',
  title: 'Permiso de Trabajo Seguro (PTW SIHO-A PDVSA SI-S-04)',
  description: 'Flujo de aprobación multinivel para la emisión autorizada de permisos de trabajo seguro en áreas operativas de riesgo.',
  phase: 4,
  rolesAllowed: ['superadmin', 'gerente', 'supervisor', 'inspector'],
  captureComponent: PtwApprovalCapture,
  schema: PtwApprovalSchema,
  initialState: 'draft',
  stateTransitions: [
    {
      from: 'draft',
      to: 'submitted',
      rolesAllowed: ['superadmin', 'gerente', 'supervisor'],
      label: 'Enviar Permiso a Revisión SIHO',
    },
    {
      from: 'submitted',
      to: 'safety_approved',
      rolesAllowed: ['superadmin', 'gerente', 'inspector'],
      gateId: 'gate-atmospheric-test',
      label: 'Aprobar y Emitir Permiso SIHO',
    },
    {
      from: 'submitted',
      to: 'rejected',
      rolesAllowed: ['superadmin', 'gerente', 'inspector'],
      label: 'Rechazar Permiso PTW',
    },
  ],
  hardGates: [
    {
      id: 'gate-atmospheric-test',
      name: 'Prueba Atmosférica e Higiene Industrial',
      description: 'Valida estrictamente los niveles autorizados: 0.0% LEL, Oxígeno entre 19.5% y 23.5%, y 0 PPM de H2S.',
      evaluator: (_context, data) => {
        if (data.lelPercentage !== 0) {
          return {
            passed: false,
            message: `CRÍTICO: Presencia de explosividad detectada (${data.lelPercentage}% LEL > 0.0%). Permiso denegado.`,
          };
        }
        if (data.o2Percentage < 19.5 || data.o2Percentage > 23.5) {
          return {
            passed: false,
            message: `CRÍTICO: Nivel de Oxígeno fuera de rango seguro (${data.o2Percentage}% O2). Rango permitido: 19.5% a 23.5%.`,
          };
        }
        if (data.h2sPpm > 0) {
          return {
            passed: false,
            message: `CRÍTICO: Presencia de Gas Sulfhídrico detectada (${data.h2sPpm} PPM H2S > 0 PPM). Permiso denegado.`,
          };
        }
        return { passed: true };
      },
    },
    {
      id: 'gate-loto-verified',
      name: 'Verificación LOTO (Bloqueo y Etiquetado)',
      description: 'Exige desenergización y bloqueo verificado para trabajos en caliente o espacio confinado.',
      evaluator: (_context, data) => {
        if ((data.workType === 'caliente' || data.workType === 'espacio_confinado') && !data.lotoVerified) {
          return {
            passed: false,
            message: `CRÍTICO: Trabajo clasificado como "${data.workType.toUpperCase()}" requiere aislamiento de energía LOTO verificado.`,
          };
        }
        return { passed: true };
      },
    },
  ],
  deliverable: {
    id: 'deliv-043-ptw-oficial',
    title: 'Permiso de Trabajo Seguro (PTW SIHO-A Certificado)',
    type: 'document',
    factory: (context, data) => {
      return createDocumentViewModel({
        documentId: `PTW-DOC-${data.ptwCode}`,
        title: 'PERMISO DE TRABAJO SEGURO (PTW SIHO-A CERTIFICADO)',
        code: data.ptwCode,
        date: new Date().toISOString().split('T')[0],
        status: data.status === 'safety_approved' ? 'APPROVED' : 'DRAFT',
        contractorBrand: context.contractorBrand,
        operatorBrand: context.operatorBrand,
        signers: [
          {
            id: 'sig-043-1',
            role: 'CONTRACTOR',
            name: data.supervisorName,
            title: 'Supervisor Emisor / Solicitante SIHO-A',
            organization: 'PROINTECA C.A.',
            status: 'SIGNED',
          },
          {
            id: 'sig-043-2',
            role: 'INSPECTOR',
            name: data.safetyInspectorName,
            title: 'Inspector Custodio / Aprobador SIHO-A',
            organization: 'PDVSA SIHO-A',
            status: data.status === 'safety_approved' ? 'SIGNED' : 'PENDING',
          },
        ],
        metadata: freezeDocumentMetadata([
          {
            id: 'sig-043-1',
            role: 'CONTRACTOR',
            name: data.supervisorName,
            title: 'Supervisor Emisor / Solicitante SIHO-A',
            organization: 'PROINTECA C.A.',
            status: 'SIGNED',
          },
          {
            id: 'sig-043-2',
            role: 'INSPECTOR',
            name: data.safetyInspectorName,
            title: 'Inspector Custodio / Aprobador SIHO-A',
            organization: 'PDVSA SIHO-A',
            status: data.status === 'safety_approved' ? 'SIGNED' : 'PENDING',
          },
        ]),
        sections: [
          {
            id: 'sec-ptw-1',
            title: '1. CLASIFICACIÓN DE ACTIVIDAD DE ALTO RIESGO',
            content: [
              `Código PTW: ${data.ptwCode}`,
              `Tipo de Trabajo: ${data.workType.toUpperCase()}`,
              `Estado del Permiso: ${data.status.toUpperCase()}`,
              `Aislamiento LOTO: ${data.lotoVerified ? 'VERIFICADO Y BLOQUEADO' : 'NO REQUERIDO / PENDIENTE'}`,
            ],
          },
          {
            id: 'sec-ptw-2',
            title: '2. PRUEBA ATMOSFÉRICA E HIGIENE INDUSTRIAL',
            content: [
              `Nivel de Explosividad (% LEL): ${data.lelPercentage}%`,
              `Concentración de Oxígeno (% O2): ${data.o2Percentage}%`,
              `Concentración H2S (PPM): ${data.h2sPpm} PPM`,
              `Dictamen de Prueba: ${data.lelPercentage === 0 && data.h2sPpm === 0 ? 'ATMÓSFERA SEGURA AUTORIZADA' : 'ATMÓSFERA NO SEGURA'}`,
            ],
          },
        ],
      });
    },
  },
};
