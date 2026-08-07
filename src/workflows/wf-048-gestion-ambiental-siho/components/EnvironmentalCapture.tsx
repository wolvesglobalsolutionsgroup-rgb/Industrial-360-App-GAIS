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

  const aspects = data?.aspects ?? [];
  const manifests = data?.manifests ?? [];

  const updateAspects = (newAspects: EnvironmentalAspect[]) => {
    onChange({ aspects: newAspects, manifests, summaryNotes: data?.summaryNotes || '' });
  };

  const updateManifests = (newManifests: RasdaManifest[]) => {
    onChange({ aspects, manifests: newManifests, summaryNotes: data?.summaryNotes || '' });
  };

  const handleAddAspect = () => {
    const newAspect: EnvironmentalAspect = {
      id: `pga_${Date.now()}`,
      activity: '',
      aspect: '',
      environmentalImpact: '',
      significance: 'Medio',
      mitigationMeasure: '',
      normRef: 'PDVSA MA-01-02-12',
      responsible: context.user.email,
      status: 'Pendiente',
    };
    updateAspects([...aspects, newAspect]);
  };

  const handleAddManifest = () => {
    const newMan: RasdaManifest = {
      id: `rasda_${Date.now()}`,
      manifestNumber: '',
      wasteType: 'Aceite Usado',
      volumeAmount: 0,
      unit: 'Litros',
      rasdaGenerator: '',
      transporterName: '',
      rasdaTransporter: '',
      disposalSite: '',
      disposalCertificateNo: '',
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

          {aspects.length === 0 ? (
            <div className="p-8 text-center bg-surface border border-dashed border-line rounded-xl space-y-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-full w-fit mx-auto">
                <Trees size={32} />
              </div>
              <h4 className="font-bold text-ink text-sm">Sin aspectos ambientales registrados</h4>
              <p className="text-xs text-ink-soft max-w-md mx-auto">
                No se han ingresado aspectos ni impactos ambientales para la matriz PGA de este proyecto.
              </p>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleAddAspect}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus size={15} />
                  Crear registro de Aspecto PGA
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aspects.map((asp, idx) => (
                <div
                  key={asp.id}
                  className="p-4 bg-surface border border-line rounded-xl space-y-3 relative group"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
                    <span className="text-xs font-bold text-brand-500">
                      #{idx + 1} - {asp.activity || 'Nueva Actividad'}
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

                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-ink-faint">Actividad Operativa:</label>
                        <input
                          type="text"
                          value={asp.activity}
                          disabled={isReadOnly}
                          onChange={(e) => {
                            const updated = [...aspects];
                            updated[idx].activity = e.target.value;
                            updateAspects(updated);
                          }}
                          placeholder="Ej: Limpieza de Trampas de Grasa"
                          className="w-full p-1.5 bg-surface-2 border border-line rounded text-xs text-ink"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-ink-faint">Aspecto Ambiental:</label>
                        <input
                          type="text"
                          value={asp.aspect}
                          disabled={isReadOnly}
                          onChange={(e) => {
                            const updated = [...aspects];
                            updated[idx].aspect = e.target.value;
                            updateAspects(updated);
                          }}
                          placeholder="Ej: Generación de lodos"
                          className="w-full p-1.5 bg-surface-2 border border-line rounded text-xs text-ink"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-ink-faint">Impacto Ambiental:</label>
                        <input
                          type="text"
                          value={asp.environmentalImpact}
                          disabled={isReadOnly}
                          onChange={(e) => {
                            const updated = [...aspects];
                            updated[idx].environmentalImpact = e.target.value;
                            updateAspects(updated);
                          }}
                          placeholder="Ej: Riesgo de infiltración"
                          className="w-full p-1.5 bg-surface-2 border border-line rounded text-xs text-ink"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-ink-faint">Medida de Mitigación:</label>
                        <input
                          type="text"
                          value={asp.mitigationMeasure}
                          disabled={isReadOnly}
                          onChange={(e) => {
                            const updated = [...aspects];
                            updated[idx].mitigationMeasure = e.target.value;
                            updateAspects(updated);
                          }}
                          placeholder="Ej: Extracción con camión vacum"
                          className="w-full p-1.5 bg-surface-2 border border-line rounded text-xs text-ink"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-ink-faint">Significancia:</label>
                        <select
                          value={asp.significance}
                          disabled={isReadOnly}
                          onChange={(e) => {
                            const updated = [...aspects];
                            updated[idx].significance = e.target.value as 'Alto' | 'Medio' | 'Bajo';
                            updateAspects(updated);
                          }}
                          className="w-full p-1.5 bg-surface-2 border border-line rounded text-xs text-ink"
                        >
                          <option value="Alto">Alto</option>
                          <option value="Medio">Medio</option>
                          <option value="Bajo">Bajo</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-ink-faint">Norma Ref:</label>
                        <input
                          type="text"
                          value={asp.normRef}
                          disabled={isReadOnly}
                          onChange={(e) => {
                            const updated = [...aspects];
                            updated[idx].normRef = e.target.value;
                            updateAspects(updated);
                          }}
                          className="w-full p-1.5 bg-surface-2 border border-line rounded text-xs text-ink"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-ink-faint">Estado:</label>
                        <select
                          value={asp.status}
                          disabled={isReadOnly}
                          onChange={(e) => {
                            const updated = [...aspects];
                            updated[idx].status = e.target.value as 'Implementado' | 'En Proceso' | 'Pendiente';
                            updateAspects(updated);
                          }}
                          className="w-full p-1.5 bg-surface-2 border border-line rounded text-xs text-ink"
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="En Proceso">En Proceso</option>
                          <option value="Implementado">Implementado</option>
                        </select>
                      </div>
                    </div>
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
          )}
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

          {manifests.length === 0 ? (
            <div className="p-8 text-center bg-surface border border-dashed border-line rounded-xl space-y-3">
              <div className="p-3 bg-brand-500/10 text-brand-500 rounded-full w-fit mx-auto">
                <Truck size={32} />
              </div>
              <h4 className="font-bold text-ink text-sm">Sin manifiestos RASDA registrados</h4>
              <p className="text-xs text-ink-soft max-w-md mx-auto">
                No se han registrado manifiestos de transporte y disposición de desechos peligrosos bajo RASDA.
              </p>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleAddManifest}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus size={15} />
                  Emitir Manifiesto RASDA
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {manifests.map((man, idx) => (
                <div
                  key={man.id}
                  className="p-4 bg-surface border border-line rounded-xl space-y-3 relative"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
                    <div>
                      <label className="text-[10px] font-bold text-ink-faint">Nº Manifiesto:</label>
                      <input
                        type="text"
                        value={man.manifestNumber}
                        disabled={isReadOnly}
                        onChange={(e) => {
                          const updated = [...manifests];
                          updated[idx].manifestNumber = e.target.value;
                          updateManifests(updated);
                        }}
                        placeholder="RASDA-2026-XXXX"
                        className="w-full p-1.5 bg-surface-2 border border-line rounded text-xs text-ink font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-ink-faint">Tipo Desecho:</label>
                      <select
                        value={man.wasteType}
                        disabled={isReadOnly}
                        onChange={(e) => {
                          const updated = [...manifests];
                          updated[idx].wasteType = e.target.value as any;
                          updateManifests(updated);
                        }}
                        className="w-full p-1.5 bg-surface-2 border border-line rounded text-xs text-ink"
                      >
                        <option value="Aceite Usado">Aceite Usado</option>
                        <option value="Lodos de Perforación / Trampa">Lodos de Perforación / Trampa</option>
                        <option value="Aguas de Producción">Aguas de Producción</option>
                        <option value="Trapos/Filtros Impregnados">Trapos/Filtros Impregnados</option>
                        <option value="Desechos Sólidos Industriales">Desechos Sólidos Industriales</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-ink-faint">Volumen / Cantidad:</label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          value={man.volumeAmount || ''}
                          disabled={isReadOnly}
                          onChange={(e) => {
                            const updated = [...manifests];
                            updated[idx].volumeAmount = Number(e.target.value);
                            updateManifests(updated);
                          }}
                          className="w-2/3 p-1.5 bg-surface-2 border border-line rounded text-xs text-ink font-bold"
                        />
                        <select
                          value={man.unit}
                          disabled={isReadOnly}
                          onChange={(e) => {
                            const updated = [...manifests];
                            updated[idx].unit = e.target.value as any;
                            updateManifests(updated);
                          }}
                          className="w-1/3 p-1.5 bg-surface-2 border border-line rounded text-xs text-ink"
                        >
                          <option value="Litros">Litros</option>
                          <option value="m³">m³</option>
                          <option value="Tambores (208L)">Tambores (208L)</option>
                          <option value="Kg">Kg</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-ink-faint">Transportista:</label>
                      <input
                        type="text"
                        value={man.transporterName}
                        disabled={isReadOnly}
                        onChange={(e) => {
                          const updated = [...manifests];
                          updated[idx].transporterName = e.target.value;
                          updateManifests(updated);
                        }}
                        placeholder="Empresa Transportista"
                        className="w-full p-1.5 bg-surface-2 border border-line rounded text-xs text-ink"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-ink-faint">Sitio Disposición:</label>
                      <input
                        type="text"
                        value={man.disposalSite}
                        disabled={isReadOnly}
                        onChange={(e) => {
                          const updated = [...manifests];
                          updated[idx].disposalSite = e.target.value;
                          updateManifests(updated);
                        }}
                        placeholder="Sitio Certificado RASDA"
                        className="w-full p-1.5 bg-surface-2 border border-line rounded text-xs text-ink"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-ink-faint">Estado Manifiesto:</label>
                      <select
                        value={man.status}
                        disabled={isReadOnly}
                        onChange={(e) => {
                          const updated = [...manifests];
                          updated[idx].status = e.target.value as any;
                          updateManifests(updated);
                        }}
                        className="w-full p-1.5 bg-surface-2 border border-line rounded text-xs text-ink font-bold"
                      >
                        <option value="Emitido">Emitido</option>
                        <option value="En Tránsito">En Tránsito</option>
                        <option value="Dispuesto y Certificado">Dispuesto y Certificado</option>
                      </select>
                    </div>
                  </div>

                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => updateManifests(manifests.filter((m) => m.id !== man.id))}
                      className="absolute top-3 right-3 text-ink-faint hover:text-rose-500 transition-colors p-1"
                      title="Eliminar manifiesto"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
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
