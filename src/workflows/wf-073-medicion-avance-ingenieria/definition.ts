import { z } from 'zod';
import { WorkflowDefinition } from '../../lib/workflows/contracts';
import { createDocumentViewModel } from '../../lib/documentViewModel';
import { freezeDocumentMetadata } from '../../lib/documentPolicy';
import { EngineeringProgressCapture } from './components/EngineeringProgressCapture';

export interface DeliverableProgressItem {
  code: string;
  title: string;
  weight: number;
  progressPct: number;
}

export interface EngineeringProgressData {
  reportCode: string;
  reportDate: string;
  plannedProgressPct: number;
  actualProgressPct: number;
  plannedValueUSD: number;
  earnedValueUSD: number;
  actualCostUSD: number;
  deliverables: DeliverableProgressItem[];
  notes?: string;
}

export const EngineeringProgressSchema = z.object({
  reportCode: z.string().min(3, 'El código de reporte es obligatorio'),
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD'),
  plannedProgressPct: z.number().min(0, 'El avance planificado debe ser >= 0').max(100, 'El avance planificado no puede exceder 100%'),
  actualProgressPct: z.number().min(0, 'El avance real debe ser >= 0').max(100, 'El avance real no puede exceder 100%'),
  plannedValueUSD: z.number().min(0, 'El Valor Planificado (PV) debe ser >= 0'),
  earnedValueUSD: z.number().min(0, 'El Valor Ganado (EV) debe ser >= 0'),
  actualCostUSD: z.number().min(0, 'El Costo Real (AC) debe ser >= 0'),
  deliverables: z.array(
    z.object({
      code: z.string().min(1, 'El código de entregable es obligatorio'),
      title: z.string().min(1, 'El título de entregable es obligatorio'),
      weight: z.number().min(0).max(100),
      progressPct: z.number().min(0).max(100),
    })
  ).min(1, 'Debe registrar al menos un entregable de ingeniería'),
  notes: z.string().optional(),
});

export function createInitialEngineeringProgressData(): EngineeringProgressData {
  return {
    reportCode: '',
    reportDate: '',
    plannedProgressPct: 0,
    actualProgressPct: 0,
    plannedValueUSD: 0,
    earnedValueUSD: 0,
    actualCostUSD: 0,
    deliverables: [],
    notes: '',
  };
}

