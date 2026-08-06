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
  const records = data?.records || [
    {
      id: 'civ_001',
      testCode: 'ENS-SUELO-2026-041',
      testType: 'Densidad_Campo_Cono_Arena',
      testDate: '2026-07-22',
      normRef: 'COVENIN 2000-92 / ASTM D1556',
      inspectorName: 'Ing. Roberto Silva',
      laboratoryName: 'Laboratorio Geotécnico Monagas C.A.',
      status: 'Aprobado',
      sandConeData: {
        location: 'Fundación Pedestal Turbocompresor K-101 (Capa 2)',
        layerDepthCm: 30,
        moisturePercent: 8.2,
        wetDensityGcm3: 2.16,
        dryDensityGcm3: 2.0,
        proctorMaxDryDensityGcm3: 2.05,
        compactionPercent: 97.5,
        requiredCompactionPercent: 95.0,
        passed: true,
      },
      notes: 'Ensayo de densidad de campo conforme a especificaciones.',
    },
    {
      id: 'civ_002',
      testCode: 'ENS-CONC-2026-089',
      testType: 'Compresion_Probetas_Concreto',
      testDate: '2026-07-28',
      normRef: 'COVENIN 1753 / ACI 318',
      inspectorName: 'Ing. Carlos Parra',
      laboratoryName: 'Laboratorio de Materiales Oriente',
      status: 'Aprobado',
      concreteData: {
        structureName: 'Pedestal Bomba B-101 / Concreto f\'c=280 kg/cm2',
        batchNumber: 'MEZCLA-2026-104',
        fcDesignKgcm2: 280,
        ageDays: 7,
        measuredStrengthKgcm2: 205,
        expectedPercentAtAge: 65,
        attainedPercentOfFc: 73.2,
        passed: true,
      },
      notes: 'Probeta probada a 7 días. Alcanza 73.2% de f\'c diseño (supera 65%).',
    },
  ];

  const updateRecords = (newRecords: CivilTestRecord[]) => {
    onChange({ records: newRecords, summaryNotes: data?.summaryNotes || '' });
  };

  const handleAddSandCone = () => {
    const newRec: CivilTestRecord = {
      id: `civ_${Date.now()}`,
      testCode: `ENS-SUELO-2026-${Math.floor(100 + Math.random() * 900)}`,
      testType: 'Densidad_Campo_Cono_Arena',
      testDate: new Date().toISOString().split('T')[0],
      normRef: 'COVENIN 2000-92 / ASTM D1556',
      inspectorName: context.user.email,
      laboratoryName: 'Laboratorio Geotécnico Central',
      status: 'Aprobado',
      sandConeData: {
        location: 'Terraplén de Acceso / Vía Principal',
        layerDepthCm: 30,
        moisturePercent: 8.0,
        wetDensityGcm3: 2.12,
        dryDensityGcm3: 1.96,
        proctorMaxDryDensityGcm3: 2.02,
        compactionPercent: 97.0,
        requiredCompactionPercent: 95.0,
        passed: true,
      },
      notes: 'Ensayo de compactación de suelos.',
    };
    updateRecords([...records, newRec]);
  };

  const handleAddConcrete = () => {
    const newRec: CivilTestRecord = {
      id: `civ_${Date.now()}`,
      testCode: `ENS-CONC-2026-${Math.floor(100 + Math.random() * 900)}`,
      testType: 'Compresion_Probetas_Concreto',
      testDate: new Date().toISOString().split('T')[0],
      normRef: 'COVENIN 1753 / ACI 318',
      inspectorName: context.user.email,
      laboratoryName: 'Laboratorio de Materiales Oriente',
      status: 'Aprobado',
      concreteData: {
        structureName: 'Pedestal Estructural de Tubería',
        batchNumber: `MEZCLA-${Math.floor(100 + Math.random() * 900)}`,
        fcDesignKgcm2: 280,
        ageDays: 28,
        measuredStrengthKgcm2: 295,
        expectedPercentAtAge: 100,
        attainedPercentOfFc: 105.3,
        passed: true,
      },
      notes: 'Ruptura de probeta cilindrica de concreto.',
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

      {/* Ensayos Cards */}
      <div className="space-y-4">
        {records.map((rec, idx) => (
          <div
            key={rec.id}
            className="p-4 bg-surface border border-line rounded-xl space-y-3 relative"
          >
            <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-brand-500">{rec.testCode}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-surface-2 text-ink">
                  {rec.testType === 'Densidad_Campo_Cono_Arena'
                    ? 'Densidad de Campo (Cono de Arena)'
                    : 'Compresión Probetas Concreto'}
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  rec.status === 'Aprobado'
                    ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                }`}
              >
                {rec.status}
              </span>
            </div>

            {rec.sandConeData && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-surface-2/50 p-3 rounded-lg">
                <div>
                  <span className="text-ink-faint block">Ubicación:</span>
                  <span className="font-bold text-ink">{rec.sandConeData.location}</span>
                </div>
                <div>
                  <span className="text-ink-faint block">Humedad / Espesor:</span>
                  <span className="font-bold text-ink">
                    {rec.sandConeData.moisturePercent}% | {rec.sandConeData.layerDepthCm} cm
                  </span>
                </div>
                <div>
                  <span className="text-ink-faint block">Densidad Seca:</span>
                  <span className="font-bold text-ink">
                    {rec.sandConeData.dryDensityGcm3} g/cm³ (Proctor {rec.sandConeData.proctorMaxDryDensityGcm3})
                  </span>
                </div>
                <div>
                  <span className="text-ink-faint block">Compactación Alcanzada:</span>
                  <span
                    className={`font-bold ${
                      rec.sandConeData.compactionPercent >= rec.sandConeData.requiredCompactionPercent
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600'
                    }`}
                  >
                    {rec.sandConeData.compactionPercent}% (Req: {rec.sandConeData.requiredCompactionPercent}%)
                  </span>
                </div>
              </div>
            )}

            {rec.concreteData && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-surface-2/50 p-3 rounded-lg">
                <div>
                  <span className="text-ink-faint block">Estructura / Batch:</span>
                  <span className="font-bold text-ink">
                    {rec.concreteData.structureName} ({rec.concreteData.batchNumber})
                  </span>
                </div>
                <div>
                  <span className="text-ink-faint block">f'c Diseño:</span>
                  <span className="font-bold text-ink">{rec.concreteData.fcDesignKgcm2} kg/cm²</span>
                </div>
                <div>
                  <span className="text-ink-faint block">Edad / Esfuerzo:</span>
                  <span className="font-bold text-ink">
                    {rec.concreteData.ageDays} días | {rec.concreteData.measuredStrengthKgcm2} kg/cm²
                  </span>
                </div>
                <div>
                  <span className="text-ink-faint block">% Resistencia f'c:</span>
                  <span
                    className={`font-bold ${
                      rec.concreteData.attainedPercentOfFc >= rec.concreteData.expectedPercentAtAge
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600'
                    }`}
                  >
                    {rec.concreteData.attainedPercentOfFc}% (Req: {rec.concreteData.expectedPercentAtAge}%)
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-ink-faint pt-1">
              <span>
                Lab: {rec.laboratoryName} | Inspector: {rec.inspectorName} | Fecha: {rec.testDate}
              </span>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => updateRecords(records.filter((r) => r.id !== rec.id))}
                  className="text-ink-faint hover:text-rose-500 transition-colors p-1"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

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
