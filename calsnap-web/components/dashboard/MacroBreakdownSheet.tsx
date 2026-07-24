'use client';

import { Drawer } from 'vaul';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';
import type { FoodItem } from '@/lib/models/food-item';

type MacroKey = 'protein' | 'carbs' | 'fat' | 'fiber';

const MACRO_FIELD: Record<MacroKey, keyof FoodItem> = {
  protein: 'proteinG',
  carbs: 'carbsG',
  fat: 'fatG',
  fiber: 'fiberG',
};

function getGrams(item: FoodItem, macro: MacroKey): number {
  return item[MACRO_FIELD[macro]] as number;
}

interface MacroBreakdownSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: FoodItem[];
  macro: MacroKey;
}

export function MacroBreakdownSheet({
  open,
  onOpenChange,
  items,
  macro,
}: MacroBreakdownSheetProps) {
  const sorted = [...items]
    .filter((item) => getGrams(item, macro) > 0)
    .sort((a, b) => getGrams(b, macro) - getGrams(a, macro));

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content
          className="fixed left-0 right-0 mt-24 flex flex-col rounded-t-2xl bg-cs-surface max-h-[92vh]"
          style={{ bottom: 'var(--app-tab-bar-content-height, 0px)' }}
        >
          <div className="mx-auto mt-2 h-1.5 w-12 flex-shrink-0 rounded-full bg-cs-muted/30" />

          <div
            className="overflow-y-auto p-6 pt-4 space-y-4"
            style={{ paddingBottom: 'calc(var(--app-tab-bar-content-height, 0px) + 0.5rem)' }}
          >
            {sorted.map((item) => {
              const grams = getGrams(item, macro);
              return (
                <div
                  key={item.id}
                  className="flex w-full items-center justify-between rounded-lg bg-cs-muted/10 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-cs-foreground truncate">
                      {item.name}
                    </p>
                    <p className={cn(typography.csCaption, 'tabular-nums')}>
                      {Math.round(item.calories)} {copy('common.macro.kcal')}
                    </p>
                  </div>
                  <span className={cn(typography.csCaption, 'tabular-nums shrink-0 ml-2')}>
                    {Math.round(grams)}{copy('common.macro.grams')}
                  </span>
                </div>
              );
            })}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