export const wf073Definition: WorkflowDefinition<EngineeringProgressData> = {
  id: 'wf-073-medicion-avance-ingenieria',
  title: 'Medición de Avance de Ingeniería con EVM (GPG Fase 2)',
  description: 'Control de progreso físico y curvas de avance S en ingeniería con cálculo EVM, SPI, CPI y varianza de costo.',
  phase: 2,
  rolesAllowed: ['superadmin', 'gerente', 'supervisor', 'inspector'],
  captureComponent: EngineeringProgressCapture,
  schema: EngineeringProgressSchema,
  hardGates: [
    {
      id: 'EMPTY_DELIVERABLES',
      name: 'Entregables Vacíos',
      description: 'Bloquea la generación de reporte si no se han registrado entregables de ingeniería.',
      evaluator: (_context, data) => {
        if (!data.deliverables || data.deliverables.length === 0) {
          return {
            passed: false,
            message: 'BLOQUEO TÉCNICO: Se requiere al menos un entregable de ingeniería registrado.',
          };
        }
        return { passed: true };
      },
    },
    {
      id: 'EFFICIENCY_BELOW_085',
      name: 'Eficiencia EVM por Debajo de 0.85',
      description: 'Bloquea la aprobación si los índices de desempeño SPI o CPI se encuentran por debajo del umbral crítico de 0.85.',
      evaluator: (_context, data) => {
        const pv = data.plannedValueUSD > 0 ? data.plannedValueUSD : 1;
        const ev = data.earnedValueUSD;
        const ac = data.actualCostUSD > 0 ? data.actualCostUSD : 1;

        const spi = ev / pv;
        const cpi = ev / ac;

        if (spi < 0.85 || cpi < 0.85) {
          return {
            passed: false,
            message: `BLOQUEO DE EFICIENCIA EVM: El índice de desempeño de desempeño SPI (${spi.toFixed(2)}) o CPI (${cpi.toFixed(2)}) es inferior al límite de 0.85. Se requiere un plan de recuperación de desviaciones.`,
          };
        }
        return { passed: true };
      },
    },
  ],
  deliverable: {
    id: 'deliv-073-reporte-evm',
    title: 'Reporte Certificado de Avance Físico de Ingeniería EVM',
    type: 'report',
    factory: (context, data) => {
      const pv = data.plannedValueUSD;
      const ev = data.earnedValueUSD;
      const ac = data.actualCostUSD;

      const spi = pv > 0 ? (ev / pv).toFixed(3) : '1.000';
      const cpi = ac > 0 ? (ev / ac).toFixed(3) : '1.000';
      const sv = (ev - pv).toFixed(2);
      const cv = (ev - ac).toFixed(2);

      const signers = [
        {
          id: 'sig-073-1',
          role: 'INSPECTOR' as const,
          name: '',
          title: 'Inspector de Control de Proyectos EVM',
          organization: context.contractorBrand.companyName || 'CONTRATISTA',
          status: 'PENDING' as const,
          signedAt: undefined,
        },
        {
          id: 'sig-073-2',
          role: 'CONTRACTOR' as const,
          name: '',
          title: 'Líder de Contratista de Ingeniería',
          organization: context.contractorBrand.companyName || 'CONTRATISTA',
          status: 'PENDING' as const,
          signedAt: undefined,
        },
        {
          id: 'sig-073-3',
          role: 'OPERATOR' as const,
          name: '',
          title: 'Gerente de Proyecto Operador',
          organization: context.operatorBrand.companyName || 'OPERADOR',
          status: 'PENDING' as const,
          signedAt: undefined,
        },
      ];

      return createDocumentViewModel({
        documentId: `EVM-ING-${data.reportCode || 'PENDIENTE'}`,
        title: 'REPORTES DE MEDIDAS DE AVANCE Y PERFORMANCE DE INGENIERÍA EVM',
        code: data.reportCode || 'PENDIENTE',
        date: data.reportDate || new Date().toISOString().split('T')[0],
        status: 'DRAFT',
        contractorBrand: context.contractorBrand,
        operatorBrand: context.operatorBrand,
        signers,
        metadata: freezeDocumentMetadata(signers),
        sections: [
          {
            id: 'sec-evm-1',
            title: '1. RESUMEN DE INDICADORES EVM Y VARIACIONES',
            content: [
              `Código de Reporte: ${data.reportCode || 'N/A'}`,
              `Fecha de Corte: ${data.reportDate || 'N/A'}`,
              `% Prog. Planificado: ${data.plannedProgressPct}%`,
              `% Prog. Real Acumulado: ${data.actualProgressPct}%`,
              `Valor Planificado (PV): $${pv.toLocaleString()} USD`,
              `Valor Ganado (EV): $${ev.toLocaleString()} USD`,
              `Costo Real (AC): $${ac.toLocaleString()} USD`,
              `SPI (Schedule Performance Index): ${spi}`,
              `CPI (Cost Performance Index): ${cpi}`,
              `Varianza de Cronograma (SV = EV - PV): $${sv} USD`,
              `Varianza de Costo (CV = EV - AC): $${cv} USD`,
            ],
          },
        ],
        tables: [
          {
            id: 'tbl-deliverables',
            title: 'DESGLOSE DE ENTREGABLES DE INGENIERÍA DE DETALLE',
            headers: ['Código', 'Entregable', 'Peso (%)', '% Avance Real'],
            rows: (data.deliverables || []).map((d) => ({
              cells: [
                { value: d.code, bold: true },
                { value: d.title },
                { value: d.weight, align: 'right' },
                { value: d.progressPct, align: 'right' },
              ],
            })),
          },
        ],
      });
    },
  },
};
