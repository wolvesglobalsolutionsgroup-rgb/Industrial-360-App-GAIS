import React from 'react';
import { FolderOpen } from 'lucide-react';
import { Button } from '../ui/Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryAction?: React.ReactNode;
  className?: string;
  testId?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  subtitle,
  actionLabel,
  onAction,
  secondaryAction,
  className = '',
  testId = 'empty-state',
}) => {
  const bodyText = description || subtitle || '';
  return (
    <div
      data-testid={testId}
      role="region"
      aria-label={title}
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-surface rounded-3xl border border-dashed border-line shadow-2xs ${className}`}
    >
      <div className="w-16 h-16 rounded-3xl bg-brand-500/10 text-brand-600 dark:text-brand-300 border border-brand-500/20 flex items-center justify-center mb-4 shadow-2xs shrink-0">
        {icon || <FolderOpen size={32} />}
      </div>

      <h3 className="text-lg font-black text-ink tracking-tight font-display">
        {title}
      </h3>

      {bodyText && (
        <p className="text-xs sm:text-sm text-ink-soft mt-1.5 max-w-md font-medium leading-relaxed">
          {bodyText}
        </p>
      )}

      {(onAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          {onAction && actionLabel && (
            <Button onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryAction}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
