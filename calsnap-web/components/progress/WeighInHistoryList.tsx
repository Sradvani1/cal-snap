import { formatWeight } from '@/lib/utilities/unit-formatters';
import type { WeighIn } from '@/lib/models/weigh-in';

interface WeighInHistoryListProps {
  weighIns: WeighIn[];
  useLbs: boolean;
}

function formatHistoryDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function WeighInHistoryList({ weighIns, useLbs }: WeighInHistoryListProps) {
  if (weighIns.length === 0) {
    return (
      <p className="text-center text-sm text-neutral-500">No weigh-ins yet</p>
    );
  }

  return (
    <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white shadow-sm">
      {weighIns.map((entry) => (
        <li key={entry.id} className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-medium text-neutral-900">
              {formatHistoryDate(entry.date)}
            </p>
            {entry.bmi !== undefined && entry.calculatedTDEE !== undefined && (
              <p className="text-xs text-neutral-500">
                BMI {entry.bmi.toFixed(1)} · TDEE {entry.calculatedTDEE} kcal
              </p>
            )}
          </div>
          <p className="text-sm font-semibold tabular-nums text-neutral-900">
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
        <div key={key} className="h-14 animate-pulse rounded-lg bg-neutral-100" />
      ))}
    </div>
  );
}
