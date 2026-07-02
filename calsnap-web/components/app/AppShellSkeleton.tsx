'use client';

import {
  CalorieRingCardSkeleton,
} from '@/components/dashboard/CalorieRingCard';
import {
  DailySummaryFooterSkeleton,
} from '@/components/dashboard/DailySummaryFooter';
import {
  DashboardHeaderSkeleton,
} from '@/components/dashboard/DashboardHeader';
import {
  MacroBarCardSkeleton,
} from '@/components/dashboard/MacroBarCard';
import {
  TodaysMealsSectionSkeleton,
} from '@/components/dashboard/TodaysMealsSection';
import {
  WeightTrendMiniChartSkeleton,
} from '@/components/dashboard/WeightTrendMiniChart';
import { layout } from '@/lib/design/layout';
import { cn } from '@/lib/utils/cn';

export function AppShellSkeleton() {
  return (
    <div className={cn(layout.pageShell, 'gap-6 py-8', layout.content.bottomPadding)}>
      <DashboardHeaderSkeleton />
      <CalorieRingCardSkeleton />
      <MacroBarCardSkeleton />
      <TodaysMealsSectionSkeleton />
      <DailySummaryFooterSkeleton />
      <WeightTrendMiniChartSkeleton />
    </div>
  );
}
