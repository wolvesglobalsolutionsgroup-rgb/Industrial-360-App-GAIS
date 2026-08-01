import React from 'react';
import { BrandKit } from '../../ProjectContext';
import { OperatorBrandPreset } from '../../lib/brandKitPresets';

interface DualHeaderProps {
  contractorBrand: BrandKit;
  operatorBrand?: BrandKit | OperatorBrandPreset;
  documentTitle: string;
  documentCode?: string;
  documentDate?: string;
  statusBadge?: string;
}

export const DualHeader: React.FC<DualHeaderProps> = ({
  contractorBrand,
  operatorBrand,
  documentTitle,
  documentCode,
  documentDate,
  statusBadge,
}) => {
  const isOperatorDraft = operatorBrand && 'status' in operatorBrand && operatorBrand.status === 'DRAFT';

  return (
    <div className="w-full bg-surface border border-surface-border rounded-xl p-4 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-surface-border pb-3">
        {/* Contractor Branding (Left) */}
        <div className="flex items-center gap-3 min-w-[220px]">
          {contractorBrand.logoUrl ? (
            <img
              src={contractorBrand.logoUrl}
              alt={contractorBrand.companyName}
              className="h-12 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-brand-500/10 border border-brand-500/30 flex items-center justify-center font-bold text-brand-500 text-sm">
              {contractorBrand.companyName.substring(0, 3).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider">{contractorBrand.companyName}</h3>
            <p className="text-[11px] text-ink-faint">{contractorBrand.taxId}</p>
            <p className="text-[10px] text-ink-faint">{contractorBrand.address}</p>
          </div>
        </div>

        {/* Center Document Title */}
        <div className="text-center flex-1 px-2">
          <h1 className="text-base font-extrabold text-ink uppercase tracking-wide">{documentTitle}</h1>
          <div className="flex items-center justify-center gap-3 mt-1 text-[11px] text-ink-muted">
            {documentCode && <span className="font-mono bg-surface-subtle px-2 py-0.5 rounded border border-surface-border">CÓD: {documentCode}</span>}
            {documentDate && <span>FECHA: {documentDate}</span>}
            {statusBadge && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                statusBadge.toUpperCase() === 'APPROVED' || statusBadge.toUpperCase() === 'APROBADO'
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
              }`}>
                {statusBadge.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Operator Branding (Right) */}
        {operatorBrand ? (
          <div className="flex items-center gap-3 min-w-[220px] justify-end text-right">
            <div>
              <div className="flex items-center justify-end gap-1.5">
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider">{operatorBrand.companyName}</h3>
                {isOperatorDraft && (
                  <span className="text-[9px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">
                    BORRADOR
                  </span>
                )}
              </div>
              <p className="text-[11px] text-ink-faint">{operatorBrand.taxId}</p>
              {'operatorName' in operatorBrand && (
                <p className="text-[10px] font-medium text-brand-500">{operatorBrand.operatorName}</p>
              )}
            </div>
            {operatorBrand.logoUrl ? (
              <img
                src={operatorBrand.logoUrl}
                alt={operatorBrand.companyName}
                className="h-12 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-surface-subtle border border-surface-border flex items-center justify-center font-bold text-ink-muted text-sm">
                OP
              </div>
            )}
          </div>
        ) : (
          <div className="hidden md:block w-[220px]" />
        )}
      </div>

      {isOperatorDraft && (
        <div className="mt-2 text-[10px] text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-2.5 py-1 text-center font-medium">
          ⚠️ MEMBRETE OPERADOR EN MODO BORRADOR (DRAFT): Configuración tenant-scoped pendiente de validación final por la Inspección del Cliente.
        </div>
      )}
    </div>
  );
};
