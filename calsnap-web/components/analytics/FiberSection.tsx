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
import { SectionCard } from '@/components/design/SectionCard';
import type { DailyNutritionSummary } from '@/lib/analytics/analytics-types';
import { copy } from '@/lib/copy';
import { fiberProgressColor, lightColors } from '@/lib/design/colors';
import { typography } from '@/lib/design/typography';

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

  const ariaLabel = copy('analytics.fiber.summary', {
    met: daysMeetingFiberTarget,
    total: loggedDayCount,
  });

  return (
    <SectionCard title={copy('analytics.section.fiber')}>
      <p className={`${typography.csCaption} mb-4`}>
        {copy('analytics.fiber.summary', {
          met: daysMeetingFiberTarget,
          total: loggedDayCount,
        })}
      </p>

      <div role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-cs-border" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 11, fill: lightColors.muted }}
              interval={chartData.length > 14 ? Math.floor(chartData.length / 7) : 0}
            />
            <YAxis tick={{ fontSize: 11, fill: lightColors.muted }} width={40} />
            <ReferenceLine
              y={fiberTargetG}
              stroke={lightColors.muted}
              strokeDasharray="4 4"
              label={{
                value: copy('analytics.macro.target'),
                position: 'insideTopRight',
                fontSize: 11,
                fill: lightColors.muted,
              }}
            />
            <Bar dataKey="fiberG" radius={[4, 4, 0, 0]}>
              {chartData.map((row) => (
                <Cell
                  key={row.dateLabel}
                  fill={fiberProgressColor(row.metTarget ? 'onTrack' : 'moderate')}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
