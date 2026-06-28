import type { MealEntry } from '@/lib/models/meal-entry';
import { ConfidenceBadge } from '@/components/scanner/ConfidenceBadge';
import { EstimationNotesAccordion } from '@/components/scanner/EstimationNotesAccordion';
import { FoodItemRow } from '@/components/scanner/FoodItemRow';
import { MEAL_TYPE_LABELS } from '@/components/meal-log/meal-type-display';
import { confidenceLevelFromScore } from '@/lib/scanner/meal-totals';
import { editableFoodItemFromFoodItem } from '@/lib/scanner/editable-food-item';

interface MealDetailViewProps {
  meal: MealEntry;
  photoUrl?: string | null;
}

function MacroSummary({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="rounded-lg bg-neutral-50 px-3 py-2 text-center">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-sm font-semibold tabular-nums text-neutral-900">
        {Math.round(value)}
        {unit}
      </p>
    </div>
  );
}

export function MealDetailView({ meal, photoUrl }: MealDetailViewProps) {
  const isManualEntry = meal.geminiConfidence === 0;
  const confidenceLevel = confidenceLevelFromScore(meal.geminiConfidence, isManualEntry);

  return (
    <div className="space-y-4">
      {photoUrl ? (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt="Meal"
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-sm text-neutral-400">
          No photo
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-neutral-900">
          {MEAL_TYPE_LABELS[meal.mealType]}
        </h2>
        <p className="text-sm text-neutral-500">
          {meal.timestamp.toLocaleString(undefined, {
            dateStyle: 'full',
            timeStyle: 'short',
          })}
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-2xl font-bold tabular-nums text-neutral-900">
            {meal.totalCalories} kcal
          </p>
          {isManualEntry ? (
            <ConfidenceBadge level="manual" />
          ) : (
            <ConfidenceBadge level={confidenceLevel} score={meal.geminiConfidence} />
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <MacroSummary label="Protein" value={meal.totalProteinG} unit="g" />
          <MacroSummary label="Carbs" value={meal.totalCarbsG} unit="g" />
          <MacroSummary label="Fat" value={meal.totalFatG} unit="g" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-neutral-700">Items</h3>
        {meal.items.map((item) => (
          <FoodItemRow key={item.id} item={editableFoodItemFromFoodItem(item)} />
        ))}
      </div>

      {!isManualEntry && meal.estimationNotes && (
        <EstimationNotesAccordion notes={meal.estimationNotes} />
      )}
    </div>
  );
}
