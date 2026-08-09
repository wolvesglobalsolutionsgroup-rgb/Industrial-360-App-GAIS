import React, { useState } from 'react';
import {
  Cpu,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Gauge,
  Sliders,
  FileText,
} from 'lucide-react';
import { WorkflowComponentProps } from '../../../lib/workflows/contracts';

export type InstrumentType = 'PT' | 'TT' | 'FT' | 'LT' | 'PSV' | 'CV';

export interface CalibrationPoint {
  inputPercent: number; // 0, 25, 50, 75, 100
  expectedVal: number;
  measuredVal: number;
  errorPercentFs: number;
  passed: boolean;
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
  return {
    id: `loop_${Date.now()}`,
    tagNo: params.tagNo.trim().toUpperCase(),
    loopTag: params.loopTag.trim().toUpperCase(),
    pidNumber: (params.pidNumber || '').trim().toUpperCase(),
    instrumentType: params.instrumentType || 'PT',
    description: (params.description || '').trim(),
    location: (params.location || '').trim(),
    rangeMin: params.rangeMin ?? 0,
    rangeMax: params.rangeMax ?? 100,
    unit: (params.unit || 'PSI').trim(),
    toleranceFsPercent: params.toleranceFsPercent ?? 0.5,
    signalType: params.signalType || '4-20mA HART',
    calibrationDate: '',
    nextCalibrationDate: '',
    calibratedBy: (params.calibratedBy || '').trim(),
    status: 'Pendiente Calibración',
    calibrationPoints: [],
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

  const [selectedLoopId, setSelectedLoopId] = useState<string | null>(
    loops.length > 0 ? loops[0].id : null
  );

  // Form for new loop
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
  const [newSignalType, setNewSignalType] = useState<'4-20mA HART' | 'Fieldbus Foundation' | 'Modbus RTU' | 'Neumático 3-15 PSI'>('4-20mA HART');
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

  const handleUpdatePoint = (
    loopId: string,
    pointIndex: number,
    measuredVal: number
  ) => {
    if (isReadOnly) return;
    const nextLoops = loops.map((loop) => {
      if (loop.id !== loopId) return loop;

      const fsRange = loop.rangeMax - loop.rangeMin || 1;
      const updatedPoints = loop.calibrationPoints.map((pt, idx) => {
        if (idx !== pointIndex) return pt;
        const absError = Math.abs(measuredVal - pt.expectedVal);
        const errorPercentFs = Number(((absError / fsRange) * 100).toFixed(3));
        const passed = errorPercentFs <= loop.toleranceFsPercent;
        return {
          ...pt,
          measuredVal,
          errorPercentFs,
          passed,
        };
      });

      const hasFailed = updatedPoints.some((pt) => !pt.passed);
      const status: InstrumentLoop['status'] = hasFailed
        ? 'Fuera de Tolerancia'
        : 'Calibrado & Operativo';

      return {
        ...loop,
        calibrationPoints: updatedPoints,
        status,
      };
    });

    updateLoops(nextLoops);
  };

  return (
    <div className="space-[#1e293b] space-y-6">
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-500/10 text-brand-500 rounded-lg">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink dark:text-slate-100">
              Control e Inspección de Instrumentación P&ID (ISA 5.1 / ASME B31.3)
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Lazos de Control, Transmisores y Calibración de Patrones de Campo
            </p>
          </div>
        </div>

        {!isReadOnly && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Registrar Lazo de Control
          </button>
        )}
      </div>

      {/* Error Messages if Hard Gates trigger */}
      {errors.length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-1">
          {errors.map((err, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 font-medium">
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
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
            Registre los transmisores, switches y lazos de control de la planta para documentar las pruebas de calibración y verificación de rango.
          </p>
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Registrar Lazo de Control
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* List Sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
              Lazos Registrados ({loops.length})
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
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
                      <span className="font-mono text-sm font-bold text-ink dark:text-slate-100">
                        {loop.tagNo}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isPassed
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {loop.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate mb-2">
                      {loop.loopTag}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Rango: {loop.rangeMin} - {loop.rangeMax} {loop.unit}</span>
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

          {/* Loop Details & Calibration Points */}
          <div className="lg:col-span-8">
            {selectedLoop ? (
              <div className="bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 dark:border-slate-800 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-600 dark:text-slate-300">
                        {selectedLoop.instrumentType}
                      </span>
                      <h3 className="text-lg font-bold text-ink dark:text-slate-100 font-mono">
                        {selectedLoop.tagNo}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {selectedLoop.description} — {selectedLoop.location}
                    </p>
                  </div>

                  <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                    <div>P&ID: <strong className="text-slate-700 dark:text-slate-200 font-mono">{selectedLoop.pidNumber}</strong></div>
                    <div>Señal: <strong className="text-slate-700 dark:text-slate-200">{selectedLoop.signalType}</strong></div>
                  </div>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Rango de Operación</span>
                    <span className="font-semibold text-ink dark:text-slate-200">
                      {selectedLoop.rangeMin} a {selectedLoop.rangeMax} {selectedLoop.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Tolerancia FS</span>
                    <span className="font-semibold text-ink dark:text-slate-200">
                      ±{selectedLoop.toleranceFsPercent}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Fecha Calibración</span>
                    <span className="font-semibold text-ink dark:text-slate-200">
                      {selectedLoop.calibrationDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Instrumentista</span>
                    <span className="font-semibold text-ink dark:text-slate-200 truncate block">
                      {selectedLoop.calibratedBy}
                    </span>
                  </div>
                </div>

                {/* Calibration Points Table */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-ink dark:text-slate-100 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-brand-500" />
                      Prueba de Calibración de 5 Puntos (Patrón Fluke / Bomba Neumática)
                    </h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Error Máx. Permitido: ±{selectedLoop.toleranceFsPercent}% FS
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                          <th className="p-2.5">Entrada (%)</th>
                          <th className="p-2.5">Valor Esperado ({selectedLoop.unit})</th>
                          <th className="p-2.5">Valor Medido ({selectedLoop.unit})</th>
                          <th className="p-2.5">Error (%FS)</th>
                          <th className="p-2.5 text-center">Dictamen</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {selectedLoop.calibrationPoints.map((pt, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="p-2.5 font-mono font-medium">{pt.inputPercent}%</td>
                            <td className="p-2.5 font-mono">{pt.expectedVal.toFixed(1)}</td>
                            <td className="p-2.5">
                              {isReadOnly ? (
                                <span className="font-mono">{pt.measuredVal}</span>
                              ) : (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={pt.measuredVal}
                                  onChange={(e) =>
                                    handleUpdatePoint(
                                      selectedLoop.id,
                                      idx,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-24 px-2 py-1 border border-slate-300 dark:border-slate-700 rounded font-mono text-xs bg-surface dark:bg-slate-900 text-ink dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                />
                              )}
                            </td>
                            <td className="p-2.5 font-mono font-medium">
                              {pt.errorPercentFs.toFixed(3)}%
                            </td>
                            <td className="p-2.5 text-center">
                              {pt.passed ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Conforme
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  No Conforme
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-ink dark:text-slate-100 text-base">
                Nuevo Lazo de Instrumentación
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddLoop} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Tag Instrumento *</label>
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
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Tag de Lazo *</label>
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
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Tipo de Instrumento</label>
                  <select
                    value={newInstrumentType}
                    onChange={(e) => setNewInstrumentType(e.target.value as InstrumentType)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
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
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Plano P&ID Ref.</label>
                  <input
                    type="text"
                    placeholder="ej. P&ID-SJ-101"
                    value={newPidNumber}
                    onChange={(e) => setNewPidNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Rango Mín</label>
                  <input
                    type="number"
                    value={newRangeMin}
                    onChange={(e) => setNewRangeMin(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Rango Máx</label>
                  <input
                    type="number"
                    value={newRangeMax}
                    onChange={(e) => setNewRangeMax(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Unidad</label>
                  <input
                    type="text"
                    placeholder="PSI, °C..."
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Ubicación / Módulo</label>
                <input
                  type="text"
                  placeholder="ej. Cabezal de Entrada San Joaquín"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Instrumentista Responsable</label>
                <input
                  type="text"
                  placeholder="ej. Ing. Carlos Mendoza"
                  value={newCalibratedBy}
                  onChange={(e) => setNewCalibratedBy(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-surface dark:bg-slate-900 text-ink dark:text-slate-100"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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
