import React from 'react';
import { Lock, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';

export interface PermissionDeniedProps {
  title?: string;
  moduleName?: string;
  requiredRole?: string | string[];
  message?: string;
  onContactAdmin?: () => void;
  className?: string;
  testId?: string;
}

export const PermissionDenied: React.FC<PermissionDeniedProps> = ({
  title = 'Acceso Restringido',
  moduleName,
  requiredRole,
  message,
  onContactAdmin,
  className = '',
  testId = 'permission-denied',
}) => {
  const roleText = Array.isArray(requiredRole)
    ? requiredRole.join(', ')
    : requiredRole;

  const defaultMessage = moduleName
    ? `No posee los permisos necesarios para acceder al módulo "${moduleName}".`
    : 'No posee privilegios suficientes para consultar esta información o ejecutar esta acción.';

  return (
    <div
      data-testid={testId}
      role="alert"
      aria-label="Acceso Denegado"
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-amber-500/5 dark:bg-amber-950/20 rounded-3xl border border-amber-500/30 shadow-2xs ${className}`}
    >
      <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mb-4 shadow-2xs shrink-0">
        <ShieldAlert size={32} />
      </div>

      <h3 className="text-lg font-black text-ink tracking-tight font-display flex items-center gap-2">
        <Lock size={18} className="text-amber-600 dark:text-amber-400" />
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-ink-soft mt-1.5 max-w-md font-medium leading-relaxed">
        {message || defaultMessage}
      </p>

      {roleText && (
        <div className="mt-3 px-3 py-1 rounded-xl bg-surface border border-line text-[11px] font-mono text-ink-soft">
          Rol requerido: <span className="font-bold text-amber-600 dark:text-amber-400">{roleText}</span>
        </div>
      )}

      {onContactAdmin && (
        <div className="mt-6">
          <Button variant="secondary" onClick={onContactAdmin}>
            Solicitar Permiso al Administrador
          </Button>
        </div>
      )}
    </div>
  );
};

export default PermissionDenied;
