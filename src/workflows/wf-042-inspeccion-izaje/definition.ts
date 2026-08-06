import { z } from 'zod';
import { WorkflowDefinition } from '../../lib/workflows/contracts';
import { createDocumentViewModel } from '../../lib/documentViewModel';
import { freezeDocumentMetadata } from '../../lib/documentPolicy';
import { CraneInspectionCapture, CraneInspectionData } from './components/CraneInspectionCapture';

export const CraneInspectionSchema = z.object({
  craneCode: z.string().min(3, 'El código de grúa debe tener al menos 3 caracteres'),
  capacityTons: z.number().positive('La capacidad debe ser mayor a 0 Toneladas'),
  inspectionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe ser YYYY-MM-DD'),
  slingCondition: z.enum(['operativa', 'desgaste_menor', 'critica_reemplazar']),
  hookLatchIntact: z.boolean(),
  hydraulicLeakDetected: z.boolean(),
  inspectorNotes: z.string().min(5, 'Las observaciones deben tener al menos 5 caracteres'),
});

export const wf042Definition: WorkflowDefinition<CraneInspectionData> = {
  id: 'wf-042-inspeccion-izaje',
  title: 'Inspección Pre-Operativa de Equipos de Izaje (ASME B30.5)',
  description: 'Verificación técnica pre-operativa para grúas móviles y elementos de izaje antes del levantamiento de cargas en instalaciones de Oil & Gas.',
  phase: 4,
  rolesAllowed: ['superadmin', 'gerente', 'supervisor', 'inspector', 'campo'],
  captureComponent: CraneInspectionCapture,
  schema: CraneInspectionSchema,
  hardGates: [
    {
      id: 'gate-hook-latch',
      name: 'Pestillo de Seguridad en Gancho',
      description: 'Obliga a que el gancho cuente con su pestillo de seguridad funcionando e intacto antes de autorizar la maniobra.',
      evaluator: (_context, data) => {
        if (!data.hookLatchIntact) {
          return {
            passed: false,
            message: 'BLOQUEO DE SEGURIDAD: El pestillo del gancho de elevación está defectuoso o ausente. Prohibida la operación bajo norma ASME B30.5.',
          };
        }
        return { passed: true };
      },
    },
    {
      id: 'gate-sling-condition',
      name: 'Estado No Crítico de Eslingas',
      description: 'Bloquea la operación si las eslingas o grilletes presentan condición crítica de desgaste.',
      evaluator: (_context, data) => {
        if (data.slingCondition === 'critica_reemplazar') {
          return {
            passed: false,
            message: 'BLOQUEO TÉCNICO: Eslingas en estado crítico de reemplazo. Deben ser retiradas de servicio inmediatamente.',
          };
        }
        return { passed: true };
      },
    },
  ],
  deliverable: {
    id: 'deliv-042-certificado-izaje',
    title: 'Certificado Técnico de Inspección de Equipos de Izaje',
    type: 'certificate',
    factory: (context, data) => {
      return createDocumentViewModel({
        documentId: `CERT-IZAJE-${data.craneCode}-${Date.now().toString().slice(-4)}`,
        title: 'CERTIFICADO DE INSPECCIÓN TÉCNICA DE EQUIPOS DE IZAJE',
        code: `CERT-ASME-B30.5-${data.craneCode}`,
        date: data.inspectionDate,
        status: 'APPROVED',
        contractorBrand: context.contractorBrand,
        operatorBrand: context.operatorBrand,
        signers: [
          {
            id: 'sig-042-1',
            role: 'INSPECTOR',
            name: context.user.email,
            title: 'Inspector Certificado de Izaje ASME B30.5',
            organization: 'PROINTECA C.A.',
            status: 'SIGNED',
            signedAt: new Date().toISOString(),
          },
        ],
        metadata: freezeDocumentMetadata([
          {
            id: 'sig-042-1',
            role: 'INSPECTOR',
            name: context.user.email,
            title: 'Inspector Certificado de Izaje ASME B30.5',
            organization: 'PROINTECA C.A.',
            status: 'SIGNED',
            signedAt: new Date().toISOString(),
          },
        ]),
        sections: [
          {
            id: 'sec-1',
            title: '1. DATOS DEL EQUIPO E INSPECCIÓN',
            content: [
              `Grúa / Ficha: ${data.craneCode}`,
              `Capacidad Máxima: ${data.capacityTons} Toneladas`,
              `Fecha de Evaluación: ${data.inspectionDate}`,
              `Estado de Eslingas: ${data.slingCondition.toUpperCase()}`,
              `Pestillo de Gancho: ${data.hookLatchIntact ? 'INTACTO Y OPERATIVO' : 'DEFECTUOSO'}`,
              `Fugas Hidráulicas: ${data.hydraulicLeakDetected ? 'DETECTADAS (REQUIERE ATENCIÓN)' : 'NINGUNA'}`,
            ],
          },
          {
            id: 'sec-2',
            title: '2. DICTAMEN TÉCNICO Y OBSERVACIONES',
            content: [data.inspectorNotes],
          },
        ],
      });
    },
  },
};
