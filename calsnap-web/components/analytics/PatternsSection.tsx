'use client';

import { SectionCard } from '@/components/design/SectionCard';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';

interface PatternsSectionProps {
  weekendAverageCalories: number | null;
  weekdayAverageCalories: number | null;
}

export function PatternsSection({
  weekendAverageCalories,
  weekdayAverageCalories,
}: PatternsSectionProps) {
  return (
    <SectionCard title={copy('analytics.section.patterns')}>
      {weekendAverageCalories !== null && weekdayAverageCalories !== null && (
        <p className={typography.csCaption}>
          {copy('analytics.patterns.weekendWeekday', {
            weekend: weekendAverageCalories,
            weekday: weekdayAverageCalories,
          })}
        </p>
      )}
    </SectionCard>
  );
}
