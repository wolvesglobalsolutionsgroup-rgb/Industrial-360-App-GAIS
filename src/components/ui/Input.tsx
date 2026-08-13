import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  className,
  type = 'text',
  label,
  error,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}, ref) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-[var(--text-secondary)]">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-[var(--text-muted)] pointer-events-none shrink-0">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          disabled={disabled}
          className={cn(
            'flex h-9 w-full rounded-xl bg-[var(--bg-surface-1)] border border-[var(--border-default)] px-3 py-1.5 text-xs sm:text-sm font-medium text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:border-[var(--border-active)] focus-visible:ring-1 focus-visible:ring-[var(--border-active)] disabled:cursor-not-allowed disabled:opacity-50',
            leftIcon && 'pl-9',
            rightIcon && 'pr-9',
            error && 'border-[var(--status-danger-border)] text-[var(--status-danger-text)] focus-visible:ring-[var(--status-danger-text)]',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 text-[var(--text-muted)] pointer-events-none shrink-0">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-[11px] font-medium text-[var(--status-danger-text)]">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
