import type { EditableFoodItem } from '@/lib/scanner/editable-food-item';

interface FoodItemRowProps {
  item: EditableFoodItem;
  onEdit?: () => void;
}

export function FoodItemRow({ item, onEdit }: FoodItemRowProps) {
  const content = (
    <>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-neutral-900">{item.name}</span>
          {item.isFlagged && (
            <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
              Review
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-neutral-500">
          {Math.round(item.weightG)}g · {item.calories} kcal
        </p>
      </div>
      {onEdit && (
        <span className="text-sm text-neutral-400" aria-hidden>
          Edit
        </span>
      )}
    </>
  );

  if (!onEdit) {
    return (
      <div className="flex w-full items-start justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onEdit}
      className="flex w-full items-start justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-left"
    >
      {content}
    </button>
  );
}
