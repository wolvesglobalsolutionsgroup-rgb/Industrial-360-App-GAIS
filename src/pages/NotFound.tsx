import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface border border-line rounded-xl p-8 shadow-soft text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold text-ink tracking-tight mb-2">404</h1>
        <h2 className="text-xl font-semibold text-ink mb-3">Página no encontrada</h2>
        <p className="text-sm text-muted mb-6 leading-relaxed">
          La ruta que intentas consultar no existe o fue movida dentro de la plataforma Industrial Control 360.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 rounded-lg border border-line text-ink hover:bg-surface-2 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Regresar
          </button>

          <button
            onClick={() => navigate('/')}
            className="px-4 py-2.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Home className="w-4 h-4" />
            Ir al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}
