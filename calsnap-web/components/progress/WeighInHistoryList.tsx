import { EmptyStateView } from '@/components/design/EmptyStateView';
import { formatWeight } from '@/lib/utilities/unit-formatters';
import type { WeighIn } from '@/lib/models/weigh-in';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

interface WeighInHistoryListProps {
  weighIns: WeighIn[];
  useLbs: boolean;
  onLogWeighIn?: () => void;
}

function formatHistoryDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function WeighInHistoryList({
  weighIns,
  useLbs,
  onLogWeighIn,
}: WeighInHistoryListProps) {
  if (weighIns.length === 0) {
    return (
      <EmptyStateView
        icon="⚖️"
        titleKey="progress.history.empty"
        messageKey="progress.chart.empty"
        actionTitleKey={onLogWeighIn ? 'progress.history.emptyAction' : undefined}
        onAction={onLogWeighIn}
      />
    );
  }

  return (
    <ul className="divide-y divide-cs-border rounded-2xl border border-cs-border bg-cs-surface shadow-sm dark:shadow-none">
      {weighIns.map((entry) => (
        <li key={entry.id} className="flex items-center justify-between px-4 py-3">
          <div>
            <p className={cn(typography.csMacroLabel, 'text-sm')}>
              {formatHistoryDate(entry.date)}
            </p>
            {entry.bmi !== undefined && entry.calculatedTDEE !== undefined && (
              <p className={typography.csCaption}>
                {copy('progress.history.bmiTdee', {
                  bmi: entry.bmi.toFixed(1),
                  tdee: entry.calculatedTDEE,
                })}
              </p>
            )}
          </div>
          <p className="text-sm font-semibold tabular-nums text-cs-foreground">
            {formatWeight(entry.weightKg, useLbs)}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function WeighInHistoryListSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((key) => (
        <div key={key} className="h-14 animate-pulse rounded-lg bg-cs-muted/20" />
      ))}
    </div>
  );
}
