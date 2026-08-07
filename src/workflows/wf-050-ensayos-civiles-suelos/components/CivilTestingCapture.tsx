import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Scale,
  ShieldCheck,
  Ruler,
  Trash2,
  Layers,
} from 'lucide-react';
import { WorkflowComponentProps } from '../../../lib/workflows/contracts';

export type CivilTestType = 'Densidad_Campo_Cono_Arena' | 'Compresion_Probetas_Concreto';

export interface SandConeTest {
  location: string;
  layerDepthCm: number;
  moisturePercent: number;
  wetDensityGcm3: number;
  dryDensityGcm3: number;
  proctorMaxDryDensityGcm3: number;
  compactionPercent: number;
  requiredCompactionPercent: number;
  passed: boolean;
}

export interface ConcreteCylinderTest {
  structureName: string;
  batchNumber: string;
  fcDesignKgcm2: number;
  ageDays: 7 | 14 | 28;
  measuredStrengthKgcm2: number;
  expectedPercentAtAge: number;
  attainedPercentOfFc: number;
  passed: boolean;
}

export interface CivilTestRecord {
  id: string;
  testCode: string;
  testType: CivilTestType;
  testDate: string;
  normRef: string;
  inspectorName: string;
  laboratoryName: string;
  status: 'Aprobado' | 'Rechazado' | 'En Proceso';
  sandConeData?: SandConeTest;
  concreteData?: ConcreteCylinderTest;
  notes?: string;
}

export interface CivilTestingData {
  records: CivilTestRecord[];
  summaryNotes?: string;
}

