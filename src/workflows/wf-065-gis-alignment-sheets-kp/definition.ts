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
      description: 'Valida estrictamente que el KP final sea mayor al KP inicial, previniendo discontinuidades en el trazado de tuberías.',
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
          name: context.user.email,
          title: 'Inspector Topógrafo Geodesta',
          organization: context.contractorBrand.companyName || 'PROINTECA C.A.',
          status: 'SIGNED' as const,
          signedAt: new Date().toISOString(),
        },
        {
          id: 'sig-075-2',
          role: 'CONTRACTOR' as const,
          name: 'Ing. Jefe de Traza y Cadena de Faja',
          title: 'Superintendente de Ductos',
          organization: context.contractorBrand.companyName || 'PROINTECA C.A.',
          status: 'SIGNED' as const,
          signedAt: new Date().toISOString(),
        },
        {
          id: 'sig-075-3',
          role: 'OPERATOR' as const,
          name: 'Ing. Especialista GIS PDVSA',
          title: 'Custodio de Servidumbre y Cartografía',
          organization: context.operatorBrand.companyName || 'PDVSA PETRÓLEO S.A.',
          status: 'SIGNED' as const,
          signedAt: new Date().toISOString(),
        },
      ];

      return createDocumentViewModel({
        documentId: `ALIGN-SHEET-${data.sheetCode}`,
        title: 'ALIGNMENT SHEET Y HOJA DE DATOS GEORREFERENCIADOS KP',
        code: data.sheetCode,
        date: new Date().toISOString().split('T')[0],
        status: 'APPROVED',
        contractorBrand: context.contractorBrand,
        operatorBrand: context.operatorBrand,
        signers,
        metadata: freezeDocumentMetadata(signers),
        sections: [
          {
            id: 'sec-gis-1',
            title: '1. DATOS DE TRAZADO Y KILOMETRAJE (KP)',
            content: [
              `Código de Plano: ${data.sheetCode}`,
              `Segmento de Tubería: ${data.pipelineSegment}`,
              `KP Inicial: KP ${data.startKp.toFixed(3)} Km`,
              `KP Final: KP ${data.endKp.toFixed(3)} Km`,
              `Longitud del Tramo: ${(data.endKp - data.startKp).toFixed(3)} Km`,
              `Sistema Geodésico / Datum: ${data.datum}`,
              `Vértices Topográficos Procesados: ${data.coordinatesCount}`,
              `Estado de Archivos KMZ: ${data.kmzValidated ? 'VALIDADO ESPACIALMENTE' : 'PENDIENTE DE REVISIÓN'}`,
            ],
          },
          {
            id: 'sec-gis-2',
            title: '2. OBSERVACIONES TOPOGRÁFICAS Y SERVIDUMBRE',
            content: [data.inspectorNotes],
          },
        ],
      });
    },
  },
};
