import React from 'react';
import { WorkflowComponentProps } from '../../../lib/workflows/contracts';
import { ConstructionTerminationData } from '../definition';
import { CheckCircle, ShieldCheck, Flame, FileSpreadsheet } from 'lucide-react';

export const ConstructionTerminationCapture: React.FC<WorkflowComponentProps<ConstructionTerminationData>> = ({
  data,
  onChange,
  isReadOnly,
}) => {
  const isExpiredPsv = React.useMemo(() => {
    if (!data.psvExpirationDate) return false;
    return new Date(data.psvExpirationDate) < new Date();
  }, [data.psvExpirationDate]);

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-lg p-5">
        <h3 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-brand-500" />
          Acta de Terminación de Construcción y Transferencia de Custodia (GPG Fase 7)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Código de Acta de Transferencia
            </label>
            <input
              type="text"
              value={data.transferCertificateCode || ''}
              onChange={(e) => onChange({ transferCertificateCode: e.target.value })}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-ink font-mono"
              placeholder="ACTA-TRF-2026-PLANT-01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Área / Planta / Instalación
            </label>
            <input
              type="text"
              value={data.facilityArea || ''}
              onChange={(e) => onChange({ facilityArea: e.target.value })}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-ink"
              placeholder="Estación de Flujo Santa Bárbara EF-04"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">
              Fecha de Transferencia
            </label>
            <input
              type="date"
              value={data.transferDate || new Date().toISOString().split('T')[0]}
              onChange={(e) => onChange({ transferDate: e.target.value })}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-ink"
            />
          </div>
        </div>

        {/* PSV Calibration Gate Section */}
        <div className="p-4 border border-border rounded-lg bg-surface-subtle space-y-4 mb-6">
          <h4 className="text-sm font-semibold text-ink flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            Válvulas de Seguridad PSV / PRV (Certificación de Banco de Pruebas)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 cursor-pointer p-3 border border-border rounded-md bg-surface">
              <input
                type="checkbox"
                checked={data.psvCalibrated || false}
                onChange={(e) => onChange({ psvCalibrated: e.target.checked })}
                disabled={isReadOnly}
                className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-ink flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Válvulas PSV Calibradas en Banco Autorizado
              </span>
            </label>

            <div>
              <label className="block text-xs text-ink-muted uppercase tracking-wider font-medium mb-1">
                Fecha Vencimiento Certificado PSV
              </label>
              <input
                type="date"
                value={data.psvExpirationDate || ''}
                onChange={(e) => onChange({ psvExpirationDate: e.target.value })}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded bg-surface font-mono ${
                  isExpiredPsv ? 'border-red-500 text-red-500' : 'border-border text-ink'
                }`}
              />
              {isExpiredPsv && (
                <span className="text-xs text-red-500 mt-1 block">¡Certificación PSV Vencida!</span>
              )}
            </div>
          </div>
        </div>

        {/* Walkthrough & As-Built Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <label className="flex items-center gap-2 cursor-pointer p-3 border border-border rounded-md bg-surface-subtle">
            <input
              type="checkbox"
              checked={data.walkthroughCompleted || false}
              onChange={(e) => onChange({ walkthroughCompleted: e.target.checked })}
              disabled={isReadOnly}
              className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500"
            />
            <span className="text-sm font-semibold text-ink">
              Caminata de Recepción Final (Walkthrough) Completada
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer p-3 border border-border rounded-md bg-surface-subtle">
            <input
              type="checkbox"
              checked={data.asBuiltDrawingsApproved || false}
              onChange={(e) => onChange({ asBuiltDrawingsApproved: e.target.checked })}
              disabled={isReadOnly}
              className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500"
            />
            <span className="text-sm font-semibold text-ink flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-brand-500" />
              Planos Como Construido (As-Built) Aprobados
            </span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-muted mb-1">
            Observaciones de la Comisión de Transferencia de Operaciones
          </label>
          <textarea
            rows={3}
            value={data.inspectorNotes || ''}
            onChange={(e) => onChange({ inspectorNotes: e.target.value })}
            disabled={isReadOnly}
            placeholder="Dictamen de entrega formal del activo a la Gerencia de Operaciones PDVSA..."
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface text-ink focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>
    </div>
  );
};
