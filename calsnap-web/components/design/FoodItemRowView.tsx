import type { FoodItem } from '@/lib/models/food-item';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

interface FoodItemRowViewProps {
  item: FoodItem;
  flagged?: boolean;
  onEdit?: () => void;
  editLabel?: string;
  className?: string;
}

export function FoodItemRowView({
  item,
  flagged = false,
  onEdit,
  editLabel,
  className,
}: FoodItemRowViewProps) {
  const rowLabel = copy('designSystem.foodItem.accessibility.row', {
    name: item.name,
    calories: Math.round(item.calories),
  });

  return (
    <div
      className={cn(
        'rounded-xl border border-cs-border bg-cs-surface p-3',
        className,
      )}
      aria-label={rowLabel}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={cn(typography.csBody, 'font-medium')}>{item.name}</p>
          <p className={typography.csCaption}>
            {copy('designSystem.foodItem.weightCalories', {
              weight: Math.round(item.estimatedWeightG),
              calories: Math.round(item.calories),
            })}
          </p>
          {(item.proteinG > 0 || item.carbsG > 0 || item.fatG > 0) && (
            <p className="mt-1 text-xs text-cs-muted">
              {copy('designSystem.foodItem.macroSummary', {
                protein: Math.round(item.proteinG),
                carbs: Math.round(item.carbsG),
                fat: Math.round(item.fatG),
              })}
            </p>
          )}
          {flagged && (
            <p className="mt-1 text-xs font-medium text-cs-warning">
              {copy('designSystem.foodItem.flaggedAdjust')}
            </p>
          )}
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="min-h-11 shrink-0 rounded-lg px-3 text-sm font-medium text-cs-secondary hover:bg-cs-muted/10"
            aria-label={copy('designSystem.foodItem.editHint')}
          >
            {editLabel ?? copy('scanner.item.edit')}
          </button>
        )}
      </div>
    </div>
  );
}
