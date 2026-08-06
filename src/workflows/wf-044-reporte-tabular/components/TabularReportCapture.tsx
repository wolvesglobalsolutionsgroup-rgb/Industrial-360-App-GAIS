import React from 'react';
import { WorkflowComponentProps } from '../../../lib/workflows/contracts';
import { Table, Plus, Trash2, ShieldCheck, FileSpreadsheet } from 'lucide-react';

export interface TabularJointItem {
  jointId: string;
  kpHour: string;
  ndtResult: 'APPROVED' | 'REJECTED' | 'REPAIR';
  ultrasonicThicknessMm: number;
}

export interface TabularReportData {
  reportCode: string;
  welderId: string;
  pipeDiameterInches: number;
  inspectorName: string;
  items: TabularJointItem[];
}

export const TabularReportCapture: React.FC<WorkflowComponentProps<TabularReportData>> = ({
  data,
  onChange,
  isReadOnly,
}) => {
  const items = data.items || [];

  const handleAddItem = () => {
    const newItem: TabularJointItem = {
      jointId: `J-2026-${(items.length + 1).toString().padStart(3, '0')}`,
      kpHour: 'KP 12+100 (12:00)',
      ndtResult: 'APPROVED',
      ultrasonicThicknessMm: 7.1,
    };
    onChange({ items: [...items, newItem] });
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...items];
    updated.splice(index, 1);
    onChange({ items: updated });
  };

  const handleItemChange = (index: number, field: keyof TabularJointItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ items: updated });
  };

  const approvedCount = items.filter((i) => i.ndtResult === 'APPROVED').length;
  const passRate = items.length > 0 ? ((approvedCount / items.length) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6 bg-surface border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-lg font-bold text-ink flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            Reporte Tabular de Inspección NDT & Soldadura
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Norma API 1104 / ASME IX — Registro de juntas soldadas y ensayo por Ultrasonido (UT)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            Tasa de Aprobación: {passRate}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">
            Código de Reporte NDT *
          </label>
          <input
            type="text"
            value={data.reportCode || ''}
            onChange={(e) => onChange({ reportCode: e.target.value })}
            disabled={isReadOnly}
            placeholder="Ej. REP-NDT-2026-001"
            className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-ink focus:outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">
            Ficha / Estampa del Soldador *
          </label>
          <input
            type="text"
            value={data.welderId || ''}
            onChange={(e) => onChange({ welderId: e.target.value })}
            disabled={isReadOnly}
            placeholder="Ej. W-CIV-1845236"
            className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-ink focus:outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">
            Diámetro de Tubería (pulgadas) *
          </label>
          <input
            type="number"
            value={data.pipeDiameterInches || 6}
            onChange={(e) => onChange({ pipeDiameterInches: parseFloat(e.target.value) || 0 })}
            disabled={isReadOnly}
            className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-ink focus:outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">
            Inspector NDT Level II *
          </label>
          <input
            type="text"
            value={data.inspectorName || ''}
            onChange={(e) => onChange({ inspectorName: e.target.value })}
            disabled={isReadOnly}
            placeholder="Tec. Roberto Gómez"
            className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-ink focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Interactive Data Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-2">
            <Table className="w-4 h-4 text-brand-500" />
            Tabla de Juntas y Espesores Medidos ({items.length} registros)
          </h4>
          {!isReadOnly && (
            <button
              type="button"
              onClick={handleAddItem}
              className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-semibold hover:bg-brand-600 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir Junta
            </button>
          )}
        </div>

        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-left text-xs text-ink">
            <thead className="bg-muted text-muted-foreground uppercase font-bold border-b border-border">
              <tr>
                <th className="px-3 py-2">Identificador de Junta</th>
                <th className="px-3 py-2">Ubicación KP / Posición</th>
                <th className="px-3 py-2">Espesor UT (mm)</th>
                <th className="px-3 py-2">Dictamen NDT</th>
                {!isReadOnly && <th className="px-3 py-2 text-right">Acción</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground italic">
                    No se han registrado juntas aún. Haga clic en "Añadir Junta" para agregar datos.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-surface/50">
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.jointId}
                        onChange={(e) => handleItemChange(idx, 'jointId', e.target.value)}
                        disabled={isReadOnly}
                        className="w-full bg-surface border border-border rounded px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.kpHour}
                        onChange={(e) => handleItemChange(idx, 'kpHour', e.target.value)}
                        disabled={isReadOnly}
                        className="w-full bg-surface border border-border rounded px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.1"
                        value={item.ultrasonicThicknessMm}
                        onChange={(e) => handleItemChange(idx, 'ultrasonicThicknessMm', parseFloat(e.target.value) || 0)}
                        disabled={isReadOnly}
                        className="w-28 bg-surface border border-border rounded px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={item.ndtResult}
                        onChange={(e) => handleItemChange(idx, 'ndtResult', e.target.value as any)}
                        disabled={isReadOnly}
                        className={`w-full border rounded px-2 py-1 text-xs font-semibold ${
                          item.ndtResult === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                            : item.ndtResult === 'REJECTED'
                            ? 'bg-red-500/10 text-red-600 border-red-500/30'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                        }`}
                      >
                        <option value="APPROVED">APROBADO</option>
                        <option value="REPAIR">REPARACIÓN</option>
                        <option value="REJECTED">RECHAZADO</option>
                      </select>
                    </td>
                    {!isReadOnly && (
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                          title="Eliminar fila"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
