'use client';

import { FavoriteCard } from '@/components/favorites/FavoriteCard';
import { EmptyStateView } from '@/components/design/EmptyStateView';
import { Skeleton } from '@/components/design/Skeleton';
import { copy } from '@/lib/copy';
import type { FavoriteMeal } from '@/lib/models/favorite-meal';

interface FavoritesGridProps {
  favorites: FavoriteMeal[] | undefined;
  isLoading: boolean;
  isError: boolean;
  confirmText: string | null;
  onUse: (favorite: FavoriteMeal) => void;
  onDelete: (favorite: FavoriteMeal) => void;
  onRename: (favorite: FavoriteMeal) => void;
}

export function FavoritesGrid({
  favorites,
  isLoading,
  isError,
  confirmText,
  onUse,
  onDelete,
  onRename,
}: FavoritesGridProps) {
  if (isError) {
    return (
      <p className="text-center text-sm text-cs-danger">
        {copy('mealLog.favorites.errorLoad')}
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <EmptyStateView
        icon="⭐"
        titleKey="mealLog.favorites.empty"
        messageKey="mealLog.favorites.emptySubtitle"
      />
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {favorites.map((fav) => (
          <FavoriteCard
            key={fav.id}
            favorite={fav}
            onUse={() => onUse(fav)}
            onDelete={() => onDelete(fav)}
            onRename={() => onRename(fav)}
          />
        ))}
      </div>
      {confirmText && (
        <p className="mt-3 text-center text-sm text-cs-success">
          {confirmText}
        </p>
      )}
    </div>
  );
}
