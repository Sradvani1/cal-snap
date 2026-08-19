'use client';

import { Drawer } from 'vaul';
import { FavoritesGrid } from '@/components/favorites/FavoritesGrid';
import { copy } from '@/lib/copy';
import type { FavoriteMeal } from '@/lib/models/favorite-meal';

interface FavoriteMealPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  favorites: FavoriteMeal[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onUse: (favorite: FavoriteMeal) => void;
}

export function FavoriteMealPickerSheet({
  open,
  onOpenChange,
  favorites,
  isLoading,
  isError,
  onUse,
}: FavoriteMealPickerSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content
          className="fixed left-0 right-0 top-36 flex max-h-[65vh] flex-col rounded-t-2xl bg-cs-surface"
          style={{ bottom: 'var(--app-tab-bar-content-height, 0px)' }}
          aria-describedby={undefined}
        >
          <div className="mx-auto mt-2 h-1.5 w-12 flex-shrink-0 rounded-full bg-cs-muted/30" />
          <div
            className="space-y-4 overflow-y-auto p-6 pt-4"
            style={{ paddingBottom: 'calc(var(--app-tab-bar-content-height, 0px) + 0.5rem)' }}
          >
            <Drawer.Title asChild>
              <h2 className="text-base font-semibold text-cs-foreground">
                {copy('mealLog.favorites.choose')}
              </h2>
            </Drawer.Title>
            <FavoritesGrid
              favorites={favorites}
              isLoading={isLoading}
              isError={isError}
              onUse={onUse}
            />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
