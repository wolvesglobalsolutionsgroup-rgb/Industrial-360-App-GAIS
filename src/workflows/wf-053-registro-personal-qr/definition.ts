import { z } from 'zod';
import { WorkflowDefinition } from '../../lib/workflows/contracts';
import { createDocumentViewModel } from '../../lib/documentViewModel';
import { freezeDocumentMetadata } from '../../lib/documentPolicy';
import {
  WorkerQrCapture,
  WorkerQrData,
} from './components/WorkerQrCapture';

export const FieldWorkerSchema = z.object({
  id: z.string(),
  credentialId: z.string().optional(),
  nationalId: z.string().min(3),
  fullName: z.string().min(3),
  role: z.string().min(2),
  contractor: z.string().min(2),
  bloodType: z.string(),
  allergies: z.string().optional(),
  medicalCheckValidUntil: z.string(),
  sihoInductionValidUntil: z.string(),
  fitStatus: z.enum(['Apto', 'Apto con Restricciones', 'No Apto', 'Vencido']),
  totalHhtAccumulated: z.number().nonnegative(),
});

export const AttendanceRecordSchema = z.object({
  id: z.string(),
  workerId: z.string(),
  workerName: z.string(),
  nationalId: z.string(),
  role: z.string(),
  checkInTime: z.string(),
  gateLocation: z.string(),
  accessStatus: z.enum(['Verde - Autorizado', 'Rojo - Denegado']),
});

export const WorkerQrWorkflowSchema = z.object({
  workers: z.array(FieldWorkerSchema),
  attendanceLogs: z.array(AttendanceRecordSchema).optional(),
  summaryNotes: z.string().optional(),
});

export const wf053Definition: WorkflowDefinition<WorkerQrData> = {
  id: 'wf-053-registro-personal-qr',
  title: 'Registro de Personal, Acreditación QR & Apto SIHO-A (PDVSA SI-S-04)',
  description:
    'Registro de personal de campo, acreditación mediante código QR rotativo y verificación de inducción de seguridad SIHO-A y aptitud médica.',
  phase: 4,
  rolesAllowed: ['superadmin', 'gerente', 'supervisor', 'inspector', 'campo'],
  captureComponent: WorkerQrCapture,
  schema: WorkerQrWorkflowSchema,
  hardGates: [
    {
      id: 'gate-siho-fit-status',
      name: 'Verificación de Aptitud SIHO-A y Médica',
      description:
        'Bloquea la generación de pases o certificados si existen trabajadores marcados como No Apto, Vencidos o sin verificación médica.',
      evaluator: (_context, data) => {
        if (!data.workers || data.workers.length === 0) {
          return {
            passed: false,
            message: 'BLOQUEO: no existen registros verificados para evaluar.',
          };
        }
        const unfitWorker = data.workers.find(
          (w) =>
            w.fitStatus === 'No Apto' ||
            w.fitStatus === 'Vencido' ||
            !w.medicalCheckValidUntil ||
            !w.sihoInductionValidUntil ||
            !w.role ||
            !w.contractor
        );
        if (unfitWorker) {
          return {
            passed: false,
            message: `BLOQUEO SIHO-A: El trabajador ${unfitWorker.fullName} (${unfitWorker.nationalId}) figura como "${unfitWorker.fitStatus}" o carece de datos de aptitud/fechas médicas completas.`,
          };
        }
        return { passed: true };
      },
    },
    {
      id: 'gate-siho-induction-validity',
      name: 'Vigencia de Inducción de Seguridad PDVSA SI-S-04',
      description:
        'Exige que todo trabajador tenga fecha de vigencia de inducción SIHO-A y examen médico asignadas y no vencidas.',
      evaluator: (_context, data) => {
        if (!data.workers || data.workers.length === 0) {
          return {
            passed: false,
            message: 'BLOQUEO: no existen registros verificados para evaluar.',
          };
        }
        const today = new Date().toISOString().split('T')[0];
        const expiredWorker = data.workers.find(
          (w) =>
            !w.sihoInductionValidUntil ||
            w.sihoInductionValidUntil < today ||
            !w.medicalCheckValidUntil ||
            w.medicalCheckValidUntil < today
        );
        if (expiredWorker) {
          return {
            passed: false,
            message: `BLOQUEO DE SEGURIDAD: La inducción SIHO-A o la fecha médica del trabajador ${expiredWorker.fullName} está vencida o no fue registrada.`,
          };
        }
        return { passed: true };
      },
    },
  ],
  deliverable: {
    id: 'deliv-053-certificado-personal-qr',
    title: 'Certificado de Acreditación de Personal y Registro Asistencia QR',
    type: 'certificate',
    factory: (context, data) => {
      const workersList = data.workers || [];

      if (workersList.length === 0) {
        throw new Error(
          'Error de Dominio: No se puede generar un certificado de acreditación de personal sin trabajadores registrados.'
        );
      }

      const signers = [
        {
          id: 'sig-053-1',
          role: 'INSPECTOR' as const,
          name: context.user.email,
          title: 'Gerente de Talento Humano & SIHO-A',
          organization: 'PROINTECA C.A.',
          status: 'PENDING' as const,
        },
      ];

      return createDocumentViewModel({
        documentId: `CERT-QR-${Date.now().toString().slice(-5)}`,
        title: 'CERTIFICADO DE ACREDITACIÓN DE PERSONAL Y REGISTRO QR SIHO-A',
        code: `PDVSA-SI-S-04-${context.projectId}`,
        date: new Date().toISOString().split('T')[0],
        status: 'DRAFT',
        contractorBrand: context.contractorBrand,
        operatorBrand: context.operatorBrand,
        signers,
        metadata: freezeDocumentMetadata(signers),
        sections: [
          {
            id: 'sec-1',
            title: '1. NÓMINA ACREDITADA DE TRABAJADORES DE OBRA',
            content: workersList.map(
              (w) =>
                `Cédula: ${w.nationalId} | Nombre: ${w.fullName} | Cargo: ${w.role} | Contratista: ${w.contractor} | Sangre: ${w.bloodType} | Apto SIHO: ${w.fitStatus} | Venc. Inducción: ${w.sihoInductionValidUntil}`
            ),
          },
          {
            id: 'sec-2',
            title: '2. AUDITORÍA DE INGRESOS Y FICHAS DIGITALES',
            content: [
              `Total Trabajadores Registrados: ${workersList.length}`,
              `Total Aptos Directos: ${workersList.filter((w) => w.fitStatus === 'Apto').length}`,
              `Total Aptos con Restricción: ${workersList.filter((w) => w.fitStatus === 'Apto con Restricciones').length}`,
            ],
          },
          {
            id: 'sec-3',
            title: '3. NOTAS DE CUMPLIMIENTO Y DECLARACIÓN SIHO',
            content: [data.summaryNotes || 'Personal debidamente instruido según norma PDVSA SI-S-04.'],
          },
        ],
      });
    },
  },
};
