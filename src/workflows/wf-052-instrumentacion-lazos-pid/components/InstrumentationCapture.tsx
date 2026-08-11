import React, { useState } from 'react';
import {
  Cpu,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Gauge,
  Sliders,
  FileText,
  Building2,
  ShieldCheck,
  Zap,
  ArrowRight,
  ArrowLeft,
  Search,
} from 'lucide-react';
import { WorkflowComponentProps } from '../../../lib/workflows/contracts';

export type InstrumentType = 'PT' | 'TT' | 'FT' | 'LT' | 'PSV' | 'CV';

export interface CalibrationPoint {
  inputPercent: number; // 0, 25, 50, 75, 100
  expectedVal: number;
  measuredVal: number; // for backward compatibility
  measuredAscending?: number;
  measuredDescending?: number;
  errorPercentFs: number;
  passed: boolean;
}

export interface ElectricalAreaClassification {
  clase: 'Clase I' | 'Clase II' | 'No Clasificada';
  division: 'División 1' | 'División 2' | 'Zona 0' | 'Zona 1' | 'Zona 2';
  grupo: 'Grupo A' | 'Grupo B' | 'Grupo C' | 'Grupo D' | 'Grupo E, F, G';
  tCode: 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6';
  protectionType: 'Ex-d (Aprueba de Explosión)' | 'Ex-i (Intrínsecamente Seguro)' | 'Ex-e' | 'Ex-p' | 'NEMA 4X';
}

export interface CalibrationStandard {
  equipoPatron: string; // e.g. "Calibrador de Procesos Fluke 754"
  modeloPatron?: string;
  serialPatron: string;
  certificadoPatronNumero: string;
  vencimientoCertificadoPatron: string;
}

export interface InstrumentLoop {
  id: string;
  tagNo: string; // e.g. PT-101A
  loopTag: string; // e.g. LOOP-101
  pidNumber: string; // e.g. P&ID-SJ-101-REV2
  instrumentType: InstrumentType;
  description: string;
  location: string;
  rangeMin: number;
  rangeMax: number;
  unit: string; // PSI, °C, GPM, %
  toleranceFsPercent: number; // e.g. 0.5%
  signalType: '4-20mA HART' | 'Fieldbus Foundation' | 'Modbus RTU' | 'Neumático 3-15 PSI';
  calibrationDate: string;
  nextCalibrationDate: string;
  calibratedBy: string;
  status: 'Calibrado & Operativo' | 'Pendiente Calibración' | 'Fuera de Tolerancia';
  calibrationPoints: CalibrationPoint[];
  notes?: string;

  // Enhancements for ISA 20 & IR-E-01
  areaClasificada?: ElectricalAreaClassification;
  patronCalibracion?: CalibrationStandard;
  globalMaxErrorPercentFs?: number;
  dictamen?: 'CONFORME' | 'NO CONFORME';
  digitalSignatureHash?: string;
}

export interface InstrumentationData {
  loops: InstrumentLoop[];
  summaryNotes?: string;
}

