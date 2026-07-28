import { useState } from 'react';
import { EmptyStateView } from '@/components/design/EmptyStateView';
import { Button } from '@/components/ui/button';
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

const PAGE_SIZE = 25;

function formatHistoryDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDeficit(entry: WeighIn): string {
  if (entry.calculatedTDEE === undefined || entry.adjustedDailyTarget === undefined) {
    return '';
  }
  const deficit = entry.calculatedTDEE - entry.adjustedDailyTarget;
  const sign = deficit >= 0 ? '+' : '';
  return `${sign}${Math.round(deficit)}`;
}

export function WeighInHistoryList({
  weighIns,
  useLbs,
  onLogWeighIn,
}: WeighInHistoryListProps) {
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

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

  const visibleWeighIns = weighIns.slice(0, displayCount);

  return (
    <>
      <ul className="divide-y divide-cs-border rounded-2xl border border-cs-border bg-cs-surface shadow-sm dark:shadow-none">
        {visibleWeighIns.map((entry) => {
          const deficitStr = formatDeficit(entry);
          return (
            <li key={entry.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className={cn(typography.csMacroLabel, 'text-sm')}>
                  {formatHistoryDate(entry.date)}
                </p>
                {entry.bmi !== undefined && deficitStr && (
                  <p className={typography.csCaption}>
                    {copy('progress.history.bmiDeficit', {
                      bmi: entry.bmi.toFixed(1),
                      deficit: deficitStr,
                    })}
                  </p>
                )}
              </div>
              <p className="text-sm font-semibold tabular-nums text-cs-foreground">
                {formatWeight(entry.weightKg, useLbs)}
              </p>
            </li>
          );
        })}
      </ul>
      {displayCount < weighIns.length && (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setDisplayCount(displayCount + PAGE_SIZE)}
            className="min-h-11"
          >
            {copy('progress.history.showMore', {
              count: weighIns.length - displayCount,
            })}
          </Button>
        </div>
      )}
    </>
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
