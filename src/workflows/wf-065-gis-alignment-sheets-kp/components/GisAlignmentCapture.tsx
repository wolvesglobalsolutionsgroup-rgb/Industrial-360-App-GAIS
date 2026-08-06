import React from 'react';
import { WorkflowComponentProps } from '../../../lib/workflows/contracts';
import { GisAlignmentData } from '../definition';
import { Map, CheckCircle2, AlertTriangle, Globe } from 'lucide-react';

export const GisAlignmentCapture: React.FC<WorkflowComponentProps<GisAlignmentData>> = ({
  data,
  onChange,
  isReadOnly,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-lg p-5">
        <h3 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
          <Map className="w-5 h-5 text-brand-500" />
          Alignment Sheets / Georreferenciación KP y Cartografía GIS
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Código Alignment Sheet
            </label>
            <input
              type="text"
              value={data.sheetCode || ''}
              onChange={(e) => onChange({ sheetCode: e.target.value })}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-ink font-mono"
              placeholder="ALIGN-KP-000-010"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Segmento de Tubería / Gasoducto
            </label>
            <input
              type="text"
              value={data.pipelineSegment || ''}
              onChange={(e) => onChange({ pipelineSegment: e.target.value })}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-ink"
              placeholder="Gasoducto Jusepín - San Joaquín 26''"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Datum Topográfico
            </label>
            <select
              value={data.datum || 'REGVEN'}
              onChange={(e) => onChange({ datum: e.target.value as any })}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-ink"
            >
              <option value="REGVEN">REGVEN (Sirgas Venezuela)</option>
              <option value="WGS84">WGS 84</option>
              <option value="PSAD56">PSAD 56</option>
            </select>
          </div>
        </div>

        {/* KP Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-surface-subtle border border-border">
            <label className="block text-xs text-ink-muted uppercase tracking-wider font-medium mb-1">
              KP Inicial (Km)
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={data.startKp ?? 0}
              onChange={(e) => onChange({ startKp: parseFloat(e.target.value) || 0 })}
              disabled={isReadOnly}
              className="w-full px-2 py-1 border border-border rounded bg-surface text-ink font-mono font-bold"
            />
          </div>

          <div className="p-4 rounded-lg bg-surface-subtle border border-border">
            <label className="block text-xs text-ink-muted uppercase tracking-wider font-medium mb-1">
              KP Final (Km)
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={data.endKp ?? 0}
              onChange={(e) => onChange({ endKp: parseFloat(e.target.value) || 0 })}
              disabled={isReadOnly}
              className={`w-full px-2 py-1 border rounded bg-surface font-mono font-bold ${
                data.endKp <= data.startKp ? 'border-red-500 text-red-500' : 'border-border text-ink'
              }`}
            />
            {data.endKp <= data.startKp && (
              <span className="text-xs text-red-500 mt-1 block">KP final debe ser mayor a KP inicial</span>
            )}
          </div>

          <div className="p-4 rounded-lg bg-surface-subtle border border-border">
            <label className="block text-xs text-ink-muted uppercase tracking-wider font-medium mb-1">
              Vértices UTM / GIS
            </label>
            <input
              type="number"
              min="2"
              value={data.coordinatesCount ?? 2}
              onChange={(e) => onChange({ coordinatesCount: parseInt(e.target.value) || 2 })}
              disabled={isReadOnly}
              className="w-full px-2 py-1 border border-border rounded bg-surface text-ink font-mono font-bold"
            />
          </div>

          <div className="p-4 rounded-lg bg-surface-subtle border border-border flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.kmzValidated || false}
                onChange={(e) => onChange({ kmzValidated: e.target.checked })}
                disabled={isReadOnly}
                className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500"
              />
              <span className="text-xs font-semibold text-ink flex items-center gap-1">
                {data.kmzValidated ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    KMZ Validado Topográficamente
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    KMZ Sin Validar
                  </>
                )}
              </span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-muted mb-1">
            Observaciones de Levantamiento Topográfico y Clandestinidad
          </label>
          <textarea
            rows={3}
            value={data.inspectorNotes || ''}
            onChange={(e) => onChange({ inspectorNotes: e.target.value })}
            disabled={isReadOnly}
            placeholder="Detalles del levantamiento RTK/GPS, servidumbre de paso y puntos de cruce..."
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface text-ink focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>
    </div>
  );
};
