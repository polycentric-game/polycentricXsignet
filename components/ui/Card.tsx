import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  clickable?: boolean;
}

export function Card({ children, clickable = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-6 shadow-sm',
        'dark:border-gray-700 dark:bg-gray-800',
        clickable && 'cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
