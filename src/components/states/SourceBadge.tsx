import React from 'react';
import { Database, Sparkles, Calculator, BookOpen, Globe } from 'lucide-react';

export type SourceType = 'firestore' | 'qa_seed' | 'calculation' | 'norm' | 'external_api' | string;

export interface SourceBadgeProps {
  source: SourceType;
  label?: string;
  detail?: string;
  className?: string;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({
  source,
  label,
  detail,
  className = '',
}) => {
  const getSourceConfig = (src: SourceType) => {
    switch (src) {
      case 'firestore':
        return {
          bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          icon: Database,
          defaultLabel: 'Firestore Real',
        };
      case 'qa_seed':
        return {
          bg: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40 font-mono',
          icon: Sparkles,
          defaultLabel: 'QA Seed Synthetic',
        };
      case 'calculation':
        return {
          bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
          icon: Calculator,
          defaultLabel: 'Cálculo Físico',
        };
      case 'norm':
        return {
          bg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
          icon: BookOpen,
          defaultLabel: 'Norma Técnica',
        };
      case 'external_api':
        return {
          bg: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
          icon: Globe,
          defaultLabel: 'API Externa',
        };
      default:
        return {
          bg: 'bg-surface-2 text-ink-soft border-line',
          icon: Database,
          defaultLabel: src,
        };
    }
  };

  const config = getSourceConfig(source);
  const Icon = config.icon;
  const displayLabel = label || config.defaultLabel;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold border transition-colors ${config.bg} ${className}`}
      title={detail ? `${displayLabel} — ${detail}` : displayLabel}
    >
      <Icon size={12} className="shrink-0" />
      <span>{displayLabel}</span>
      {detail && <span className="opacity-75 font-normal">({detail})</span>}
    </span>
  );
};

export default SourceBadge;
