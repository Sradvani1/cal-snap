'use client';

import { itemWeightRange, type EditableFoodItem } from '@/lib/scanner/editable-food-item';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

interface EditableFoodItemCardProps {
  item: EditableFoodItem;
  onWeightChange: (id: string, weightG: number) => void;
  onDelete: (id: string) => void;
}

export function EditableFoodItemCard({
  item,
  onWeightChange,
  onDelete,
}: EditableFoodItemCardProps) {
  const { min, max } = itemWeightRange(item.originalWeightG);

  return (
    <div className="rounded-xl border border-cs-border bg-cs-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={cn(typography.csBody, 'font-medium')}>{item.name}</p>
          <p className={typography.csCaption}>
            {Math.round(item.weightG)}g · {Math.round(item.calories)} kcal
          </p>
          {(item.proteinG > 0 || item.carbsG > 0 || item.fatG > 0) && (
            <p className="mt-1 text-xs text-cs-muted">
              P: {Math.round(item.proteinG)}g · C: {Math.round(item.carbsG)}g · F:{' '}
              {Math.round(item.saturatedFatG)}g/{Math.round(item.unsaturatedFatG)}g
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="flex min-h-8 min-w-8 items-center justify-center rounded-lg text-sm text-cs-muted hover:bg-cs-muted/10"
          aria-label={`Delete ${item.name}`}
        >
          ✕
        </button>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={item.weightG}
          onChange={(e) => onWeightChange(item.id, Number(e.target.value))}
          className="flex-1 accent-cs-primary"
          aria-label={`${item.name} weight`}
        />
        <span className="w-12 text-right text-sm tabular-nums text-cs-muted">
          {Math.round(item.weightG)}g
        </span>
      </div>
    </div>
  );
}
