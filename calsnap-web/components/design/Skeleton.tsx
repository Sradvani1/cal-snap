'use client';

import type { ComponentProps } from 'react';

import { useReducedMotion } from '@/lib/design/motion';
import { cn } from '@/lib/utils/cn';

export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className={cn('rounded bg-cs-muted/20', !reducedMotion && 'animate-pulse', className)}
      aria-hidden
      {...props}
    />
  );
}
