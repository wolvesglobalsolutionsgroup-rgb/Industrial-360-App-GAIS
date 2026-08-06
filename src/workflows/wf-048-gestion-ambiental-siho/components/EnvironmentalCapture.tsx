import React, { useState } from 'react';
import {
  Trees,
  ShieldAlert,
  FileText,
  Truck,
  Droplets,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Building2,
  Trash2,
} from 'lucide-react';
import { WorkflowComponentProps } from '../../../lib/workflows/contracts';

export interface EnvironmentalAspect {
  id: string;
  activity: string;
  aspect: string;
  environmentalImpact: string;
  significance: 'Alto' | 'Medio' | 'Bajo';
  mitigationMeasure: string;
  normRef: string;
  responsible: string;
  status: 'Implementado' | 'En Proceso' | 'Pendiente';
}

export interface RasdaManifest {
  id: string;
  manifestNumber: string;
  wasteType: 'Aceite Usado' | 'Lodos de Perforación / Trampa' | 'Aguas de Producción' | 'Trapos/Filtros Impregnados' | 'Desechos Sólidos Industriales';
  volumeAmount: number;
  unit: 'Litros' | 'm³' | 'Tambores (208L)' | 'Kg';
  rasdaGenerator: string;
  transporterName: string;
  rasdaTransporter: string;
  disposalSite: string;
  disposalCertificateNo: string;
  dispatchDate: string;
  status: 'Emitido' | 'En Tránsito' | 'Dispuesto y Certificado';
}

export interface EnvironmentalData {
  aspects: EnvironmentalAspect[];
  manifests: RasdaManifest[];
  summaryNotes?: string;
}