export function createDefaultInstrumentLoop(params: {
  tagNo: string;
  loopTag: string;
  pidNumber?: string;
  instrumentType?: InstrumentType;
  description?: string;
  location?: string;
  rangeMin?: number;
  rangeMax?: number;
  unit?: string;
  toleranceFsPercent?: number;
  signalType?: InstrumentLoop['signalType'];
  calibratedBy?: string;
}): InstrumentLoop {
  const min = params.rangeMin ?? 0;
  const max = params.rangeMax ?? 100;
  const span = max - min || 1;

  // Generate 5-point default calibration table (0%, 25%, 50%, 75%, 100%)
  const defaultPoints: CalibrationPoint[] = [0, 25, 50, 75, 100].map((pct) => {
    const expected = min + (span * pct) / 100;
    return {
      inputPercent: pct,
      expectedVal: Number(expected.toFixed(2)),
      measuredVal: Number(expected.toFixed(2)),
      measuredAscending: Number(expected.toFixed(2)),
      measuredDescending: Number(expected.toFixed(2)),
      errorPercentFs: 0,
      passed: true,
    };
  });

  return {
    id: `loop_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    tagNo: params.tagNo.trim().toUpperCase(),
    loopTag: params.loopTag.trim().toUpperCase(),
    pidNumber: (params.pidNumber || '').trim().toUpperCase(),
    instrumentType: params.instrumentType || 'PT',
    description: (params.description || '').trim(),
    location: (params.location || '').trim(),
    rangeMin: min,
    rangeMax: max,
    unit: (params.unit || 'PSI').trim(),
    toleranceFsPercent: params.toleranceFsPercent ?? 0.5,
    signalType: params.signalType || '4-20mA HART',
    calibrationDate: '',
    nextCalibrationDate: '',
    calibratedBy: (params.calibratedBy || '').trim(),
    status: 'Pendiente Calibración',
    calibrationPoints: [],
    areaClasificada: {
      clase: 'Clase I',
      division: 'División 1',
      grupo: 'Grupo D',
      tCode: 'T3',
      protectionType: 'Ex-d (Aprueba de Explosión)',
    },
    patronCalibracion: {
      equipoPatron: 'Calibrador Documentador Fluke 754',
      serialPatron: 'FLK-882194',
      certificadoPatronNumero: 'CERT-CAL-2025-9982',
      vencimientoCertificadoPatron: '2026-12-31',
    },
    globalMaxErrorPercentFs: 0,
    dictamen: 'CONFORME',
  };
}

export const InstrumentationCapture: React.FC<WorkflowComponentProps<InstrumentationData>> = ({
  data,
  onChange,
  isReadOnly = false,
  errors = [],
}) => {
  const loops = data?.loops || [];
  const summaryNotes = data?.summaryNotes || '';

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [selectedLoopId, setSelectedLoopId] = useState<string | null>(
    loops.length > 0 ? loops[0].id : null
  );

  // Form state for adding new loop modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTagNo, setNewTagNo] = useState('');
  const [newLoopTag, setNewLoopTag] = useState('');
  const [newPidNumber, setNewPidNumber] = useState('');
  const [newInstrumentType, setNewInstrumentType] = useState<InstrumentType>('PT');
  const [newDescription, setNewDescription] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newRangeMin, setNewRangeMin] = useState(0);
  const [newRangeMax, setNewRangeMax] = useState(100);
  const [newUnit, setNewUnit] = useState('PSI');
  const [newToleranceFs, setNewToleranceFs] = useState(0.5);
  const [newSignalType, setNewSignalType] = useState<InstrumentLoop['signalType']>('4-20mA HART');
  const [newCalibratedBy, setNewCalibratedBy] = useState('');

  const selectedLoop = loops.find((l) => l.id === selectedLoopId) || loops[0] || null;

  const updateLoops = (nextLoops: InstrumentLoop[]) => {
    onChange({
      loops: nextLoops,
      summaryNotes,
    });
  };

  const handleAddLoop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagNo.trim() || !newLoopTag.trim()) return;

    const newLoop = createDefaultInstrumentLoop({
      tagNo: newTagNo,
      loopTag: newLoopTag,
      pidNumber: newPidNumber,
      instrumentType: newInstrumentType,
      description: newDescription,
      location: newLocation,
      rangeMin: Number(newRangeMin),
      rangeMax: Number(newRangeMax),
      unit: newUnit,
      toleranceFsPercent: Number(newToleranceFs),
      signalType: newSignalType,
      calibratedBy: newCalibratedBy,
    });

    const next = [...loops, newLoop];
    updateLoops(next);
    setSelectedLoopId(newLoop.id);
    setShowAddModal(false);
    setNewTagNo('');
    setNewLoopTag('');
    setNewPidNumber('');
    setNewDescription('');
    setNewLocation('');
    setNewCalibratedBy('');
  };

  const handleDeleteLoop = (loopId: string) => {
    if (isReadOnly) return;
    const next = loops.filter((l) => l.id !== loopId);
    updateLoops(next);
    if (selectedLoopId === loopId) {
      setSelectedLoopId(next.length > 0 ? next[0].id : null);
    }
  };

  // Updates single calibration point reading in selected loop
  const handleUpdatePointReading = (
    loopId: string,
    pointIndex: number,
    field: 'measuredAscending' | 'measuredDescending' | 'measuredVal',
    value: number
  ) => {
    if (isReadOnly) return;

    const nextLoops = loops.map((loop) => {
      if (loop.id !== loopId) return loop;

      const fsRange = loop.rangeMax - loop.rangeMin || 1;
      const span = fsRange;

      let pts = loop.calibrationPoints;
      if (pts.length === 0) {
        pts = [0, 25, 50, 75, 100].map((pct) => {
          const expected = loop.rangeMin + (span * pct) / 100;
          return {
            inputPercent: pct,
            expectedVal: Number(expected.toFixed(2)),
            measuredVal: Number(expected.toFixed(2)),
            measuredAscending: Number(expected.toFixed(2)),
            measuredDescending: Number(expected.toFixed(2)),
            errorPercentFs: 0,
            passed: true,
          };
        });
      }

      const updatedPoints = pts.map((pt, idx) => {
        if (idx !== pointIndex) return pt;

        const asc = field === 'measuredAscending' ? value : pt.measuredAscending ?? pt.measuredVal;
        const desc = field === 'measuredDescending' ? value : pt.measuredDescending ?? pt.measuredVal;
        const mainMeasured = field === 'measuredVal' ? value : asc;

        const absErrAsc = Math.abs(asc - pt.expectedVal);
        const absErrDesc = Math.abs(desc - pt.expectedVal);
        const maxAbsErr = Math.max(absErrAsc, absErrDesc);

        const errorPercentFs = Number(((maxAbsErr / fsRange) * 100).toFixed(3));
        const passed = errorPercentFs <= loop.toleranceFsPercent;

        return {
          ...pt,
          measuredVal: mainMeasured,
          measuredAscending: asc,
          measuredDescending: desc,
          errorPercentFs,
          passed,
        };
      });

      const maxErrorGlobal = Math.max(...updatedPoints.map((p) => p.errorPercentFs));
      const hasFailed = updatedPoints.some((pt) => !pt.passed);

      const status: InstrumentLoop['status'] = hasFailed
        ? 'Fuera de Tolerancia'
        : 'Calibrado & Operativo';

      const dictamen: InstrumentLoop['dictamen'] = hasFailed ? 'NO CONFORME' : 'CONFORME';

      return {
        ...loop,
        calibrationPoints: updatedPoints,
        globalMaxErrorPercentFs: maxErrorGlobal,
        dictamen,
        status,
        calibrationDate: loop.calibrationDate || new Date().toISOString().split('T')[0],
      };
    });

    updateLoops(nextLoops);
  };

  return (
    <div className="space-y-6">
      {/* Wizard Step Indicator Banner */}
      <div className="bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-500/10 text-brand-500 rounded-xl">
              <Gauge className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold">
                  ISA 5.1 / ISA 20 / PDVSA IR-E-01
                </span>
                <span className="text-xs text-slate-500">
                  WF-052
                </span>
              </div>
              <h2 className="text-lg font-bold text-ink dark:text-slate-100 mt-0.5">
                Control, Calibración de Instrumentos y Prueba de Lazos P&ID
              </h2>
            </div>
          </div>

          {/* Wizard Step Navigation Buttons */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-xl text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeStep === 1
                  ? 'bg-brand-500 text-white font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Paso 1: Identificación y Área</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStep(2)}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeStep === 2
                  ? 'bg-brand-500 text-white font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Paso 2: Calibración 5 Puntos ISA 20</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStep(3)}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeStep === 3
                  ? 'bg-brand-500 text-white font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Paso 3: Certificado DEL-INST-CERT-052</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hard Gate / Validation Error Messages */}
      {errors.length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-1">
          {errors.map((err, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      {loops.length === 0 ? (
        <div className="text-center py-12 bg-surface dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-8">
          <Cpu className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-semibold text-ink dark:text-slate-200 mb-1">
            No hay lazos de instrumentación registrados
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
            Registre los transmisores, válvulas y lazos P&ID para realizar la verificación de 5 puntos ISA 20 y clasificación de área IR-E-01.
          </p>
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium text-xs transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Registrar Lazo de Control
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Instrument List Sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Lazos e Instrumentos ({loops.length})
              </span>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="text-xs text-brand-500 hover:underline font-medium inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Nuevo Lazo
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
              {loops.map((loop) => {
                const isSelected = selectedLoop?.id === loop.id;
                const isPassed = loop.status === 'Calibrado & Operativo';

                return (
                  <div
                    key={loop.id}
                    onClick={() => setSelectedLoopId(loop.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-brand-500/5 border-brand-500/40 shadow-sm'
                        : 'bg-surface dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold text-ink dark:text-slate-100">
                        {loop.tagNo}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isPassed
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {loop.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate mb-2">
                      Lazo: {loop.loopTag} | Plano: {loop.pidNumber || 'P&ID N/A'}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Rango: {loop.rangeMin}-{loop.rangeMax} {loop.unit}</span>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLoop(loop.id);
                          }}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          title="Eliminar Lazo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Detail View for Selected Loop */}
          <div className="lg:col-span-8">
            {selectedLoop ? (
              <div className="bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-6">
                {/* Loop Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 dark:border-slate-800 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-600 dark:text-slate-300">
                        {selectedLoop.instrumentType}
                      </span>
                      <h3 className="text-base font-bold text-ink dark:text-slate-100 font-mono">
                        {selectedLoop.tagNo} ({selectedLoop.loopTag})
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {selectedLoop.description || 'Sin descripción'} — Ubicación: {selectedLoop.location || 'Planta General'}
                    </p>
                  </div>

                  <div className="text-right text-xs text-slate-500 dark:text-slate-400 font-mono">
                    <div>P&ID: <strong className="text-slate-700 dark:text-slate-200">{selectedLoop.pidNumber}</strong></div>
                    <div>Señal: <strong className="text-slate-700 dark:text-slate-200">{selectedLoop.signalType}</strong></div>
                  </div>
                </div>

                {/* STEP 1: IDENTIFICATION & ELECTRICAL AREA CLASSIFICATION (IR-E-01) */}
                {activeStep === 1 && (
                  <div className="space-y-4 text-xs">
                    <h4 className="font-bold text-ink dark:text-slate-100 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      Paso 1: Datos de Gabinete y Clasificación Eléctrica de Área (PDVSA IR-E-01)
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-500 mb-1">Tag del Instrumento *</label>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={selectedLoop.tagNo}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            updateLoops(loops.map((l) => (l.id === selectedLoop.id ? { ...l, tagNo: val } : l)));
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1">Tag del Lazo *</label>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={selectedLoop.loopTag}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            updateLoops(loops.map((l) => (l.id === selectedLoop.id ? { ...l, loopTag: val } : l)));
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 mb-1">Plano P&ID Referencia *</label>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={selectedLoop.pidNumber}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateLoops(loops.map((l) => (l.id === selectedLoop.id ? { ...l, pidNumber: val } : l)));
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1">Tipo de Señal de Control</label>
                        <select
                          disabled={isReadOnly}
                          value={selectedLoop.signalType}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            updateLoops(loops.map((l) => (l.id === selectedLoop.id ? { ...l, signalType: val } : l)));
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900"
                        >
                          <option value="4-20mA HART">4-20mA HART</option>
                          <option value="Fieldbus Foundation">Fieldbus Foundation</option>
                          <option value="Modbus RTU">Modbus RTU</option>
                          <option value="Neumático 3-15 PSI">Neumático 3-15 PSI</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-500 mb-1">Rango Mínimo / Máximo ({selectedLoop.unit})</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            disabled={isReadOnly}
                            value={selectedLoop.rangeMin}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateLoops(loops.map((l) => (l.id === selectedLoop.id ? { ...l, rangeMin: val } : l)));
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 font-mono"
                          />
                          <input
                            type="number"
                            disabled={isReadOnly}
                            value={selectedLoop.rangeMax}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateLoops(loops.map((l) => (l.id === selectedLoop.id ? { ...l, rangeMax: val } : l)));
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1">Tolerancia Permisible (%FS) *</label>
                        <input
                          type="number"
                          step="0.1"
                          disabled={isReadOnly}
                          value={selectedLoop.toleranceFsPercent}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0.5;
                            updateLoops(loops.map((l) => (l.id === selectedLoop.id ? { ...l, toleranceFsPercent: val } : l)));
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 font-mono"
                        />
                      </div>
                    </div>

                    {/* Electrical Area Classification Panel (PDVSA IR-E-01) */}
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
                      <h5 className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <Zap className="w-4 h-4" /> Clasificación Eléctrica del Área de Instalación (PDVSA IR-E-01)
                      </h5>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-500 mb-0.5">Clase</label>
                          <select
                            disabled={isReadOnly}
                            value={selectedLoop.areaClasificada?.clase || 'Clase I'}
                            onChange={(e) => {
                              const area = { ...(selectedLoop.areaClasificada || { clase: 'Clase I', division: 'División 1', grupo: 'Grupo D', tCode: 'T3', protectionType: 'Ex-d (Aprueba de Explosión)' as const }), clase: e.target.value as any };
                              updateLoops(loops.map((l) => (l.id === selectedLoop.id ? { ...l, areaClasificada: area } : l)));
                            }}
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900"
                          >
                            <option value="Clase I">Clase I (Gases/Vapores)</option>
                            <option value="Clase II">Clase II (Polvos)</option>
                            <option value="No Clasificada">No Clasificada</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-500 mb-0.5">División / Zona</label>
                          <select
                            disabled={isReadOnly}
                            value={selectedLoop.areaClasificada?.division || 'División 1'}
                            onChange={(e) => {
                              const area = { ...(selectedLoop.areaClasificada || { clase: 'Clase I', division: 'División 1', grupo: 'Grupo D', tCode: 'T3', protectionType: 'Ex-d (Aprueba de Explosión)' as const }), division: e.target.value as any };
                              updateLoops(loops.map((l) => (l.id === selectedLoop.id ? { ...l, areaClasificada: area } : l)));
                            }}
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900"
                          >
                            <option value="División 1">División 1 (Contínuo)</option>
                            <option value="División 2">División 2 (Anormal)</option>
                            <option value="Zona 0">Zona 0</option>
                            <option value="Zona 1">Zona 1</option>
                            <option value="Zona 2">Zona 2</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-500 mb-0.5">Grupo Gas</label>
                          <select
                            disabled={isReadOnly}
                            value={selectedLoop.areaClasificada?.grupo || 'Grupo D'}
                            onChange={(e) => {
                              const area = { ...(selectedLoop.areaClasificada || { clase: 'Clase I', division: 'División 1', grupo: 'Grupo D', tCode: 'T3', protectionType: 'Ex-d (Aprueba de Explosión)' as const }), grupo: e.target.value as any };
                              updateLoops(loops.map((l) => (l.id === selectedLoop.id ? { ...l, areaClasificada: area } : l)));
                            }}
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900"
                          >
                            <option value="Grupo A">Grupo A (Acetileno)</option>
                            <option value="Grupo B">Grupo B (Hidrógeno)</option>
                            <option value="Grupo C">Grupo C (Etileno)</option>
                            <option value="Grupo D">Grupo D (Metano/Gas Nat.)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-500 mb-0.5">T-Code (Temp)</label>
                          <select
                            disabled={isReadOnly}
                            value={selectedLoop.areaClasificada?.tCode || 'T3'}
                            onChange={(e) => {
                              const area = { ...(selectedLoop.areaClasificada || { clase: 'Clase I', division: 'División 1', grupo: 'Grupo D', tCode: 'T3', protectionType: 'Ex-d (Aprueba de Explosión)' as const }), tCode: e.target.value as any };
                              updateLoops(loops.map((l) => (l.id === selectedLoop.id ? { ...l, areaClasificada: area } : l)));
                            }}
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900"
                          >
                            <option value="T1">T1 (450°C)</option>
                            <option value="T2">T2 (300°C)</option>
                            <option value="T3">T3 (200°C)</option>
                            <option value="T4">T4 (135°C)</option>
                            <option value="T5">T5 (100°C)</option>
                            <option value="T6">T6 (85°C)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveStep(2)}
                        className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium inline-flex items-center gap-1.5 shadow-sm"
                      >
                        Continuar a Calibración 5 Puntos (ISA 20) <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: ISA 20 5-POINT CALIBRATION CAPTURE */}
                {activeStep === 2 && (
                  <div className="space-y-4 text-xs">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                      <h4 className="font-bold text-ink dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-brand-500" />
                        Paso 2: Captura de Calibración 5 Puntos (ISA 20)
                      </h4>
                      <span className="text-xs text-slate-500">
                        Error Máx. Permitido: <strong className="font-mono">±{selectedLoop.toleranceFsPercent}% FS</strong>
                      </span>
                    </div>

                    {/* Calibration Standard Information */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg space-y-2 border border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block">
                        Patrón de Calibración Utilizado (Trazabilidad ISO/IEC 17025)
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <label className="block text-slate-500">Equipo Patrón</label>
                          <input
                            type="text"
                            disabled={isReadOnly}
                            value={selectedLoop.patronCalibracion?.equipoPatron || ''}
                            onChange={(e) => {
                              const pat = { ...(selectedLoop.patronCalibracion || { equipoPatron: '', serialPatron: '', certificadoPatronNumero: '', vencimientoCertificadoPatron: '' }), equipoPatron: e.target.value };
                              updateLoops(loops.map((l) => (l.id === selectedLoop.id ? { ...l, patronCalibracion: pat } : l)));
                            }}
                            placeholder="ej. Fluke 754"
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500">Serial Patrón</label>
                          <input
                            type="text"
                            disabled={isReadOnly}
                            value={selectedLoop.patronCalibracion?.serialPatron || ''}
                            onChange={(e) => {
                              const pat = { ...(selectedLoop.patronCalibracion || { equipoPatron: '', serialPatron: '', certificadoPatronNumero: '', vencimientoCertificadoPatron: '' }), serialPatron: e.target.value };
                              updateLoops(loops.map((l) => (l.id === selectedLoop.id ? { ...l, patronCalibracion: pat } : l)));
                            }}
                            placeholder="Serial"
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500">Certificado N°</label>
                          <input
                            type="text"
                            disabled={isReadOnly}
                            value={selectedLoop.patronCalibracion?.certificadoPatronNumero || ''}
                            onChange={(e) => {
                              const pat = { ...(selectedLoop.patronCalibracion || { equipoPatron: '', serialPatron: '', certificadoPatronNumero: '', vencimientoCertificadoPatron: '' }), certificadoPatronNumero: e.target.value };
                              updateLoops(loops.map((l) => (l.id === selectedLoop.id ? { ...l, patronCalibracion: pat } : l)));
                            }}
                            placeholder="N° Certificado"
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500">Vencimiento Patrón</label>
                          <input
                            type="date"
                            disabled={isReadOnly}
                            value={selectedLoop.patronCalibracion?.vencimientoCertificadoPatron || ''}
                            onChange={(e) => {
                              const pat = { ...(selectedLoop.patronCalibracion || { equipoPatron: '', serialPatron: '', certificadoPatronNumero: '', vencimientoCertificadoPatron: '' }), vencimientoCertificadoPatron: e.target.value };
                              updateLoops(loops.map((l) => (l.id === selectedLoop.id ? { ...l, patronCalibracion: pat } : l)));
                            }}
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 5-Point Calibration Readings Table */}
                    {selectedLoop.calibrationPoints.length === 0 ? (
                      <div className="p-6 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-lg space-y-2">
                        <p className="text-slate-500 text-xs">
                          Este instrumento no tiene puntos de calibración generados.
                        </p>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => {
                              const fsRange = selectedLoop.rangeMax - selectedLoop.rangeMin || 1;
                              const pts = [0, 25, 50, 75, 100].map((pct) => {
                                const expected = selectedLoop.rangeMin + (fsRange * pct) / 100;
                                return {
                                  inputPercent: pct,
                                  expectedVal: Number(expected.toFixed(2)),
                                  measuredVal: Number(expected.toFixed(2)),
                                  measuredAscending: Number(expected.toFixed(2)),
                                  measuredDescending: Number(expected.toFixed(2)),
                                  errorPercentFs: 0,
                                  passed: true,
                                };
                              });
                              updateLoops(
                                loops.map((l) =>
                                  l.id === selectedLoop.id
                                    ? { ...l, calibrationPoints: pts }
                                    : l
                                )
                              );
                            }}
                            className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded font-medium text-xs shadow-sm"
                          >
                            Generar 5 Puntos ISA 20 (0%, 25%, 50%, 75%, 100%)
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                            <th className="p-2.5">Punto (%)</th>
                            <th className="p-2.5">Valor Teórico ({selectedLoop.unit})</th>
                            <th className="p-2.5">Ascendente ({selectedLoop.unit})</th>
                            <th className="p-2.5">Descendente ({selectedLoop.unit})</th>
                            <th className="p-2.5">Error Máx (%FS)</th>
                            <th className="p-2.5 text-center">Dictamen</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {selectedLoop.calibrationPoints.map((pt, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                              <td className="p-2.5 font-mono font-bold">{pt.inputPercent}%</td>
                              <td className="p-2.5 font-mono text-slate-600 dark:text-slate-400">
                                {pt.expectedVal.toFixed(2)}
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="number"
                                  step="0.01"
                                  disabled={isReadOnly}
                                  value={pt.measuredAscending ?? pt.measuredVal}
                                  onChange={(e) =>
                                    handleUpdatePointReading(
                                      selectedLoop.id,
                                      idx,
                                      'measuredAscending',
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-24 px-2 py-1 border border-slate-300 dark:border-slate-700 rounded font-mono text-xs bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                                />
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="number"
                                  step="0.01"
                                  disabled={isReadOnly}
                                  value={pt.measuredDescending ?? pt.measuredVal}
                                  onChange={(e) =>
                                    handleUpdatePointReading(
                                      selectedLoop.id,
                                      idx,
                                      'measuredDescending',
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-24 px-2 py-1 border border-slate-300 dark:border-slate-700 rounded font-mono text-xs bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                                />
                              </td>
                              <td className="p-2.5 font-mono font-bold">
                                {pt.errorPercentFs.toFixed(3)}%
                              </td>
                              <td className="p-2.5 text-center">
                                {pt.passed ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Conforme
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-bold">
                                    <AlertTriangle className="w-3.5 h-3.5" /> No Conforme
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    )}

                    <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setActiveStep(1)}
                        className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 inline-flex items-center gap-1"
                      >
                        <ArrowLeft className="w-4 h-4" /> Anterior
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveStep(3)}
                        className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium inline-flex items-center gap-1.5 shadow-sm"
                      >
                        Ver Certificado DEL-INST-CERT-052 <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: DOCUMENT PREVIEW DEL-INST-CERT-052 */}
                {activeStep === 3 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                      <h4 className="font-bold text-ink dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4 text-brand-500" />
                        Paso 3: Certificado Final QA/QC (DEL-INST-CERT-052)
                      </h4>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                        Databook Cap. 03 / Sec. 3.2
                      </span>
                    </div>

                    {/* HTML Document Canvas */}
                    <div className="bg-white text-slate-900 p-6 rounded-xl border border-slate-300 shadow-md text-xs font-sans space-y-5">
                      {/* Co-Branding Header */}
                      <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-6 h-6 text-red-700" />
                          <div>
                            <span className="font-bold text-sm text-red-700 block">PDVSA GAS</span>
                            <span className="text-[10px] text-slate-600 block">OPERADOR Y CUSTODIO</span>
                          </div>
                        </div>

                        <div className="text-center">
                          <h2 className="font-bold text-xs uppercase tracking-wider">CERTIFICADO DE CALIBRACIÓN DE INSTRUMENTOS</h2>
                          <span className="text-[10px] font-mono text-slate-600">DOCUMENTO NORMATIVO DEL-INST-CERT-052</span>
                        </div>

                        <div className="flex items-center gap-2 text-right">
                          <div>
                            <span className="font-bold text-xs text-slate-800 block">PROINTECA C.A.</span>
                            <span className="text-[10px] text-slate-600 block">CONTRATISTA QA/QC</span>
                          </div>
                          <ShieldCheck className="w-6 h-6 text-slate-800" />
                        </div>
                      </div>

                      {/* Section 1: Identification */}
                      <div className="border p-3 rounded bg-slate-50 space-y-1 text-[11px]">
                        <div className="font-bold text-slate-800 border-b pb-1">1. IDENTIFICACIÓN DEL INSTRUMENTO Y ÁREA CLASIFICADA</div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                          <div><strong>Tag Instrumento:</strong> {selectedLoop.tagNo}</div>
                          <div><strong>Tag Lazo:</strong> {selectedLoop.loopTag}</div>
                          <div><strong>Plano P&ID:</strong> {selectedLoop.pidNumber}</div>
                          <div><strong>Tipo / Función:</strong> {selectedLoop.instrumentType}</div>
                          <div><strong>Rango Operativo:</strong> {selectedLoop.rangeMin} a {selectedLoop.rangeMax} {selectedLoop.unit}</div>
                          <div><strong>Tolerancia FS:</strong> ±{selectedLoop.toleranceFsPercent}%</div>
                          <div><strong>Clasificación Eléctrica:</strong> {selectedLoop.areaClasificada?.clase} {selectedLoop.areaClasificada?.division} ({selectedLoop.areaClasificada?.tCode})</div>
                          <div><strong>Técnico Instrumentista:</strong> {selectedLoop.calibratedBy || 'Por asignar'}</div>
                        </div>
                      </div>

                      {/* Section 2: ISA 20 Results Table */}
                      <div>
                        <div className="font-bold text-slate-800 mb-1 text-[11px]">2. RESULTADOS DE PRUEBA 5 PUNTOS (ISA 20)</div>
                        <table className="w-full border-collapse border border-slate-400 text-[10px]">
                          <thead>
                            <tr className="bg-slate-200 text-slate-900 border-b border-slate-400 font-bold">
                              <th className="border border-slate-400 p-1 text-center">% Escala</th>
                              <th className="border border-slate-400 p-1 text-center">Teórico ({selectedLoop.unit})</th>
                              <th className="border border-slate-400 p-1 text-center">Lectura Asc.</th>
                              <th className="border border-slate-400 p-1 text-center">Lectura Desc.</th>
                              <th className="border border-slate-400 p-1 text-center">Error %FS</th>
                              <th className="border border-slate-400 p-1 text-center">Dictamen</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedLoop.calibrationPoints.map((pt, i) => (
                              <tr key={i} className="border-b border-slate-300">
                                <td className="border border-slate-400 p-1 text-center font-bold">{pt.inputPercent}%</td>
                                <td className="border border-slate-400 p-1 text-center font-mono">{pt.expectedVal.toFixed(2)}</td>
                                <td className="border border-slate-400 p-1 text-center font-mono">{pt.measuredAscending ?? pt.measuredVal}</td>
                                <td className="border border-slate-400 p-1 text-center font-mono">{pt.measuredDescending ?? pt.measuredVal}</td>
                                <td className="border border-slate-400 p-1 text-center font-mono font-bold">{pt.errorPercentFs.toFixed(3)}%</td>
                                <td className="border border-slate-400 p-1 text-center font-bold">
                                  {pt.passed ? (
                                    <span className="text-emerald-700">CONFORME</span>
                                  ) : (
                                    <span className="text-red-700">NO CONFORME</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Section 3: Standard Equipment */}
                      <div className="border p-2.5 rounded bg-slate-50 text-[10px] space-y-0.5">
                        <div className="font-bold text-slate-800">3. EQUIPO PATRÓN Y TRAZABILIDAD</div>
                        <div>Equipo: {selectedLoop.patronCalibracion?.equipoPatron} | Serial: {selectedLoop.patronCalibracion?.serialPatron} | Certificado: {selectedLoop.patronCalibracion?.certificadoPatronNumero} | Vencimiento: {selectedLoop.patronCalibracion?.vencimientoCertificadoPatron}</div>
                      </div>

                      {/* Section 4: Tripartite Signatures */}
                      <div>
                        <div className="font-bold text-slate-800 mb-2 text-[11px]">4. FIRMAS TRIPARTITAS Y VALIDACIÓN EN CAMPO</div>
                        <div className="grid grid-cols-3 gap-3 text-[10px] text-center">
                          <div className="border border-slate-300 p-2 rounded">
                            <div className="font-bold">TÉCNICO I&C</div>
                            <div className="my-2 font-mono text-slate-500 text-[9px]">[FIRMADO DIGITALMENTE]</div>
                            <div>{selectedLoop.calibratedBy || 'Técnico Instrumentista'}</div>
                          </div>
                          <div className="border border-slate-300 p-2 rounded">
                            <div className="font-bold">INSPECTOR QA/QC</div>
                            <div className="my-2 font-mono text-slate-500 text-[9px]">[FIRMADO DIGITALMENTE]</div>
                            <div>Ing. QA/QC Instrumentación</div>
                          </div>
                          <div className="border border-slate-300 p-2 rounded">
                            <div className="font-bold">CUSTODIO OPERADOR / DCS</div>
                            <div className="my-2 font-mono text-slate-500 text-[9px]">[PENDIENTE VALIDACIÓN DCS]</div>
                            <div>Superintendente de Operaciones</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-start">
                      <button
                        type="button"
                        onClick={() => setActiveStep(2)}
                        className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 inline-flex items-center gap-1 text-xs"
                      >
                        <ArrowLeft className="w-4 h-4" /> Volver a Captura
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-ink dark:text-slate-100 text-sm">
                Registrar Nuevo Lazo P&ID
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddLoop} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Tag Instrumento *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. PT-101A"
                    value={newTagNo}
                    onChange={(e) => setNewTagNo(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Tag de Lazo *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. LOOP-101"
                    value={newLoopTag}
                    onChange={(e) => setNewLoopTag(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Tipo de Instrumento</label>
                  <select
                    value={newInstrumentType}
                    onChange={(e) => setNewInstrumentType(e.target.value as InstrumentType)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900"
                  >
                    <option value="PT">PT - Presión</option>
                    <option value="TT">TT - Temperatura</option>
                    <option value="FT">FT - Flujo</option>
                    <option value="LT">LT - Nivel</option>
                    <option value="PSV">PSV - Válvula Alivio</option>
                    <option value="CV">CV - Válvula Control</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Plano P&ID Ref.</label>
                  <input
                    type="text"
                    placeholder="ej. P&ID-SJ-101-REV2"
                    value={newPidNumber}
                    onChange={(e) => setNewPidNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Rango Mín</label>
                  <input
                    type="number"
                    value={newRangeMin}
                    onChange={(e) => setNewRangeMin(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Rango Máx</label>
                  <input
                    type="number"
                    value={newRangeMax}
                    onChange={(e) => setNewRangeMax(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Unidad</label>
                  <input
                    type="text"
                    placeholder="PSI, °C..."
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Instrumentista Responsable</label>
                <input
                  type="text"
                  placeholder="ej. Ing. Carlos Mendoza"
                  value={newCalibratedBy}
                  onChange={(e) => setNewCalibratedBy(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded font-medium"
                >
                  Guardar Lazo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
