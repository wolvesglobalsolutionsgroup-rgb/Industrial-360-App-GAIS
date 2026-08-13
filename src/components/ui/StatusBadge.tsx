import React from 'react';
import { cn } from '../../lib/utils';

export interface StatusBadgeProps {
  status?: 'success' | 'warning' | 'danger' | 'neutral' | 'active' | 'pending' | 'rejected' | 'completed' | 'in_progress' | 'draft' | string;
  variant?: 'success' | 'warning' | 'danger' | 'neutral' | string;
  label?: string;
  customText?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  label,
  customText,
  className,
  size = 'md',
}) => {
  const normStatus = ((status || variant || '') as string).toLowerCase();

  let styleType: 'success' | 'warning' | 'danger' | 'neutral' = 'neutral';

  if (['success', 'active', 'completed', 'approved', 'pass', 'valido'].includes(normStatus)) {
    styleType = 'success';
  } else if (['warning', 'pending', 'in_progress', 'review', 'pendiente'].includes(normStatus)) {
    styleType = 'warning';
  } else if (['danger', 'rejected', 'failed', 'error', 'expired', 'rechazado'].includes(normStatus)) {
    styleType = 'danger';
  } else {
    styleType = 'neutral';
  }

  const styles = {
    success: 'bg-[var(--status-success-bg)] text-[var(--status-success-text)] border-[var(--status-success-border)]',
    warning: 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border-[var(--status-warning-border)]',
    danger: 'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)] border-[var(--status-danger-border)]',
    neutral: 'bg-[var(--status-neutral-bg)] text-[var(--status-neutral-text)] border-[var(--status-neutral-border)]',
  };

  const displayLabel = customText || label || status || variant || '';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold rounded-full border border-solid select-none tracking-tight whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        styles[styleType],
        className
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full shrink-0',
          styleType === 'success' && 'bg-[var(--status-success-text)]',
          styleType === 'warning' && 'bg-[var(--status-warning-text)]',
          styleType === 'danger' && 'bg-[var(--status-danger-text)]',
          styleType === 'neutral' && 'bg-[var(--status-neutral-text)]'
        )}
      />
      <span>{displayLabel}</span>
    </span>
  );
};

export const Badge = StatusBadge;
