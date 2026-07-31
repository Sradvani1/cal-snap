'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Drawer } from 'vaul';
import { useAuth } from '@/lib/auth/auth-context';
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
  skipAutoSave?: boolean;
  onLog?: (items: FoodItem[], mealType: MealType) => void;
  isLogging?: boolean;
  onFavorite?: () => void;
  onDeleteMeal?: (meal: MealEntry) => void;
  viewHref?: string;
  isFavorited?: boolean;
  hideMealType?: boolean;
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
    proteinG: item.proteinG * ratio,
    carbsG: item.carbsG * ratio,
    fatG: item.fatG * ratio,
    saturatedFatG: item.saturatedFatG * ratio,
    unsaturatedFatG: item.unsaturatedFatG * ratio,
    fiberG: item.fiberG * ratio,
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

export function MealQuickLookSheet({
  open,
  onOpenChange,
  meal,
  skipAutoSave = false,
  onLog,
  isLogging = false,
  onFavorite,
  onDeleteMeal,
  viewHref,
  isFavorited = false,
  hideMealType = false,
}: MealQuickLookSheetProps) {
  const { user } = useAuth();
  const updateMeal = useUpdateMeal(user?.uid);
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [mealType, setMealType] = useState<MealType>(meal?.mealType ?? 'breakfast');
  const [faveClicked, setFaveClicked] = useState(() => isFavorited);

  const prevOpen = useRef(open);
  const hasChangesRef = useRef(false);

  const adjustedItems = useMemo(
    () =>
      meal
        ? meal.items
            .filter((item) => !deletedIds.has(item.id))
            .map((item) => {
              const newWeight = weights[item.id];
              return newWeight !== undefined ? scaleItem(item, newWeight) : item;
            })
        : [],
    [meal, weights, deletedIds],
  );

  const totals = useMemo(() => computeTotals(adjustedItems), [adjustedItems]);

  const hasWeightChanges = useMemo(
    () =>
      meal
        ? Object.keys(weights).some((id) => {
            const original = meal.items.find((i) => i.id === id);
            return original ? weights[id] !== original.estimatedWeightG : false;
          })
        : false,
    [meal, weights],
  );

  const hasMealTypeChange = meal ? mealType !== meal.mealType : false;
  const hasDeletions = meal ? meal.items.some((i) => deletedIds.has(i.id)) : false;
  const hasChanges = hasWeightChanges || hasMealTypeChange || hasDeletions;

  useEffect(() => {
    hasChangesRef.current = hasChanges;
  }, [hasChanges]);

  useEffect(() => {
    if (prevOpen.current && !open && hasChangesRef.current && user?.uid && meal && !skipAutoSave) {
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
  }, [open, updateMeal, meal, mealType, adjustedItems, totals, user?.uid, skipAutoSave]);

  const handleWeightChange = useCallback(
    (itemId: string, weight: number) => {
      setWeights((prev) => ({ ...prev, [itemId]: weight }));
    },
    [],
  );

  const handleDeleteItem = useCallback((itemId: string) => {
    setDeletedIds((prev) => new Set(prev).add(itemId));
  }, []);

  const toggleExpanded = useCallback(
    (itemId: string) => {
      setExpandedItemId((prev) => (prev === itemId ? null : itemId));
    },
    [],
  );

  const handleLog = useCallback(() => {
    onLog?.(adjustedItems, mealType);
    onOpenChange(false);
  }, [adjustedItems, mealType, onLog, onOpenChange]);

  const handleFavorite = useCallback(() => {
    setFaveClicked((prev) => !prev);
    onFavorite?.();
  }, [onFavorite]);

  const handleDelete = useCallback(() => {
    if (!meal) return;
    onDeleteMeal?.(meal);
    onOpenChange(false);
  }, [onDeleteMeal, onOpenChange, meal]);

  const hasActions = !!(onLog || viewHref || onDeleteMeal);

  if (!meal) return null;

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content
          className="fixed left-0 right-0 mt-24 flex flex-col rounded-t-2xl bg-cs-surface max-h-[75vh]"
          style={{ bottom: 'var(--app-tab-bar-content-height, 0px)' }}
        >
          <div className="mx-auto mt-2 h-1.5 w-12 flex-shrink-0 rounded-full bg-cs-muted/30" />

          {onFavorite && (
            <div className="flex justify-end px-6 pt-3 pb-0">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleFavorite(); }}
                className={cn(
                  'text-lg transition-colors',
                  faveClicked ? 'text-cs-warning' : 'text-cs-muted hover:text-cs-warning',
                )}
                aria-label={faveClicked ? 'Remove from favorites' : 'Add to favorites'}
              >
                {faveClicked ? '★' : '☆'}
              </button>
            </div>
          )}

          <div
            className="overflow-y-auto p-6 pt-4 space-y-4"
            style={{ paddingBottom: 'calc(var(--app-tab-bar-content-height, 0px) + 0.5rem)' }}
          >
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
                      if (e.target !== e.currentTarget) return;
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
                    <div className="flex items-center gap-1">
                      <span className={cn(typography.csCaption, 'tabular-nums shrink-0')}>
                        {Math.round(item.estimatedWeightG)}
                        {copy('common.macro.grams')}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id);
                        }}
                        className="flex min-h-8 min-w-8 items-center justify-center rounded-lg text-sm text-cs-muted hover:bg-cs-muted/10"
                        aria-label={copy('mealLog.sheet.deleteItem', { item: item.name })}
                      >
                        ✕
                      </button>
                    </div>
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

            {!hideMealType && <MealTypeSelector compact value={mealType} onChange={setMealType} />}

            {hasActions && (
              <div className="flex gap-1.5">
                {onLog && (
                  <ActionButton
                    onClick={handleLog}
                    disabled={isLogging}
                    className="bg-cs-primary/10 text-cs-primary hover:bg-cs-primary/15"
                  >
                    {isLogging ? '...' : copy('common.action.log')}
                  </ActionButton>
                )}
                {viewHref && (
                  <ActionButton as="link" href={viewHref} onClick={() => onOpenChange(false)}>
                    {copy('common.action.view')}
                  </ActionButton>
                )}
                {onDeleteMeal && (
                  <ActionButton onClick={handleDelete}>
                    {copy('common.action.delete')}
                  </ActionButton>
                )}
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  className,
  as,
  href,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  as?: 'link';
  href?: string;
}) {
  const base = cn(
    'flex-1 min-h-10 rounded-lg px-1 py-2 text-[13px] font-medium transition-colors text-center border border-cs-border bg-cs-surface text-cs-foreground hover:bg-cs-muted/10 disabled:opacity-50',
    className,
  );

  if (as === 'link' && href) {
    return <Link href={href} className={base} onClick={onClick}>{children}</Link>;
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={base}>
      {children}
    </button>
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
