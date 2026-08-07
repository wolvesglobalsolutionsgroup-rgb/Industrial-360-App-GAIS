import { z } from 'zod';
import { WorkflowDefinition } from '../../lib/workflows/contracts';
import { createDocumentViewModel } from '../../lib/documentViewModel';
import { freezeDocumentMetadata } from '../../lib/documentPolicy';
import {
  EnvironmentalCapture,
  EnvironmentalData,
} from './components/EnvironmentalCapture';

export const EnvironmentalAspectSchema = z.object({
  id: z.string(),
  activity: z.string().min(3),
  aspect: z.string().min(3),
  environmentalImpact: z.string().min(3),
  significance: z.enum(['Alto', 'Medio', 'Bajo']),
  mitigationMeasure: z.string().min(3),
  normRef: z.string(),
  responsible: z.string(),
  status: z.enum(['Implementado', 'En Proceso', 'Pendiente']),
});

export const RasdaManifestSchema = z.object({
  id: z.string(),
  manifestNumber: z.string().min(5),
  wasteType: z.enum([
    'Aceite Usado',
    'Lodos de Perforación / Trampa',
    'Aguas de Producción',
    'Trapos/Filtros Impregnados',
    'Desechos Sólidos Industriales',
  ]),
  volumeAmount: z.number().positive(),
  unit: z.enum(['Litros', 'm³', 'Tambores (208L)', 'Kg']),
  rasdaGenerator: z.string(),
  transporterName: z.string(),
  rasdaTransporter: z.string(),
  disposalSite: z.string().min(5),
  disposalCertificateNo: z.string(),
  dispatchDate: z.string(),
  status: z.enum(['Emitido', 'En Tránsito', 'Dispuesto y Certificado']),
});

export const EnvironmentalWorkflowSchema = z.object({
  aspects: z.array(EnvironmentalAspectSchema),
  manifests: z.array(RasdaManifestSchema),
  summaryNotes: z.string().optional(),
});

export const wf048Definition: WorkflowDefinition<EnvironmentalData> = {
  id: 'wf-048-gestion-ambiental-siho',
  title: 'Gestión Ambiental SIHO & Manifiestos RASDA (PDVSA MA-01)',
  description:
    'Control de la Matriz de Aspectos e Impactos Ambientales (PGA) y Trazabilidad de Manifiestos de Desechos Peligrosos bajo Registro RASDA.',
  phase: 4,
  rolesAllowed: ['superadmin', 'gerente', 'supervisor', 'inspector', 'campo'],
  captureComponent: EnvironmentalCapture,
  schema: EnvironmentalWorkflowSchema,
  hardGates: [
    {
      id: 'gate-rasda-disposal-site',
      name: 'Sitio de Disposición Final Certificado RASDA',
      description:
        'Verifica que todo manifiesto de desechos peligrosos tenga asignado un sitio de disposición final autorizado.',
      evaluator: (_context, data) => {
        if (!data.manifests || data.manifests.length === 0) {
          return { passed: true };
        }
        const invalidMan = data.manifests.find(
          (m) => !m.disposalSite || m.disposalSite.trim().length < 5
        );
        if (invalidMan) {
          return {
            passed: false,
            message: `BLOQUEO AMBIENTAL: El manifiesto ${invalidMan.manifestNumber} no especifica un sitio de disposición final certificado RASDA.`,
          };
        }
        return { passed: true };
      },
    },
    {
      id: 'gate-pga-mitigation',
      name: 'Medidas de Mitigación en Impactos de Alta Significancia',
      description:
        'Exige que todo aspecto con significancia Alta tenga definida su medida de mitigación e inspector responsable.',
      evaluator: (_context, data) => {
        if (!data.aspects || data.aspects.length === 0) {
          return { passed: true };
        }
        const unmitigated = data.aspects.find(
          (a) =>
            a.significance === 'Alto' &&
            (!a.mitigationMeasure || a.mitigationMeasure.trim().length < 5)
        );
        if (unmitigated) {
          return {
            passed: false,
            message: `BLOQUEO DE CUMPLIMIENTO: La actividad "${unmitigated.activity}" catalogada de alta significancia carece de medidas de mitigación ambientales válidas.`,
          };
        }
        return { passed: true };
      },
    },
  ],
  deliverable: {
    id: 'deliv-048-manifiesto-ambiental',
    title: 'Manifiesto y Certificado de Gestión Ambiental RASDA',
    type: 'report',
    factory: (context, data) => {
      const manifestsList = data.manifests || [];
      const aspectsList = data.aspects || [];

      if (manifestsList.length === 0 && aspectsList.length === 0) {
        throw new Error(
          'Error de Dominio: No se pueden generar entregables de gestión ambiental sin aspectos o manifiestos RASDA registrados.'
        );
      }

      const signers = [
        {
          id: 'sig-048-1',
          role: 'INSPECTOR' as const,
          name: context.user.email,
          title: 'Inspector de Calidad Ambiental PDVSA MA-01',
          organization: 'PROINTECA C.A.',
          status: 'PENDING' as const,
        },
      ];

      return createDocumentViewModel({
        documentId: `MAN-AMB-RASDA-${Date.now().toString().slice(-5)}`,
        title: 'MANIFIESTO Y CERTIFICADO DE GESTIÓN AMBIENTAL RASDA',
        code: `PDVSA-MA-01-RASDA-${context.projectId}`,
        date: new Date().toISOString().split('T')[0],
        status: 'DRAFT',
        contractorBrand: context.contractorBrand,
        operatorBrand: context.operatorBrand,
        signers,
        metadata: freezeDocumentMetadata(signers),
        sections: [
          {
            id: 'sec-1',
            title: '1. RESUMEN DE MATRIZ DE ASPECTOS E IMPACTOS AMBIENTALES (PGA)',
            content: aspectsList.map(
              (a) =>
                `Actividad: ${a.activity} | Aspecto: ${a.aspect} | Impacto: ${a.environmentalImpact} | Significancia: ${a.significance} | Mitigación: ${a.mitigationMeasure}`
            ),
          },
          {
            id: 'sec-2',
            title: '2. RESUMEN DE MANIFIESTOS Y TRAZABILIDAD DE DESECHOS (RASDA)',
            content: manifestsList.map(
              (m) =>
                `Manifiesto: ${m.manifestNumber} | Tipo: ${m.wasteType} | Cantidad: ${m.volumeAmount} ${m.unit} | Transportista: ${m.transporterName} | Disposición: ${m.disposalSite} | Estado: ${m.status}`
            ),
          },
          {
            id: 'sec-3',
            title: '3. DICTAMEN DE AUDITORÍA Y OBSERVACIONES',
            content: [data.summaryNotes || 'Gestión ambiental conforme a normativa PDVSA MA-01.'],
          },
        ],
      });
    },
  },
};
