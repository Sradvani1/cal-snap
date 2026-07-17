'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { MealEntry } from '@/lib/models/meal-entry';
import {
  MEAL_TYPE_ICONS,
  formatMealTime,
} from '@/components/meal-log/meal-type-display';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

interface MealLogRowProps {
  meal: MealEntry;
  showActions?: boolean;
  onDelete?: (mealId: string) => void;
}

export function MealLogRow({ meal, showActions = false, onDelete }: MealLogRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleDelete = () => {
    setMenuOpen(false);
    onDelete?.(meal.id);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg bg-cs-muted/10 px-3 py-2">
      <Link
        href={`/log/${meal.id}`}
        className="flex min-w-0 flex-1 items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span aria-hidden>{MEAL_TYPE_ICONS[meal.mealType]}</span>
          <span className={typography.csCaption}>{formatMealTime(meal.timestamp)}</span>
        </div>
        <span className={cn(typography.csBody, 'font-medium tabular-nums')}>
          {meal.totalCalories} {copy('common.macro.kcal')}
        </span>
      </Link>

      {showActions && onDelete && (
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label={copy('mealLog.row.actions')}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-cs-muted hover:bg-cs-muted/15"
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-lg border border-cs-border bg-cs-surface py-1 shadow-lg">
              <Link
                href={`/log/${meal.id}`}
                className="block px-4 py-2 text-sm text-cs-foreground hover:bg-cs-muted/10"
                onClick={() => setMenuOpen(false)}
              >
                {copy('mealLog.row.view')}
              </Link>
              <Link
                href={`/scan/edit/${meal.id}`}
                className="block px-4 py-2 text-sm text-cs-foreground hover:bg-cs-muted/10"
                onClick={() => setMenuOpen(false)}
              >
                {copy('mealLog.row.edit')}
              </Link>
              <button
                type="button"
                className="block w-full px-4 py-2 text-left text-sm text-cs-danger hover:bg-cs-muted/10"
                onClick={handleDelete}
              >
                {copy('mealLog.actions.delete')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
