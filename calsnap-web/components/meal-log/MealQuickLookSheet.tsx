'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Drawer } from 'vaul';
import { useAuth } from '@/lib/auth/auth-context';
import { MEAL_TYPE_LABELS } from '@/components/meal-log/meal-type-display';
import { MealTypeSelector } from '@/components/scanner/MealTypeSelector';
import { useUpdateMeal } from '@/lib/queries/use-update-meal';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import type { MealEntry } from '@/lib/models/meal-entry';
import type { MealType } from '@/lib/models/meal-type';
import type { FoodItem } from '@/lib/models/food-item';
import { cn } from '@/lib/utils/cn';

interface MealQuickLookSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meal: MealEntry | null;
}

const WEIGHT_RANGE_FACTOR = 0.3;

function getWeightRange(originalWeight?: number): { min: number; max: number } {
  if (!originalWeight || originalWeight <= 0) {
    return { min: 1, max: 1 };
  }
  return {
    min: Math.max(1, Math.round(originalWeight * (1 - WEIGHT_RANGE_FACTOR))),
    max: Math.round(originalWeight * (1 + WEIGHT_RANGE_FACTOR)),
  };
}

function scaleItem(item: FoodItem, newWeight: number): FoodItem {
  const ratio = newWeight / item.estimatedWeightG;
  return {
    ...item,
    estimatedWeightG: newWeight,
    calories: Math.round(item.calories * ratio),
    proteinG: Math.round(item.proteinG * ratio),
    carbsG: Math.round(item.carbsG * ratio),
    fatG: Math.round(item.fatG * ratio),
    saturatedFatG: Math.round(item.saturatedFatG * ratio),
    unsaturatedFatG: Math.round(item.unsaturatedFatG * ratio),
    fiberG: Math.round(item.fiberG * ratio),
  };
}

function computeTotals(items: FoodItem[]) {
  return {
    totalCalories: items.reduce((s, i) => s + i.calories, 0),
    totalProteinG: items.reduce((s, i) => s + i.proteinG, 0),
    totalCarbsG: items.reduce((s, i) => s + i.carbsG, 0),
    totalFatG: items.reduce((s, i) => s + i.fatG, 0),
    totalSaturatedFatG: items.reduce((s, i) => s + i.saturatedFatG, 0),
    totalUnsaturatedFatG: items.reduce((s, i) => s + i.unsaturatedFatG, 0),
    totalFiberG: items.reduce((s, i) => s + i.fiberG, 0),
  };
}

export function MealQuickLookSheet({ open, onOpenChange, meal }: MealQuickLookSheetProps) {
  const { user } = useAuth();
  const updateMeal = useUpdateMeal(user?.uid);
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [mealType, setMealType] = useState<MealType>(meal?.mealType ?? 'breakfast');

  const prevOpen = useRef(open);

  useEffect(() => {
    if (!meal) return;
    setWeights({});
    setExpandedItemId(null);
    setMealType(meal.mealType);
  }, [meal?.id]);

  if (!meal) return null;

  const adjustedItems = meal.items.map((item) => {
    const newWeight = weights[item.id];
    return newWeight !== undefined ? scaleItem(item, newWeight) : item;
  });

  const totals = computeTotals(adjustedItems);

  const hasWeightChanges = Object.keys(weights).some(
    (id) => weights[id] !== meal.items.find((i) => i.id === id)?.estimatedWeightG,
  );
  const hasMealTypeChange = mealType !== meal.mealType;
  const hasChanges = hasWeightChanges || hasMealTypeChange;
  const hasChangesRef = useRef(hasChanges);
  hasChangesRef.current = hasChanges;

  useEffect(() => {
    if (prevOpen.current && !open && hasChangesRef.current && user?.uid) {
      updateMeal.mutate({
        entry: {
          ...meal,
          mealType,
          items: adjustedItems,
          ...totals,
          isManuallyAdjusted: true,
        },
      });
    }
    prevOpen.current = open;
  }, [open, updateMeal, meal, mealType, adjustedItems, totals, user?.uid]);

  const handleWeightChange = useCallback(
    (itemId: string, weight: number) => {
      setWeights((prev) => ({ ...prev, [itemId]: weight }));
    },
    [],
  );

  const toggleExpanded = useCallback(
    (itemId: string) => {
      setExpandedItemId((prev) => (prev === itemId ? null : itemId));
    },
    [],
  );

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 mt-24 flex flex-col rounded-t-2xl bg-cs-surface max-h-[92vh]">
          <div className="mx-auto mt-2 h-1.5 w-12 flex-shrink-0 rounded-full bg-cs-muted/30" />

          <div className="overflow-y-auto p-6 pt-2 pb-8 space-y-4">
            <Drawer.Title className="text-lg font-semibold text-cs-foreground">
              {MEAL_TYPE_LABELS[mealType]}
            </Drawer.Title>

            {adjustedItems.map((item) => {
              const original = meal.items.find((i) => i.id === item.id);
              const range = getWeightRange(original?.estimatedWeightG);
              const isExpanded = expandedItemId === item.id;

              return (
                <div key={item.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleExpanded(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') toggleExpanded(item.id);
                    }}
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
                      {Math.round(item.estimatedWeightG)}
                      {copy('common.macro.grams')}
                    </span>
                  </div>

                  {isExpanded && range.max > range.min && (
                    <div className="mt-1 px-3">
                      <input
                        type="range"
                        min={range.min}
                        max={range.max}
                        step={1}
                        value={item.estimatedWeightG}
                        onChange={(e) =>
                          handleWeightChange(item.id, Number(e.target.value))
                        }
                        className="w-full h-2 accent-cs-primary"
                      />
                      <p className={cn(typography.csCaption, 'text-right tabular-nums')}>
                        {Math.round(item.estimatedWeightG)}
                        {copy('common.macro.grams')}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="flex gap-2">
              <MacroPill
                label={copy('common.macro.protein')}
                value={`${Math.round(totals.totalProteinG)}${copy('common.macro.grams')}`}
              />
              <MacroPill
                label={copy('common.macro.carbs')}
                value={`${Math.round(totals.totalCarbsG)}${copy('common.macro.grams')}`}
              />
              <MacroPill
                label={copy('common.macro.fat')}
                value={`${Math.round(totals.totalFatG)}${copy('common.macro.grams')}`}
              />
              <MacroPill
                label={copy('common.macro.fiber')}
                value={`${Math.round(totals.totalFiberG)}${copy('common.macro.grams')}`}
              />
            </div>

            <MealTypeSelector value={mealType} onChange={setMealType} />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function MacroPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 rounded-lg bg-cs-muted/10 px-2 py-1.5 text-center">
      <p className="text-[11px] leading-tight text-cs-muted">{label}</p>
      <p className="text-xs font-semibold tabular-nums text-cs-foreground">{value}</p>
    </div>
  );
}
