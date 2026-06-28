'use client';

import { ConfidenceBadge } from '@/components/scanner/ConfidenceBadge';
import { EstimationNotesAccordion } from '@/components/scanner/EstimationNotesAccordion';
import { FoodItemEditSheet } from '@/components/scanner/FoodItemEditSheet';
import { FoodItemRow } from '@/components/scanner/FoodItemRow';
import { MealTypeSelector } from '@/components/scanner/MealTypeSelector';
import { confidenceLevelFromScore } from '@/lib/scanner/meal-totals';
import type { MealScannerState } from '@/lib/scanner/use-meal-scanner';

interface MealAnalysisResultViewProps {
  scanner: MealScannerState;
  isLogging: boolean;
  onLog: () => void;
  onReAnalyze: () => void;
  onDiscard: () => void;
  isEditing?: boolean;
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

export function MealAnalysisResultView({
  scanner,
  isLogging,
  onLog,
  onReAnalyze,
  onDiscard,
  isEditing = false,
}: MealAnalysisResultViewProps) {
  const editingItem =
    scanner.editableItems.find((item) => item.id === scanner.editingItemId) ?? null;

  const confidenceLevel = confidenceLevelFromScore(
    scanner.overallConfidence,
    scanner.isManualEntry,
  );

  return (
    <div className="space-y-4">
      {scanner.previewUrl && (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={scanner.previewUrl}
            alt="Meal"
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-2xl font-bold tabular-nums text-neutral-900">
            {scanner.totals.totalCalories} kcal
          </h2>
          {!scanner.isManualEntry && (
            <ConfidenceBadge level={confidenceLevel} score={scanner.overallConfidence} />
          )}
          {scanner.isManualEntry && <ConfidenceBadge level="manual" />}
        </div>

        <div className="grid grid-cols-4 gap-2">
          <MacroSummary label="Protein" value={scanner.totals.totalProteinG} unit="g" />
          <MacroSummary label="Carbs" value={scanner.totals.totalCarbsG} unit="g" />
          <MacroSummary label="Fat" value={scanner.totals.totalFatG} unit="g" />
          <MacroSummary label="Fiber" value={scanner.totals.totalFiberG} unit="g" />
        </div>
      </div>

      {scanner.allItemsFlagged && !scanner.isManualEntry && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          All items have low confidence — review portions carefully before logging.
        </div>
      )}

      <MealTypeSelector value={scanner.mealType} onChange={scanner.setMealType} />

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-neutral-700">Items</h3>
        {scanner.editableItems.map((item) => (
          <FoodItemRow
            key={item.id}
            item={item}
            onEdit={() => scanner.setEditingItemId(item.id)}
          />
        ))}
      </div>

      {!scanner.isManualEntry && (
        <EstimationNotesAccordion notes={scanner.estimationNotes} />
      )}

      {scanner.logError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {scanner.logError}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={!scanner.canLog || isLogging}
          onClick={onLog}
          className="min-h-11 w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isLogging
            ? isEditing
              ? 'Saving…'
              : 'Logging…'
            : isEditing
              ? 'Save changes'
              : 'Log this meal'}
        </button>
        {!isEditing && (
          <button
            type="button"
            disabled={isLogging}
            onClick={onReAnalyze}
            className="min-h-11 w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900"
          >
            Re-analyze
          </button>
        )}
        <button
          type="button"
          disabled={isLogging}
          onClick={onDiscard}
          className="min-h-11 w-full rounded-lg px-4 py-2 text-sm font-medium text-red-600"
        >
          {isEditing ? 'Cancel' : 'Discard'}
        </button>
      </div>

      <FoodItemEditSheet
        item={editingItem}
        onClose={() => scanner.setEditingItemId(null)}
        onSave={(id, patch) => {
          scanner.editItem(id, { name: patch.name });
          scanner.updateItemWeight(id, patch.weightG);
        }}
      />
    </div>
  );
}
