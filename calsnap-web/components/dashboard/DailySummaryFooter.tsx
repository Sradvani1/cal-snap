import type { FiberProgressBand } from '@/lib/dashboard/calorie-progress';
import type { MacroSplit } from '@/lib/models/macro-split';
import {
  formatMacroSplitCaption,
  macroSplitAccessibilityLabel,
} from '@/lib/dashboard/macro-split-caption';

interface DailySummaryFooterProps {
  fiberConsumed: number;
  fiberTarget: number;
  fiberBand: FiberProgressBand;
  netSummary: string;
  netCalorieDelta: number;
  actualMacroPercents: MacroSplit;
  targetMacroPercents: MacroSplit;
}

const FIBER_BAND_COLORS: Record<FiberProgressBand, string> = {
  onTrack: 'text-green-600',
  moderate: 'text-amber-600',
  low: 'text-red-600',
};

function netCalorieColor(delta: number): string {
  if (delta > 0) {
    return 'text-red-600';
  }
  if (delta < 0) {
    return 'text-green-600';
  }
  return 'text-neutral-600';
}

export function DailySummaryFooter({
  fiberConsumed,
  fiberTarget,
  fiberBand,
  netSummary,
  netCalorieDelta,
  actualMacroPercents,
  targetMacroPercents,
}: DailySummaryFooterProps) {
  const macroSplitText = formatMacroSplitCaption(actualMacroPercents, targetMacroPercents);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-900">Daily summary</h2>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-neutral-700">Fiber</span>
          <span
            className={`tabular-nums ${FIBER_BAND_COLORS[fiberBand]}`}
            aria-label={`Fiber ${Math.round(fiberConsumed)} grams of ${Math.round(fiberTarget)} gram target, ${fiberBand} band`}
          >
            {fiberConsumed.toFixed(1)}g / {fiberTarget.toFixed(0)}g
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-neutral-700">Net calories</span>
          <span className={`tabular-nums ${netCalorieColor(netCalorieDelta)}`}>
            {netSummary}
          </span>
        </div>

        <p
          className="text-sm text-neutral-500"
          aria-label={macroSplitAccessibilityLabel(actualMacroPercents, targetMacroPercents)}
        >
          {macroSplitText}
        </p>
      </div>
    </div>
  );
}

export function DailySummaryFooterSkeleton() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4 h-6 w-32 animate-pulse rounded bg-neutral-100" />
      <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
    </div>
  );
}
