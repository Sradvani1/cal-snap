interface DailySummaryFooterProps {
  fiberConsumed: number;
  fiberTarget: number;
  netSummary: string;
}

export function DailySummaryFooter({
  fiberConsumed,
  fiberTarget,
  netSummary,
}: DailySummaryFooterProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-neutral-700">Fiber</span>
        <span className="tabular-nums text-neutral-600">
          {fiberConsumed.toFixed(1)}g / {fiberTarget.toFixed(0)}g
        </span>
      </div>
      <p className="mt-3 text-sm text-neutral-600">{netSummary}</p>
    </div>
  );
}

export function DailySummaryFooterSkeleton() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
    </div>
  );
}
