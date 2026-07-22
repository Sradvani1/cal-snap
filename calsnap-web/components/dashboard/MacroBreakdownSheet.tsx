'use client';

import { AppDialog } from '@/components/design/AppDialog';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import type { FoodItem } from '@/lib/models/food-item';

type MacroKey = 'protein' | 'carbs' | 'fat' | 'fiber';

const MACRO_FIELD = {
  protein: 'proteinG',
  carbs: 'carbsG',
  fat: 'fatG',
  fiber: 'fiberG',
} as const;

const MACRO_LABEL: Record<MacroKey, string> = {
  protein: copy('common.macro.protein'),
  carbs: copy('common.macro.carbs'),
  fat: copy('common.macro.fat'),
  fiber: copy('common.macro.fiber'),
};

const MACRO_BAR_COLOR: Record<MacroKey, string> = {
  protein: 'bg-cs-protein',
  carbs: 'bg-cs-carbs',
  fat: 'bg-cs-fat',
  fiber: 'bg-cs-success',
};

function getMacroGrams(item: FoodItem, macro: MacroKey): number {
  return item[MACRO_FIELD[macro]] as number;
}

function FatSplitInfo({ item }: { item: FoodItem }) {
  const hasSplit = item.saturatedFatG + item.unsaturatedFatG > 0;

  if (!hasSplit) {
    return <span className="text-xs text-cs-muted">{Math.round(item.fatG)}g</span>;
  }

  const fatTotal = item.saturatedFatG + item.unsaturatedFatG;

  return (
    <div className="mt-0.5">
      <span className="text-xs text-cs-muted">
        S: {Math.round(item.saturatedFatG)}g / U: {Math.round(item.unsaturatedFatG)}g
      </span>
      <div className="mt-0.5 flex h-1.5 overflow-hidden rounded-full bg-cs-muted/20">
        {fatTotal > 0 && (
          <>
            <div
              className="h-full bg-cs-fat-saturated"
              style={{ width: `${(item.saturatedFatG / fatTotal) * 100}%` }}
            />
            <div
              className="h-full bg-cs-fat-unsaturated"
              style={{ width: `${(item.unsaturatedFatG / fatTotal) * 100}%` }}
            />
          </>
        )}
      </div>
    </div>
  );
}

interface MacroBreakdownSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: FoodItem[];
  macro: MacroKey;
}

export function MacroBreakdownSheet({
  open,
  onOpenChange,
  items,
  macro,
}: MacroBreakdownSheetProps) {
  const total = items.reduce((sum, item) => sum + getMacroGrams(item, macro), 0);

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${MACRO_LABEL[macro]} Breakdown`}
      sheet
    >
      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        {items.map((item) => {
          const grams = getMacroGrams(item, macro);
          const pct = total > 0 ? Math.round((grams / total) * 100) : 0;

          return (
            <div
              key={item.id}
              className="rounded-xl border border-cs-border bg-cs-surface p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className={typography.csBody}>{item.name}</p>
                  <p className={typography.csCaption}>
                    {Math.round(item.estimatedWeightG)}g
                  </p>
                  {macro === 'fat' && <FatSplitInfo item={item} />}
                  {macro !== 'fat' && (
                    <p className="text-xs text-cs-muted">
                      {Math.round(grams)}g
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-sm tabular-nums font-semibold text-cs-foreground">
                  {Math.round(grams)}g
                </span>
                <span className="shrink-0 w-10 text-right text-xs tabular-nums text-cs-muted">
                  {pct}%
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cs-muted/20">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${MACRO_BAR_COLOR[macro]}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </AppDialog>
  );
}
