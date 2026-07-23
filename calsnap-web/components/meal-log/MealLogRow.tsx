'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MealEntry } from '@/lib/models/meal-entry';
import { MealQuickLookSheet } from '@/components/meal-log/MealQuickLookSheet';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

const MEAL_BRIEF_LIMIT = 22;

function mealBrief(meal: MealEntry): string {
  const names = meal.items.map((i) => i.name);
  if (names.length === 0) return copy('mealLog.row.empty');

  const suffix = names.length === 1 ? '' : ` +${names.length - 1}`;
  const first = names[0];

  if (first.length + suffix.length <= MEAL_BRIEF_LIMIT) {
    return first + suffix;
  }

  const words = first.split(' ');
  for (let i = words.length; i > 0; i--) {
    const candidate = words.slice(0, i).join(' ') + suffix;
    if (candidate.length <= MEAL_BRIEF_LIMIT) return candidate;
  }

  return suffix || '…';
}

interface MealLogRowProps {
  meal: MealEntry;
  showActions?: boolean;
  onDelete?: (mealId: string) => void;
  onSaveFavorite?: (mealId: string) => void;
}

export function MealLogRow({ meal, showActions = false, onDelete, onSaveFavorite }: MealLogRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickLookOpen, setQuickLookOpen] = useState(false);
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

  const handleRowTap = useCallback(() => {
    if (!showActions) {
      setQuickLookOpen(true);
    }
  }, [showActions]);

  const brief = mealBrief(meal);

  const content = (
    <>
      <span className={cn(typography.csCaption, 'min-w-0 truncate text-cs-foreground')}>
        {brief}
      </span>
      <span className={cn(typography.csCaption, 'font-medium tabular-nums shrink-0 text-cs-foreground')}>
        {meal.totalCalories} {copy('common.macro.kcal')}
      </span>
    </>
  );

  return (
    <div className="flex items-center gap-2 rounded-lg bg-cs-muted/10 px-3 py-2">
      {showActions ? (
        <Link
          href={`/log/${meal.id}`}
          className="flex min-w-0 flex-1 items-center justify-between"
        >
          {content}
        </Link>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={handleRowTap}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleRowTap(); }}
          className="flex min-w-0 flex-1 items-center justify-between"
        >
          {content}
        </div>
      )}

      {showActions && (onDelete || onSaveFavorite) ? (
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
            <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-cs-border bg-cs-surface py-1 shadow-lg">
              {onSaveFavorite && (
                <button
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm text-cs-foreground hover:bg-cs-muted/10"
                  onClick={() => {
                    onSaveFavorite(meal.id);
                    setMenuOpen(false);
                  }}
                >
                  {copy('mealLog.actions.saveFavorite')}
                </button>
              )}
              <Link
                href={`/log/${meal.id}`}
                className="block px-4 py-2 text-sm text-cs-foreground hover:bg-cs-muted/10"
                onClick={() => setMenuOpen(false)}
              >
                {copy('mealLog.row.view')}
              </Link>
              {onDelete && (
                <button
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm text-cs-danger hover:bg-cs-muted/10"
                  onClick={handleDelete}
                >
                  {copy('mealLog.actions.delete')}
                </button>
              )}
            </div>
          )}
        </div>
      ) : null}

      {!showActions && (
        <MealQuickLookSheet
          open={quickLookOpen}
          onOpenChange={setQuickLookOpen}
          meal={meal}
        />
      )}
    </div>
  );
}
