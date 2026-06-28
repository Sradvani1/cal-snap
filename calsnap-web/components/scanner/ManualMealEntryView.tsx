'use client';

import { PrimaryButton, SecondaryButton } from '@/components/design/PrimaryButton';
import type { EditableFoodItem } from '@/lib/scanner/editable-food-item';
import type { MealScannerState } from '@/lib/scanner/use-meal-scanner';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

interface ManualMealEntryViewProps {
  scanner: MealScannerState;
}

const MACRO_FIELDS = [
  { field: 'proteinG' as const, labelKey: 'common.macro.protein' as const },
  { field: 'carbsG' as const, labelKey: 'common.macro.carbs' as const },
  { field: 'fatG' as const, labelKey: 'common.macro.fat' as const },
  { field: 'fiberG' as const, labelKey: 'common.macro.fiber' as const },
];

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
    <div className="space-y-3 rounded-xl border border-cs-border bg-cs-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className={cn(typography.csBody, 'font-medium')}>{copy('scanner.manual.foodItem')}</h3>
        {canRemove && (
          <button type="button" onClick={onRemove} className="text-sm text-cs-danger">
            {copy('scanner.manual.remove')}
          </button>
        )}
      </div>

      <label className="block">
        <span className={cn(typography.csCaption, 'mb-1 block')}>{copy('common.label.name')}</span>
        <input
          type="text"
          value={item.name}
          onChange={(event) => onUpdate({ name: event.target.value })}
          className="w-full rounded-lg border border-cs-border bg-cs-surface px-3 py-2 text-sm text-cs-foreground"
          placeholder={copy('scanner.manual.namePlaceholder')}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={cn(typography.csCaption, 'mb-1 block')}>{copy('scanner.manual.weight')}</span>
          <input
            type="number"
            min={0}
            value={item.weightG || ''}
            onChange={(event) =>
              onUpdate({ weightG: Number.parseFloat(event.target.value) || 0 })
            }
            className="w-full rounded-lg border border-cs-border bg-cs-surface px-3 py-2 text-sm tabular-nums text-cs-foreground"
          />
        </label>
        <label className="block">
          <span className={cn(typography.csCaption, 'mb-1 block')}>{copy('scanner.manual.calories')}</span>
          <input
            type="number"
            min={0}
            value={item.calories || ''}
            onChange={(event) =>
              onUpdate({ calories: Number.parseInt(event.target.value, 10) || 0 })
            }
            className="w-full rounded-lg border border-cs-border bg-cs-surface px-3 py-2 text-sm tabular-nums text-cs-foreground"
          />
        </label>
      </div>

      <details>
        <summary className={cn(typography.csCaption, 'cursor-pointer font-medium')}>
          {copy('scanner.manual.optionalMacros')}
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {MACRO_FIELDS.map(({ field, labelKey }) => (
            <label key={field} className="block">
              <span className={cn(typography.csCaption, 'mb-1 block')}>
                {copy(labelKey)} ({copy('common.macro.grams')})
              </span>
              <input
                type="number"
                min={0}
                step={0.1}
                value={item[field] || ''}
                onChange={(event) =>
                  onUpdate({ [field]: Number.parseFloat(event.target.value) || 0 })
                }
                className="w-full rounded-lg border border-cs-border bg-cs-surface px-3 py-2 text-sm tabular-nums text-cs-foreground"
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

      <SecondaryButton
        type="button"
        onClick={scanner.addManualItem}
        fullWidth
        className="min-h-11 border-dashed"
      >
        {copy('scanner.manual.addItem')}
      </SecondaryButton>

      <PrimaryButton
        type="button"
        disabled={!scanner.canFinishManual}
        onClick={scanner.finishManualEntry}
        fullWidth
        className="min-h-11"
      >
        {copy('common.button.continue')}
      </PrimaryButton>
    </div>
  );
}
