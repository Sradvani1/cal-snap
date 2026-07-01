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
  const items = [
    { labelKey: 'progress.stats.lostSoFar' as const, value: lostSoFarLabel },
    { labelKey: 'progress.stats.toGoal' as const, value: toGoalLabel },
    { labelKey: 'progress.stats.weeklyRate' as const, value: weeklyRateLabel },
    { labelKey: 'progress.stats.estimatedGoalDate' as const, value: projectedDateLabel },
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
          <p className={`${typography.csCardTitle} mt-1 text-base`}>{item.value}</p>
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
