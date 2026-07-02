import { SectionCard, SectionCardSkeleton } from '@/components/design/SectionCard';
import type { FiberProgressBand } from '@/lib/dashboard/calorie-progress';
import type { MacroSplit } from '@/lib/models/macro-split';
import {
  formatMacroSplitCaption,
  macroSplitAccessibilityLabel,
} from '@/lib/dashboard/macro-split-caption';
import { typography } from '@/lib/design/typography';
import { copy } from '@/lib/copy';

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
  onTrack: 'text-cs-success',
  moderate: 'text-cs-warning-text',
  low: 'text-cs-danger-text',
};

function netCalorieColor(delta: number): string {
  if (delta > 0) {
    return 'text-cs-danger';
  }
  if (delta < 0) {
    return 'text-cs-success';
  }
  return 'text-cs-muted';
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
    <SectionCard title={copy('dashboard.summary.title')}>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className={typography.csMacroLabel}>{copy('common.macro.fiber')}</span>
          <span
            className={`tabular-nums ${FIBER_BAND_COLORS[fiberBand]}`}
            aria-label={`${copy('common.macro.fiber')} ${Math.round(fiberConsumed)} grams of ${Math.round(fiberTarget)} gram target, ${fiberBand} band`}
          >
            {fiberConsumed.toFixed(1)}g / {fiberTarget.toFixed(0)}g
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className={typography.csMacroLabel}>{copy('dashboard.summary.netCalories')}</span>
          <span className={`tabular-nums ${netCalorieColor(netCalorieDelta)}`}>
            {netSummary}
          </span>
        </div>

        <p
          className={typography.csCaption}
          aria-label={macroSplitAccessibilityLabel(actualMacroPercents, targetMacroPercents)}
        >
          {macroSplitText}
        </p>
      </div>
    </SectionCard>
  );
}

export function DailySummaryFooterSkeleton() {
  return <SectionCardSkeleton />;
}
