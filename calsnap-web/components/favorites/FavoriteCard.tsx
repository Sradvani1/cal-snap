'use client';

import { useEffect, useRef, useState } from 'react';
import {
  MEAL_TYPE_ICONS,
} from '@/components/meal-log/meal-type-display';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import type { FavoriteMeal } from '@/lib/models/favorite-meal';
import { cn } from '@/lib/utils/cn';

interface FavoriteCardProps {
  favorite: FavoriteMeal;
  onUse: () => void;
  onDelete: () => void;
  onRename: () => void;
}

export function FavoriteCard({ favorite, onUse, onDelete, onRename }: FavoriteCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onUse}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onUse(); }}
      className="relative cursor-pointer rounded-xl border border-cs-border bg-cs-surface p-3 transition-colors hover:bg-cs-muted/5"
    >
      <div className="mb-1 text-center text-lg" aria-hidden>
        {MEAL_TYPE_ICONS[favorite.mealType]}
      </div>

      <p className="mb-0.5 truncate text-center text-sm font-semibold text-cs-foreground">
        {favorite.name}
      </p>

      <p className={cn('text-center tabular-nums', typography.csCaption)}>
        {Math.round(favorite.totalCalories)} {copy('common.macro.kcal')}
      </p>

      <p className="text-center text-xs tabular-nums text-cs-muted">
        {copy('common.macro.protein')} {Math.round(favorite.totalProteinG)}{copy('common.macro.grams')}{' '}
        {copy('common.macro.carbs')} {Math.round(favorite.totalCarbsG)}{copy('common.macro.grams')}{' '}
        {copy('common.macro.fat')} {Math.round(favorite.totalFatG)}{copy('common.macro.grams')}
      </p>

      <div className="absolute right-1 top-1" ref={menuRef}>
        <button
          type="button"
          aria-label={copy('mealLog.row.actions')}
          aria-expanded={menuOpen}
          onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-cs-muted hover:bg-cs-muted/15"
        >
          ⋯
        </button>
        {menuOpen && (
          <div
            className="absolute right-0 top-full z-10 mt-1 w-36 rounded-lg border border-cs-border bg-cs-surface py-1 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="block w-full px-4 py-2 text-left text-sm text-cs-foreground hover:bg-cs-muted/10"
              onClick={() => { setMenuOpen(false); onRename(); }}
            >
              {copy('mealLog.favorites.rename')}
            </button>
            <button
              type="button"
              className="block w-full px-4 py-2 text-left text-sm text-cs-danger hover:bg-cs-muted/10"
              onClick={() => { setMenuOpen(false); onDelete(); }}
            >
              {copy('mealLog.actions.delete')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
