import type { MealEntry } from '@/lib/models/meal-entry';
import { ConfidenceBadge } from '@/components/design/ConfidenceBadge';
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
}

function formatMacroValue(value: number, unit: string): string {
  return `${Math.round(value)}${unit}`;
}

export function MealDetailView({ meal, photoUrl }: MealDetailViewProps) {
  const isManualEntry = meal.geminiConfidence === 0;
  const confidenceLevel = confidenceLevelFromScore(meal.geminiConfidence, isManualEntry);
  const grams = copy('common.macro.grams');

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
      ) : (
        <div
          className={cn(
            typography.csCaption,
            'flex aspect-[4/3] items-center justify-center rounded-xl border border-cs-border bg-cs-muted/10',
          )}
        >
          {copy('mealLog.detail.noPhoto')}
        </div>
      )}

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
            {meal.totalCalories} {copy('common.macro.kcal')}
          </p>
          {isManualEntry ? (
            <ConfidenceBadge level="manual" />
          ) : (
            <ConfidenceBadge level={confidenceLevel} score={meal.geminiConfidence} />
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <NutrientStatRow
            layout="card"
            label={copy('common.macro.protein')}
            value={formatMacroValue(meal.totalProteinG, grams)}
          />
          <NutrientStatRow
            layout="card"
            label={copy('common.macro.carbs')}
            value={formatMacroValue(meal.totalCarbsG, grams)}
          />
          <NutrientStatRow
            layout="card"
            label={copy('common.macro.fat')}
            value={formatMacroValue(meal.totalFatG, grams)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className={cn(typography.csBody, 'font-medium')}>{copy('scanner.result.items')}</h3>
        {meal.items.map((item) => (
          <FoodItemRowView key={item.id} item={item} flagged={item.isFlagged} />
        ))}
      </div>

      {!isManualEntry && meal.estimationNotes && (
        <EstimationNotesAccordion notes={meal.estimationNotes} />
      )}
    </div>
  );
}
