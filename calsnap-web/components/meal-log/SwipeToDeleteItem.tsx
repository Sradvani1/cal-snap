'use client';

import { useDrag } from '@use-gesture/react';
import { useRef, useState, type ReactNode } from 'react';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils/cn';

const DELETE_BUTTON_WIDTH = 80;
const OPEN_THRESHOLD = DELETE_BUTTON_WIDTH / 2;

interface SwipeToDeleteItemProps {
  /** Whether the row is currently swiped open to reveal the delete button. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called on tap or keyboard activation (Enter/Space). */
  onActivate: () => void;
  onDelete: () => void;
  deleteLabel: string;
  children: ReactNode;
}

export function SwipeToDeleteItem({
  open,
  onOpenChange,
  onActivate,
  onDelete,
  deleteLabel,
  children,
}: SwipeToDeleteItemProps) {
  const [dragPx, setDragPx] = useState<number | null>(null);
  const suppressClickRef = useRef(false);

  const dragging = dragPx !== null;
  const px = dragPx ?? (open ? -DELETE_BUTTON_WIDTH : 0);

  const bind = useDrag(
    ({ down, movement: [mx] }) => {
      if (down) {
        suppressClickRef.current = true;
        setDragPx(Math.max(-DELETE_BUTTON_WIDTH, Math.min(0, mx)));
      } else {
        setDragPx(null);
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
        onOpenChange(mx < -OPEN_THRESHOLD);
      }
    },
    { axis: 'x', filterTaps: true, rubberband: 0.15, touchAction: 'pan-y' },
  );

  return (
    <div className="group relative overflow-hidden rounded-lg">
      <button
        type="button"
        aria-label={deleteLabel}
        onClick={onDelete}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-cs-danger text-white hover:bg-cs-danger/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cs-primary focus-visible:ring-offset-2"
      >
        {copy('common.button.delete')}
      </button>
      <div
        {...bind()}
        role="button"
        tabIndex={0}
        onClick={() => {
          if (suppressClickRef.current) return;
          onActivate();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onActivate();
          }
        }}
        className={cn(
          'relative flex w-full cursor-pointer items-center justify-between bg-[color-mix(in_srgb,var(--cs-muted)_10%,var(--cs-surface))] px-3 py-2',
          dragging ? 'transition-none' : 'transition-transform',
          'group-has-[button:focus-visible]:-translate-x-20',
        )}
        style={px !== 0 ? { translate: `${px}px` } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
