'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { SectionCard } from '@/components/design/SectionCard';
import {
  TIME_OF_DAY_BUCKETS,
  Weekday,
  timeOfDayDisplayLabel,
  weekdayShortLabel,
  type TimeOfDayBucket,
  type TopFoodEntry,
} from '@/lib/analytics/analytics-types';
import { copy } from '@/lib/copy';
import { lightColors } from '@/lib/design/colors';
import { typography } from '@/lib/design/typography';

interface PatternsSectionProps {
  dayOfWeekBreakdown: Record<Weekday, number>;
  timeOfDayBreakdown: Record<TimeOfDayBucket, number>;
  weekendAverageCalories: number | null;
  weekdayAverageCalories: number | null;
  topFoods: TopFoodEntry[];
}

const WEEKDAY_ORDER: Weekday[] = [
  Weekday.monday,
  Weekday.tuesday,
  Weekday.wednesday,
  Weekday.thursday,
  Weekday.friday,
  Weekday.saturday,
  Weekday.sunday,
];

export function PatternsSection({
  dayOfWeekBreakdown,
  timeOfDayBreakdown,
  weekendAverageCalories,
  weekdayAverageCalories,
  topFoods,
}: PatternsSectionProps) {
  const dowData = WEEKDAY_ORDER.map((weekday) => ({
    label: weekdayShortLabel(weekday),
    calories: dayOfWeekBreakdown[weekday],
  }));

  const todData = TIME_OF_DAY_BUCKETS.map((bucket) => ({
    label: timeOfDayDisplayLabel(bucket),
    calories: timeOfDayBreakdown[bucket],
  }));

  return (
    <SectionCard title={copy('analytics.section.patterns')}>
      <div className="flex flex-col gap-6">
        <div>
          <h3 className={`${typography.csMacroLabel} mb-2`}>
            {copy('analytics.patterns.caloriesByDow')}
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={dowData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-cs-border" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: lightColors.muted }} />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 11, fill: lightColors.muted }}
                width={36}
              />
              <Bar dataKey="calories" fill={lightColors.foreground} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3 className={`${typography.csMacroLabel} mb-2`}>
            {copy('analytics.patterns.caloriesByTod')}
          </h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={todData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-cs-border" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: lightColors.muted }} />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 11, fill: lightColors.muted }}
                width={64}
              />
              <Bar dataKey="calories" fill={lightColors.muted} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {weekendAverageCalories !== null && weekdayAverageCalories !== null && (
          <p className={typography.csCaption}>
            {copy('analytics.patterns.weekendWeekday', {
              weekend: weekendAverageCalories,
              weekday: weekdayAverageCalories,
            })}
          </p>
        )}

        {topFoods.length > 0 && (
          <div>
            <h3 className={`${typography.csMacroLabel} mb-2`}>
              {copy('analytics.patterns.topFoods')}
            </h3>
            <ul className="divide-y divide-cs-border rounded-lg border border-cs-border">
              {topFoods.map((food) => (
                <li
                  key={food.name}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <span className={typography.csMacroLabel}>{food.name}</span>
                  <span className={typography.csCaption}>
                    {copy('analytics.patterns.foodEntry', {
                      count: food.count,
                      avg: food.avgCalories,
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
