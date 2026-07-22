import type { MealEntry } from '@/lib/models/meal-entry';
import type { EditableFoodItem } from '@/lib/scanner/editable-food-item';
import type { MealTotals } from '@/lib/scanner/meal-totals';
import { ConfidenceBadge } from '@/components/design/ConfidenceBadge';
import { EditableFoodItemCard } from '@/components/scanner/EditableFoodItemCard';
import { NutrientStatRow } from '@/components/design/NutrientStatRow';
import { EstimationNotesAccordion } from '@/components/scanner/EstimationNotesAccordion';
import { FoodItemRowView } from '@/components/design/FoodItemRowView';
import { MEAL_TYPE_LABELS } from '@/components/meal-log/meal-type-display';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { confidenceLevelFromScore } from '@/lib/scanner/meal-totals';
import { cn } from '@/lib/utils/cn';

interface MealDetailViewProps {
  meal: MealEntry;
  photoUrl?: string | null;
  editableItems?: EditableFoodItem[] | null;
  totalsOverride?: MealTotals;
  onWeightChange?: (id: string, weightG: number) => void;
  onDeleteItem?: (id: string) => void;
}

function formatMacroValue(value: number, unit: string): string {
  return `${Math.round(value)}${unit}`;
}

export function MealDetailView({
  meal,
  photoUrl,
  editableItems,
  totalsOverride,
  onWeightChange,
  onDeleteItem,
}: MealDetailViewProps) {
  const confidenceLevel = confidenceLevelFromScore(meal.geminiConfidence);
  const grams = copy('common.macro.grams');
  const totals = totalsOverride ?? {
    totalCalories: meal.totalCalories,
    totalProteinG: meal.totalProteinG,
    totalCarbsG: meal.totalCarbsG,
    totalFatG: meal.totalFatG,
    totalFiberG: meal.totalFiberG,
  };

  return (
    <div className="space-y-4">
      {photoUrl ? (
        <div className="overflow-hidden rounded-xl border border-cs-border bg-cs-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt={copy('scanner.result.photoAlt')}
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      ) : null}

      <div>
        <h2 className={typography.csCardTitle}>{MEAL_TYPE_LABELS[meal.mealType]}</h2>
        <p className={typography.csCaption}>
          {meal.timestamp.toLocaleString(undefined, {
            dateStyle: 'full',
            timeStyle: 'short',
          })}
        </p>
      </div>

      <div className="rounded-xl border border-cs-border bg-cs-surface p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className={typography.csLargeCalorie} data-testid="meal-detail-total-calories">
            {totals.totalCalories} {copy('common.macro.kcal')}
          </p>
          <ConfidenceBadge level={confidenceLevel} score={meal.geminiConfidence} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <NutrientStatRow
            layout="card"
            label={copy('common.macro.protein')}
            value={formatMacroValue(totals.totalProteinG, grams)}
          />
          <NutrientStatRow
            layout="card"
            label={copy('common.macro.carbs')}
            value={formatMacroValue(totals.totalCarbsG, grams)}
          />
          <NutrientStatRow
            layout="card"
            label={copy('common.macro.fat')}
            value={formatMacroValue(totals.totalFatG, grams)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className={cn(typography.csBody, 'font-medium')}>{copy('scanner.result.items')}</h3>
        {editableItems && onWeightChange && onDeleteItem
          ? editableItems.map((item) => (
              <EditableFoodItemCard
                key={item.id}
                item={item}
                onWeightChange={onWeightChange}
                onDelete={onDeleteItem}
              />
            ))
          : meal.items.map((item) => (
              <FoodItemRowView key={item.id} item={item} flagged={item.isFlagged} />
            ))}
      </div>

      {meal.estimationNotes && (
        <EstimationNotesAccordion notes={meal.estimationNotes} />
      )}
    </div>
  );
}