export function CivilTestingCapture({
  definition,
  context,
  data,
  onChange,
  isReadOnly = false,
}: WorkflowComponentProps<CivilTestingData>) {
  const records = data?.records ?? [];

  const updateRecords = (newRecords: CivilTestRecord[]) => {
    onChange({ records: newRecords, summaryNotes: data?.summaryNotes || '' });
  };

  const handleAddSandCone = () => {
    const newRec: CivilTestRecord = {
      id: `civ_${Date.now()}`,
      testCode: '',
      testType: 'Densidad_Campo_Cono_Arena',
      testDate: new Date().toISOString().split('T')[0],
      normRef: 'COVENIN 2000-92 / ASTM D1556',
      inspectorName: context.user.email,
      laboratoryName: '',
      status: 'En Proceso',
      sandConeData: {
        location: '',
        layerDepthCm: 30,
        moisturePercent: 0,
        wetDensityGcm3: 0,
        dryDensityGcm3: 0,
        proctorMaxDryDensityGcm3: 0,
        compactionPercent: 0,
        requiredCompactionPercent: 95.0,
        passed: false,
      },
      notes: '',
    };
    updateRecords([...records, newRec]);
  };

  const handleAddConcrete = () => {
    const newRec: CivilTestRecord = {
      id: `civ_${Date.now()}`,
      testCode: '',
      testType: 'Compresion_Probetas_Concreto',
      testDate: new Date().toISOString().split('T')[0],
      normRef: 'COVENIN 1753 / ACI 318',
      inspectorName: context.user.email,
      laboratoryName: '',
      status: 'En Proceso',
      concreteData: {
        structureName: '',
        batchNumber: '',
        fcDesignKgcm2: 280,
        ageDays: 28,
        measuredStrengthKgcm2: 0,
        expectedPercentAtAge: 100,
        attainedPercentOfFc: 0,
        passed: false,
      },
      notes: '',
    };
    updateRecords([...records, newRec]);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="p-4 bg-surface-2 border border-line rounded-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/15 text-sky-600 dark:text-sky-400 rounded-lg">
            <Building2 size={22} />
          </div>
          <div>
            <h3 className="font-bold text-ink">{definition.title}</h3>
            <p className="text-xs text-ink-soft">
              Proyecto: {context.projectId} | Normas COVENIN 2000-92, ASTM D1556, ACI 318
            </p>
          </div>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddSandCone}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              + Densidad Suelo
            </button>
            <button
              type="button"
              onClick={handleAddConcrete}
              className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              + Probeta Concreto
            </button>
          </div>
        )}
      </div>

      {/* Ensayos Cards / EmptyState */}
      {records.length === 0 ? (
        <div className="p-8 text-center bg-surface border border-dashed border-line rounded-xl space-y-3">
          <div className="p-3 bg-sky-500/10 text-sky-600 rounded-full w-fit mx-auto">
            <Building2 size={32} />
          </div>
          <h4 className="font-bold text-ink text-sm">Sin ensayos civiles registrados</h4>
          <p className="text-xs text-ink-soft max-w-md mx-auto">
            No se han ingresado resultados de densidad de campo (Cono de Arena) ni resistencia de probetas de concreto.
          </p>
          {!isReadOnly && (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleAddSandCone}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus size={15} />
                Crear ensayo Densidad Suelo
              </button>
              <button
                type="button"
                onClick={handleAddConcrete}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus size={15} />
                Crear ensayo Probeta Concreto
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((rec, idx) => (
            <div
              key={rec.id}
              className="p-4 bg-surface border border-line rounded-xl space-y-3 relative"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 border-b border-line pb-2">
                <div>
                  <label className="text-[10px] font-bold text-ink-faint">Código Ensayo:</label>
                  <input
                    type="text"
                    value={rec.testCode}
                    disabled={isReadOnly}
                    onChange={(e) => {
                      const updated = [...records];
                      updated[idx].testCode = e.target.value;
                      updateRecords(updated);
                    }}
                    placeholder="ENS-SUELO-2026-XXX"
                    className="w-full p-1.5 bg-surface-2 border border-line rounded text-xs text-ink font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-ink-faint">Laboratorio / Inspector:</label>
                  <input
                    type="text"
                    value={rec.laboratoryName}
                    disabled={isReadOnly}
                    onChange={(e) => {
                      const updated = [...records];
                      updated[idx].laboratoryName = e.target.value;
                      updateRecords(updated);
                    }}
                    placeholder="Laboratorio Geotécnico"
                    className="w-full p-1.5 bg-surface-2 border border-line rounded text-xs text-ink"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-ink-faint">Estado Ensayo:</label>
                  <select
                    value={rec.status}
                    disabled={isReadOnly}
                    onChange={(e) => {
                      const updated = [...records];
                      updated[idx].status = e.target.value as any;
                      updateRecords(updated);
                    }}
                    className="w-full p-1.5 bg-surface-2 border border-line rounded text-xs text-ink font-bold"
                  >
                    <option value="En Proceso">En Proceso</option>
                    <option value="Aprobado">Aprobado</option>
                    <option value="Rechazado">Rechazado</option>
                  </select>
                </div>
              </div>

              {rec.sandConeData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs bg-surface-2/50 p-3 rounded-lg">
                  <div>
                    <label className="text-[10px] font-bold text-ink-faint">Ubicación:</label>
                    <input
                      type="text"
                      value={rec.sandConeData.location}
                      disabled={isReadOnly}
                      onChange={(e) => {
                        const updated = [...records];
                        if (updated[idx].sandConeData) {
                          updated[idx].sandConeData!.location = e.target.value;
                        }
                        updateRecords(updated);
                      }}
                      placeholder="Ubicación de ensayo"
                      className="w-full p-1 bg-surface border border-line rounded text-xs text-ink"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-ink-faint">Densidad Seca / Proctor:</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={rec.sandConeData.dryDensityGcm3 || ''}
                        disabled={isReadOnly}
                        onChange={(e) => {
                          const updated = [...records];
                          if (updated[idx].sandConeData) {
                            updated[idx].sandConeData!.dryDensityGcm3 = Number(e.target.value);
                          }
                          updateRecords(updated);
                        }}
                        placeholder="Seca g/cm³"
                        className="w-1/2 p-1 bg-surface border border-line rounded text-xs text-ink font-bold"
                      />
                      <input
                        type="number"
                        value={rec.sandConeData.proctorMaxDryDensityGcm3 || ''}
                        disabled={isReadOnly}
                        onChange={(e) => {
                          const updated = [...records];
                          if (updated[idx].sandConeData) {
                            updated[idx].sandConeData!.proctorMaxDryDensityGcm3 = Number(e.target.value);
                          }
                          updateRecords(updated);
                        }}
                        placeholder="Proctor g/cm³"
                        className="w-1/2 p-1 bg-surface border border-line rounded text-xs text-ink"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-ink-faint">% Compactación Alcanzada / Requerida:</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={rec.sandConeData.compactionPercent || ''}
                        disabled={isReadOnly}
                        onChange={(e) => {
                          const updated = [...records];
                          if (updated[idx].sandConeData) {
                            const val = Number(e.target.value);
                            updated[idx].sandConeData!.compactionPercent = val;
                            updated[idx].sandConeData!.passed = val >= updated[idx].sandConeData!.requiredCompactionPercent;
                          }
                          updateRecords(updated);
                        }}
                        placeholder="% Alc"
                        className="w-1/2 p-1 bg-surface border border-line rounded text-xs text-ink font-bold"
                      />
                      <input
                        type="number"
                        value={rec.sandConeData.requiredCompactionPercent || 95}
                        disabled={isReadOnly}
                        onChange={(e) => {
                          const updated = [...records];
                          if (updated[idx].sandConeData) {
                            updated[idx].sandConeData!.requiredCompactionPercent = Number(e.target.value);
                          }
                          updateRecords(updated);
                        }}
                        placeholder="% Req"
                        className="w-1/2 p-1 bg-surface border border-line rounded text-xs text-ink"
                      />
                    </div>
                  </div>
                </div>
              )}

              {rec.concreteData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs bg-surface-2/50 p-3 rounded-lg">
                  <div>
                    <label className="text-[10px] font-bold text-ink-faint">Estructura / Batch:</label>
                    <input
                      type="text"
                      value={rec.concreteData.structureName}
                      disabled={isReadOnly}
                      onChange={(e) => {
                        const updated = [...records];
                        if (updated[idx].concreteData) {
                          updated[idx].concreteData!.structureName = e.target.value;
                        }
                        updateRecords(updated);
                      }}
                      placeholder="Pedestal / Elemento"
                      className="w-full p-1 bg-surface border border-line rounded text-xs text-ink"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-ink-faint">f'c Diseño / Medido (kg/cm²):</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={rec.concreteData.fcDesignKgcm2 || ''}
                        disabled={isReadOnly}
                        onChange={(e) => {
                          const updated = [...records];
                          if (updated[idx].concreteData) {
                            updated[idx].concreteData!.fcDesignKgcm2 = Number(e.target.value);
                          }
                          updateRecords(updated);
                        }}
                        placeholder="f'c Dis"
                        className="w-1/2 p-1 bg-surface border border-line rounded text-xs text-ink"
                      />
                      <input
                        type="number"
                        value={rec.concreteData.measuredStrengthKgcm2 || ''}
                        disabled={isReadOnly}
                        onChange={(e) => {
                          const updated = [...records];
                          if (updated[idx].concreteData) {
                            const val = Number(e.target.value);
                            updated[idx].concreteData!.measuredStrengthKgcm2 = val;
                            const fc = updated[idx].concreteData!.fcDesignKgcm2 || 280;
                            const att = Math.round((val / fc) * 1000) / 10;
                            updated[idx].concreteData!.attainedPercentOfFc = att;
                            updated[idx].concreteData!.passed = att >= updated[idx].concreteData!.expectedPercentAtAge;
                          }
                          updateRecords(updated);
                        }}
                        placeholder="Medido kg/cm²"
                        className="w-1/2 p-1 bg-surface border border-line rounded text-xs text-ink font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-ink-faint">% f'c Logrado:</label>
                    <div className="p-1 bg-surface border border-line rounded text-xs text-ink font-bold">
                      {rec.concreteData.attainedPercentOfFc || 0}% (Req: {rec.concreteData.expectedPercentAtAge}%)
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-ink-faint pt-1">
                <span>
                  Inspector: {rec.inspectorName} | Fecha: {rec.testDate}
                </span>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => updateRecords(records.filter((r) => r.id !== rec.id))}
                    className="text-ink-faint hover:text-rose-500 transition-colors p-1"
                    title="Eliminar ensayo"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Notes */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-ink block">
          Dictamen Geotécnico / Estructural del Laboratorio:
        </label>
        <textarea
          rows={3}
          value={data?.summaryNotes || ''}
          onChange={(e) =>
            onChange({
              records,
              summaryNotes: e.target.value,
            })
          }
          disabled={isReadOnly}
          placeholder="Ingrese dictamen técnico del laboratorio de mecánica de suelos o control de concreto..."
          className="w-full p-3 bg-surface border border-line rounded-xl text-xs text-ink focus:ring-2 focus:ring-brand-500 outline-none"
        />
      </div>
    </div>
  );
}
