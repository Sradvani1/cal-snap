'use client';

import type { EditableFoodItem } from '@/lib/scanner/editable-food-item';
import type { MealScannerState } from '@/lib/scanner/use-meal-scanner';

interface ManualMealEntryViewProps {
  scanner: MealScannerState;
}

function ManualItemCard({
  item,
  canRemove,
  onUpdate,
  onRemove,
}: {
  item: EditableFoodItem;
  canRemove: boolean;
  onUpdate: (patch: Partial<EditableFoodItem>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-900">Food item</h3>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-sm text-red-600"
          >
            Remove
          </button>
        )}
      </div>

      <label className="block">
        <span className="mb-1 block text-xs text-neutral-500">Name</span>
        <input
          type="text"
          value={item.name}
          onChange={(event) => onUpdate({ name: event.target.value })}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          placeholder="e.g. Grilled chicken"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs text-neutral-500">Weight (g)</span>
          <input
            type="number"
            min={0}
            value={item.weightG || ''}
            onChange={(event) =>
              onUpdate({ weightG: Number.parseFloat(event.target.value) || 0 })
            }
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm tabular-nums"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-neutral-500">Calories</span>
          <input
            type="number"
            min={0}
            value={item.calories || ''}
            onChange={(event) =>
              onUpdate({ calories: Number.parseInt(event.target.value, 10) || 0 })
            }
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm tabular-nums"
          />
        </label>
      </div>

      <details>
        <summary className="cursor-pointer text-xs font-medium text-neutral-600">
          Optional macros
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(['proteinG', 'carbsG', 'fatG', 'fiberG'] as const).map((field) => (
            <label key={field} className="block">
              <span className="mb-1 block text-xs text-neutral-500">
                {field.replace('G', ' (g)').replace('protein', 'Protein').replace('carbs', 'Carbs').replace('fat', 'Fat').replace('fiber', 'Fiber')}
              </span>
              <input
                type="number"
                min={0}
                step={0.1}
                value={item[field] || ''}
                onChange={(event) =>
                  onUpdate({ [field]: Number.parseFloat(event.target.value) || 0 })
                }
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm tabular-nums"
              />
            </label>
          ))}
        </div>
      </details>
    </div>
  );
}

export function ManualMealEntryView({ scanner }: ManualMealEntryViewProps) {
  return (
    <div className="space-y-4">
      {scanner.editableItems.map((item) => (
        <ManualItemCard
          key={item.id}
          item={item}
          canRemove={scanner.editableItems.length > 1}
          onUpdate={(patch) => scanner.updateManualItem(item.id, patch)}
          onRemove={() => scanner.removeManualItem(item.id)}
        />
      ))}

      <button
        type="button"
        onClick={scanner.addManualItem}
        className="min-h-11 w-full rounded-lg border border-dashed border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700"
      >
        Add item
      </button>

      <button
        type="button"
        disabled={!scanner.canFinishManual}
        onClick={scanner.finishManualEntry}
        className="min-h-11 w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  );
}
