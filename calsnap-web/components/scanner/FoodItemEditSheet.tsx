'use client';

import { useState } from 'react';
import type { EditableFoodItem } from '@/lib/scanner/editable-food-item';

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
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 p-4">
      <div
        className="w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-food-title"
      >
        <h2 id="edit-food-title" className="mb-4 text-lg font-semibold text-neutral-900">
          Edit item
        </h2>

        <label className="mb-3 block">
          <span className="mb-1 block text-sm text-neutral-600">Name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          />
        </label>

        <label className="mb-6 block">
          <span className="mb-1 block text-sm text-neutral-600">Weight (g)</span>
          <input
            type="number"
            min={0}
            step={1}
            value={weightG}
            onChange={(event) => setWeightG(event.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm tabular-nums"
          />
          <p className="mt-1 text-xs text-neutral-500">
            Calories and macros scale proportionally when weight changes.
          </p>
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 flex-1 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="min-h-11 flex-1 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function FoodItemEditSheet({ item, onClose, onSave }: FoodItemEditSheetProps) {
  if (!item) {
    return null;
  }

  return <FoodItemEditForm key={item.id} item={item} onClose={onClose} onSave={onSave} />;
}
