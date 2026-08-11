import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';
import * as Sentry from '@sentry/react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
    this.setState({ error, errorInfo });

    // Report to Sentry only if VITE_SENTRY_DSN environment variable is explicitly configured (opt-in)
    const sentryDsn = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SENTRY_DSN;
    if (sentryDsn) {
      try {
        Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
      } catch (err) {
        console.warn('[ErrorBoundary] Failed to send error report to Sentry:', err);
      }
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6 bg-slate-900 text-white rounded-2xl border border-red-500/30 shadow-2xl my-4">
          <div className="max-w-xl w-full space-y-6 text-center">
            <div className="inline-flex p-4 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 shadow-inner">
              <ShieldAlert className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest bg-red-500/20 text-red-300 border border-red-500/30 rounded-full">
                Excepción Controlada de Seguridad / UI
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Error de Renderizado en Módulo
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-lg mx-auto">
                Se ha detectado una falla inesperada en este componente. El sistema ha aislado el error para prevenir la degradación de la sesión o la pérdida de datos del proyecto.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
                <span className="text-red-400 font-bold block">
                  {this.state.error.name}: {this.state.error.message}
                </span>
                {this.state.errorInfo?.componentStack && (
                  <details className="text-slate-400 text-[11px] cursor-pointer">
                    <summary className="hover:text-slate-200 underline">Ver Stack de Componentes</summary>
                    <pre className="mt-2 p-2 bg-slate-900 rounded border border-slate-800 overflow-x-auto text-[10px] leading-tight">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Reintentar Componente
              </button>
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" /> Recargar Página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
