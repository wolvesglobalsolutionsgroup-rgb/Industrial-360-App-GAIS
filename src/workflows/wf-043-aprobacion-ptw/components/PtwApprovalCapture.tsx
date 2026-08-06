import React from 'react';
import { WorkflowComponentProps } from '../../../lib/workflows/contracts';
import { ShieldAlert, Flame, Gauge, Lock, Send, CheckCircle2, XCircle } from 'lucide-react';

export interface PtwApprovalData {
  ptwCode: string;
  workType: 'caliente' | 'frio' | 'espacio_confinado' | 'excavacion' | 'altura';
  lelPercentage: number;
  o2Percentage: number;
  h2sPpm: number;
  lotoVerified: boolean;
  supervisorName: string;
  safetyInspectorName: string;
  status: 'draft' | 'submitted' | 'safety_approved' | 'rejected';
}

export const PtwApprovalCapture: React.FC<WorkflowComponentProps<PtwApprovalData>> = ({
  data,
  onChange,
  onTransition,
  currentState,
  isReadOnly,
}) => {
  return (
    <div className="space-y-6 bg-surface border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-lg font-bold text-ink flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            Permiso de Trabajo Seguro (PTW SIHO-A)
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Norma PDVSA SI-S-04 — Evaluación atmosférica, LOTO y aprobación secuencial
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
            currentState === 'safety_approved'
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
              : currentState === 'submitted'
              ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
              : currentState === 'rejected'
              ? 'bg-red-500/10 text-red-600 border-red-500/30'
              : 'bg-muted text-muted-foreground border-border'
          }`}>
            Estado: {currentState.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">
            Código de Permiso PTW *
          </label>
          <input
            type="text"
            value={data.ptwCode || ''}
            onChange={(e) => onChange({ ptwCode: e.target.value })}
            disabled={isReadOnly || currentState !== 'draft'}
            placeholder="Ej. PTW-2026-CRP-089"
            className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-ink focus:outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">
            Clasificación de Trabajo de Alto Riesgo *
          </label>
          <select
            value={data.workType || 'caliente'}
            onChange={(e) => onChange({ workType: e.target.value as any })}
            disabled={isReadOnly || currentState !== 'draft'}
            className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-ink focus:outline-none focus:border-brand-500"
          >
            <option value="caliente">Trabajo en Caliente (Soldadura /Corte /Chispa)</option>
            <option value="frio">Trabajo en Frío (Mecánico /Ajuste)</option>
            <option value="espacio_confinado">Espacio Confinado (Tanques /Vasos)</option>
            <option value="excavacion">Excavación Zanja (&gt; 1.2m)</option>
            <option value="altura">Trabajo en Altura (&gt; 1.5m)</option>
          </select>
        </div>
      </div>

      {/* Proof of Gases */}
      <div className="p-4 bg-surface border border-border rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-brand-500" />
          <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
            Prueba de Gases y Atmósfera (Hard Gate SIHO-A)
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              % LEL (Gases Combustibles) [Requerido: 0.0%]
            </label>
            <input
              type="number"
              step="0.1"
              value={data.lelPercentage ?? 0}
              onChange={(e) => onChange({ lelPercentage: parseFloat(e.target.value) || 0 })}
              disabled={isReadOnly}
              className={`w-full px-3 py-2 text-sm bg-surface border rounded-lg text-ink focus:outline-none ${
                data.lelPercentage === 0 ? 'border-emerald-500' : 'border-red-500 text-red-600'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              % O2 (Oxígeno) [Requerido: 19.5% - 23.5%]
            </label>
            <input
              type="number"
              step="0.1"
              value={data.o2Percentage ?? 20.9}
              onChange={(e) => onChange({ o2Percentage: parseFloat(e.target.value) || 0 })}
              disabled={isReadOnly}
              className={`w-full px-3 py-2 text-sm bg-surface border rounded-lg text-ink focus:outline-none ${
                data.o2Percentage >= 19.5 && data.o2Percentage <= 23.5 ? 'border-emerald-500' : 'border-red-500 text-red-600'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              PPM H2S (Sulfhídrico) [Requerido: 0 PPM]
            </label>
            <input
              type="number"
              value={data.h2sPpm ?? 0}
              onChange={(e) => onChange({ h2sPpm: parseInt(e.target.value, 10) || 0 })}
              disabled={isReadOnly}
              className={`w-full px-3 py-2 text-sm bg-surface border rounded-lg text-ink focus:outline-none ${
                data.h2sPpm === 0 ? 'border-emerald-500' : 'border-red-500 text-red-600'
              }`}
            />
          </div>
        </div>
      </div>

      {/* LOTO Verification */}
      <div className="p-4 bg-surface border border-border rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-amber-500" />
          <div>
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
              Aislamiento Seguro de Energía LOTO
            </h4>
            <p className="text-xs text-muted-foreground">
              Desenergización, bloqueo físico y etiquetado cero energía verificado en campo
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => !isReadOnly && onChange({ lotoVerified: !data.lotoVerified })}
          disabled={isReadOnly}
          className={`px-4 py-2 rounded-lg text-xs font-semibold border flex items-center gap-2 ${
            data.lotoVerified
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
              : 'bg-red-500/10 text-red-600 border-red-500/30'
          }`}
        >
          {data.lotoVerified ? 'LOTO Verificado (Aislado)' : 'LOTO Pendiente (No Aislado)'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">
            Supervisor Solicitante
          </label>
          <input
            type="text"
            value={data.supervisorName || ''}
            onChange={(e) => onChange({ supervisorName: e.target.value })}
            disabled={isReadOnly}
            placeholder="Ing. Manuel Rivas"
            className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-ink"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">
            Inspector SIHO-A Aprobador
          </label>
          <input
            type="text"
            value={data.safetyInspectorName || ''}
            onChange={(e) => onChange({ safetyInspectorName: e.target.value })}
            disabled={isReadOnly}
            placeholder="Ing. Carlos Mendoza / SIHO Inspector"
            className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-ink"
          />
        </div>
      </div>

      {/* Transition buttons if onTransition provided */}
      {onTransition && !isReadOnly && (
        <div className="flex items-center gap-3 border-t border-border pt-4 justify-end">
          {currentState === 'draft' && (
            <button
              type="button"
              onClick={() => onTransition('submitted')}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Enviar a Revisión SIHO-A
            </button>
          )}

          {currentState === 'submitted' && (
            <>
              <button
                type="button"
                onClick={() => onTransition('rejected')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Rechazar Permiso
              </button>
              <button
                type="button"
                onClick={() => onTransition('safety_approved')}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Aprobar y Emitir PTW
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
