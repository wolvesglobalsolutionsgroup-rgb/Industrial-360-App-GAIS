import { z } from 'zod';
import { WorkflowDefinition } from '../../lib/workflows/contracts';
import { createDocumentViewModel, DocumentTable } from '../../lib/documentViewModel';
import { freezeDocumentMetadata } from '../../lib/documentPolicy';
import { ArtCapture } from './components/ArtCapture';
import {
  ArtApprovalData,
  HazardCategoryCatalog,
  calculateRiskLevel,
} from './types';

export const SignerApprovalSchema = z.object({
  nombre: z.string().min(2, 'Nombre de firmante es obligatorio'),
  ci: z.string().min(4, 'C.I. de firmante es obligatoria'),
  cargo: z.string().min(2, 'Cargo de firmante es obligatorio'),
  firma: z.string().min(1, 'Firma es obligatoria'),
  fecha: z.string().optional(),
});

export const WorkerDisclosureSchema = z.object({
  nombre: z.string().min(2, 'Nombre del trabajador es obligatorio'),
  ci: z.string().min(4, 'C.I. del trabajador es obligatoria'),
  cargo: z.string().min(2, 'Cargo del trabajador es obligatorio'),
  firma: z.string().min(1, 'Firma de divulgación es obligatoria'),
  fecha: z.string().min(1, 'Fecha de divulgación es obligatoria'),
});

export const HazardItemSchema = z.object({
  categoria: z.enum([
    'FISICO',
    'QUIMICO',
    'BIOLOGICO',
    'DISERGONOMICO',
    'MECANICO',
    'ELECTRICO',
    'LOCATIVO',
    'AMBIENTAL',
    'INTERFERENCIAS',
    'OTROS',
  ]),
  descripcion: z.string().min(3, 'Descripción del peligro es obligatoria'),
});

export const ArtPasoSchema = z.object({
  pasoNumero: z.number().positive(),
  pasoDescripcion: z.string().min(3, 'Descripción de la tarea es obligatoria'),
  peligrosIdentificados: z.array(HazardItemSchema).min(1, 'Debe registrar al menos un peligro por paso'),
  evaluacionProbabilidad: z.enum(['ALTA', 'MEDIA', 'BAJA']).optional(),
  evaluacionSeveridad: z.enum(['CATASTROFICA', 'CRITICA', 'MENOR']).optional(),
  nivelRiesgoCalculado: z.enum(['ALTO', 'MEDIO', 'BAJO']).optional(),
  medidasPreventivas: z.string().min(3, 'Medida preventiva es obligatoria'),
  responsableEjecucionControl: z.string().min(2, 'Responsable del control es obligatorio'),
});

export const ArtApprovalSchema = z.object({
  numeroArt: z.string().min(3, 'Número correlativo de ART es obligatorio'),
  tituloTrabajo: z.string().min(5, 'Título de la actividad es obligatorio'),
  instalacionArea: z.string().min(3, 'Instalación / Área es obligatoria'),
  empresa: z.enum(['PDVSA', 'CONTRATISTA']),
  contratoNumero: z.string().optional(),
  ordenSapNumero: z.string().optional(),
  fechaElaboracion: z.string().min(1, 'Fecha de elaboración es obligatoria'),
  hojaNumero: z.string().min(1, 'Número de hoja es obligatorio'),
  procedimientoRelacionado: z.string().optional(),
  
  siteVerified: z.boolean(),
  siteVerificationLocation: z.string().optional(),

  pasos: z.array(ArtPasoSchema).min(1, 'El ART debe desglosar al menos un paso de trabajo'),

  elaboradores: z.array(SignerApprovalSchema).optional(),
  aprobadorEmisor: SignerApprovalSchema,
  aprobadorReceptor: SignerApprovalSchema,
  aprobadorEjecutor: SignerApprovalSchema,

  workersAssignedCount: z.number().nonnegative(),
  divulgacionTrabajadores: z.array(WorkerDisclosureSchema),

  conditionsChanged: z.boolean(),
  changeReason: z.string().optional(),

  linkedPtwNumber: z.string().optional(),
  currentState: z.enum([
    'DRAFT',
    'SITE_VERIFIED',
    'SIHOA_REVIEW',
    'SIGNED_TRIPARTITE',
    'ACTIVE_IN_FIELD',
    'REVISION_REQUIRED',
    'CLOSED_ARCHIVED',
    'SUSPENDED_CANCELLED',
  ]).optional(),
});

