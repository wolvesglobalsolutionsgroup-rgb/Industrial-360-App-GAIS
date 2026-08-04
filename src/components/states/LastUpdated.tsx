import React from 'react';
import { Clock, RefreshCw } from 'lucide-react';

export interface LastUpdatedProps {
  timestamp?: string | number | Date | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  label?: string;
  className?: string;
}

export const LastUpdated: React.FC<LastUpdatedProps> = ({
  timestamp,
  onRefresh,
  isRefreshing = false,
  label = 'Sincronizado',
  className = '',
}) => {
  const formatTime = (ts?: string | number | Date | null): string => {
    if (!ts) return 'Recientemente';
    const date = ts instanceof Date ? ts : new Date(ts);
    if (isNaN(date.getTime())) return 'Fecha no disponible';

    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return 'Hace un instante';
    if (diffSeconds < 3600) return `Hace ${Math.floor(diffSeconds / 60)} min`;
    if (diffSeconds < 86400) return `Hace ${Math.floor(diffSeconds / 3600)} h`;

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString();
  };

  return (
    <div className={`inline-flex items-center gap-2 text-[11px] font-mono text-ink-soft bg-surface-2 px-2.5 py-1 rounded-lg border border-line ${className}`}>
      <Clock size={12} className="text-ink-faint shrink-0" />
      <span>
        {label}: <strong className="text-ink font-semibold">{formatTime(timestamp)}</strong>
      </span>

      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Actualizar datos"
          className="ml-1 p-0.5 rounded text-ink-faint hover:text-brand-600 dark:hover:text-brand-300 disabled:opacity-50 cursor-pointer transition-colors"
        >
          <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      )}
    </div>
  );
};

export default LastUpdated;
