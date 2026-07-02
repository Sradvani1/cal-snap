'use client';

import type { ReactNode } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils/cn';

interface AppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** When true, content is bottom-sheet style on mobile */
  sheet?: boolean;
}

export function AppDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  sheet = true,
}: AppDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        sheet={sheet}
        className={cn(
          sheet &&
            'top-auto bottom-0 max-h-[90vh] translate-y-0 rounded-t-2xl rounded-b-none pb-sheet-safe sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:pb-6',
          className,
        )}
      >
        {sheet ? (
          <div
            className="mx-auto mb-3 h-1 w-10 rounded-full bg-cs-border sm:hidden"
            aria-hidden="true"
          />
        ) : null}
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children}
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}
