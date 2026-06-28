'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { AnalyticsSectionCard } from '@/components/analytics/AnalyticsSectionCard';
import type { DailyNutritionSummary } from '@/lib/analytics/analytics-types';

interface FiberSectionProps {
  chartDailySeries: DailyNutritionSummary[];
  fiberTargetG: number;
  daysMeetingFiberTarget: number;
  loggedDayCount: number;
}

interface ChartRow {
  dateLabel: string;
  fiberG: number;
  metTarget: boolean;
}

function formatAxisDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function FiberSection({
  chartDailySeries,
  fiberTargetG,
  daysMeetingFiberTarget,
  loggedDayCount,
}: FiberSectionProps) {
  const chartData: ChartRow[] = chartDailySeries.map((day) => ({
    dateLabel: formatAxisDate(day.date),
    fiberG: day.fiberG,
    metTarget: day.fiberG >= fiberTargetG,
  }));

  const ariaLabel = `Fiber intake: ${daysMeetingFiberTarget} of ${loggedDayCount} logged days met the ${fiberTargetG.toFixed(0)}g target`;

  return (
    <AnalyticsSectionCard title="Fiber">
      <p className="mb-4 text-sm text-neutral-600">
        {daysMeetingFiberTarget} of {loggedDayCount} logged days met fiber target
      </p>

      <div role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-100" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 11, fill: '#737373' }}
              interval={chartData.length > 14 ? Math.floor(chartData.length / 7) : 0}
            />
            <YAxis tick={{ fontSize: 11, fill: '#737373' }} width={40} />
            <ReferenceLine
              y={fiberTargetG}
              stroke="#737373"
              strokeDasharray="4 4"
              label={{ value: 'Target', position: 'insideTopRight', fontSize: 11, fill: '#737373' }}
            />
            <Bar dataKey="fiberG" radius={[4, 4, 0, 0]}>
              {chartData.map((row) => (
                <Cell key={row.dateLabel} fill={row.metTarget ? '#22c55e' : '#f59e0b'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </AnalyticsSectionCard>
  );
}
