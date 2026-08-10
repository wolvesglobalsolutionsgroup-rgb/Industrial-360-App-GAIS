import React, { useState } from 'react';
import { WorkflowComponentProps } from '../../../lib/workflows/contracts';
import { PtwApprovalData } from '../types';
import {
  ShieldAlert,
  Flame,
  Gauge,
  Lock,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  FileCheck,
  Building2,
  HardHat,
  AlertTriangle,
  FileSpreadsheet,
  Zap,
  Radio,
  Anchor,
  Sparkles,
  FileText,
  Ban,
  CheckSquare,
  HelpCircle,
} from 'lucide-react';

export const PtwApprovalCapture: React.FC<WorkflowComponentProps<PtwApprovalData>> = ({
  data,
  onChange,
  onTransition,
  currentState,
  isReadOnly,
}) => {
  const [activeTab, setActiveTab] = useState<'eligibility' | 'core' | 'special_anexos' | 'execution' | 'closeout_signatures' | 'audit'>(
    'eligibility'
  );

  // Helper for nested state updates
  const updateContractor = (patch: Partial<PtwApprovalData['contractorEligibility']>) => {
    onChange({ contractorEligibility: { ...data.contractorEligibility, ...patch } });
  };

  const updatePreStart = (patch: Partial<PtwApprovalData['preStartReadiness']>) => {
    onChange({ preStartReadiness: { ...data.preStartReadiness, ...patch } });
  };

  const updateGasTest = (patch: Partial<PtwApprovalData['gasTest']>) => {
    onChange({ gasTest: { ...data.gasTest, ...patch } });
  };

  const updatePrep = (patch: Partial<PtwApprovalData['preparationChecklist']>) => {
    onChange({ preparationChecklist: { ...data.preparationChecklist, ...patch } });
  };

  const updateVerification = (patch: Partial<PtwApprovalData['verificationConditions']>) => {
    onChange({ verificationConditions: { ...data.verificationConditions, ...patch } });
  };

  const updateMoc = (patch: Partial<PtwApprovalData['managementOfChange']>) => {
    onChange({ managementOfChange: { ...data.managementOfChange, ...patch } });
  };

  const updateExtension = (patch: Partial<PtwApprovalData['extension']>) => {
    onChange({ extension: { ...data.extension, ...patch } });
  };

  const updateCloseout = (patch: Partial<PtwApprovalData['closeout']>) => {
    onChange({ closeout: { ...data.closeout, ...patch } });
  };

  const updateSigner = (role: 'emisor' | 'receptor' | 'ejecutor', patch: Partial<PtwApprovalData['signers']['emisor']>) => {
    onChange({
      signers: {
        ...data.signers,
        [role]: { ...data.signers[role], ...patch },
      },
    });
  };

  const isSpecialRequired = (type: string) => {
    return data.preStartReadiness.specialCertificatesRequired.includes(type as any);
  };

  const toggleSpecialAnexo = (type: any) => {
    const current = data.preStartReadiness.specialCertificatesRequired;
    const next = current.includes(type) ? current.filter((t) => t !== type) : [...current, type];
    updatePreStart({ specialCertificatesRequired: next });
  };

  return (
    <div className="space-y-6 bg-surface border border-border rounded-xl p-6 shadow-sm">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-4 gap-4">
        <div>
          <h3 className="text-lg font-bold text-ink flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            Permiso de Trabajo Seguro (PTW SIHO-A PDVSA IR-S-04)
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Manual de Ingeniería de Riesgos PDVSA IR-S-04 Rev. 4 — Evaluación Atmosférica, LOTO y Anexos Especiales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              ['ISSUED', 'APPROVED'].includes(currentState)
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                : ['SUBMITTED', 'UNDER_REVIEW'].includes(currentState)
                ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                : currentState === 'SUSPENDED'
                ? 'bg-red-500/10 text-red-600 border-red-500/30'
                : 'bg-muted text-muted-foreground border-border'
            }`}
          >
            Estado: {currentState}
          </span>
        </div>
      </div>

      {/* Workflow Navigation Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('eligibility')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 ${
            activeTab === 'eligibility' ? 'bg-brand-500 text-white' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Building2 className="w-4 h-4" />
          1. Elegibilidad & Prerrequisitos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('core')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 ${
            activeTab === 'core' ? 'bg-brand-500 text-white' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <FileText className="w-4 h-4" />
          2. PTW Core & Anexo A
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('special_anexos')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 ${
            activeTab === 'special_anexos' ? 'bg-brand-500 text-white' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          3. Anexos Especiales ({data.preStartReadiness.specialCertificatesRequired.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('execution')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 ${
            activeTab === 'execution' ? 'bg-brand-500 text-white' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Clock className="w-4 h-4" />
          4. Ejecución & Prórroga
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('closeout_signatures')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 ${
            activeTab === 'closeout_signatures' ? 'bg-brand-500 text-white' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          5. Cierre & Firmas
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 ${
            activeTab === 'audit' ? 'bg-brand-500 text-white' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          6. Parámetros & Auditoría
        </button>
      </div>

      {/* TAB 1: Eligibility & PreStartReadiness */}
      {activeTab === 'eligibility' && (
        <div className="space-y-4">
          <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-4">
            <h4 className="text-sm font-bold text-ink flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-500" />
              Elegibilidad de la Empresa Contratista
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Nombre Contratista *</label>
                <input
                  type="text"
                  value={data.contractorEligibility.contractorName}
                  onChange={(e) => updateContractor({ contractorName: e.target.value })}
                  disabled={isReadOnly}
                  placeholder="Ej. PROINTECA C.A."
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-ink"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">RIF Contratista *</label>
                <input
                  type="text"
                  value={data.contractorEligibility.contractorRif}
                  onChange={(e) => updateContractor({ contractorRif: e.target.value })}
                  disabled={isReadOnly}
                  placeholder="J-12345678-9"
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-ink"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Estatus Habilitación SIHOA *</label>
                <select
                  value={data.contractorEligibility.contractorStatus}
                  onChange={(e) => updateContractor({ contractorStatus: e.target.value as any })}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-ink"
                >
                  <option value="APTA">APTA (Habilitada SIHOA)</option>
                  <option value="PENDING_EVALUATION">PENDIENTE EVALUACIÓN</option>
                  <option value="SUSPENDIDA">SUSPENDIDA / NO APTA</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-ink">Plan SIHOA Aprobado para esta Obra/Servicio</span>
              </div>
              <button
                type="button"
                onClick={() => !isReadOnly && updateContractor({ sihoaPlanApproved: !data.contractorEligibility.sihoaPlanApproved })}
                disabled={isReadOnly}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                  data.contractorEligibility.sihoaPlanApproved
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                    : 'bg-red-500/10 text-red-600 border-red-500/30'
                }`}
              >
                {data.contractorEligibility.sihoaPlanApproved ? 'Plan SIHOA Aprobado' : 'Plan SIHOA Pendiente'}
              </button>
            </div>
          </div>

          <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-4">
            <h4 className="text-sm font-bold text-ink flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-brand-500" />
              Prerrequisitos Normativos del Trabajo (PDVSA IR-S-17 & SI-S-20)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 p-3 bg-surface border border-border rounded-lg">
                <label className="block text-xs font-semibold text-muted-foreground">Código ART (PDVSA IR-S-17) *</label>
                <input
                  type="text"
                  value={data.preStartReadiness.artCode}
                  onChange={(e) => updatePreStart({ artCode: e.target.value })}
                  disabled={isReadOnly}
                  placeholder="Ej. ART-2026-CR-102"
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-ink"
                />
                <button
                  type="button"
                  onClick={() => !isReadOnly && updatePreStart({ artApproved: !data.preStartReadiness.artApproved })}
                  disabled={isReadOnly}
                  className={`w-full py-1.5 text-xs font-semibold rounded-lg border ${
                    data.preStartReadiness.artApproved
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                  }`}
                >
                  {data.preStartReadiness.artApproved ? 'ART Aprobado (IR-S-17)' : 'ART Pendiente de Aprobar'}
                </button>
              </div>

              <div className="space-y-2 p-3 bg-surface border border-border rounded-lg">
                <label className="block text-xs font-semibold text-muted-foreground">Código Procedimiento (PDVSA SI-S-20) *</label>
                <input
                  type="text"
                  value={data.preStartReadiness.procedureCode}
                  onChange={(e) => updatePreStart({ procedureCode: e.target.value })}
                  disabled={isReadOnly}
                  placeholder="Ej. PROC-MEC-2026-05"
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-ink"
                />
                <button
                  type="button"
                  onClick={() => !isReadOnly && updatePreStart({ procedureApproved: !data.preStartReadiness.procedureApproved })}
                  disabled={isReadOnly}
                  className={`w-full py-1.5 text-xs font-semibold rounded-lg border ${
                    data.preStartReadiness.procedureApproved
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                  }`}
                >
                  {data.preStartReadiness.procedureApproved ? 'Procedimiento Aprobado (SI-S-20)' : 'Procedimiento Pendiente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PTW Core & Anexo A */}
      {activeTab === 'core' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Código de Permiso PTW *</label>
              <input
                type="text"
                value={data.ptwCode}
                onChange={(e) => onChange({ ptwCode: e.target.value })}
                disabled={isReadOnly}
                placeholder="Ej. PTW-2026-CRP-089"
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-ink"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Orden SAP N° (Si aplica)</label>
              <input
                type="text"
                value={data.sapOrderNumber}
                onChange={(e) => onChange({ sapOrderNumber: e.target.value })}
                disabled={isReadOnly}
                placeholder="400012345"
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-ink"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Tipo de Trabajo *</label>
              <select
                value={data.workType}
                onChange={(e) => onChange({ workType: e.target.value as any })}
                disabled={isReadOnly}
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-ink"
              >
                <option value="frio">Trabajo en Frío (Mecánico /Ajuste /Limp.)</option>
                <option value="caliente">Trabajo en Caliente (Chispa /Corte /Llama)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Instalación / Área / Unidad *</label>
              <input
                type="text"
                value={data.installationArea}
                onChange={(e) => onChange({ installationArea: e.target.value })}
                disabled={isReadOnly}
                placeholder="Ej. Planta de Fraccionamiento Ulé, Unidad 12"
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-ink"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Equipo / Intervención</label>
              <input
                type="text"
                value={data.equipmentDescription}
                onChange={(e) => onChange({ equipmentDescription: e.target.value })}
                disabled={isReadOnly}
                placeholder="Ej. Torre Deetanizadora TK-102"
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-ink"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Descripción del Trabajo a Realizar *</label>
            <textarea
              rows={2}
              value={data.workDescription}
              onChange={(e) => onChange({ workDescription: e.target.value })}
              disabled={isReadOnly}
              placeholder="Describa brevemente las actividades..."
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-ink resize-none"
            />
          </div>

          {/* Time and Duration Control */}
          <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-500" />
              Horarios, Coincidencia de Gas y Duración Máxima (Punto 8.4)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Hora Inicio *</label>
                <input
                  type="time"
                  value={data.startTime}
                  onChange={(e) => onChange({ startTime: e.target.value })}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-ink"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Hora Prueba Inicial Gas *</label>
                <input
                  type="time"
                  value={data.gasTest.testTime}
                  onChange={(e) => updateGasTest({ testTime: e.target.value })}
                  disabled={isReadOnly}
                  className={`w-full px-3 py-2 text-sm bg-surface border rounded-lg text-ink ${
                    data.startTime && data.gasTest.testTime && data.startTime !== data.gasTest.testTime
                      ? 'border-red-500 text-red-600'
                      : 'border-border'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Duración (Horas) *</label>
                <input
                  type="number"
                  max={data.isPlantShutdownOrMajorMaint ? 12 : 8}
                  min={1}
                  value={data.maxDurationHours}
                  onChange={(e) => onChange({ maxDurationHours: parseInt(e.target.value, 10) || 8 })}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-ink"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => !isReadOnly && onChange({ isPlantShutdownOrMajorMaint: !data.isPlantShutdownOrMajorMaint })}
                  disabled={isReadOnly}
                  className={`w-full py-2 px-3 text-xs font-semibold rounded-lg border ${
                    data.isPlantShutdownOrMajorMaint
                      ? 'bg-purple-500/10 text-purple-600 border-purple-500/30'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {data.isPlantShutdownOrMajorMaint ? 'Parada Planta (Max 12h)' : 'Trabajo Normal (Max 8h)'}
                </button>
              </div>
            </div>
            {data.startTime && data.gasTest.testTime && data.startTime !== data.gasTest.testTime && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                HARD_BLOCK: La hora de inicio ({data.startTime}) DEBE coincidir exactamente con la hora de la prueba de gas ({data.gasTest.testTime}).
              </p>
            )}
          </div>

          {/* Gas Test Values */}
          <div className="p-4 bg-surface border border-border rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-2">
              <Gauge className="w-4 h-4 text-brand-500" />
              Resultados de la Prueba Atmosférica (Evaluación en Sitio)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">% LEL (Gases Inflamables) [En caliente: 0.0%]</label>
                <input
                  type="number"
                  step="0.1"
                  value={data.gasTest.lelPercentage}
                  onChange={(e) => updateGasTest({ lelPercentage: parseFloat(e.target.value) || 0 })}
                  disabled={isReadOnly}
                  className={`w-full px-3 py-2 text-sm bg-surface border rounded-lg text-ink ${
                    data.workType === 'caliente' && data.gasTest.lelPercentage !== 0 ? 'border-red-500 text-red-600' : 'border-emerald-500'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">% O2 (Oxígeno) [19.5% - 23.5%]</label>
                <input
                  type="number"
                  step="0.1"
                  value={data.gasTest.o2Percentage}
                  onChange={(e) => updateGasTest({ o2Percentage: parseFloat(e.target.value) || 0 })}
                  disabled={isReadOnly}
                  className={`w-full px-3 py-2 text-sm bg-surface border rounded-lg text-ink ${
                    data.gasTest.o2Percentage >= 19.5 && data.gasTest.o2Percentage <= 23.5 ? 'border-emerald-500' : 'border-red-500 text-red-600'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">PPM H2S [Requerido: 0 PPM]</label>
                <input
                  type="number"
                  value={data.gasTest.h2sPpm}
                  onChange={(e) => updateGasTest({ h2sPpm: parseInt(e.target.value, 10) || 0 })}
                  disabled={isReadOnly}
                  className={`w-full px-3 py-2 text-sm bg-surface border rounded-lg text-ink ${
                    data.gasTest.h2sPpm === 0 ? 'border-emerald-500' : 'border-red-500 text-red-600'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Special Anexos Selection B-L */}
      {activeTab === 'special_anexos' && (
        <div className="space-y-4">
          <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-3">
            <h4 className="text-sm font-bold text-ink flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-brand-500" />
              Anexos de Permisos Especiales Requeridos (PDVSA IR-S-04 Anexos B–L)
            </h4>
            <p className="text-xs text-muted-foreground">
              Seleccione los Certificados Especiales aplicables para desplegar sus formularios y listas de verificación.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
              {[
                { id: 'confinado', label: 'Anexo B: Espacios Confinados' },
                { id: 'izaje', label: 'Anexo C: Izamiento de Carga' },
                { id: 'radiacion', label: 'Anexo D: Radiaciones Ionizantes' },
                { id: 'excavacion', label: 'Anexo E: Excavaciones' },
                { id: 'electrico', label: 'Anexo F: Sistema Eléctrico' },
                { id: 'subacuatico', label: 'Anexo G: Subacuáticos / Acuáticos' },
                { id: 'hot_tapping', label: 'Anexo H: Hot Tapping (Perforación)' },
                { id: 'compartida', label: 'Anexo I: Áreas Compartidas' },
                { id: 'altura', label: 'Anexo J: Trabajos en Altura' },
                { id: 'fumigacion', label: 'Anexo K: Fumigación' },
                { id: 'soldadura', label: 'Anexo L: Soldadura' },
              ].map((anexo) => (
                <button
                  key={anexo.id}
                  type="button"
                  onClick={() => !isReadOnly && toggleSpecialAnexo(anexo.id)}
                  disabled={isReadOnly}
                  className={`p-2.5 text-xs font-semibold rounded-lg border text-left flex items-center justify-between ${
                    isSpecialRequired(anexo.id)
                      ? 'bg-brand-500/10 text-brand-600 border-brand-500/30'
                      : 'bg-surface text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  <span>{anexo.label}</span>
                  {isSpecialRequired(anexo.id) ? <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" /> : <div className="w-3.5 h-3.5 border border-border rounded" />}
                </button>
              ))}
            </div>
          </div>

          {/* Contextual Render of Active Special Anexos */}
          <div className="space-y-3">
            {data.preStartReadiness.specialCertificatesRequired.map((cert) => (
              <div key={cert} className="p-3 bg-surface border border-brand-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink uppercase tracking-wide">
                    Certificado Especial Activado: Anexo {cert.toUpperCase()}
                  </span>
                  <span className="text-[10px] bg-brand-500/10 text-brand-600 px-2 py-0.5 rounded font-mono">
                    HO-H-06 / IR-S-04 Integrado
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  El formulario de inspección técnica, lista de chequeo de seguridad y firmas específicas para {cert} se han integrado a este expediente.
                </p>
              </div>
            ))}
            {data.preStartReadiness.specialCertificatesRequired.length === 0 && (
              <p className="text-xs text-muted-foreground italic text-center py-4">
                No se han seleccionado Anexos Especiales adicionales. Solo aplicará el Permiso Core (Anexo A).
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Execution & Extension */}
      {activeTab === 'execution' && (
        <div className="space-y-4">
          <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-3">
            <h4 className="text-sm font-bold text-ink flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-500" />
              Solicitud de Prórroga del Permiso (Punto 8.5)
            </h4>
            <p className="text-xs text-muted-foreground">
              Sólo se otorgará UNA (1) Prórroga de máximo DOS (2) horas continuas, si y solo si las condiciones iniciales no han variado y los firmantes son los mismos.
            </p>

            <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg">
              <span className="text-xs font-semibold text-ink">¿Requiere Prórroga de Trabajo?</span>
              <button
                type="button"
                onClick={() => !isReadOnly && updateExtension({ requested: !data.extension.requested })}
                disabled={isReadOnly}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                  data.extension.requested
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                    : 'bg-muted text-muted-foreground border-border'
                }`}
              >
                {data.extension.requested ? 'Prórroga Solicitada' : 'Sin Prórroga'}
              </button>
            </div>

            {data.extension.requested && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Prorrogar Hasta (Hora)</label>
                  <input
                    type="time"
                    value={data.extension.extendedUntilTime}
                    onChange={(e) => updateExtension({ extendedUntilTime: e.target.value })}
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-ink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Horas Solicitadas (Máx 2h)</label>
                  <input
                    type="number"
                    max={2}
                    min={1}
                    value={data.extension.extensionHours}
                    onChange={(e) => updateExtension({ extensionHours: parseInt(e.target.value, 10) || 1 })}
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 text-sm bg-surface border rounded-lg text-ink ${
                      data.extension.extensionHours > 2 ? 'border-red-500 text-red-600' : 'border-border'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Motivo Justificado</label>
                  <input
                    type="text"
                    value={data.extension.reason}
                    onChange={(e) => updateExtension({ reason: e.target.value })}
                    disabled={isReadOnly}
                    placeholder="Ej. Ajuste final de alineación de acople..."
                    className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-ink"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Closeout & Signatures */}
      {activeTab === 'closeout_signatures' && (
        <div className="space-y-4">
          <div className="p-4 bg-surface border border-border rounded-xl space-y-4">
            <h4 className="text-sm font-bold text-ink flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-brand-500" />
              Identificación y Firmas Tripartitas (Emisor, Receptor, Ejecutor)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* EMISOR */}
              <div className="p-3 bg-muted/20 border border-border rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">1. EMISOR (PDVSA CUSTODIO)</span>
                  <span className="text-[10px] bg-brand-500/10 text-brand-600 px-1.5 py-0.5 rounded font-mono">
                    {data.signers.emisor.status}
                  </span>
                </div>
                <input
                  type="text"
                  value={data.signers.emisor.name}
                  onChange={(e) => updateSigner('emisor', { name: e.target.value })}
                  disabled={isReadOnly}
                  placeholder="Nombre y Apellido Emisor *"
                  className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-lg text-ink"
                />
                <input
                  type="text"
                  value={data.signers.emisor.certNumber}
                  onChange={(e) => updateSigner('emisor', { certNumber: e.target.value })}
                  disabled={isReadOnly}
                  placeholder="N° Certificado Emisor *"
                  className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-lg text-ink"
                />
              </div>

              {/* RECEPTOR */}
              <div className="p-3 bg-muted/20 border border-border rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">2. RECEPTOR (MANTENIMIENTO)</span>
                  <span className="text-[10px] bg-brand-500/10 text-brand-600 px-1.5 py-0.5 rounded font-mono">
                    {data.signers.receptor.status}
                  </span>
                </div>
                <input
                  type="text"
                  value={data.signers.receptor.name}
                  onChange={(e) => updateSigner('receptor', { name: e.target.value })}
                  disabled={isReadOnly}
                  placeholder="Nombre y Apellido Receptor *"
                  className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-lg text-ink"
                />
                <input
                  type="text"
                  value={data.signers.receptor.certNumber}
                  onChange={(e) => updateSigner('receptor', { certNumber: e.target.value })}
                  disabled={isReadOnly}
                  placeholder="N° Certificado Receptor *"
                  className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-lg text-ink"
                />
              </div>

              {/* EJECUTOR */}
              <div className="p-3 bg-muted/20 border border-border rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">3. EJECUTOR (OBRA/SERVICIO)</span>
                  <span className="text-[10px] bg-brand-500/10 text-brand-600 px-1.5 py-0.5 rounded font-mono">
                    {data.signers.ejecutor.status}
                  </span>
                </div>
                <input
                  type="text"
                  value={data.signers.ejecutor.name}
                  onChange={(e) => updateSigner('ejecutor', { name: e.target.value })}
                  disabled={isReadOnly}
                  placeholder="Nombre y Apellido Ejecutor *"
                  className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-lg text-ink"
                />
              </div>
            </div>
          </div>

          {/* Closeout Verification */}
          <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-3">
            <h4 className="text-sm font-bold text-ink flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              Verificación de Cierre y Entrega Segura de Instalación (Punto 8.7)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => !isReadOnly && updateCloseout({ areaCleanAndOrderly: !data.closeout.areaCleanAndOrderly })}
                disabled={isReadOnly}
                className={`p-3 text-xs font-semibold rounded-lg border text-left flex items-center justify-between ${
                  data.closeout.areaCleanAndOrderly
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                    : 'bg-surface text-muted-foreground border-border'
                }`}
              >
                <span>Orden y Limpieza Preservados en Sitio</span>
                {data.closeout.areaCleanAndOrderly ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
              </button>

              <button
                type="button"
                onClick={() => !isReadOnly && updateCloseout({ locksRemovedAndReconnected: !data.closeout.locksRemovedAndReconnected })}
                disabled={isReadOnly}
                className={`p-3 text-xs font-semibold rounded-lg border text-left flex items-center justify-between ${
                  data.closeout.locksRemovedAndReconnected
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                    : 'bg-surface text-muted-foreground border-border'
                }`}
              >
                <span>Bloqueos Retirados / Equipos Reconectados</span>
                {data.closeout.locksRemovedAndReconnected ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: External Pending Parameters & Audit */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
            <h4 className="text-sm font-bold text-amber-700 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              Parámetros Técnicos Externos Pendientes (PENDING_EXTERNAL_PARAMETER)
            </h4>
            <p className="text-xs text-amber-800">
              Si existe algún parámetro técnico pendiente de telemetría o fuente externa, se registra con su fuente esperada sin inventar valores ficticios.
            </p>

            {data.pendingExternalParameters.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No hay parámetros externos marcados como pendientes.</p>
            ) : (
              <div className="space-y-2">
                {data.pendingExternalParameters.map((p) => (
                  <div key={p.parameterId} className="p-3 bg-surface border border-amber-500/30 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink">{p.parameterName}</span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 font-mono text-[10px]">{p.status}</span>
                    </div>
                    <p className="text-muted-foreground">Fuente Esperada: {p.expectedSource}</p>
                    <p className="text-amber-700 font-semibold">{p.warningMessage}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transition Action Buttons */}
      {onTransition && !isReadOnly && (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
          {currentState === 'DRAFT' && (
            <button
              type="button"
              onClick={() => onTransition('IN_PROGRESS')}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Iniciar Captura PTW
            </button>
          )}

          {currentState === 'IN_PROGRESS' && (
            <button
              type="button"
              onClick={() => onTransition('SUBMITTED')}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Enviar a Revisión de Riesgos
            </button>
          )}

          {currentState === 'SUBMITTED' && (
            <button
              type="button"
              onClick={() => onTransition('UNDER_REVIEW')}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600 flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4" />
              Iniciar Revisión Custodio / SIHO
            </button>
          )}

          {currentState === 'UNDER_REVIEW' && (
            <>
              <button
                type="button"
                onClick={() => onTransition('CHANGES_REQUESTED')}
                className="px-3 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Solicitar Correcciones
              </button>
              <button
                type="button"
                onClick={() => onTransition('APPROVED')}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Aprobar Prerrequisitos PTW
              </button>
            </>
          )}

          {currentState === 'CHANGES_REQUESTED' && (
            <button
              type="button"
              onClick={() => onTransition('IN_PROGRESS')}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Reabrir para Corrección
            </button>
          )}

          {currentState === 'APPROVED' && (
            <button
              type="button"
              onClick={() => onTransition('ISSUED')}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Otorgar y Emitir Permiso en Sitio
            </button>
          )}

          {currentState === 'ISSUED' && (
            <>
              <button
                type="button"
                onClick={() => onTransition('SUSPENDED')}
                className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 flex items-center gap-2"
              >
                <Ban className="w-4 h-4" />
                Suspender Permiso
              </button>
              <button
                type="button"
                onClick={() => onTransition('CLOSED')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center gap-2"
              >
                <CheckSquare className="w-4 h-4" />
                Cerrar Permiso al Finalizar
              </button>
            </>
          )}

          {currentState === 'SUSPENDED' && (
            <button
              type="button"
              onClick={() => onTransition('ISSUED')}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Re-emitir Permiso
            </button>
          )}

          {currentState === 'CLOSED' && (
            <button
              type="button"
              onClick={() => onTransition('ARCHIVED')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Archivar Permiso Custodiado
            </button>
          )}
        </div>
      )}
    </div>
  );
};
