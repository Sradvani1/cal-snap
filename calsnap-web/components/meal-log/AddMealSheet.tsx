'use client';

import { Drawer } from 'vaul';
import { Button } from '@/components/ui/button';
import { MEAL_TYPE_LABELS } from '@/components/meal-log/meal-type-display';
import { copy } from '@/lib/copy';
import type { MealType } from '@/lib/models/meal-type';

interface AddMealSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealType: MealType | null;
  onScan: () => void;
  onUseFavorite: () => void;
}

export function AddMealSheet({
  open,
  onOpenChange,
  mealType,
  onScan,
  onUseFavorite,
}: AddMealSheetProps) {
  if (!mealType) return null;

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 flex flex-col rounded-t-2xl bg-cs-surface"
          style={{ bottom: 'var(--app-tab-bar-content-height, 0px)' }}
          aria-describedby={undefined}
        >
          <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-cs-muted/30" />
          <div className="space-y-3 p-6 pt-4">
            <Drawer.Title asChild>
              <h2 className="text-base font-semibold text-cs-foreground">
                {copy('mealLog.addSheet.title', { mealType: MEAL_TYPE_LABELS[mealType] })}
              </h2>
            </Drawer.Title>
            <Button className="w-full" onClick={onScan}>
              {copy('mealLog.addSheet.scan')}
            </Button>
            <Button className="w-full" variant="outline" onClick={onUseFavorite}>
              {copy('mealLog.addSheet.favorite')}
            </Button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
