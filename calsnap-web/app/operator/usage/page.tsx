'use client';

import { useEffect, useState } from 'react';
import { SectionCard, SectionCardSkeleton } from '@/components/design/SectionCard';
import { useAuth } from '@/lib/auth/auth-context';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { UsageEvent, type UsageEventName } from '@/lib/usage/events';

interface UsageDailyRecord {
  date: string;
  activeUsers: number;
  eventCounts: Partial<Record<UsageEventName, number>>;
}

interface UsageSummary {
  days: UsageDailyRecord[];
  totals: {
    activeUsers: number;
    eventCounts: Partial<Record<UsageEventName, number>>;
  };
}

function total(summary: UsageSummary, event: UsageEventName): number {
  return summary.totals.eventCounts[event] ?? 0;
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-cs-muted/10 p-3">
      <p className={typography.csCaption}>{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-cs-foreground">{value}</p>
    </div>
  );
}

export default function OperatorUsagePage() {
  const { user, loading } = useAuth();
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [error, setError] = useState<'forbidden' | 'loadFailed' | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    let current = true;
    async function load() {
      try {
        const token = await getFirebaseAuth().currentUser?.getIdToken();
        if (!token) {
          throw new Error('No token');
        }
        const response = await fetch('/api/internal/usage', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (response.status === 403) {
          if (current) setError('forbidden');
          return;
        }
        if (!response.ok) {
          throw new Error('Usage request failed');
        }
        const result = (await response.json()) as UsageSummary;
        if (current) setSummary(result);
      } catch {
        if (current) setError('loadFailed');
      }
    }

    void load();
    const retry = window.setTimeout(() => void load(), 1_500);
    return () => {
      current = false;
      window.clearTimeout(retry);
    };
  }, [user]);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <header className="mb-6">
        <h1 className={`${typography.csCardTitle} text-2xl`}>{copy('usage.title')}</h1>
        <p className={`${typography.csCaption} mt-1`}>{copy('usage.subtitle')}</p>
      </header>

      {(loading || (user && !summary && !error)) && <SectionCardSkeleton />}
      {!loading && !user && <p className={typography.csBody}>{copy('usage.error.forbidden')}</p>}
      {error && <p className="text-sm text-cs-danger-text">{copy(`usage.error.${error}`)}</p>}

      {summary && (
        <div className="space-y-6">
          <SectionCard>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricCard label={copy('usage.metric.activeUsers')} value={summary.totals.activeUsers} />
              <MetricCard label={copy('usage.metric.scans')} value={total(summary, UsageEvent.ScanRequested)} />
              <MetricCard label={copy('usage.metric.meals')} value={total(summary, UsageEvent.MealSaved)} />
              <MetricCard label={copy('usage.metric.weighIns')} value={total(summary, UsageEvent.WeighInSaved)} />
            </div>
          </SectionCard>

          <SectionCard title={copy('usage.table.title')}>
            {summary.days.length === 0 ? (
              <p className={typography.csCaption}>{copy('usage.empty')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[36rem] text-left text-sm">
                  <thead className={typography.csCaption}>
                    <tr>
                      <th className="pb-3 font-medium">{copy('usage.table.date')}</th>
                      <th className="pb-3 font-medium">{copy('usage.table.activeUsers')}</th>
                      <th className="pb-3 font-medium">{copy('usage.table.scans')}</th>
                      <th className="pb-3 font-medium">{copy('usage.table.meals')}</th>
                      <th className="pb-3 font-medium">{copy('usage.table.weighIns')}</th>
                    </tr>
                  </thead>
                  <tbody className="text-cs-foreground">
                    {[...summary.days].reverse().map((day) => (
                      <tr key={day.date} className="border-t border-cs-border">
                        <td className="py-3 tabular-nums">{day.date}</td>
                        <td className="py-3 tabular-nums">{day.activeUsers}</td>
                        <td className="py-3 tabular-nums">{day.eventCounts[UsageEvent.ScanRequested] ?? 0}</td>
                        <td className="py-3 tabular-nums">{day.eventCounts[UsageEvent.MealSaved] ?? 0}</td>
                        <td className="py-3 tabular-nums">{day.eventCounts[UsageEvent.WeighInSaved] ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      )}
    </main>
  );
}
