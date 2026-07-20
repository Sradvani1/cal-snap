import type { AggregatedMeals } from '@/lib/dashboard/aggregate-meals';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

interface DailySummaryBarProps {
  aggregation: AggregatedMeals;
}

export function DailySummaryBar({ aggregation }: DailySummaryBarProps) {
  return (
    <div className="border-t border-cs-border pt-3 mt-4">
      <p className={cn(typography.csCaption, 'mb-1')}>{copy('mealLog.summary.total')}</p>
      <div className="flex items-center gap-4">
        <span className={cn(typography.csBody, 'font-medium tabular-nums')}>
          {Math.round(aggregation.todaysCalories)} {copy('common.macro.kcal')}
        </span>
        <div className="flex gap-3 text-xs tabular-nums text-cs-muted">
          <span>
            {copy('common.macro.protein')} {Math.round(aggregation.todaysProteinG)}{copy('common.macro.grams')}
          </span>
          <span>
            {copy('common.macro.carbs')} {Math.round(aggregation.todaysCarbsG)}{copy('common.macro.grams')}
          </span>
          <span>
            {copy('common.macro.fat')} {Math.round(aggregation.todaysFatG)}{copy('common.macro.grams')}
          </span>
        </div>
      </div>
    </div>
  );
}
