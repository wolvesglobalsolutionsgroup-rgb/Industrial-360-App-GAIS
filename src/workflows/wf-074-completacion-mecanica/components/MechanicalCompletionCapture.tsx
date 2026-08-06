import React from 'react';
import { WorkflowComponentProps } from '../../../lib/workflows/contracts';
import { MechanicalCompletionData } from '../definition';
import { Wrench, CheckSquare, AlertTriangle, FileCheck } from 'lucide-react';

export const MechanicalCompletionCapture: React.FC<WorkflowComponentProps<MechanicalCompletionData>> = ({
  data,
  onChange,
  isReadOnly,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-lg p-5">
        <h3 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-brand-500" />
          Certificado de Completación Mecánica y Dossier de Calidad (GPG Fase 7)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Código de Subsistema / Paquete
            </label>
            <input
              type="text"
              value={data.subsystemCode || ''}
              onChange={(e) => onChange({ subsystemCode: e.target.value })}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-ink font-mono"
              placeholder="MC-SUB-301-A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Nombre del Subsistema
            </label>
            <input
              type="text"
              value={data.subsystemName || ''}
              onChange={(e) => onChange({ subsystemName: e.target.value })}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-ink"
              placeholder="Sistema de Separación Bifásica de Entrada"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Fecha de Completación
            </label>
            <input
              type="date"
              value={data.completionDate || new Date().toISOString().split('T')[0]}
              onChange={(e) => onChange({ completionDate: e.target.value })}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-ink"
            />
          </div>
        </div>

        {/* Punchlist & Quality Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-surface-subtle border border-border">
            <label className="block text-xs text-ink-muted uppercase tracking-wider font-medium mb-1 flex items-center gap-1">
              Punchlist Cat. A (Críticos)
              {data.categoryAPunchCount > 0 && <AlertTriangle className="w-4 h-4 text-red-500" />}
            </label>
            <input
              type="number"
              min="0"
              value={data.categoryAPunchCount ?? 0}
              onChange={(e) => onChange({ categoryAPunchCount: parseInt(e.target.value) || 0 })}
              disabled={isReadOnly}
              className={`w-full px-2 py-1 border rounded bg-surface font-mono font-bold text-lg ${
                data.categoryAPunchCount > 0 ? 'border-red-500 text-red-500' : 'border-border text-emerald-500'
              }`}
            />
            <span className="text-xs text-ink-muted mt-1 block">Debe ser 0 para aprobar</span>
          </div>

          <div className="p-4 rounded-lg bg-surface-subtle border border-border">
            <label className="block text-xs text-ink-muted uppercase tracking-wider font-medium mb-1">
              Punchlist Cat. B (Menores)
            </label>
            <input
              type="number"
              min="0"
              value={data.categoryBPunchCount ?? 0}
              onChange={(e) => onChange({ categoryBPunchCount: parseInt(e.target.value) || 0 })}
              disabled={isReadOnly}
              className="w-full px-2 py-1 border border-border rounded bg-surface text-ink font-mono font-bold text-lg"
            />
            <span className="text-xs text-ink-muted mt-1 block">Permite transferencia condicional</span>
          </div>

          <div className="p-4 rounded-lg bg-surface-subtle border border-border flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.databookComplete || false}
                onChange={(e) => onChange({ databookComplete: e.target.checked })}
                disabled={isReadOnly}
                className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500"
              />
              <span className="text-xs font-semibold text-ink flex items-center gap-1">
                <FileCheck className="w-4 h-4 text-brand-500" />
                Databook de Calidad Completo
              </span>
            </label>
          </div>

          <div className="p-4 rounded-lg bg-surface-subtle border border-border flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.hydrotestCertified || false}
                onChange={(e) => onChange({ hydrotestCertified: e.target.checked })}
                disabled={isReadOnly}
                className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500"
              />
              <span className="text-xs font-semibold text-ink flex items-center gap-1">
                <CheckSquare className="w-4 h-4 text-emerald-500" />
                Pruebas Hidrostáticas Certificadas
              </span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-muted mb-1">
            Observaciones de la Comisión de Completación Mecánica
          </label>
          <textarea
            rows={3}
            value={data.inspectorNotes || ''}
            onChange={(e) => onChange({ inspectorNotes: e.target.value })}
            disabled={isReadOnly}
            placeholder="Resumen de caminata de inspección (walkthrough), estanqueidad y soplado de líneas..."
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface text-ink focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>
    </div>
  );
};
