import { z } from 'zod';
import { WorkflowDefinition } from '../../lib/workflows/contracts';
import { createDocumentViewModel } from '../../lib/documentViewModel';
import { freezeDocumentMetadata } from '../../lib/documentPolicy';
import {
  InstrumentationCapture,
  InstrumentationData,
} from './components/InstrumentationCapture';

export const CalibrationPointSchema = z.object({
  inputPercent: z.number(),
  expectedVal: z.number(),
  measuredVal: z.number(),
  errorPercentFs: z.number(),
  passed: z.boolean(),
});

export const InstrumentLoopSchema = z.object({
  id: z.string(),
  tagNo: z.string().min(2),
  loopTag: z.string().min(2),
  pidNumber: z.string(),
  instrumentType: z.enum(['PT', 'TT', 'FT', 'LT', 'PSV', 'CV']),
  description: z.string(),
  location: z.string(),
  rangeMin: z.number(),
  rangeMax: z.number(),
  unit: z.string(),
  toleranceFsPercent: z.number().positive(),
  signalType: z.enum([
    '4-20mA HART',
    'Fieldbus Foundation',
    'Modbus RTU',
    'Neumático 3-15 PSI',
  ]),
  calibrationDate: z.string(),
  nextCalibrationDate: z.string(),
  calibratedBy: z.string(),
  status: z.enum([
    'Calibrado & Operativo',
    'Pendiente Calibración',
    'Fuera de Tolerancia',
  ]),
  calibrationPoints: z.array(CalibrationPointSchema),
  notes: z.string().optional(),
});

export const InstrumentationWorkflowSchema = z.object({
  loops: z.array(InstrumentLoopSchema),
  summaryNotes: z.string().optional(),
});

export const wf052Definition: WorkflowDefinition<InstrumentationData> = {
  id: 'wf-052-instrumentacion-lazos-pid',
  title: 'Control e Inspección de Instrumentación P&ID (ISA 5.1 / ASME B31.3)',
  description:
    'Calibración de instrumentos de campo, transmisores inteligentes HART y verificación de lazos de control según estándares ISA 5.1.',
  phase: 3,
  rolesAllowed: ['superadmin', 'gerente', 'supervisor', 'inspector', 'campo'],
  captureComponent: InstrumentationCapture,
  schema: InstrumentationWorkflowSchema,
  hardGates: [
    {
      id: 'gate-instrument-tolerance',
      name: 'Tolerancia de Calibración de Instrumentos (%FS)',
      description:
        'Verifica que todos los puntos de prueba medidos en el instrumento se encuentren dentro del porcentaje de tolerancia FS establecido y sin calibraciones pendientes.',
      evaluator: (_context, data) => {
        if (!data.loops || data.loops.length === 0) {
          return {
            passed: false,
            message: 'BLOQUEO: no existen registros verificados para evaluar.',
          };
        }
        const pendingLoop = data.loops.find(
          (loop) =>
            loop.status === 'Pendiente Calibración' ||
            !loop.calibrationDate ||
            !loop.calibratedBy ||
            !loop.pidNumber ||
            !loop.location
        );
        if (pendingLoop) {
          return {
            passed: false,
            message: `BLOQUEO DE INSTRUMENTACIÓN: El instrumento ${pendingLoop.tagNo} se encuentra en estado pendiente o carece de datos de calibración / P&ID.`,
          };
        }
        const failedLoop = data.loops.find((loop) =>
          loop.calibrationPoints?.some((pt) => !pt.passed)
        );
        if (failedLoop) {
          return {
            passed: false,
            message: `BLOQUEO DE INSTRUMENTACIÓN: El instrumento ${failedLoop.tagNo} tiene puntos de calibración fuera de tolerancia (±${failedLoop.toleranceFsPercent}% FS) o no verificados.`,
          };
        }
        return { passed: true };
      },
    },
    {
      id: 'gate-calibration-points',
      name: 'Verificación de Puntos de Calibración Mínimos',
      description:
        'Exige que todo instrumento registrado tenga al menos 3 puntos de calibración de prueba (e.g. 0%, 50%, 100%).',
      evaluator: (_context, data) => {
        if (!data.loops || data.loops.length === 0) {
          return {
            passed: false,
            message: 'BLOQUEO: no existen registros verificados para evaluar.',
          };
        }
        const incompleteLoop = data.loops.find(
          (loop) => !loop.calibrationPoints || loop.calibrationPoints.length < 3
        );
        if (incompleteLoop) {
          return {
            passed: false,
            message: `BLOQUEO NORMATIVO: El instrumento ${incompleteLoop.tagNo} posee menos de 3 puntos de prueba de calibración exigidos por la norma ISA.`,
          };
        }
        return { passed: true };
      },
    },
  ],
  deliverable: {
    id: 'deliv-052-certificado-instrumentacion',
    title: 'Certificado de Calibración y Registro de Lazos P&ID',
    type: 'certificate',
    factory: (context, data) => {
      const loopsList = data.loops || [];

      if (loopsList.length === 0) {
        throw new Error(
          'Error de Dominio: No se puede generar un certificado de instrumentación sin lazos registrados.'
        );
      }

      const signers = [
        {
          id: 'sig-052-1',
          role: 'INSPECTOR' as const,
          name: context.user.email,
          title: 'Ingeniero de Instrumentación & Control ISA',
          organization: 'PROINTECA C.A.',
          status: 'PENDING' as const,
        },
      ];

      return createDocumentViewModel({
        documentId: `CERT-INST-${Date.now().toString().slice(-5)}`,
        title: 'CERTIFICADO DE CALIBRACIÓN Y REGISTRO DE LAZOS P&ID',
        code: `PDVSA-ISA-5.1-${context.projectId}`,
        date: new Date().toISOString().split('T')[0],
        status: 'DRAFT',
        contractorBrand: context.contractorBrand,
        operatorBrand: context.operatorBrand,
        signers,
        metadata: freezeDocumentMetadata(signers),
        sections: [
          {
            id: 'sec-1',
            title: '1. RESUMEN DE LAZOS E INSTRUMENTOS DE CAMPO',
            content: loopsList.map(
              (l) =>
                `Tag: ${l.tagNo} | Lazo: ${l.loopTag} | Tipo: ${l.instrumentType} | Rango: ${l.rangeMin}-${l.rangeMax} ${l.unit} | Señal: ${l.signalType} | Estado: ${l.status}`
            ),
          },
          {
            id: 'sec-2',
            title: '2. RESULTADOS DE CALIBRACIÓN Y TOLERANCIAS',
            content: loopsList.flatMap((l) =>
              (l.calibrationPoints || []).map(
                (p) =>
                  `Tag: ${l.tagNo} | Entrada: ${p.inputPercent}% | Esperado: ${p.expectedVal} | Medido: ${p.measuredVal} | Error %FS: ${p.errorPercentFs}% | Dictamen: ${p.passed ? 'Conforme' : 'No Conforme'}`
              )
            ),
          },
          {
            id: 'sec-3',
            title: '3. OBSERVACIONES Y NOTAS TÉCNICAS',
            content: [data.summaryNotes || 'Calibración conforme a estándar ISA 5.1 y especificación del operador.'],
          },
        ],
      });
    },
  },
};
