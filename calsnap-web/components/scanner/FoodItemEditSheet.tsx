'use client';

import { useState } from 'react';
import { AppDialog } from '@/components/design/AppDialog';
import { PrimaryButton, SecondaryButton } from '@/components/design/PrimaryButton';
import type { EditableFoodItem } from '@/lib/scanner/editable-food-item';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

interface FoodItemEditSheetProps {
  item: EditableFoodItem | null;
  onClose: () => void;
  onSave: (id: string, patch: { name: string; weightG: number }) => void;
}

function FoodItemEditForm({
  item,
  onClose,
  onSave,
}: {
  item: EditableFoodItem;
  onClose: () => void;
  onSave: (id: string, patch: { name: string; weightG: number }) => void;
}) {
  const [name, setName] = useState(item.name);
  const [weightG, setWeightG] = useState(String(item.weightG));

  const handleSave = () => {
    const parsedWeight = Number.parseFloat(weightG);
    if (!name.trim() || !Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      return;
    }
    onSave(item.id, { name: name.trim(), weightG: parsedWeight });
    onClose();
  };

  return (
    <>
      <label className="mb-3 block">
        <span className={cn(typography.csCaption, 'mb-1 block')}>{copy('common.label.name')}</span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-lg border border-cs-border bg-cs-surface px-3 py-2 text-sm text-cs-foreground"
        />
      </label>

      <label className="mb-2 block">
        <span className={cn(typography.csCaption, 'mb-1 block')}>
          {copy('scanner.editSheet.weightLabel')}
        </span>
        <input
          type="number"
          min={0}
          step={1}
          value={weightG}
          onChange={(event) => setWeightG(event.target.value)}
          className="w-full rounded-lg border border-cs-border bg-cs-surface px-3 py-2 text-sm tabular-nums text-cs-foreground"
        />
        <p className={cn(typography.csCaption, 'mt-1')}>{copy('scanner.editSheet.weightHint')}</p>
      </label>

      <div className="mt-4 flex gap-2">
        <SecondaryButton type="button" onClick={onClose} className="min-h-11 flex-1">
          {copy('common.button.cancel')}
        </SecondaryButton>
        <PrimaryButton type="button" onClick={handleSave} className="min-h-11 flex-1">
          {copy('common.button.save')}
        </PrimaryButton>
      </div>
    </>
  );
}

export function FoodItemEditSheet({ item, onClose, onSave }: FoodItemEditSheetProps) {
  return (
    <AppDialog
      open={item !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={copy('scanner.editSheet.title')}
    >
      {item ? <FoodItemEditForm key={item.id} item={item} onClose={onClose} onSave={onSave} /> : null}
    </AppDialog>
  );
}
