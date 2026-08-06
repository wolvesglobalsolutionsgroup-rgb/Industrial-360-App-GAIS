import React from 'react';
import { WorkflowComponentProps } from '../../../lib/workflows/contracts';
import { Bim3dWeldingIntegrityData } from '../definition';
import { Box, ShieldCheck, AlertOctagon, Cpu } from 'lucide-react';

export const Bim3dWeldingCapture: React.FC<WorkflowComponentProps<Bim3dWeldingIntegrityData>> = ({
  data,
  onChange,
  isReadOnly,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-lg p-5">
        <h3 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
          <Box className="w-5 h-5 text-brand-500" />
          Integridad de Soldadura, BIM 3D y Navegabilidad ILI / PIG
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Código / ID de Spool BIM 3D
            </label>
            <input
              type="text"
              value={data.spoolId || ''}
              onChange={(e) => onChange({ spoolId: e.target.value })}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-ink font-mono"
              placeholder="SPOOL-BIM-26-088"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Diámetro Nominal (Pulgadas)
            </label>
            <input
              type="number"
              min="1"
              step="0.5"
              value={data.pipeDiameterInches || 24}
              onChange={(e) => onChange({ pipeDiameterInches: parseFloat(e.target.value) || 24 })}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-ink font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Espesor de Pared Nominal (mm)
            </label>
            <input
              type="number"
              min="1"
              step="0.1"
              value={data.wallThicknessMm || 12.7}
              onChange={(e) => onChange({ wallThicknessMm: parseFloat(e.target.value) || 12.7 })}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-ink font-mono"
            />
          </div>
        </div>

        {/* Geometry & PIG Navigability Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-surface-subtle border border-border">
            <label className="block text-xs text-ink-muted uppercase tracking-wider font-medium mb-1">
              Radio Mínimo Curvatura (R/D)
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              value={data.minRadiusD || 3.0}
              onChange={(e) => onChange({ minRadiusD: parseFloat(e.target.value) || 3.0 })}
              disabled={isReadOnly}
              className={`w-full px-2 py-1 border rounded bg-surface font-mono font-bold ${
                data.minRadiusD < 3.0 ? 'border-red-500 text-red-500' : 'border-border text-ink'
              }`}
            />
            <span className="text-xs text-ink-muted mt-1 block">Requerido &gt;= 3D para PIG</span>
          </div>

          <div className="p-4 rounded-lg bg-surface-subtle border border-border">
            <label className="block text-xs text-ink-muted uppercase tracking-wider font-medium mb-1">
              Ovalidad (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={data.ovalityPercentage || 1.5}
              onChange={(e) => onChange({ ovalityPercentage: parseFloat(e.target.value) || 0 })}
              disabled={isReadOnly}
              className={`w-full px-2 py-1 border rounded bg-surface font-mono font-bold ${
                data.ovalityPercentage > 3.0 ? 'border-red-500 text-red-500' : 'border-border text-ink'
              }`}
            />
            <span className="text-xs text-ink-muted mt-1 block">Límite máx. ASME: 3.0%</span>
          </div>

          <div className="p-4 rounded-lg bg-surface-subtle border border-border">
            <label className="block text-xs text-ink-muted uppercase tracking-wider font-medium mb-1">
              Ángulo Doblez en Frío (grados)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="90"
              value={data.coldBendAngleDeg || 15}
              onChange={(e) => onChange({ coldBendAngleDeg: parseFloat(e.target.value) || 0 })}
              disabled={isReadOnly}
              className="w-full px-2 py-1 border border-border rounded bg-surface text-ink font-mono font-bold"
            />
          </div>

          <div className="p-4 rounded-lg bg-surface-subtle border border-border">
            <label className="block text-xs text-ink-muted uppercase tracking-wider font-medium mb-1">
              Anomalías ILI Detectadas
            </label>
            <input
              type="number"
              min="0"
              value={data.defectCountILI || 0}
              onChange={(e) => onChange({ defectCountILI: parseInt(e.target.value) || 0 })}
              disabled={isReadOnly}
              className="w-full px-2 py-1 border border-border rounded bg-surface text-ink font-mono font-bold"
            />
          </div>
        </div>

        {/* Hard Gates Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <label className="flex items-center gap-2 cursor-pointer p-3 border border-border rounded-md bg-surface-subtle">
            <input
              type="checkbox"
              checked={data.pigNavigable || false}
              onChange={(e) => onChange({ pigNavigable: e.target.checked })}
              disabled={isReadOnly}
              className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500"
            />
            <span className="text-sm font-semibold text-ink flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-brand-500" />
              Paso de Rascador Inteligente (PIG) Garantizado
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer p-3 border border-border rounded-md bg-surface-subtle">
            <input
              type="checkbox"
              checked={data.coldBendApprovedPDVSA || false}
              onChange={(e) => onChange({ coldBendApprovedPDVSA: e.target.checked })}
              disabled={isReadOnly}
              className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500"
            />
            <span className="text-sm font-semibold text-ink flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Doblez en Frío Aprobado Norma PDVSA H-221
            </span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-muted mb-1">
            Dictamen de Integridad de Soldadura e Inspección Visual / NDT
          </label>
          <textarea
            rows={3}
            value={data.inspectorNotes || ''}
            onChange={(e) => onChange({ inspectorNotes: e.target.value })}
            disabled={isReadOnly}
            placeholder="Evaluación de desalineamiento de junta, geometría y registro en modelo digital BIM..."
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface text-ink focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>
    </div>
  );
};
