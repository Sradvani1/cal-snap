import { formatWeight } from '@/lib/utilities/unit-formatters';

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
  return (
    <div className="grid grid-cols-3 gap-4 text-center">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Current</p>
        <p className="mt-1 text-lg font-semibold text-neutral-900">
          {formatWeight(currentWeightKg, useLbs)}
        </p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Start</p>
        <p className="mt-1 text-lg font-semibold text-neutral-900">
          {formatWeight(startingWeightKg, useLbs)}
        </p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Goal</p>
        <p className="mt-1 text-lg font-semibold text-neutral-900">
          {formatWeight(goalWeightKg, useLbs)}
        </p>
      </div>
    </div>
  );
}

export function WeightProgressHeaderSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[0, 1, 2].map((key) => (
        <div key={key} className="flex flex-col items-center gap-2">
          <div className="h-3 w-12 animate-pulse rounded bg-neutral-100" />
          <div className="h-6 w-20 animate-pulse rounded bg-neutral-100" />
        </div>
      ))}
    </div>
  );
}
