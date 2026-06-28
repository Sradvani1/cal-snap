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
    { label: 'Lost so far', value: lostSoFarLabel },
    { label: 'To goal', value: toGoalLabel },
    { label: 'Weekly rate', value: weeklyRateLabel },
    { label: 'Projected goal', value: projectedDateLabel },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            {item.label}
          </p>
          <p className="mt-1 text-base font-semibold text-neutral-900">{item.value}</p>
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
          className="h-20 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100"
        />
      ))}
    </div>
  );
}
