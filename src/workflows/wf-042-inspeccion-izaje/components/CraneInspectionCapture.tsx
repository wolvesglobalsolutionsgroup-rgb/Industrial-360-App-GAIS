import React from 'react';
import { WorkflowComponentProps, WorkflowDefinition } from '../../../lib/workflows/contracts';
import { ShieldCheck, AlertTriangle, CheckCircle2, FileText, Check, X } from 'lucide-react';

export interface CraneInspectionData {
  craneCode: string;
  capacityTons: number;
  inspectionDate: string;
  slingCondition: 'operativa' | 'desgaste_menor' | 'critica_reemplazar';
  hookLatchIntact: boolean;
  hydraulicLeakDetected: boolean;
  inspectorNotes: string;
}

export const CraneInspectionCapture: React.FC<WorkflowComponentProps<CraneInspectionData>> = ({
  data,
  onChange,
  isReadOnly,
}) => {
  return (
    <div className="space-y-6 bg-surface border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-lg font-bold text-ink flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-500" />
            Inspección Pre-Operativa de Grúas y Aparejos
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Norma ASME B30.5 & OSHA 1926.1412 — Verificación de seguridad de maniobras de izaje
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-500 border border-brand-500/20">
          Fase 4: Inspección
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">
            Código / Ficha de la Grúa *
          </label>
          <input
            type="text"
            value={data.craneCode || ''}
            onChange={(e) => onChange({ craneCode: e.target.value })}
            disabled={isReadOnly}
            placeholder="Ej. GRU-TEREX-004"
            className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-ink focus:outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">
            Capacidad Máxima (Toneladas) *
          </label>
          <input
            type="number"
            value={data.capacityTons || 0}
            onChange={(e) => onChange({ capacityTons: parseFloat(e.target.value) || 0 })}
            disabled={isReadOnly}
            placeholder="Ej. 120"
            className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-ink focus:outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">
            Fecha de Inspección *
          </label>
          <input
            type="date"
            value={data.inspectionDate || ''}
            onChange={(e) => onChange({ inspectionDate: e.target.value })}
            disabled={isReadOnly}
            className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-ink focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">
            Estado de Eslingas y Grilletes
          </label>
          <select
            value={data.slingCondition || 'operativa'}
            onChange={(e) => onChange({ slingCondition: e.target.value as any })}
            disabled={isReadOnly}
            className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-ink focus:outline-none focus:border-brand-500"
          >
            <option value="operativa">Operativa - Sin Desgaste</option>
            <option value="desgaste_menor">Desgaste Menor - Monitoreo</option>
            <option value="critica_reemplazar">CRÍTICA - Reemplazar Inmediatamente</option>
          </select>
        </div>

        <div className="p-3 bg-surface border border-border rounded-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-ink block">Pestillo de Seguridad en Gancho</span>
            <span className="text-[11px] text-muted-foreground">Hard Gate ASME B30.5</span>
          </div>
          <button
            type="button"
            onClick={() => !isReadOnly && onChange({ hookLatchIntact: !data.hookLatchIntact })}
            disabled={isReadOnly}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
              data.hookLatchIntact
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                : 'bg-red-500/10 text-red-600 border border-red-500/30'
            }`}
          >
            {data.hookLatchIntact ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
            {data.hookLatchIntact ? 'Intacto (OK)' : 'Defectuoso (Bloqueo)'}
          </button>
        </div>

        <div className="p-3 bg-surface border border-border rounded-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-ink block">Fuga Hidráulica Detectada</span>
            <span className="text-[11px] text-muted-foreground">Sistemas de elevación / pluma</span>
          </div>
          <button
            type="button"
            onClick={() => !isReadOnly && onChange({ hydraulicLeakDetected: !data.hydraulicLeakDetected })}
            disabled={isReadOnly}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
              data.hydraulicLeakDetected
                ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
            }`}
          >
            {data.hydraulicLeakDetected ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            {data.hydraulicLeakDetected ? 'SI (Fuga)' : 'NO (Limpio)'}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1">
          Observaciones Técnicas del Inspector NDT / SIHO *
        </label>
        <textarea
          rows={3}
          value={data.inspectorNotes || ''}
          onChange={(e) => onChange({ inspectorNotes: e.target.value })}
          disabled={isReadOnly}
          placeholder="Ingrese detalles del estado de los cables, prueba de freno y prueba de capacidad..."
          className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-ink focus:outline-none focus:border-brand-500"
        />
      </div>
    </div>
  );
};
