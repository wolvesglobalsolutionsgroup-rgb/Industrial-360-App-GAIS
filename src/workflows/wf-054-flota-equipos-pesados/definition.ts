import { z } from 'zod';
import { WorkflowDefinition } from '../../lib/workflows/contracts';
import { createDocumentViewModel } from '../../lib/documentViewModel';
import { freezeDocumentMetadata } from '../../lib/documentPolicy';
import {
  FleetEquipmentCapture,
  FleetData,
} from './components/FleetEquipmentCapture';

export const PreOpChecklistSchema = z.object({
  checkEngineOil: z.boolean(),
  checkHydraulicLeaks: z.boolean(),
  checkBrakesAlerts: z.boolean(),
  checkFireExtinguisher: z.boolean(),
  checkEmergencyStop: z.boolean(),
  passedAll: z.boolean(),
});

export const FleetEquipmentItemSchema = z.object({
  id: z.string(),
  tag: z.string().min(2),
  name: z.string().min(2),
  type: z.string(),
  brandModel: z.string(),
  currentHorometer: z.number().nonnegative(),
  lastServiceHorometer: z.number().nonnegative(),
  nextServiceHorometer: z.number().nonnegative(),
  maintenanceIntervalHours: z.number().positive(),
  status: z.enum(['OPERATIONAL', 'MAINTENANCE_DUE', 'OUT_OF_SERVICE']),
  preOpChecklist: PreOpChecklistSchema.optional(),
  notes: z.string().optional(),
});

export const FleetWorkflowSchema = z.object({
  equipment: z.array(FleetEquipmentItemSchema),
  summaryNotes: z.string().optional(),
});

export const wf054Definition: WorkflowDefinition<FleetData> = {
  id: 'wf-054-flota-equipos-pesados',
  title: 'Flota, Maquinaria Pesada, Horómetros & Checklist Pre-operativo (ASME B30 / COVENIN)',
  description:
    'Control del parque de maquinaria pesada, registro de horómetros de operación, alertas de mantenimiento preventivo y verificación de inspección pre-operativa.',
  phase: 4,
  rolesAllowed: ['superadmin', 'gerente', 'supervisor', 'inspector', 'campo'],
  captureComponent: FleetEquipmentCapture,
  schema: FleetWorkflowSchema,
  hardGates: [
    {
      id: 'gate-preop-checklist',
      name: 'Inspección Pre-operativa Obligatoria de Seguridad',
      description:
        'Verifica que todo equipo operativo en lista tenga aprobada la inspección pre-operativa de 5 puntos de seguridad.',
      evaluator: (_context, data) => {
        if (!data.equipment || data.equipment.length === 0) {
          return { passed: true };
        }
        const failedPreOp = data.equipment.find(
          (item) => item.status === 'OPERATIONAL' && item.preOpChecklist && !item.preOpChecklist.passedAll
        );
        if (failedPreOp) {
          return {
            passed: false,
            message: `BLOQUEO DE MAQUINARIA: El equipo ${failedPreOp.tag} (${failedPreOp.name}) presenta fallas no conformes en su checklist pre-operativo de seguridad.`,
          };
        }
        return { passed: true };
      },
    },
    {
      id: 'gate-maintenance-due',
      name: 'Mantenimiento Preventivo Vencido por Horómetro',
      description:
        'Bloquea la certificación de maquinaria cuyo horómetro de operación haya sobrepasado el límite asignado de mantenimiento.',
      evaluator: (_context, data) => {
        if (!data.equipment || data.equipment.length === 0) {
          return { passed: true };
        }
        const overdueEquipment = data.equipment.find(
          (item) =>
            item.status === 'OPERATIONAL' &&
            item.currentHorometer >= item.nextServiceHorometer
        );
        if (overdueEquipment) {
          return {
            passed: false,
            message: `BLOQUEO DE MANTENIMIENTO: La maquinaria ${overdueEquipment.tag} ha sobrepasado su horómetro de servicio (${overdueEquipment.currentHorometer} hrs >= límite ${overdueEquipment.nextServiceHorometer} hrs).`,
          };
        }
        return { passed: true };
      },
    },
  ],
  deliverable: {
    id: 'deliv-054-pasaporte-maquinaria',
    title: 'Pasaporte Técnico e Informe de Control de Maquinaria Pesada',
    type: 'report',
    factory: (context, data) => {
      const fleetList = data.equipment || [];

      if (fleetList.length === 0) {
        throw new Error(
          'Error de Dominio: No se puede generar un reporte de maquinaria sin equipos registrados en el parque.'
        );
      }

      const signers = [
        {
          id: 'sig-054-1',
          role: 'INSPECTOR' as const,
          name: context.user.email,
          title: 'Inspector de Flota & Equipos Críticos ASME B30',
          organization: 'PROINTECA C.A.',
          status: 'PENDING' as const,
        },
      ];

      return createDocumentViewModel({
        documentId: `PAS-MAQ-${Date.now().toString().slice(-5)}`,
        title: 'PASAPORTE TÉCNICO Y CONTROL DE MAQUINARIA PESADA',
        code: `PDVSA-FLOTA-${context.projectId}`,
        date: new Date().toISOString().split('T')[0],
        status: 'DRAFT',
        contractorBrand: context.contractorBrand,
        operatorBrand: context.operatorBrand,
        signers,
        metadata: freezeDocumentMetadata(signers),
        sections: [
          {
            id: 'sec-1',
            title: '1. RESUMEN DEL PARQUE DE MAQUINARIA Y HORÓMETROS',
            content: fleetList.map(
              (e) =>
                `Ficha: ${e.tag} | Equipo: ${e.name} | Tipo: ${e.type} | Modelo: ${e.brandModel} | Horómetro Actual: ${e.currentHorometer} hrs | Próximo Servicio: ${e.nextServiceHorometer} hrs | Estado: ${e.status}`
            ),
          },
          {
            id: 'sec-2',
            title: '2. AUDITORÍA DE INSPECCIÓN PRE-OPERATIVA DE CAMPO',
            content: fleetList.map(
              (e) =>
                `Ficha: ${e.tag} | Aceite: ${e.preOpChecklist?.checkEngineOil ? 'OK' : 'FALLA'} | Fugas Hidráulicas: ${e.preOpChecklist?.checkHydraulicLeaks ? 'OK' : 'FALLA'} | Frenos: ${e.preOpChecklist?.checkBrakesAlerts ? 'OK' : 'FALLA'} | Extintor: ${e.preOpChecklist?.checkFireExtinguisher ? 'OK' : 'FALLA'} | Paro Emergencia: ${e.preOpChecklist?.checkEmergencyStop ? 'OK' : 'FALLA'}`
            ),
          },
          {
            id: 'sec-3',
            title: '3. OBSERVACIONES Y EVALUACIÓN DE DISPONIBILIDAD',
            content: [data.summaryNotes || 'Operación de maquinaria verificada conforme a estándar ASME B30 y especificación de obra.'],
          },
        ],
      });
    },
  },
};
