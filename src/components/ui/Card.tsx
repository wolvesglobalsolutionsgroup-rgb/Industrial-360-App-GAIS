import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  glass?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({
  children,
  className,
  hoverEffect = false,
  glass = false,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'bg-[var(--bg-surface-1)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] shadow-xs transition-all duration-150',
        glass && 'glass',
        hoverEffect && 'hover:border-[var(--border-active)] hover:shadow-md hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
Card.displayName = 'Card';

export const CardHeader = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-4 sm:p-5 pb-3 border-b border-[var(--border-subtle)]', className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('text-base sm:text-lg font-semibold text-[var(--text-primary)] tracking-tight', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-xs text-[var(--text-secondary)] mt-1 font-medium', className)} {...props}>
    {children}
  </p>
);

export const CardContent = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-4 sm:p-5', className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-4 sm:p-5 pt-3 bg-[var(--bg-surface-2)] border-t border-[var(--border-subtle)] rounded-b-xl', className)} {...props}>
    {children}
  </div>
);
