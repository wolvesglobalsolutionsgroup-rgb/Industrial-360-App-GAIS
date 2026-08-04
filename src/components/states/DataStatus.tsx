import React from 'react';
import EmptyState, { EmptyStateProps } from './EmptyState';
import ErrorState, { ErrorStateProps } from './ErrorState';
import PermissionDenied, { PermissionDeniedProps } from './PermissionDenied';

export type DataStatusType = 'loading' | 'error' | 'empty' | 'ready' | 'forbidden';

export interface DataStatusProps {
  status: DataStatusType;
  children: React.ReactNode;
  loadingFallback?: React.ReactNode;
  errorProps?: ErrorStateProps;
  emptyProps?: EmptyStateProps;
  permissionProps?: PermissionDeniedProps;
  className?: string;
}

export const DataStatus: React.FC<DataStatusProps> = ({
  status,
  children,
  loadingFallback,
  errorProps,
  emptyProps,
  permissionProps,
  className = '',
}) => {
  if (status === 'loading') {
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    }
    return (
      <div className={`flex flex-col items-center justify-center p-12 bg-surface rounded-3xl border border-line ${className}`}>
        <div className="w-10 h-10 border-3 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-ink-soft font-mono">Cargando datos verificados...</p>
      </div>
    );
  }

  if (status === 'forbidden') {
    return (
      <PermissionDenied
        {...permissionProps}
        className={className}
      />
    );
  }

  if (status === 'error') {
    return (
      <ErrorState
        {...errorProps}
        className={className}
      />
    );
  }

  if (status === 'empty') {
    return (
      <EmptyState
        title={emptyProps?.title || 'Sin registros'}
        description={emptyProps?.description || 'No se encontraron datos para los filtros u organización seleccionados.'}
        {...emptyProps}
        className={className}
      />
    );
  }

  return <div className={className}>{children}</div>;
};

export default DataStatus;
