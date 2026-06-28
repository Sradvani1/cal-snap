import type { FiberProgressBand } from '@/lib/dashboard/calorie-progress';

interface MacroBarCardProps {
  proteinConsumed: number;
  proteinTarget: number;
  carbsConsumed: number;
  carbsTarget: number;
  fatConsumed: number;
  fatTarget: number;
  fiberConsumed: number;
  fiberTarget: number;
  fiberBand: FiberProgressBand;
}

function barWidth(consumed: number, target: number): number {
  if (target <= 0) {
    return 0;
  }
  return Math.min((consumed / target) * 100, 100);
}

function fiberBarClass(band: FiberProgressBand): string {
  switch (band) {
    case 'onTrack':
      return 'bg-emerald-500';
    case 'moderate':
      return 'bg-amber-500';
    case 'low':
      return 'bg-red-500';
  }
}

function MacroRow({
  label,
  consumed,
  target,
  barClassName,
}: {
  label: string;
  consumed: number;
  target: number;
  barClassName: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-neutral-700">{label}</span>
        <span className="tabular-nums text-neutral-500">
          {Math.round(consumed)}g / {Math.round(target)}g
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barClassName}`}
          style={{ width: `${barWidth(consumed, target)}%` }}
        />
      </div>
    </div>
  );
}

export function MacroBarCard({
  proteinConsumed,
  proteinTarget,
  carbsConsumed,
  carbsTarget,
  fatConsumed,
  fatTarget,
  fiberConsumed,
  fiberTarget,
  fiberBand,
}: MacroBarCardProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-900">Macros</h2>
      <div className="space-y-4">
        <MacroRow
          label="Protein"
          consumed={proteinConsumed}
          target={proteinTarget}
          barClassName="bg-neutral-700"
        />
        <MacroRow
          label="Carbs"
          consumed={carbsConsumed}
          target={carbsTarget}
          barClassName="bg-neutral-500"
        />
        <MacroRow
          label="Fat"
          consumed={fatConsumed}
          target={fatTarget}
          barClassName="bg-neutral-400"
        />
        <MacroRow
          label="Fiber"
          consumed={fiberConsumed}
          target={fiberTarget}
          barClassName={fiberBarClass(fiberBand)}
        />
      </div>
    </div>
  );
}

export function MacroBarCardSkeleton() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4 h-6 w-20 animate-pulse rounded bg-neutral-100" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map((row) => (
          <div key={row} className="h-8 animate-pulse rounded bg-neutral-100" />
        ))}
      </div>
    </div>
  );
}
