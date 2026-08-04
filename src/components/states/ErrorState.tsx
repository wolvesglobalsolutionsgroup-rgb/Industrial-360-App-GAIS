import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  code?: string;
  onRetry?: () => void;
  className?: string;
  testId?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Error de Carga',
  message = 'Ocurrió un inconveniente al consultar la información. Por favor reintente o contacte a soporte si el problema persiste.',
  code,
  onRetry,
  className = '',
  testId = 'error-state',
}) => {
  return (
    <div
      data-testid={testId}
      role="alert"
      aria-live="assertive"
      className={`flex flex-col items-center justify-center p-8 sm:p-10 text-center bg-rose-500/5 dark:bg-rose-950/20 rounded-3xl border border-rose-500/30 shadow-2xs ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center mb-4 shadow-2xs shrink-0">
        <AlertTriangle size={28} />
      </div>

      <h3 className="text-base sm:text-lg font-black text-ink tracking-tight font-display">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-ink-soft mt-1.5 max-w-md font-medium leading-relaxed">
        {message}
      </p>

      {code && (
        <div className="mt-3 px-2.5 py-1 rounded-lg bg-surface border border-line text-[11px] font-mono text-ink-faint">
          Código de referencia: <span className="font-bold text-rose-600 dark:text-rose-400">{code}</span>
        </div>
      )}

      {onRetry && (
        <div className="mt-6">
          <Button variant="outline" onClick={onRetry} className="gap-2">
            <RefreshCw size={14} />
            Reintentar Carga
          </Button>
        </div>
      )}
    </div>
  );
};

export default ErrorState;
