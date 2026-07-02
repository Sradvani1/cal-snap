'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ConfidenceBadge } from '@/components/design/ConfidenceBadge';
import { NutrientStatRow } from '@/components/design/NutrientStatRow';
import { PrimaryButton, SecondaryButton } from '@/components/design/PrimaryButton';
import { EstimationNotesAccordion } from '@/components/scanner/EstimationNotesAccordion';
import { FoodItemEditSheet } from '@/components/scanner/FoodItemEditSheet';
import { FoodItemRow } from '@/components/scanner/FoodItemRow';
import { MealTypeSelector } from '@/components/scanner/MealTypeSelector';
import { copy } from '@/lib/copy';
import { SCAN_FADE_MS, SCAN_STAGGER_MS, useReducedMotion } from '@/lib/design/motion';
import { typography } from '@/lib/design/typography';
import { confidenceLevelFromScore } from '@/lib/scanner/meal-totals';
import type { MealScannerState } from '@/lib/scanner/use-meal-scanner';
import { cn } from '@/lib/utils/cn';

interface MealAnalysisResultViewProps {
  scanner: MealScannerState;
  isLogging: boolean;
  onLog: () => void;
  onReAnalyze: () => void;
  onDiscard: () => void;
  isEditing?: boolean;
}

function ScanStaggerSection({
  index,
  reducedMotion,
  children,
  className,
}: {
  index: number;
  reducedMotion: boolean;
  children: ReactNode;
  className?: string;
}) {
  const [visible, setVisible] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }
    const timer = window.setTimeout(() => setVisible(true), index * SCAN_STAGGER_MS);
    return () => window.clearTimeout(timer);
  }, [index, reducedMotion]);

  return (
    <div
      className={cn(
        'transition-opacity motion-reduce:transition-none',
        visible ? 'opacity-100' : 'opacity-0',
        className,
      )}
      style={reducedMotion ? undefined : { transitionDuration: `${SCAN_FADE_MS}ms` }}
      inert={!visible ? true : undefined}
    >
      {children}
    </div>
  );
}

function formatMacroValue(value: number, unit: string): string {
  return `${Math.round(value)}${unit}`;
}

export function MealAnalysisResultView({
  scanner,
  isLogging,
  onLog,
  onReAnalyze,
  onDiscard,
  isEditing = false,
}: MealAnalysisResultViewProps) {
  const reducedMotion = useReducedMotion();
  const editingItem =
    scanner.editableItems.find((item) => item.id === scanner.editingItemId) ?? null;

  const confidenceLevel = confidenceLevelFromScore(
    scanner.overallConfidence,
    scanner.isManualEntry,
  );
  const grams = copy('common.macro.grams');

  let sectionIndex = 0;

  return (
    <div className="space-y-4">
      {scanner.previewUrl && (
        <ScanStaggerSection index={sectionIndex++} reducedMotion={reducedMotion}>
          <div className="overflow-hidden rounded-xl border border-cs-border bg-cs-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={scanner.previewUrl}
              alt={copy('scanner.result.photoAlt')}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        </ScanStaggerSection>
      )}

      <ScanStaggerSection index={sectionIndex++} reducedMotion={reducedMotion}>
        <div className="rounded-xl border border-cs-border bg-cs-surface p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className={typography.csLargeCalorie}>
              {scanner.totals.totalCalories} {copy('common.macro.kcal')}
            </h2>
            {!scanner.isManualEntry && (
              <ConfidenceBadge level={confidenceLevel} score={scanner.overallConfidence} />
            )}
            {scanner.isManualEntry && <ConfidenceBadge level="manual" />}
          </div>

          <div className="grid grid-cols-4 gap-2">
            <NutrientStatRow
              layout="card"
              label={copy('common.macro.protein')}
              value={formatMacroValue(scanner.totals.totalProteinG, grams)}
            />
            <NutrientStatRow
              layout="card"
              label={copy('common.macro.carbs')}
              value={formatMacroValue(scanner.totals.totalCarbsG, grams)}
            />
            <NutrientStatRow
              layout="card"
              label={copy('common.macro.fat')}
              value={formatMacroValue(scanner.totals.totalFatG, grams)}
            />
            <NutrientStatRow
              layout="card"
              label={copy('common.macro.fiber')}
              value={formatMacroValue(scanner.totals.totalFiberG, grams)}
            />
          </div>
        </div>
      </ScanStaggerSection>

      {scanner.allItemsFlagged && !scanner.isManualEntry && (
        <ScanStaggerSection index={sectionIndex++} reducedMotion={reducedMotion}>
          <div className="rounded-lg border border-cs-warning/30 bg-cs-warning/10 px-4 py-3 text-sm text-cs-warning-text">
            {copy('scanner.result.lowConfidence')}
          </div>
        </ScanStaggerSection>
      )}

      <ScanStaggerSection index={sectionIndex++} reducedMotion={reducedMotion}>
        <MealTypeSelector value={scanner.mealType} onChange={scanner.setMealType} />
      </ScanStaggerSection>

      <ScanStaggerSection index={sectionIndex++} reducedMotion={reducedMotion}>
        <div className="space-y-2">
          <h3 className={cn(typography.csBody, 'font-medium')}>{copy('scanner.result.items')}</h3>
          {scanner.editableItems.map((item) => (
            <FoodItemRow key={item.id} item={item} onEdit={() => scanner.setEditingItemId(item.id)} />
          ))}
        </div>
      </ScanStaggerSection>

      {!scanner.isManualEntry && (
        <ScanStaggerSection index={sectionIndex++} reducedMotion={reducedMotion}>
          <EstimationNotesAccordion notes={scanner.estimationNotes} />
        </ScanStaggerSection>
      )}

      {scanner.logError && (
        <ScanStaggerSection index={sectionIndex++} reducedMotion={reducedMotion}>
          <p
            className="rounded-lg border border-cs-danger/30 bg-cs-danger/10 px-4 py-3 text-sm text-cs-danger-text"
            role="alert"
          >
            {scanner.logError}
          </p>
        </ScanStaggerSection>
      )}

      <ScanStaggerSection index={sectionIndex++} reducedMotion={reducedMotion}>
        <div className="flex flex-col gap-2">
          <PrimaryButton
            type="button"
            disabled={!scanner.canLog || isLogging}
            onClick={onLog}
            fullWidth
            className="min-h-11"
          >
            {isLogging
              ? isEditing
                ? copy('scanner.result.saving')
                : copy('scanner.result.logging')
              : isEditing
                ? copy('scanner.result.saveChanges')
                : copy('scanner.result.logMeal')}
          </PrimaryButton>
          {!isEditing && (
            <SecondaryButton
              type="button"
              disabled={isLogging}
              onClick={onReAnalyze}
              fullWidth
              className="min-h-11"
            >
              {copy('scanner.result.reAnalyze')}
            </SecondaryButton>
          )}
          <button
            type="button"
            disabled={isLogging}
            onClick={onDiscard}
            className="min-h-11 w-full rounded-lg px-4 py-2 text-sm font-medium text-cs-danger-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cs-primary focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {isEditing ? copy('common.button.cancel') : copy('scanner.result.discard')}
          </button>
        </div>
      </ScanStaggerSection>

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
