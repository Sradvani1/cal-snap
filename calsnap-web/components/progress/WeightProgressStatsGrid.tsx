import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

interface WeightProgressStatsGridProps {
  lostSoFarLabel: string;
  toGoalLabel: string;
  weeklyRateLabel: string;
  projectedDateLabel: string;
}

export function WeightProgressStatsGrid({
  lostSoFarLabel,
  toGoalLabel,
  weeklyRateLabel,
  projectedDateLabel,
}: WeightProgressStatsGridProps) {
  const items: Array<{
    labelKey: 'progress.stats.lostSoFar' | 'progress.stats.toGoal' | 'progress.stats.weeklyRate' | 'progress.stats.estimatedGoalDate';
    value: string;
    large: boolean;
  }> = [
    { labelKey: 'progress.stats.lostSoFar', value: lostSoFarLabel, large: true },
    { labelKey: 'progress.stats.toGoal', value: toGoalLabel, large: true },
    { labelKey: 'progress.stats.weeklyRate', value: weeklyRateLabel, large: false },
    { labelKey: 'progress.stats.estimatedGoalDate', value: projectedDateLabel, large: false },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div
          key={item.labelKey}
          className="rounded-2xl border border-cs-border bg-cs-surface p-4 shadow-sm dark:shadow-none"
        >
          <p className={cn(typography.csCaption, 'text-xs font-medium uppercase tracking-wide')}>
            {copy(item.labelKey)}
          </p>
          <p className={`mt-1 ${item.large ? `${typography.csCardTitle} text-base` : typography.csCaption}`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function WeightProgressStatsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[0, 1, 2, 3].map((key) => (
        <div
          key={key}
          className="h-20 animate-pulse rounded-2xl border border-cs-border bg-cs-muted/20"
        />
      ))}
    </div>
  );
}