export function EnvironmentalCapture({
  definition,
  context,
  data,
  onChange,
  isReadOnly = false,
}: WorkflowComponentProps<EnvironmentalData>) {
  const [activeTab, setActiveTab] = useState<'aspects' | 'manifests'>('aspects');

  const aspects = data?.aspects || [
    {
      id: 'pga_1',
      activity: 'Limpieza e Inspección de Trampas de Grasa en Taller',
      aspect: 'Generación de lodos de hidrocarburo retenidos',
      environmentalImpact: 'Riesgo de infiltración en subsuelo y freático',
      significance: 'Alto',
      mitigationMeasure: 'Extracción programada con camión vacum y retención temporal en tanques cónicos RASDA',
      normRef: 'PDVSA MA-01-02-12 Secc 4.2',
      responsible: 'Ing. Gustavo Alarcón (Ambiente)',
      status: 'Implementado',
    },
    {
      id: 'pga_2',
      activity: 'Cambio de Lubricante y Filtros en Flota Pesada',
      aspect: 'Generación de filtros usados y estopas impregnadas',
      environmentalImpact: 'Contaminación por residuos peligrosos sólidos',
      significance: 'Alto',
      mitigationMeasure: 'Segregación en tambores identificados con código de color y despacho a gestor RASDA',
      normRef: 'Ley de Sustancias, Materiales y Desechos Peligrosos Art. 45',
      responsible: 'Mecánico Jefe Ramos',
      status: 'Implementado',
    },
  ];

  const manifests = data?.manifests || [
    {
      id: 'rasda_101',
      manifestNumber: 'RASDA-2026-0041',
      wasteType: 'Aceite Usado',
      volumeAmount: 2400,
      unit: 'Litros',
      rasdaGenerator: 'RASDA-G-MONAGAS-9812',
      transporterName: 'Transportes Ecológicos Yaguare C.A.',
      rasdaTransporter: 'RASDA-T-2026-104',
      disposalSite: 'Relleno Sanitario e Incinerador Industrial Jusepín',
      disposalCertificateNo: 'CERT-DISP-JUS-2026-88',
      dispatchDate: '2026-07-25',
      status: 'Dispuesto y Certificado',
    },
  ];

  const updateAspects = (newAspects: EnvironmentalAspect[]) => {
    onChange({ aspects: newAspects, manifests, summaryNotes: data?.summaryNotes || '' });
  };

  const updateManifests = (newManifests: RasdaManifest[]) => {
    onChange({ aspects, manifests: newManifests, summaryNotes: data?.summaryNotes || '' });
  };

  const handleAddAspect = () => {
    const newAspect: EnvironmentalAspect = {
      id: `pga_${Date.now()}`,
      activity: 'Nueva Actividad Operativa',
      aspect: 'Aspecto Ambiental Identificado',
      environmentalImpact: 'Impacto Potencial sobre Medio Receptor',
      significance: 'Medio',
      mitigationMeasure: 'Medida de Control Ambiental Preventiva',
      normRef: 'PDVSA MA-01-02-12',
      responsible: context.user.email,
      status: 'En Proceso',
    };
    updateAspects([...aspects, newAspect]);
  };

  const handleAddManifest = () => {
    const newMan: RasdaManifest = {
      id: `rasda_${Date.now()}`,
      manifestNumber: `RASDA-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      wasteType: 'Aceite Usado',
      volumeAmount: 1000,
      unit: 'Litros',
      rasdaGenerator: 'RASDA-G-MONAGAS-9812',
      transporterName: 'TransEcológicos C.A.',
      rasdaTransporter: 'RASDA-T-2026-001',
      disposalSite: 'Planta Tratamiento Industrial Jusepín',
      disposalCertificateNo: 'CERT-DISP-PENDING',
      dispatchDate: new Date().toISOString().split('T')[0],
      status: 'Emitido',
    };
    updateManifests([...manifests, newMan]);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="p-4 bg-surface-2 border border-line rounded-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Trees size={22} />
          </div>
          <div>
            <h3 className="font-bold text-ink">{definition.title}</h3>
            <p className="text-xs text-ink-soft">
              Proyecto: {context.projectId} | Registro de Gestión Ambiental PDVSA MA-01 / RASDA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('aspects')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              activeTab === 'aspects'
                ? 'bg-brand-500 text-white border-brand-500'
                : 'bg-surface border-line text-ink-soft hover:text-ink'
            }`}
          >
            Aspectos e Impactos ({aspects.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manifests')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              activeTab === 'manifests'
                ? 'bg-brand-500 text-white border-brand-500'
                : 'bg-surface border-line text-ink-soft hover:text-ink'
            }`}
          >
            Manifiestos RASDA ({manifests.length})
          </button>
        </div>
      </div>

      {/* Tab: Aspectos e Impactos */}
      {activeTab === 'aspects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-ink flex items-center gap-2">
              <ShieldAlert size={16} className="text-emerald-500" />
              Matriz de Aspectos e Impactos Ambientales (PGA)
            </h4>
            {!isReadOnly && (
              <button
                type="button"
                onClick={handleAddAspect}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                Agregar Aspecto PGA
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aspects.map((asp, idx) => (
              <div
                key={asp.id}
                className="p-4 bg-surface border border-line rounded-xl space-y-3 relative group"
              >
                <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
                  <span className="text-xs font-bold text-brand-500">
                    #{idx + 1} - {asp.activity}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      asp.significance === 'Alto'
                        ? 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                        : asp.significance === 'Medio'
                        ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                    }`}
                  >
                    Significancia: {asp.significance}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-ink-soft">
                  <p>
                    <strong className="text-ink">Aspecto:</strong> {asp.aspect}
                  </p>
                  <p>
                    <strong className="text-ink">Impacto:</strong> {asp.environmentalImpact}
                  </p>
                  <p>
                    <strong className="text-ink">Mitigación:</strong> {asp.mitigationMeasure}
                  </p>
                  <p className="text-[11px] text-ink-faint">
                    Norma: {asp.normRef} | Resp: {asp.responsible}
                  </p>
                </div>

                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => updateAspects(aspects.filter((a) => a.id !== asp.id))}
                    className="absolute top-3 right-3 text-ink-faint hover:text-rose-500 transition-colors p-1"
                    title="Eliminar aspecto"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Manifiestos RASDA */}
      {activeTab === 'manifests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-ink flex items-center gap-2">
              <Truck size={16} className="text-brand-500" />
              Manifiestos de Trazabilidad de Desechos Peligrosos (RASDA)
            </h4>
            {!isReadOnly && (
              <button
                type="button"
                onClick={handleAddManifest}
                className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                Emitir Manifiesto RASDA
              </button>
            )}
          </div>

          <div className="space-y-3">
            {manifests.map((man) => (
              <div
                key={man.id}
                className="p-4 bg-surface border border-line rounded-xl flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-ink">{man.manifestNumber}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-surface-2 font-bold text-ink-soft">
                      {man.wasteType}
                    </span>
                  </div>
                  <p className="text-xs text-ink-soft">
                    Volumen: <strong className="text-ink">{man.volumeAmount} {man.unit}</strong> | Transportista: {man.transporterName} ({man.rasdaTransporter})
                  </p>
                  <p className="text-[11px] text-ink-faint">
                    Sitio Disposición: {man.disposalSite} | Certificado: {man.disposalCertificateNo}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                      man.status === 'Dispuesto y Certificado'
                        ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                    }`}
                  >
                    {man.status}
                  </span>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => updateManifests(manifests.filter((m) => m.id !== man.id))}
                      className="text-ink-faint hover:text-rose-500 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Notes */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-ink block">
          Observaciones y Dictamen Ambiental del Inspector:
        </label>
        <textarea
          rows={3}
          value={data?.summaryNotes || ''}
          onChange={(e) =>
            onChange({
              aspects,
              manifests,
              summaryNotes: e.target.value,
            })
          }
          disabled={isReadOnly}
          placeholder="Ingrese observaciones normativas adicionales, hallazgos de auditoría ambiental PDVSA MA-01..."
          className="w-full p-3 bg-surface border border-line rounded-xl text-xs text-ink focus:ring-2 focus:ring-brand-500 outline-none"
        />
      </div>
    </div>
  );
}
