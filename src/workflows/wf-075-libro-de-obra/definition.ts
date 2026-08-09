import { z } from 'zod';
import { WorkflowDefinition } from '../../lib/workflows/contracts';
import { createDocumentViewModel } from '../../lib/documentViewModel';
import { freezeDocumentMetadata } from '../../lib/documentPolicy';
import { SiteLogbookCapture } from './components/SiteLogbookCapture';

export interface DailyLogEntry {
  entryNumber: number;
  date: string;
  description: string;
  weatherCondition: 'bueno' | 'lluvia_moderada' | 'lluvia_fuerte' | 'inoperativo' | '' | 'pendiente';
  manpowerCount: number;
  incidentsReported: boolean;
}

export interface SiteLogbookData {
  bookCode: string;
  startDate: string;
  endDate: string;
  contractorName: string;
  residentEngineer: string;
  inspectorName: string;
  sectionsCount: number;
  dailyEntries: DailyLogEntry[];
  isSealed: boolean;
}

export const SiteLogbookSchema = z.object({
  bookCode: z.string().min(3, 'El código de Libro de Obra debe tener al menos 3 caracteres'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inicio formato YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha fin formato YYYY-MM-DD'),
  contractorName: z.string().min(2, 'El nombre de la empresa contratista es obligatorio'),
  residentEngineer: z.string().min(2, 'El nombre del Ingeniero Residente es obligatorio'),
  inspectorName: z.string().min(2, 'El nombre del Inspector de Obra es obligatorio'),
  sectionsCount: z.number().int().min(16, 'El Libro de Obra debe contar con las 16 secciones reglamentarias PDVSA'),
  dailyEntries: z.array(
    z.object({
      entryNumber: z.number().int().positive(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha asiento YYYY-MM-DD'),
      description: z.string().min(5, 'Cada asiento debe describir la novedad o actividad ejecutada'),
      weatherCondition: z.enum(['bueno', 'lluvia_moderada', 'lluvia_fuerte', 'inoperativo']),
      manpowerCount: z.number().int().min(0),
      incidentsReported: z.boolean(),
    })
  ).min(1, 'Debe registrar al menos un asiento diario en el Libro de Obra'),
  isSealed: z.boolean(),
});

export function createDefaultSiteLogbookEntry(entryNumber: number = 1): DailyLogEntry {
  return {
    entryNumber,
    date: '',
    description: '',
    weatherCondition: '',
    manpowerCount: 0,
    incidentsReported: false,
  };
}

export function createInitialSiteLogbookData(): SiteLogbookData {
  return {
    bookCode: '',
    startDate: '',
    endDate: '',
    contractorName: '',
    residentEngineer: '',
    inspectorName: '',
    sectionsCount: 16,
    dailyEntries: [],
    isSealed: false,
  };
}

export const wf075Definition: WorkflowDefinition<SiteLogbookData> = {
  id: 'wf-075-libro-de-obra',
  title: 'Libro de Obra Digital y Asientos Diarios (16 Secciones GPG / PDVSA)',
  description: 'Bitácora oficial y control reglamentario de 16 secciones de obra de construcción con firma diaria de inspección y residencia.',
  phase: 4,
  rolesAllowed: ['superadmin', 'gerente', 'supervisor', 'inspector', 'campo'],
  captureComponent: SiteLogbookCapture,
  schema: SiteLogbookSchema,
  hardGates: [
    {
      id: 'UNSEALED_BOOK',
      name: 'Libro de Obra No Sellado Digitalmente',
      description: 'Bloquea el cierre o transferencia de fase si el Libro de Obra no ha sido formalmente cerrado y sellado por la inspección.',
      evaluator: (_context, data) => {
        if (!data.isSealed) {
          return {
            passed: false,
            message: 'BLOQUEO DE LIBRO DE OBRA: El Libro de Obra no ha sido sellado digitalmente por la Inspección de Obra.',
          };
        }
        return { passed: true };
      },
    },
    {
      id: 'MISSING_DAILY_ENTRIES',
      name: 'Falta de Asientos Diarios Reglamentarios o Incompletos',
      description: 'Valida que existan asientos diarios y que no haya registros sin fecha, sin descripción o con clima no seleccionado.',
      evaluator: (_context, data) => {
        if (!data.dailyEntries || data.dailyEntries.length === 0) {
          return {
            passed: false,
            message: 'BLOQUEO TÉCNICO: Se registraron 0 asientos diarios en el periodo reportado del Libro de Obra.',
          };
        }

        for (const entry of data.dailyEntries) {
          if (!entry.date || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
            return {
              passed: false,
              message: `BLOQUEO TÉCNICO: El asiento #${entry.entryNumber} no posee una fecha válida en formato YYYY-MM-DD.`,
            };
          }
          if (!entry.description || entry.description.trim().length < 5) {
            return {
              passed: false,
              message: `BLOQUEO TÉCNICO: El asiento #${entry.entryNumber} no posee una descripción suficiente (mínimo 5 caracteres).`,
            };
          }
          if (!entry.weatherCondition || entry.weatherCondition === '' || (entry.weatherCondition as string) === 'pendiente') {
            return {
              passed: false,
              message: `BLOQUEO TÉCNICO: El asiento #${entry.entryNumber} no tiene la condición climática seleccionada.`,
            };
          }
        }

        return { passed: true };
      },
    },
  ],
  deliverable: {
    id: 'deliv-075-libro-obra-oficial',
    title: 'Libro de Obra Digital Certificado',
    type: 'document',
    factory: (context, data) => {
      const signers = [
        {
          id: 'sig-075-1',
          role: 'INSPECTOR' as const,
          name: data.inspectorName || '',
          title: 'Inspector Principal de Obra',
          organization: context.operatorBrand.companyName || 'OPERADOR',
          status: 'PENDING' as const,
          signedAt: undefined,
        },
        {
          id: 'sig-075-2',
          role: 'CONTRACTOR' as const,
          name: data.residentEngineer || '',
          title: 'Ingeniero Residente de Obra',
          organization: data.contractorName || context.contractorBrand.companyName || 'CONTRATISTA',
          status: 'PENDING' as const,
          signedAt: undefined,
        },
        {
          id: 'sig-075-3',
          role: 'OPERATOR' as const,
          name: '',
          title: 'Superintendente de Infraestructura',
          organization: context.operatorBrand.companyName || 'OPERADOR',
          status: 'PENDING' as const,
          signedAt: undefined,
        },
      ];

      return createDocumentViewModel({
        documentId: `LIBRO-OBRA-${data.bookCode || 'PENDIENTE'}`,
        title: 'LIBRO DE OBRA DIGITAL CERTIFICADO Y ASIENTOS REGISTRADOS',
        code: data.bookCode || 'PENDIENTE',
        date: data.endDate || new Date().toISOString().split('T')[0],
        status: data.isSealed ? 'SEALED' : 'DRAFT',
        contractorBrand: context.contractorBrand,
        operatorBrand: context.operatorBrand,
        signers,
        metadata: freezeDocumentMetadata(signers),
        sections: [
          {
            id: 'sec-lo-1',
            title: '1. DATOS GENERALES Y REGISTRO REGLAMENTARIO DE 16 SECCIONES',
            content: [
              `Código de Libro: ${data.bookCode || 'N/A'}`,
              `Fecha Inicio: ${data.startDate || 'N/A'}`,
              `Fecha Cierre: ${data.endDate || 'N/A'}`,
              `Ingeniero Residente: ${data.residentEngineer || 'N/A'}`,
              `Inspector de Obra: ${data.inspectorName || 'N/A'}`,
              `Secciones Reglamentarias Cumplidas: ${data.sectionsCount} de 16`,
              `Estado de Sellado Digital: ${data.isSealed ? 'SELLADO Y CERRADO' : 'ABIERTO EN REVISIÓN'}`,
            ],
          },
        ],
        tables: [
          {
            id: 'tbl-daily-entries',
            title: 'BITÁCORA DE ASIENTOS DIARIOS REGISTRADOS',
            headers: ['Nº', 'Fecha', 'Descripción de Actividad / Novedades', 'Clima', 'Personal', 'Incidente'],
            rows: (data.dailyEntries || []).map((e) => ({
              cells: [
                { value: `#${e.entryNumber}`, bold: true },
                { value: e.date },
                { value: e.description },
                { value: e.weatherCondition ? e.weatherCondition.toUpperCase() : 'N/A' },
                { value: e.manpowerCount, align: 'right' },
                { value: e.incidentsReported ? 'SÍ' : 'NO' },
              ],
            })),
          },
        ],
      });
    },
  },
};
