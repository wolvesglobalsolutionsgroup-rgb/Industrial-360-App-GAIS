import { z } from 'zod';
import { WorkflowDefinition } from '../../lib/workflows/contracts';
import { createDocumentViewModel } from '../../lib/documentViewModel';
import { freezeDocumentMetadata } from '../../lib/documentPolicy';
import { GisAlignmentCapture } from './components/GisAlignmentCapture';

export interface GisAlignmentData {
  sheetCode: string;
  pipelineSegment: string;
  startKp: number;
  endKp: number;
  kmzValidated: boolean;
  coordinatesCount: number;
  datum: 'REGVEN' | 'WGS84' | 'PSAD56';
  inspectorNotes: string;
}

export const GisAlignmentSchema = z.object({
  sheetCode: z.string().min(3, 'El código de Alignment Sheet debe tener al menos 3 caracteres'),
  pipelineSegment: z.string().min(3, 'El nombre del segmento de tubería es obligatorio'),
  startKp: z.number().min(0, 'El KP inicial debe ser mayor o igual a 0'),
  endKp: z.number().min(0, 'El KP final debe ser mayor o igual a 0'),
  kmzValidated: z.boolean(),
  coordinatesCount: z.number().int().min(2, 'Se requieren al menos 2 vértices de coordenadas UTM/GIS'),
  datum: z.enum(['REGVEN', 'WGS84', 'PSAD56']),
  inspectorNotes: z.string().min(5, 'Las observaciones topográficas deben tener al menos 5 caracteres'),
});

export function createInitialGisAlignmentData(): GisAlignmentData {
  return {
    sheetCode: '',
    pipelineSegment: '',
    startKp: 0,
    endKp: 0,
    kmzValidated: false,
    coordinatesCount: 0,
    datum: 'REGVEN',
    inspectorNotes: '',
  };
}

export const wf065Definition: WorkflowDefinition<GisAlignmentData> = {
  id: 'wf-065-gis-alignment-sheets-kp',
  title: 'Alignment Sheets, Proyección KP y Georreferenciación GIS (GPG Fase 5)',
  description: 'Control de planos de alineamiento de tuberías, continuidad topográfica de kilometraje KP y validación de archivos cartográficos KMZ/GIS.',
  phase: 5,
  rolesAllowed: ['superadmin', 'gerente', 'supervisor', 'inspector', 'campo'],
  captureComponent: GisAlignmentCapture,
  schema: GisAlignmentSchema,
  hardGates: [
    {
      id: 'GATE_KP_CONTINUITY',
      name: 'Continuidad Topográfica de Kilometraje KP',
      description: 'Valida strictly que el KP final sea mayor al KP inicial, previniendo discontinuidades en el trazado de tuberías.',
      evaluator: (_context, data) => {
        if (data.endKp <= data.startKp) {
          return {
            passed: false,
            message: `DISCONTINUIDAD TOPOGRÁFICA: El KP final (${data.endKp} Km) es menor o igual al KP inicial (${data.startKp} Km).`,
          };
        }
        return { passed: true };
      },
    },
    {
      id: 'GATE_KMZ_VALIDATION',
      name: 'Validación Cartográfica KMZ / Geopackage',
      description: 'Exige que los archivos vectoriales KMZ/GIS hayan sido procesados y validados espacialmente.',
      evaluator: (_context, data) => {
        if (!data.kmzValidated) {
          return {
            passed: false,
            message: 'BLOQUEO GIS: El archivo de georreferenciación KMZ no ha sido verificado contra la cartografía oficial PDVSA REGVEN.',
          };
        }
        return { passed: true };
      },
    },
  ],
  deliverable: {
    id: 'deliv-065-alignment-sheet',
    title: 'Alignment Sheet y Certificado de Georreferenciación KP',
    type: 'document',
    factory: (context, data) => {
      const signers = [
        {
          id: 'sig-065-1',
          role: 'INSPECTOR' as const,
          name: '',
          title: 'Inspector Topógrafo Geodesta',
          organization: context.contractorBrand.companyName || 'CONTRATISTA',
          status: 'PENDING' as const,
          signedAt: undefined,
        },
        {
          id: 'sig-065-2',
          role: 'CONTRACTOR' as const,
          name: '',
          title: 'Jefe de Traza y Cadena de Faja',
          organization: context.contractorBrand.companyName || 'CONTRATISTA',
          status: 'PENDING' as const,
          signedAt: undefined,
        },
        {
          id: 'sig-065-3',
          role: 'OPERATOR' as const,
          name: '',
          title: 'Custodio de Servidumbre y Cartografía',
          organization: context.operatorBrand.companyName || 'OPERADOR',
          status: 'PENDING' as const,
          signedAt: undefined,
        },
      ];

      return createDocumentViewModel({
        documentId: `ALIGN-SHEET-${data.sheetCode || 'PENDIENTE'}`,
        title: 'ALIGNMENT SHEET Y HOJA DE DATOS GEORREFERENCIADOS KP',
        code: data.sheetCode || 'PENDIENTE',
        date: new Date().toISOString().split('T')[0],
        status: 'DRAFT',
        contractorBrand: context.contractorBrand,
        operatorBrand: context.operatorBrand,
        signers,
        metadata: freezeDocumentMetadata(signers),
        sections: [
          {
            id: 'sec-gis-1',
            title: '1. DATOS DE TRAZADO Y KILOMETRAJE (KP)',
            content: [
              `Código de Plano: ${data.sheetCode || 'N/A'}`,
              `Segmento de Tubería: ${data.pipelineSegment || 'N/A'}`,
              `KP Inicial: KP ${(data.startKp || 0).toFixed(3)} Km`,
              `KP Final: KP ${(data.endKp || 0).toFixed(3)} Km`,
              `Longitud del Tramo: ${((data.endKp || 0) - (data.startKp || 0)).toFixed(3)} Km`,
              `Sistema Geodésico / Datum: ${data.datum || 'REGVEN'}`,
              `Vértices Topográficos Procesados: ${data.coordinatesCount || 0}`,
              `Estado de Archivos KMZ: ${data.kmzValidated ? 'VALIDADO ESPACIALMENTE' : 'PENDIENTE DE REVISIÓN'}`,
            ],
          },
          {
            id: 'sec-gis-2',
            title: '2. OBSERVACIONES TOPOGRÁFICAS Y SERVIDUMBRE',
            content: [data.inspectorNotes || 'Sin observaciones registradas.'],
          },
        ],
      });
    },
  },
};
