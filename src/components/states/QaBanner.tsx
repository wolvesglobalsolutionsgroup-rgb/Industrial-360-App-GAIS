import React from 'react';
import { AlertTriangle, Database, ShieldCheck } from 'lucide-react';

export interface QaBannerProps {
  datasetId?: string;
  version?: string;
  source?: string;
  environment?: string;
  orgId?: string;
  className?: string;
}

export const QaBanner: React.FC<QaBannerProps> = ({
  datasetId = 'DS-IC360-QA-CANONICAL',
  version = 'v1.0.0-QA',
  source = 'CONSORCIO O&G QA PILOT',
  environment,
  orgId,
  className = '',
}) => {
  const isQaEnv =
    environment === 'qa' ||
    orgId === 'ic360-qa-pilot' ||
    (typeof window !== 'undefined' && window.location.hostname.includes('qa'));

  if (!isQaEnv) {
    return null;
  }

  return (
    <div
      id="ic360-qa-banner"
      role="banner"
      aria-label="Entorno QA Activo"
      className={`sticky top-0 z-50 w-full bg-amber-500 text-slate-950 px-4 py-2 text-xs font-black flex flex-wrap items-center justify-between gap-2 border-b-2 border-amber-600 shadow-md font-mono print:hidden ${className}`}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} className="text-slate-950 shrink-0" />
        <span className="uppercase tracking-wide font-black text-slate-950">
          ENTORNO QA — DATOS SINTÉTICOS CANÓNICOS — NO OPERACIONAL
        </span>
      </div>

      <div className="flex items-center gap-3 text-[11px] font-bold text-slate-900 opacity-95">
        <span className="flex items-center gap-1">
          <Database size={12} />
          DATASET: <code className="bg-amber-400 px-1.5 py-0.5 rounded border border-amber-600/40 text-slate-950">{datasetId}</code>
        </span>
        <span>
          VER: <code className="bg-amber-400 px-1.5 py-0.5 rounded border border-amber-600/40 text-slate-950">{version}</code>
        </span>
        <span className="hidden md:inline flex items-center gap-1">
          <ShieldCheck size={12} />
          ORIGEN: {source}
        </span>
      </div>
    </div>
  );
};

export default QaBanner;
