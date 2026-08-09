import React from 'react';
import { WorkflowComponentProps } from '../../../lib/workflows/contracts';
import { EngineeringProgressData } from '../definition';
import { ShieldAlert, TrendingUp, Calculator } from 'lucide-react';

export const EngineeringProgressCapture: React.FC<WorkflowComponentProps<EngineeringProgressData>> = ({
  data,
  onChange,
  isReadOnly,
}) => {
  const handleDeliverableProgressChange = (index: number, progressPct: number) => {
    const updated = [...(data.deliverables || [])];
    updated[index] = { ...updated[index], progressPct };
    
    // Calculate new overall actual progress
    const totalWeight = updated.reduce((sum, item) => sum + item.weight, 0);
    const weightedProgress = updated.reduce(
      (sum, item) => sum + item.weight * (item.progressPct / 100),
      0
    );
    const calculatedActual = totalWeight > 0 ? Number(((weightedProgress / totalWeight) * 100).toFixed(2)) : 0;
    
    // EV = PV_budget * (%Actual / 100)
    const budget = data.plannedValueUSD || 0;
    const earnedUSD = Number((budget * (calculatedActual / 100)).toFixed(2));

    onChange({
      deliverables: updated,
      actualProgressPct: calculatedActual,
      earnedValueUSD: earnedUSD,
    });
  };

  const pv = data.plannedValueUSD || 0;
  const ev = data.earnedValueUSD || 0;
  const ac = data.actualCostUSD || 0;

  const sv = Number((ev - pv).toFixed(2));
  const cv = Number((ev - ac).toFixed(2));
  const spi = pv > 0 ? Number((ev / pv).toFixed(3)) : 1.0;
  const cpi = ac > 0 ? Number((ev / ac).toFixed(3)) : 1.0;

  const isLowEfficiency = spi < 0.85 || cpi < 0.85;

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-lg p-5">
        <h3 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-500" />
          Medición de Avance de Ingeniería con EVM (Earned Value Management)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Código de Reporte
            </label>
            <input
              type="text"
              value={data.reportCode || ''}
              onChange={(e) => onChange({ reportCode: e.target.value })}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-ink focus:ring-2 focus:ring-brand-500"
              placeholder="REP-ING-2026-001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Fecha de Reporte
            </label>
            <input
              type="date"
              value={data.reportDate || ''}
              onChange={(e) => onChange({ reportDate: e.target.value })}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-ink focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              % Avance Programado (%Prog Plan)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={data.plannedProgressPct || 0}
              onChange={(e) => onChange({ plannedProgressPct: parseFloat(e.target.value) || 0 })}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-ink focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* EVM Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-surface-subtle border border-border">
            <span className="text-xs text-ink-muted uppercase tracking-wider font-medium">Valor Planificado (PV)</span>
            <div className="text-xl font-bold text-ink mt-1 font-mono">${pv.toLocaleString()} USD</div>
          </div>

          <div className="p-4 rounded-lg bg-surface-subtle border border-border">
            <span className="text-xs text-ink-muted uppercase tracking-wider font-medium">Valor Ganado (EV)</span>
            <div className="text-xl font-bold text-ink mt-1 font-mono">${ev.toLocaleString()} USD</div>
            <span className="text-xs text-ink-muted mt-1 block">% Real: {data.actualProgressPct}%</span>
          </div>

          <div className="p-4 rounded-lg bg-surface-subtle border border-border">
            <span className="text-xs text-ink-muted uppercase tracking-wider font-medium">Costo Real (AC)</span>
            <input
              type="number"
              min="0"
              value={data.actualCostUSD || 0}
              onChange={(e) => onChange({ actualCostUSD: parseFloat(e.target.value) || 0 })}
              disabled={isReadOnly}
              className="w-full mt-1 px-2 py-1 text-base font-bold font-mono border border-border rounded bg-surface text-ink"
            />
          </div>

          <div className={`p-4 rounded-lg border ${isLowEfficiency ? 'bg-amber-500/10 border-amber-500/30' : 'bg-surface-subtle border-border'}`}>
            <span className="text-xs text-ink-muted uppercase tracking-wider font-medium flex items-center gap-1">
              Indicadores SPI / CPI
              {isLowEfficiency && <ShieldAlert className="w-4 h-4 text-amber-500" />}
            </span>
            <div className="text-lg font-bold text-ink mt-1 font-mono">
              SPI: <span className={spi < 0.85 ? 'text-red-500' : 'text-emerald-500'}>{spi}</span> | CPI: <span className={cpi < 0.85 ? 'text-red-500' : 'text-emerald-500'}>{cpi}</span>
            </div>
            <span className="text-xs text-ink-muted mt-1 block">SV: ${sv} | CV: ${cv}</span>
          </div>
        </div>

        {/* Deliverables Breakdown */}
        <div className="mt-6">
          <h4 className="text-md font-semibold text-ink mb-3 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-brand-500" />
            Desglose de Entregables de Ingeniería
          </h4>
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface-subtle border-b border-border text-xs uppercase text-ink-muted font-semibold">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Entregable</th>
                  <th className="px-4 py-3 text-right">Peso (%)</th>
                  <th className="px-4 py-3 text-right">% Avance Actual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-ink">
                {(data.deliverables || []).map((del, idx) => (
                  <tr key={del.code || idx}>
                    <td className="px-4 py-3 font-mono font-medium">{del.code}</td>
                    <td className="px-4 py-3">{del.title}</td>
                    <td className="px-4 py-3 text-right font-mono">{del.weight}%</td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={del.progressPct}
                        onChange={(e) => handleDeliverableProgressChange(idx, parseFloat(e.target.value) || 0)}
                        disabled={isReadOnly}
                        className="w-20 px-2 py-1 text-right border border-border rounded bg-surface text-ink font-mono"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
