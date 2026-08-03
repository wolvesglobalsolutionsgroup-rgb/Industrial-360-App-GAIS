import React from 'react';

export interface QaBannerProps {
  datasetId?: string;
  version?: string;
  source?: string;
  environment?: string;
  orgId?: string;
}

export const QaBanner: React.FC<QaBannerProps> = ({
  datasetId = 'DS-IC360-QA-CANONICAL',
  version = 'v1.0.0-QA',
  source = 'CONSORCIO O&G QA PILOT',
  environment,
  orgId,
}) => {
  const isQaEnv = environment === 'qa' || orgId === 'ic360-qa-pilot';

  if (!isQaEnv) {
    return null;
  }

  return (
    <div
      id="ic360-qa-banner"
      className="sticky top-0 z-50 w-full bg-amber-500 text-slate-950 px-4 py-2 text-xs font-black flex flex-wrap items-center justify-between gap-2 border-b-2 border-amber-600 shadow-md font-mono"
    >
      <div className="flex items-center gap-2">
        <span className="text-base">⚠️</span>
        <span className="uppercase tracking-wide font-black">
          ENTORNO QA — DATOS SINTÉTICOS — NO OPERACIONAL
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px] font-bold text-slate-900 opacity-90">
        <span>DATASET: <code className="bg-amber-400 px-1.5 py-0.5 rounded border border-amber-600/40">{datasetId}</code></span>
        <span>VER: <code className="bg-amber-400 px-1.5 py-0.5 rounded border border-amber-600/40">{version}</code></span>
        <span className="hidden sm:inline">ORIGEN: {source}</span>
      </div>
    </div>
  );
};

export default QaBanner;
