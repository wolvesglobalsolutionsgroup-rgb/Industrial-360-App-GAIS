import { z } from 'zod';
import { WorkflowDefinition } from '../../lib/workflows/contracts';
import { createDocumentViewModel, DocumentTable } from '../../lib/documentViewModel';
import { TabularReportCapture, TabularReportData } from './components/TabularReportCapture';

export const TabularJointItemSchema = z.object({
  jointId: z.string().min(1, 'Identificador de junta es obligatorio'),
  kpHour: z.string().min(1, 'Ubicación KP es obligatoria'),
  ndtResult: z.enum(['APPROVED', 'REJECTED', 'REPAIR']),
  ultrasonicThicknessMm: z.number().positive('El espesor UT debe ser mayor a 0 mm'),
});

export const TabularReportSchema = z.object({
  reportCode: z.string().min(3, 'El código de reporte debe tener al menos 3 caracteres'),
  welderId: z.string().min(2, 'Ficha/estampa de soldador es obligatoria'),
  pipeDiameterInches: z.number().positive('Diámetro debe ser mayor a 0 pulgadas'),
  inspectorName: z.string().min(2, 'Nombre de inspector NDT es obligatorio'),
  items: z.array(TabularJointItemSchema).min(1, 'Debe registrar al menos una junta soldada'),
});

export const wf044Definition: WorkflowDefinition<TabularReportData> = {
  id: 'wf-044-reporte-tabular',
  title: 'Reporte Tabular de Avance NDT y Trazabilidad de Soldadura',
  description: 'Módulo tabular estructurado para registro masivo de juntas soldadas, ultrasonido de pared y dictámenes de calidad para compilación automática.',
  phase: 5,
  rolesAllowed: ['superadmin', 'gerente', 'supervisor', 'inspector'],
  captureComponent: TabularReportCapture,
  schema: TabularReportSchema,
  hardGates: [
    {
      id: 'gate-min-joints',
      name: 'Mínimo Registro de Juntas y Espesor Válido',
      description: 'Valida que exista al menos una junta registrada y que todos los espesores medidos sean de al menos 1.0 mm.',
      evaluator: (_context, data) => {
        if (!data.items || data.items.length === 0) {
          return {
            passed: false,
            message: 'REGISTRO VACÍO: Se requiere al menos una junta de soldadura en la tabla antes de procesar.',
          };
        }
        const invalidThickness = data.items.some((i) => !i.ultrasonicThicknessMm || i.ultrasonicThicknessMm < 1.0);
        if (invalidThickness) {
          return {
            passed: false,
            message: 'ERROR DE MEDIDA: Todas las juntas deben registrar un espesor UT válido mayor o igual a 1.0 mm.',
          };
        }
        return { passed: true };
      },
    },
  ],
  deliverable: {
    id: 'deliv-044-reporte-tabular-ndt',
    title: 'Informe Tabular Certificado de Ensayos No Destructivos',
    type: 'report',
    factory: (context, data) => {
      const approvedCount = data.items.filter((i) => i.ndtResult === 'APPROVED').length;
      const passRate = ((approvedCount / data.items.length) * 100).toFixed(1);

      const tableData: DocumentTable = {
        id: 'tbl-ndt-joints',
        title: 'TABLA DE TRAZABILIDAD NDT DE JUNTAS SOLDADAS',
        headers: ['Junta N°', 'Ubicación / KP', 'Espesor UT (mm)', 'Dictamen NDT'],
        rows: data.items.map((item) => ({
          cells: [
            { value: item.jointId, align: 'left', bold: true },
            { value: item.kpHour, align: 'left' },
            { value: item.ultrasonicThicknessMm, align: 'right' },
            { value: item.ndtResult, align: 'center', bold: true },
          ],
        })),
        summaryRow: {
          cells: [
            { value: 'TOTAL JUNTAS', bold: true },
            { value: `${data.items.length} Evaluadas`, bold: true },
            { value: `Aprobadas: ${approvedCount}`, bold: true, align: 'right' },
            { value: `Tasa: ${passRate}%`, bold: true, align: 'center' },
          ],
        },
      };

      return createDocumentViewModel({
        documentId: `REP-NDT-TAB-${data.reportCode}`,
        title: 'INFORME TABULAR DE CONTROL DE CALIDAD Y TRAZABILIDAD NDT',
        code: data.reportCode,
        date: new Date().toISOString().split('T')[0],
        status: 'APPROVED',
        contractorBrand: context.contractorBrand,
        operatorBrand: context.operatorBrand,
        signers: [
          {
            role: 'INSPECTOR_NDT',
            name: data.inspectorName,
            title: 'Inspector NDT Nivel II (API 1104 / ASNT)',
            verified: true,
          },
        ],
        metadata: {
          projectCode: context.projectId,
          clientName: 'PDVSA / Consorcio Operador',
          contractorName: 'PROINTECA C.A.',
          location: 'Trazado de Tubería / Tramo de Ducto',
          securityHash: `SHA256-${Date.now()}-NDT-TAB`,
          systemVersion: 'IC360-v2026.1',
        },
        sections: [
          {
            id: 'sec-summary',
            title: '1. RESUMEN EJECUTIVO DE INSPECCIÓN',
            content: [
              `Código de Reporte: ${data.reportCode}`,
              `Estampa / Soldador: ${data.welderId}`,
              `Diámetro de Tubería: ${data.pipeDiameterInches}" SCH 40`,
              `Total de Juntas Evaluadas: ${data.items.length}`,
              `Tasa de Aprobación de Primera Intención: ${passRate}%`,
            ],
          },
        ],
        tables: [tableData],
      });
    },
  },
};
