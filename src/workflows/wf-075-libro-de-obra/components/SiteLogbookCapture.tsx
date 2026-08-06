import React from 'react';
import { WorkflowComponentProps } from '../../../lib/workflows/contracts';
import { SiteLogbookData } from '../definition';
import { BookOpen, AlertCircle, PlusCircle, CheckCircle } from 'lucide-react';

export const SiteLogbookCapture: React.FC<WorkflowComponentProps<SiteLogbookData>> = ({
  data,
  onChange,
  isReadOnly,
}) => {
  const addEntry = () => {
    const nextNumber = (data.dailyEntries?.length || 0) + 1;
    const newEntry = {
      entryNumber: nextNumber,
      date: new Date().toISOString().split('T')[0],
      description: '',
      weatherCondition: 'bueno' as const,
      manpowerCount: 10,
      incidentsReported: false,
    };
    onChange({ dailyEntries: [...(data.dailyEntries || []), newEntry] });
  };

  const updateEntry = (index: number, updatedField: Record<string, any>) => {
    const updated = [...(data.dailyEntries || [])];
    updated[index] = { ...updated[index], ...updatedField };
    onChange({ dailyEntries: updated });
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-lg p-5">
        <h3 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-brand-500" />
          Libro de Obra Digital (16 Secciones Reglamentarias GPG / PDVSA)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Código Libro de Obra
            </label>
            <input
              type="text"
              value={data.bookCode || ''}
              onChange={(e) => onChange({ bookCode: e.target.value })}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-ink font-mono"
              placeholder="LO-2026-OILGAS-01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Ingeniero Residente
            </label>
            <input
              type="text"
              value={data.residentEngineer || ''}
              onChange={(e) => onChange({ residentEngineer: e.target.value })}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-ink"
              placeholder="Ing. Carlos Mendoza"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Inspector de Obra PDVSA
            </label>
            <input
              type="text"
              value={data.inspectorName || ''}
              onChange={(e) => onChange({ inspectorName: e.target.value })}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-ink"
              placeholder="Ing. Roberto Gómez"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Fecha Inicio del Libro
            </label>
            <input
              type="date"
              value={data.startDate || ''}
              onChange={(e) => onChange({ startDate: e.target.value })}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-ink"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Fecha Cierre del Libro
            </label>
            <input
              type="date"
              value={data.endDate || ''}
              onChange={(e) => onChange({ endDate: e.target.value })}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-ink"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer p-2 border border-border rounded-md w-full bg-surface-subtle">
              <input
                type="checkbox"
                checked={data.isSealed || false}
                onChange={(e) => onChange({ isSealed: e.target.checked })}
                disabled={isReadOnly}
                className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-ink flex items-center gap-1">
                {data.isSealed ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Libro Cerrado y Sellado Digitalmente
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    Libro Abierto (Pendiente Sellado)
                  </>
                )}
              </span>
            </label>
          </div>
        </div>

        {/* Daily Entries */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-semibold text-ink">Asientos Diarios de Obra ({data.dailyEntries?.length || 0})</h4>
            {!isReadOnly && (
              <button
                type="button"
                onClick={addEntry}
                className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Nuevo Asiento Diario
              </button>
            )}
          </div>

          <div className="space-y-4">
            {(data.dailyEntries || []).map((entry, idx) => (
              <div key={idx} className="p-4 border border-border rounded-lg bg-surface-subtle space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
                  <span className="font-mono text-xs font-bold text-brand-500 uppercase">
                    Asiento Nº #{entry.entryNumber}
                  </span>
                  <input
                    type="date"
                    value={entry.date}
                    onChange={(e) => updateEntry(idx, { date: e.target.value })}
                    disabled={isReadOnly}
                    className="px-2 py-1 text-xs border border-border rounded bg-surface text-ink"
                  />
                </div>

                <div>
                  <textarea
                    rows={2}
                    value={entry.description}
                    onChange={(e) => updateEntry(idx, { description: e.target.value })}
                    disabled={isReadOnly}
                    placeholder="Escriba las actividades ejecutadas, novedades o instrucciones..."
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface text-ink focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-ink-muted mb-1">Clima / Atmosférico</label>
                    <select
                      value={entry.weatherCondition}
                      onChange={(e) => updateEntry(idx, { weatherCondition: e.target.value })}
                      disabled={isReadOnly}
                      className="w-full px-2 py-1 border border-border rounded bg-surface text-ink"
                    >
                      <option value="bueno">Bueno / Despejado</option>
                      <option value="lluvia_moderada">Lluvia Moderada</option>
                      <option value="lluvia_fuerte">Lluvia Fuerte</option>
                      <option value="inoperativo">Inoperativo por Clima</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-ink-muted mb-1">Personal en Sitio</label>
                    <input
                      type="number"
                      min="0"
                      value={entry.manpowerCount}
                      onChange={(e) => updateEntry(idx, { manpowerCount: parseInt(e.target.value) || 0 })}
                      disabled={isReadOnly}
                      className="w-full px-2 py-1 border border-border rounded bg-surface text-ink font-mono"
                    />
                  </div>

                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={entry.incidentsReported}
                        onChange={(e) => updateEntry(idx, { incidentsReported: e.target.checked })}
                        disabled={isReadOnly}
                        className="w-4 h-4 rounded text-red-500"
                      />
                      <span className="text-ink font-medium">Incidente Ocurrido</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
