import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { formatWeight } from '@/lib/utilities/unit-formatters';
import { cn } from '@/lib/utils/cn';

interface WeightProgressHeaderProps {
  currentWeightKg: number;
  startingWeightKg: number;
  goalWeightKg: number;
  useLbs: boolean;
}

export function WeightProgressHeader({
  currentWeightKg,
  startingWeightKg,
  goalWeightKg,
  useLbs,
}: WeightProgressHeaderProps) {
  const items = [
    { labelKey: 'progress.header.current' as const, value: formatWeight(currentWeightKg, useLbs) },
    { labelKey: 'progress.header.start' as const, value: formatWeight(startingWeightKg, useLbs) },
    { labelKey: 'progress.header.goal' as const, value: formatWeight(goalWeightKg, useLbs) },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 text-center">
      {items.map((item) => (
        <div key={item.labelKey}>
          <p className={cn(typography.csCaption, 'text-xs font-medium uppercase tracking-wide')}>
            {copy(item.labelKey)}
          </p>
          <p className={`${typography.csCardTitle} mt-1 text-lg`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

export function WeightProgressHeaderSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[0, 1, 2].map((key) => (
        <div key={key} className="flex flex-col items-center gap-2">
          <div className="h-3 w-12 animate-pulse rounded bg-cs-muted/20" />
          <div className="h-6 w-20 animate-pulse rounded bg-cs-muted/20" />
        </div>
      ))}
    </div>
  );
}
