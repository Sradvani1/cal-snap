import Link from 'next/link';

export function AnalyticsEmptyState() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
      <p className="text-base font-medium text-neutral-900">Log at least 3 days of meals</p>
      <p className="mt-2 text-sm text-neutral-600">
        Dietary charts and insights need a few days of meal history in your selected timeframe.
      </p>
      <Link
        href="/scan"
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white"
      >
        Scan a meal
      </Link>
    </div>
  );
}