export const wf044ArtDefinition: WorkflowDefinition<ArtApprovalData> = {
  id: 'wf-044-analisis-riesgos-trabajo',
  title: 'Análisis de Riesgos del Trabajo (ART PDVSA IR-S-17)',
  description:
    'Desglose secuencial de tareas, identificación de peligros por categorías (Anexo B IR-S-17), medidas de control, firmas tripartitas y registro de divulgación a trabajadores.',
  phase: 3,
  rolesAllowed: ['superadmin', 'gerente', 'supervisor', 'inspector', 'campo'],
  captureComponent: ArtCapture,
  schema: ArtApprovalSchema,
  hardGates: [
    {
      id: 'gate-site-verified',
      name: 'RULE-HARD-01 — Elaboración en Sitio de Trabajo',
      description:
        'Conforme a PDVSA IR-S-17 §5.2, el ART debe ser elaborado e inspeccionado directamente en la localización del trabajo con la participación de quienes ejecutan la tarea.',
      evaluator: (_context, data) => {
        if (!data.siteVerified) {
          return {
            passed: false,
            message:
              'HARD_BLOCK (IR-S-17 §5.2): El ART no ha sido marcado como elaborado en el sitio de trabajo con verificación visual de campo.',
          };
        }
        return { passed: true };
      },
    },
    {
      id: 'gate-worker-disclosure',
      name: 'RULE-HARD-02 — Divulgación Completa a Trabajadores',
      description:
        'Conforme a PDVSA IR-S-17 §5.3 y §7.2.3, todo trabajador asignado a la ejecución debe firmar la constancia de divulgación del ART antes de iniciar.',
      evaluator: (_context, data) => {
        const assigned = data.workersAssignedCount || 0;
        const disclosures = data.divulgacionTrabajadores ? data.divulgacionTrabajadores.length : 0;
        if (assigned > 0 && disclosures < assigned) {
          return {
            passed: false,
            message: `HARD_BLOCK (IR-S-17 §5.3): Falta divulgación a trabajadores. Asignados: ${assigned}, Firmados: ${disclosures}.`,
          };
        }
        if (disclosures === 0) {
          return {
            passed: false,
            message:
              'HARD_BLOCK (IR-S-17 §5.3): Se requiere al menos un registro de divulgación firmado por los trabajadores de campo.',
          };
        }
        return { passed: true };
      },
    },
    {
      id: 'gate-tripartite-signatures',
      name: 'RULE-HARD-03 — Firmas Tripartitas Obligatorias',
      description:
        'Conforme al Anexo A de PDVSA IR-S-17, el ART requiere firmas válidas y registradas del Emisor Custodio, Receptor y Ejecutor.',
      evaluator: (_context, data) => {
        if (!data.aprobadorEmisor?.firma || !data.aprobadorEmisor?.nombre) {
          return {
            passed: false,
            message: 'HARD_BLOCK (IR-S-17 Anexo A): Falta la firma de aprobación del Custodio Emisor PDVSA.',
          };
        }
        if (!data.aprobadorReceptor?.firma || !data.aprobadorReceptor?.nombre) {
          return {
            passed: false,
            message: 'HARD_BLOCK (IR-S-17 Anexo A): Falta la firma de aprobación del Receptor / Mantenedor.',
          };
        }
        if (!data.aprobadorEjecutor?.firma || !data.aprobadorEjecutor?.nombre) {
          return {
            passed: false,
            message: 'HARD_BLOCK (IR-S-17 Anexo A): Falta la firma de aprobación del Ejecutor / Contratista.',
          };
        }
        return { passed: true };
      },
    },
    {
      id: 'gate-condition-reevaluation',
      name: 'RULE-HARD-04 — Re-evaluación por Cambio de Condiciones',
      description:
        'Conforme a PDVSA IR-S-17 §8.1, si cambian las condiciones atmosféricas, el personal o el alcance, el ART pierde vigencia y exige re-evaluación inmediata.',
      evaluator: (_context, data) => {
        if (data.conditionsChanged) {
          return {
            passed: false,
            message:
              'HARD_BLOCK (IR-S-17 §8.1): Se registró un cambio de condiciones. El ART pasa a REVISION_REQUIRED y el PTW vinculado debe suspenderse.',
          };
        }
        return { passed: true };
      },
    },
  ],
  deliverable: {
    id: 'deliv-044-art-ir-s-17',
    title: 'Análisis de Riesgos del Trabajo Certificado (PDVSA IR-S-17 Anexo A)',
    type: 'document',
    factory: (context, data) => {
      const pasosTableRows = (data.pasos || []).map((paso) => {
        const peligrosTxt = paso.peligrosIdentificados
          .map((p) => {
            const catInfo = HazardCategoryCatalog.find((c) => c.id === p.categoria);
            return `[${catInfo?.code || p.categoria}] ${p.descripcion}`;
          })
          .join('\n');

        const riskLevel =
          paso.nivelRiesgoCalculado ||
          (paso.evaluacionProbabilidad && paso.evaluacionSeveridad
            ? calculateRiskLevel(paso.evaluacionProbabilidad, paso.evaluacionSeveridad)
            : 'MEDIO');

        return {
          cells: [
            { value: paso.pasoNumero, align: 'center' as const, bold: true },
            { value: paso.pasoDescripcion, align: 'left' as const },
            { value: peligrosTxt, align: 'left' as const },
            { value: riskLevel, align: 'center' as const, bold: true },
            { value: paso.medidasPreventivas, align: 'left' as const },
            { value: paso.responsableEjecucionControl, align: 'left' as const },
          ],
        };
      });

      const pasosTable: DocumentTable = {
        id: 'tbl-art-pasos',
        title: 'ANÁLISIS SECUENCIAL DE TAREAS, PELIGROS Y CONTROLES (PDVSA IR-S-17)',
        headers: [
          'Paso N°',
          'Secuencia de la Tarea',
          'Peligros o Riesgos Identificados',
          'Nivel Riesgo',
          'Medidas Preventivas / De Control',
          'Responsable del Control',
        ],
        rows: pasosTableRows,
      };

      const signers = [
        {
          id: 'sig-art-emisor',
          role: 'OPERATOR' as const,
          name: data.aprobadorEmisor.nombre,
          title: `EMISOR CUSTODIO - ${data.aprobadorEmisor.cargo} (C.I. ${data.aprobadorEmisor.ci})`,
          organization: 'PDVSA / OPERADOR',
          status: 'SIGNED' as const,
        },
        {
          id: 'sig-art-receptor',
          role: 'INSPECTOR' as const,
          name: data.aprobadorReceptor.nombre,
          title: `RECEPTOR - ${data.aprobadorReceptor.cargo} (C.I. ${data.aprobadorReceptor.ci})`,
          organization: 'MANTENIMIENTO',
          status: 'SIGNED' as const,
        },
        {
          id: 'sig-art-ejecutor',
          role: 'CONTRACTOR' as const,
          name: data.aprobadorEjecutor.nombre,
          title: `EJECUTOR - ${data.aprobadorEjecutor.cargo} (C.I. ${data.aprobadorEjecutor.ci})`,
          organization: data.empresa === 'CONTRATISTA' ? 'EMPRESA CONTRATISTA' : 'PDVSA EJECUCIÓN',
          status: 'SIGNED' as const,
        },
      ];

      return createDocumentViewModel({
        documentId: `ART-IR-S-17-${data.numeroArt}`,
        title: 'ANÁLISIS DE RIESGOS DEL TRABAJO (ART)',
        code: `PDVSA-IR-S-17-${data.numeroArt}`,
        date: data.fechaElaboracion || new Date().toISOString().split('T')[0],
        status: data.conditionsChanged ? 'DRAFT' : 'APPROVED',
        contractorBrand: context.contractorBrand,
        operatorBrand: context.operatorBrand,
        signers,
        metadata: freezeDocumentMetadata(signers),
        sections: [
          {
            id: 'sec-art-info',
            title: '1. DATOS GENERALES Y VERIFICACIÓN EN SITIO',
            content: [
              `Número ART: ${data.numeroArt}`,
              `Título de la Tarea: ${data.tituloTrabajo}`,
              `Instalación / Área: ${data.instalacionArea}`,
              `Empresa Ejecutora: ${data.empresa} ${data.contratoNumero ? `(Contrato: ${data.contratoNumero})` : ''}`,
              `Orden SAP N°: ${data.ordenSapNumero || 'N/A'}`,
              `Procedimiento SI-S-20 Ref: ${data.procedimientoRelacionado || 'N/A'}`,
              `Elaborado en Sitio (IR-S-17 §5.2): ${data.siteVerified ? 'SÍ (CONFORME)' : 'NO (FALTA VERIFICACIÓN)'}`,
              `Ubicación GPS / Sitio: ${data.siteVerificationLocation || 'Inspeccionado en Campo'}`,
              `Permiso PTW Vinculado (WF-043): ${data.linkedPtwNumber || 'N/A'}`,
            ],
          },
          {
            id: 'sec-art-divulgacion',
            title: '2. DIVULGACIÓN A TRABAJADORES Y EQUIPO DE TRABAJO',
            content: [
              `Total Trabajadores Asignados: ${data.workersAssignedCount}`,
              `Total Firmas de Divulgación Registradas: ${data.divulgacionTrabajadores ? data.divulgacionTrabajadores.length : 0}`,
              `Cumplimiento Divulgación §5.3: ${
                data.divulgacionTrabajadores && data.divulgacionTrabajadores.length >= data.workersAssignedCount
                  ? 'COMPLETO'
                  : 'INCOMPLETO'
              }`,
            ],
          },
        ],
        tables: [pasosTable],
      });
    },
  },
};
