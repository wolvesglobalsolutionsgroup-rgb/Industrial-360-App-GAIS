import React from 'react';
import { cn } from '../../lib/utils';

export const Table = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className="w-full overflow-x-auto custom-scrollbar">
    <table className={cn('w-full text-left border-collapse text-xs sm:text-sm', className)}>
      {children}
    </table>
  </div>
);

export const TableHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <thead>
    <tr className={cn('bg-[var(--bg-surface-2)] border-b border-[var(--border-default)] text-[var(--text-secondary)] text-xs font-semibold tracking-wider uppercase', className)}>
      {children}
    </tr>
  </thead>
);

export const TableBody = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <tbody className={cn('divide-y divide-[var(--border-subtle)] bg-[var(--bg-surface-1)]', className)}>
    {children}
  </tbody>
);

export const TableRow = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <tr 
    onClick={onClick}
    className={cn('hover:bg-[var(--bg-surface-2)]/60 transition-colors', onClick && 'cursor-pointer', className)}
  >
    {children}
  </tr>
);

export const TableHead = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <th className={cn('px-3.5 py-2.5 font-semibold text-[var(--text-secondary)]', className)}>
    {children}
  </th>
);

export const TableCell = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <td className={cn('px-3.5 py-2.5 text-[var(--text-primary)] font-medium tabular', className)}>
    {children}
  </td>
);

/**
 * DenseDataTable — High Performance HMI / Linear style (36px row height)
 */
export const DenseDataTable = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className="w-full overflow-x-auto border border-[var(--border-default)] rounded-xl bg-[var(--bg-surface-1)] shadow-xs">
    <table className={cn('w-full text-left border-collapse text-xs', className)}>
      {children}
    </table>
  </div>
);
