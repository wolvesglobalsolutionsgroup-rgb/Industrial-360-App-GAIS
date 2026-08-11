import React, { useState } from 'react';
import {
  ShieldAlert,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Users,
  MapPin,
  FileCheck,
  Building2,
  Sparkles,
  Eye,
  RefreshCw,
  HardHat,
} from 'lucide-react';
import { WorkflowComponentProps } from '../../../lib/workflows/contracts';
import {
  ArtApprovalData,
  ArtPasoItem,
  HazardCategory,
  HazardCategoryCatalog,
  ProbabilidadRiesgo,
  SeveridadRiesgo,
  WorkerDisclosure,
  calculateRiskLevel,
} from '../types';

export const ArtCapture: React.FC<WorkflowComponentProps<ArtApprovalData>> = ({
  data,
  onChange,
  isReadOnly = false,
  errors = [],
}) => {
  const [activeTab, setActiveTab] = useState<'HEADER' | 'PASOS' | 'SIGNATURES' | 'PREVIEW'>('HEADER');

  const numeroArt = data?.numeroArt || 'ART-2026-001';
  const tituloTrabajo = data?.tituloTrabajo || '';
  const instalacionArea = data?.instalacionArea || '';
  const empresa = data?.empresa || 'CONTRATISTA';
  const contratoNumero = data?.contratoNumero || '';
  const ordenSapNumero = data?.ordenSapNumero || '';
  const fechaElaboracion = data?.fechaElaboracion || new Date().toISOString().split('T')[0];
  const hojaNumero = data?.hojaNumero || '1 de 1';
  const procedimientoRelacionado = data?.procedimientoRelacionado || '';
  const siteVerified = data?.siteVerified || false;
  const siteVerificationLocation = data?.siteVerificationLocation || '';

  const pasos: ArtPasoItem[] = data?.pasos || [];
  const workersAssignedCount = data?.workersAssignedCount || 0;
  const divulgacionTrabajadores: WorkerDisclosure[] = data?.divulgacionTrabajadores || [];

  const aprobadorEmisor = data?.aprobadorEmisor || { nombre: '', ci: '', cargo: '', firma: '' };
  const aprobadorReceptor = data?.aprobadorReceptor || { nombre: '', ci: '', cargo: '', firma: '' };
  const aprobadorEjecutor = data?.aprobadorEjecutor || { nombre: '', ci: '', cargo: '', firma: '' };

  const conditionsChanged = data?.conditionsChanged || false;
  const changeReason = data?.changeReason || '';
  const linkedPtwNumber = data?.linkedPtwNumber || '';

  const updateData = (partial: Partial<ArtApprovalData>) => {
    onChange({
      numeroArt,
      tituloTrabajo,
      instalacionArea,
      empresa,
      contratoNumero,
      ordenSapNumero,
      fechaElaboracion,
      hojaNumero,
      procedimientoRelacionado,
      siteVerified,
      siteVerificationLocation,
      pasos,
      elaboradores: data?.elaboradores || [],
      aprobadorEmisor,
      aprobadorReceptor,
      aprobadorEjecutor,
      workersAssignedCount,
      divulgacionTrabajadores,
      conditionsChanged,
      changeReason,
      linkedPtwNumber,
      currentState: data?.currentState || 'DRAFT',
      ...partial,
    });
  };

  // Handler to add a new step
  const handleAddPaso = () => {
    const newPasoNumber = pasos.length + 1;
    const newPaso: ArtPasoItem = {
      pasoNumero: newPasoNumber,
      pasoDescripcion: '',
      peligrosIdentificados: [{ categoria: 'MECANICO', descripcion: '' }],
      evaluacionProbabilidad: 'MEDIA',
      evaluacionSeveridad: 'CRITICA',
      nivelRiesgoCalculado: 'ALTO',
      medidasPreventivas: '',
      responsableEjecucionControl: '',
    };
    updateData({ pasos: [...pasos, newPaso] });
  };

  const handleUpdatePaso = (index: number, partialPaso: Partial<ArtPasoItem>) => {
    const updatedPasos = pasos.map((p, i) => {
      if (i !== index) return p;
      const updated = { ...p, ...partialPaso };
      if (updated.evaluacionProbabilidad && updated.evaluacionSeveridad) {
        updated.nivelRiesgoCalculado = calculateRiskLevel(
          updated.evaluacionProbabilidad,
          updated.evaluacionSeveridad
        );
      }
      return updated;
    });
    updateData({ pasos: updatedPasos });
  };

  const handleDeletePaso = (index: number) => {
    const filtered = pasos.filter((_, i) => i !== index).map((p, idx) => ({ ...p, pasoNumero: idx + 1 }));
    updateData({ pasos: filtered });
  };

  const handleAddWorker = () => {
    const newWorker: WorkerDisclosure = {
      nombre: '',
      ci: '',
      cargo: 'OP. CAMPO',
      firma: 'FIRMA_DIGITAL',
      fecha: new Date().toISOString().split('T')[0],
    };
    updateData({
      divulgacionTrabajadores: [...divulgacionTrabajadores, newWorker],
      workersAssignedCount: Math.max(workersAssignedCount, divulgacionTrabajadores.length + 1),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold">
                  PDVSA IR-S-17
                </span>
                <span className="text-xs font-mono text-slate-500">
                  {numeroArt}
                </span>
              </div>
              <h2 className="text-lg font-bold text-ink dark:text-slate-100 mt-0.5">
                Análisis de Riesgos del Trabajo (ART)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('HEADER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'HEADER'
                  ? 'bg-brand-500 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              1. Encabezado
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PASOS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'PASOS'
                  ? 'bg-brand-500 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              2. Pasos y Peligros ({pasos.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('SIGNATURES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'SIGNATURES'
                  ? 'bg-brand-500 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              3. Firmas y Divulgación
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PREVIEW')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'PREVIEW'
                  ? 'bg-brand-500 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5 inline mr-1" />
              Vista Previa IR-S-17
            </button>
          </div>
        </div>

        {/* Condition Changed Warning */}
        {conditionsChanged && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between text-xs text-amber-700 dark:text-amber-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>
                <strong>ALERTA DE RE-EVALUACIÓN (IR-S-17 §8.1):</strong> Se registraron cambios de condiciones. El ART pasa a REVISION_REQUIRED y suspende la vigencia del PTW.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Errors display */}
      {errors.length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-1">
          {errors.map((err, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      {/* TAB 1: HEADER & SITE VERIFICATION */}
      {activeTab === 'HEADER' && (
        <div className="bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-5">
          <h3 className="text-sm font-bold text-ink dark:text-slate-100 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">
            1. Datos del Encabezado y Verificación en Sitio (IR-S-17 §5.2)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-500 mb-1 font-medium">Número ART *</label>
              <input
                type="text"
                disabled={isReadOnly}
                value={numeroArt}
                onChange={(e) => updateData({ numeroArt: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-surface dark:bg-slate-900 text-ink dark:text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1 font-medium">Título de la Tarea / Trabajo *</label>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="ej. Mantenimiento Preventivo a Válvula de Alivio PSV-101"
                value={tituloTrabajo}
                onChange={(e) => updateData({ tituloTrabajo: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1 font-medium">Instalación / Área / Unidad *</label>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="ej. Planta Compresora San Joaquín - Tren A"
                value={instalacionArea}
                onChange={(e) => updateData({ instalacionArea: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1 font-medium">Empresa Ejecutora *</label>
              <select
                disabled={isReadOnly}
                value={empresa}
                onChange={(e) => updateData({ empresa: e.target.value as any })}
                className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
              >
                <option value="CONTRATISTA">CONTRATISTA</option>
                <option value="PDVSA">PDVSA PROPIA</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1 font-medium">Número de Contrato</label>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="ej. CTR-2025-4491"
                value={contratoNumero}
                onChange={(e) => updateData({ contratoNumero: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-surface dark:bg-slate-900 text-ink dark:text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1 font-medium">Orden SAP N°</label>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="ej. 40001892"
                value={ordenSapNumero}
                onChange={(e) => updateData({ ordenSapNumero: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-surface dark:bg-slate-900 text-ink dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1 font-medium">Fecha de Elaboración *</label>
              <input
                type="date"
                disabled={isReadOnly}
                value={fechaElaboracion}
                onChange={(e) => updateData({ fechaElaboracion: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1 font-medium">Hoja N°</label>
              <input
                type="text"
                disabled={isReadOnly}
                value={hojaNumero}
                onChange={(e) => updateData({ hojaNumero: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-surface dark:bg-slate-900 text-ink dark:text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1 font-medium">Procedimiento SI-S-20 Ref. (WF-046)</label>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="ej. PROC-SI-S-20-0012"
                value={procedimientoRelacionado}
                onChange={(e) => updateData({ procedimientoRelacionado: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-surface dark:bg-slate-900 text-ink dark:text-slate-100 font-mono"
              />
            </div>
          </div>

          {/* Site Verification Box (RULE-HARD-01) */}
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-300">
                  Verificación de Inspección en Sitio (RULE-HARD-01 / IR-S-17 §5.2)
                </h4>
              </div>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-emerald-800 dark:text-emerald-300">
                <input
                  type="checkbox"
                  disabled={isReadOnly}
                  checked={siteVerified}
                  onChange={(e) => updateData({ siteVerified: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                Elaborado e Inspeccionado en Sitio
              </label>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              La norma exigir que el equipo técnico inspeccione físicamente el área para verificar condiciones atmosféricas, accesos, fuentes energizadas e interferencias antes de redactar los pasos.
            </p>
            {siteVerified && (
              <div>
                <label className="block text-slate-500 mb-1 font-medium text-xs">Ubicación GPS / Punto de Inspección:</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  placeholder="ej. Lat 9.6812, Lon -64.3411 (Coordenadas verificadas en campo)"
                  value={siteVerificationLocation}
                  onChange={(e) => updateData({ siteVerificationLocation: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-surface dark:bg-slate-900 text-ink dark:text-slate-100 text-xs font-mono"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PASOS, PELIGROS Y CONTROLES */}
      {activeTab === 'PASOS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-ink dark:text-slate-100 uppercase tracking-wider">
              2. Desglose Secuencial de Pasos, Peligros (Anexo B) y Matriz de Riesgo 3x3
            </h3>
            {!isReadOnly && (
              <button
                type="button"
                onClick={handleAddPaso}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium text-xs shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Agregar Paso de Trabajo
              </button>
            )}
          </div>

          {pasos.length === 0 ? (
            <div className="text-center py-8 bg-surface dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-6">
              <HardHat className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-ink dark:text-slate-200">No hay pasos registrados en el ART</p>
              <p className="text-xs text-slate-500 mt-1">Haga clic en "Agregar Paso de Trabajo" para desglosar la secuencia de tareas.</p>
            </div>
          ) : (
            pasos.map((paso, idx) => {
              const currentRisk = paso.nivelRiesgoCalculado || 'MEDIO';

              return (
                <div
                  key={idx}
                  className="bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4 shadow-sm"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-sm text-brand-500 font-mono">
                      PASO {paso.pasoNumero} DE {pasos.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-bold rounded ${
                          currentRisk === 'ALTO'
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                            : currentRisk === 'MEDIO'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        RIESGO {currentRisk}
                      </span>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => handleDeletePaso(idx)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                    <div className="md:col-span-12">
                      <label className="block text-slate-500 mb-1 font-medium">Descripción de la Tarea / Paso *</label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="ej. Posicionamiento del camión grúa e instalación de estabilizadores en terreno compacto"
                        value={paso.pasoDescripcion}
                        onChange={(e) => handleUpdatePaso(idx, { pasoDescripcion: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                      />
                    </div>

                    {/* Peligros Sub-section */}
                    <div className="md:col-span-12 space-y-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
                          Peligros / Riesgos (Catálogo Anexo B IR-S-17)
                        </span>
                      </div>

                      {paso.peligrosIdentificados.map((p, pIdx) => (
                        <div key={pIdx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                          <div className="md:col-span-4">
                            <select
                              disabled={isReadOnly}
                              value={p.categoria}
                              onChange={(e) => {
                                const newCat = e.target.value as HazardCategory;
                                const updatedPeligros = [...paso.peligrosIdentificados];
                                updatedPeligros[pIdx] = { ...updatedPeligros[pIdx], categoria: newCat };
                                handleUpdatePaso(idx, { peligrosIdentificados: updatedPeligros });
                              }}
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100 text-xs font-mono"
                            >
                              {HazardCategoryCatalog.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.code} — {cat.title}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="md:col-span-7">
                            <input
                              type="text"
                              disabled={isReadOnly}
                              placeholder="Descripción específica del peligro en este paso"
                              value={p.descripcion}
                              onChange={(e) => {
                                const updatedPeligros = [...paso.peligrosIdentificados];
                                updatedPeligros[pIdx] = { ...updatedPeligros[pIdx], descripcion: e.target.value };
                                handleUpdatePaso(idx, { peligrosIdentificados: updatedPeligros });
                              }}
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100 text-xs"
                            />
                          </div>
                          <div className="md:col-span-1 text-center">
                            {!isReadOnly && paso.peligrosIdentificados.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedPeligros = paso.peligrosIdentificados.filter((_, i) => i !== pIdx);
                                  handleUpdatePaso(idx, { peligrosIdentificados: updatedPeligros });
                                }}
                                className="text-slate-400 hover:text-red-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => {
                            const updatedPeligros = [...paso.peligrosIdentificados, { categoria: 'LOCATIVO' as HazardCategory, descripcion: '' }];
                            handleUpdatePaso(idx, { peligrosIdentificados: updatedPeligros });
                          }}
                          className="text-xs text-brand-500 hover:underline font-medium inline-flex items-center gap-1 mt-1"
                        >
                          <Plus className="w-3 h-3" /> Agregar otro peligro a este paso
                        </button>
                      )}
                    </div>

                    {/* Risk Evaluation 3x3 */}
                    <div className="md:col-span-3">
                      <label className="block text-slate-500 mb-1 font-medium">Probabilidad (P)</label>
                      <select
                        disabled={isReadOnly}
                        value={paso.evaluacionProbabilidad || 'MEDIA'}
                        onChange={(e) => handleUpdatePaso(idx, { evaluacionProbabilidad: e.target.value as ProbabilidadRiesgo })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                      >
                        <option value="BAJA">BAJA</option>
                        <option value="MEDIA">MEDIA</option>
                        <option value="ALTA">ALTA</option>
                      </select>
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-slate-500 mb-1 font-medium">Severidad (S)</label>
                      <select
                        disabled={isReadOnly}
                        value={paso.evaluacionSeveridad || 'CRITICA'}
                        onChange={(e) => handleUpdatePaso(idx, { evaluacionSeveridad: e.target.value as SeveridadRiesgo })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                      >
                        <option value="MENOR">MENOR</option>
                        <option value="CRITICA">CRÍTICA</option>
                        <option value="CATASTROFICA">CATASTRÓFICA</option>
                      </select>
                    </div>

                    <div className="md:col-span-6">
                      <label className="block text-slate-500 mb-1 font-medium">Responsable del Control *</label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="ej. Supervisor de Izaje / Ing. SIHOA"
                        value={paso.responsableEjecucionControl}
                        onChange={(e) => handleUpdatePaso(idx, { responsableEjecucionControl: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                      />
                    </div>

                    <div className="md:col-span-12">
                      <label className="block text-slate-500 mb-1 font-medium">Medidas Preventivas y de Control *</label>
                      <textarea
                        rows={2}
                        disabled={isReadOnly}
                        placeholder="Especificar controles en la fuente, medio y receptor (ej. Delimitación de área 10m, uso de arnés con doble cabo, presencia de paletero)"
                        value={paso.medidasPreventivas}
                        onChange={(e) => handleUpdatePaso(idx, { medidasPreventivas: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: SIGNATURES AND DISCLOSURE */}
      {activeTab === 'SIGNATURES' && (
        <div className="space-y-6">
          {/* Tripartite Signatures Section (RULE-HARD-03) */}
          <div className="bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-ink dark:text-slate-100 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">
              3. Firmas Tripartitas de Aprobación (RULE-HARD-03 / Anexo A IR-S-17)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Emisor Custodio */}
              <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 bg-slate-50/50 dark:bg-slate-800/30">
                <span className="font-bold text-xs text-brand-500 block">EMISOR CUSTODIO PDVSA</span>
                <div>
                  <label className="block text-slate-500 mb-0.5">Nombre y Apellido *</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={aprobadorEmisor.nombre}
                    onChange={(e) => updateData({ aprobadorEmisor: { ...aprobadorEmisor, nombre: e.target.value, firma: 'FIRMA_DIGITAL' } })}
                    className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-0.5">C.I. *</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={aprobadorEmisor.ci}
                    onChange={(e) => updateData({ aprobadorEmisor: { ...aprobadorEmisor, ci: e.target.value } })}
                    className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-0.5">Cargo *</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={aprobadorEmisor.cargo}
                    onChange={(e) => updateData({ aprobadorEmisor: { ...aprobadorEmisor, cargo: e.target.value } })}
                    className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Receptor */}
              <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 bg-slate-50/50 dark:bg-slate-800/30">
                <span className="font-bold text-xs text-brand-500 block">RECEPTOR / MANTENIMIENTO</span>
                <div>
                  <label className="block text-slate-500 mb-0.5">Nombre y Apellido *</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={aprobadorReceptor.nombre}
                    onChange={(e) => updateData({ aprobadorReceptor: { ...aprobadorReceptor, nombre: e.target.value, firma: 'FIRMA_DIGITAL' } })}
                    className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-0.5">C.I. *</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={aprobadorReceptor.ci}
                    onChange={(e) => updateData({ aprobadorReceptor: { ...aprobadorReceptor, ci: e.target.value } })}
                    className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-0.5">Cargo *</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={aprobadorReceptor.cargo}
                    onChange={(e) => updateData({ aprobadorReceptor: { ...aprobadorReceptor, cargo: e.target.value } })}
                    className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Ejecutor */}
              <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 bg-slate-50/50 dark:bg-slate-800/30">
                <span className="font-bold text-xs text-brand-500 block">EJECUTOR / CONTRATISTA</span>
                <div>
                  <label className="block text-slate-500 mb-0.5">Nombre y Apellido *</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={aprobadorEjecutor.nombre}
                    onChange={(e) => updateData({ aprobadorEjecutor: { ...aprobadorEjecutor, nombre: e.target.value, firma: 'FIRMA_DIGITAL' } })}
                    className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-0.5">C.I. *</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={aprobadorEjecutor.ci}
                    onChange={(e) => updateData({ aprobadorEjecutor: { ...aprobadorEjecutor, ci: e.target.value } })}
                    className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-0.5">Cargo *</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={aprobadorEjecutor.cargo}
                    onChange={(e) => updateData({ aprobadorEjecutor: { ...aprobadorEjecutor, cargo: e.target.value } })}
                    className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Worker Disclosure Table (RULE-HARD-02) */}
          <div className="bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
              <div>
                <h3 className="text-sm font-bold text-ink dark:text-slate-100 uppercase tracking-wider">
                  Registro de Divulgación a Trabajadores (RULE-HARD-02 / IR-S-17 §5.3)
                </h3>
                <p className="text-xs text-slate-500">
                  Firmas obligatorias del personal de campo antes de iniciar operaciones.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Asignados: <strong className="font-mono">{workersAssignedCount}</strong> | Firmados:{' '}
                  <strong className="font-mono">{divulgacionTrabajadores.length}</strong>
                </div>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={handleAddWorker}
                    className="px-2.5 py-1 bg-brand-500 hover:bg-brand-600 text-white rounded text-xs font-medium inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Trabajador
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-2">#</th>
                    <th className="p-2">Nombre y Apellido</th>
                    <th className="p-2">C.I.</th>
                    <th className="p-2">Cargo / Especialidad</th>
                    <th className="p-2">Fecha Divulgación</th>
                    <th className="p-2 text-center">Estado Firma</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {divulgacionTrabajadores.map((w, wIdx) => (
                    <tr key={wIdx}>
                      <td className="p-2 font-mono">{wIdx + 1}</td>
                      <td className="p-2">
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={w.nombre}
                          onChange={(e) => {
                            const copy = [...divulgacionTrabajadores];
                            copy[wIdx].nombre = e.target.value;
                            updateData({ divulgacionTrabajadores: copy });
                          }}
                          placeholder="Nombre del trabajador"
                          className="w-full px-2 py-0.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={w.ci}
                          onChange={(e) => {
                            const copy = [...divulgacionTrabajadores];
                            copy[wIdx].ci = e.target.value;
                            updateData({ divulgacionTrabajadores: copy });
                          }}
                          placeholder="C.I."
                          className="w-full px-2 py-0.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100 font-mono"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={w.cargo}
                          onChange={(e) => {
                            const copy = [...divulgacionTrabajadores];
                            copy[wIdx].cargo = e.target.value;
                            updateData({ divulgacionTrabajadores: copy });
                          }}
                          className="w-full px-2 py-0.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="date"
                          disabled={isReadOnly}
                          value={w.fecha}
                          onChange={(e) => {
                            const copy = [...divulgacionTrabajadores];
                            copy[wIdx].fecha = e.target.value;
                            updateData({ divulgacionTrabajadores: copy });
                          }}
                          className="w-full px-2 py-0.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                        />
                      </td>
                      <td className="p-2 text-center font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4 inline mr-1" />
                        FIRMADO
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Condition Changed Toggle (RULE-HARD-04) */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs space-y-2">
            <label className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300 cursor-pointer">
              <input
                type="checkbox"
                disabled={isReadOnly}
                checked={conditionsChanged}
                onChange={(e) => updateData({ conditionsChanged: e.target.checked })}
                className="w-4 h-4 text-amber-600 rounded border-amber-400 focus:ring-amber-500"
              />
              Registrar Cambio de Condiciones en Campo (RULE-HARD-04 / IR-S-17 §8.1)
            </label>
            {conditionsChanged && (
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">Causa del Cambio / Motivo de Re-evaluación:</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  placeholder="ej. Inicio de lluvia torrencial / cambio de grúa / ingreso de nuevo personal"
                  value={changeReason}
                  onChange={(e) => updateData({ changeReason: e.target.value })}
                  className="w-full px-3 py-1.5 border border-amber-300 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PREVIEW (WYSIWYG Anexo A IR-S-17) */}
      {activeTab === 'PREVIEW' && (
        <div className="bg-white text-slate-900 rounded-xl p-8 border border-slate-300 shadow-md max-w-4xl mx-auto text-xs font-sans space-y-6">
          {/* Header Bar with Logos */}
          <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4">
            <div>
              <span className="font-bold text-base text-red-700 block">PDVSA</span>
              <span className="text-[10px] text-slate-600 block uppercase">Manual de Ingeniería de Riesgos (IR-S-17)</span>
            </div>
            <div className="text-center">
              <h1 className="font-bold text-sm tracking-wider uppercase">ANÁLISIS DE RIESGOS DEL TRABAJO (ART)</h1>
              <span className="text-[11px] font-mono text-slate-700">Formato Normativo Anexo A</span>
            </div>
            <div className="text-right font-mono text-[11px]">
              <div><strong>ART N°:</strong> {numeroArt}</div>
              <div><strong>HOJA:</strong> {hojaNumero}</div>
            </div>
          </div>

          {/* General Metadata Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px] border p-3 rounded bg-slate-50">
            <div><strong>Trabajo / Tarea:</strong> {tituloTrabajo || 'N/A'}</div>
            <div><strong>Instalación / Area:</strong> {instalacionArea || 'N/A'}</div>
            <div><strong>Empresa:</strong> {empresa} {contratoNumero ? `(${contratoNumero})` : ''}</div>
            <div><strong>Fecha:</strong> {fechaElaboracion}</div>
            <div><strong>Elaborado en Sitio (§5.2):</strong> {siteVerified ? 'SÍ (CONFORME)' : 'NO'}</div>
            <div><strong>Procedimiento SI-S-20:</strong> {procedimientoRelacionado || 'N/A'}</div>
          </div>

          {/* Main 3-Column Steps Table */}
          <div>
            <h4 className="font-bold text-xs uppercase mb-2 border-b border-slate-400 pb-1">
              Desglose de Pasos, Peligros y Medidas de Control
            </h4>
            <table className="w-full border-collapse border border-slate-400 text-[10px]">
              <thead>
                <tr className="bg-slate-200 text-slate-900 border-b border-slate-400">
                  <th className="border border-slate-400 p-1.5 w-8">N°</th>
                  <th className="border border-slate-400 p-1.5 w-1/3">Secuencia de Pasos del Trabajo</th>
                  <th className="border border-slate-400 p-1.5 w-1/3">Peligros o Riesgos Identificados</th>
                  <th className="border border-slate-400 p-1.5">Medidas Preventivas / Controles</th>
                </tr>
              </thead>
              <tbody>
                {pasos.map((paso) => (
                  <tr key={paso.pasoNumero} className="border-b border-slate-300">
                    <td className="border border-slate-400 p-1.5 font-bold text-center">{paso.pasoNumero}</td>
                    <td className="border border-slate-400 p-1.5 font-medium">{paso.pasoDescripcion}</td>
                    <td className="border border-slate-400 p-1.5">
                      {paso.peligrosIdentificados.map((p, idx) => (
                        <div key={idx} className="mb-0.5">
                          <strong className="text-red-800">[{p.categoria}]:</strong> {p.descripcion}
                        </div>
                      ))}
                    </td>
                    <td className="border border-slate-400 p-1.5">
                      <div>{paso.medidasPreventivas}</div>
                      <div className="text-[9px] text-slate-600 mt-1">
                        <strong>Resp:</strong> {paso.responsableEjecucionControl}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signatures Block */}
          <div>
            <h4 className="font-bold text-xs uppercase mb-2 border-b border-slate-400 pb-1">
              Aprobaciones Tripartitas
            </h4>
            <div className="grid grid-cols-3 gap-3 text-[10px] text-center">
              <div className="border border-slate-300 p-2 rounded">
                <div className="font-bold text-slate-800">EMISOR CUSTODIO</div>
                <div className="my-3 font-mono text-slate-500 text-[9px]">{aprobadorEmisor.firma || '[SIN FIRMA]'}</div>
                <div>{aprobadorEmisor.nombre || 'N/A'}</div>
                <div className="text-slate-500">{aprobadorEmisor.cargo}</div>
              </div>
              <div className="border border-slate-300 p-2 rounded">
                <div className="font-bold text-slate-800">RECEPTOR / MANTENIMIENTO</div>
                <div className="my-3 font-mono text-slate-500 text-[9px]">{aprobadorReceptor.firma || '[SIN FIRMA]'}</div>
                <div>{aprobadorReceptor.nombre || 'N/A'}</div>
                <div className="text-slate-500">{aprobadorReceptor.cargo}</div>
              </div>
              <div className="border border-slate-300 p-2 rounded">
                <div className="font-bold text-slate-800">EJECUTOR / CONTRATISTA</div>
                <div className="my-3 font-mono text-slate-500 text-[9px]">{aprobadorEjecutor.firma || '[SIN FIRMA]'}</div>
                <div>{aprobadorEjecutor.nombre || 'N/A'}</div>
                <div className="text-slate-500">{aprobadorEjecutor.cargo}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
