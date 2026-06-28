'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { AnalyticsSectionCard } from '@/components/analytics/AnalyticsSectionCard';
import {
  TIME_OF_DAY_BUCKETS,
  Weekday,
  timeOfDayDisplayLabel,
  weekdayShortLabel,
  type TimeOfDayBucket,
  type TopFoodEntry,
} from '@/lib/analytics/analytics-types';

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
    <AnalyticsSectionCard title="Patterns">
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="mb-2 text-sm font-medium text-neutral-700">Calories by day of week</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={dowData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-100" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#737373' }} />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 11, fill: '#737373' }}
                width={36}
              />
              <Bar dataKey="calories" fill="#171717" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-medium text-neutral-700">Calories by time of day</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={todData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-100" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#737373' }} />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 11, fill: '#737373' }}
                width={64}
              />
              <Bar dataKey="calories" fill="#525252" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {weekendAverageCalories !== null && weekdayAverageCalories !== null && (
          <p className="text-sm text-neutral-600">
            Weekend avg: {weekendAverageCalories} kcal · Weekday avg: {weekdayAverageCalories} kcal
          </p>
        )}

        {topFoods.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-neutral-700">Top foods</h3>
            <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
              {topFoods.map((food) => (
                <li
                  key={food.name}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <span className="font-medium text-neutral-900">{food.name}</span>
                  <span className="text-neutral-500">
                    {food.count}× · ~{food.avgCalories} kcal
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AnalyticsSectionCard>
  );
}
