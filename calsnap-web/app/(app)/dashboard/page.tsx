'use client';

import { useAuth } from '@/lib/auth/use-auth';
import { useDashboard } from '@/lib/queries/use-dashboard';
import { SessionErrorBanner } from '@/components/auth/SessionErrorBanner';
import {
  CalorieRingCard,
  CalorieRingCardSkeleton,
} from '@/components/dashboard/CalorieRingCard';
import {
  MacroBarCard,
  MacroBarCardSkeleton,
} from '@/components/dashboard/MacroBarCard';
import {
  TodaysMealsSection,
  TodaysMealsSectionSkeleton,
} from '@/components/dashboard/TodaysMealsSection';
import {
  DailySummaryFooter,
  DailySummaryFooterSkeleton,
} from '@/components/dashboard/DailySummaryFooter';
import {
  WeightTrendMiniChart,
  WeightTrendMiniChartSkeleton,
} from '@/components/dashboard/WeightTrendMiniChart';
import {
  DashboardHeader,
  DashboardHeaderSkeleton,
} from '@/components/dashboard/DashboardHeader';
import { ScanFab } from '@/components/dashboard/ScanFab';
import { PlateauAlertSheet } from '@/components/dashboard/PlateauAlertSheet';

function DashboardContent({ uid }: { uid: string | undefined }) {
  const dashboard = useDashboard(uid);

  if (dashboard.isLoading) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-8 pb-24">
        <DashboardHeaderSkeleton />
        <CalorieRingCardSkeleton />
        <MacroBarCardSkeleton />
        <TodaysMealsSectionSkeleton />
        <DailySummaryFooterSkeleton />
        <WeightTrendMiniChartSkeleton />
      </div>
    );
  }

  if (dashboard.profileLoadFailed || !dashboard.profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 pb-24">
        <SessionErrorBanner
          message={
            dashboard.error instanceof Error
              ? dashboard.error.message
              : 'Could not load your profile.'
          }
        />
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-8 pb-24">
        {dashboard.error && (
          <SessionErrorBanner
            message={
              dashboard.error instanceof Error
                ? dashboard.error.message
                : 'Failed to load dashboard'
            }
          />
        )}

        <DashboardHeader greeting={dashboard.greeting} date={dashboard.formattedDate} />

        <CalorieRingCard
          consumed={dashboard.consumed}
          target={dashboard.target}
          remaining={dashboard.remaining}
          progress={dashboard.progress}
          band={dashboard.band}
        />

        <MacroBarCard
          proteinConsumed={dashboard.proteinConsumed}
          proteinTarget={dashboard.macros.proteinG}
          carbsConsumed={dashboard.carbsConsumed}
          carbsTarget={dashboard.macros.carbsG}
          fatConsumed={dashboard.fatConsumed}
          fatTarget={dashboard.macros.fatG}
          fiberConsumed={dashboard.fiberConsumed}
          fiberTarget={dashboard.fiberTarget}
          fiberBand={dashboard.fiberBand}
        />

        <TodaysMealsSection mealsByType={dashboard.mealsByType} />

        <DailySummaryFooter
          fiberConsumed={dashboard.fiberConsumed}
          fiberTarget={dashboard.fiberTarget}
          fiberBand={dashboard.fiberBand}
          netSummary={dashboard.netSummary}
          netCalorieDelta={dashboard.netCalorieDelta}
          actualMacroPercents={dashboard.actualMacroPercents}
          targetMacroPercents={dashboard.targetMacroPercents}
        />

        <WeightTrendMiniChart
          weighIns={dashboard.chartWeighIns}
          startingWeightKg={dashboard.startingWeightKg}
          useLbs={dashboard.useLbsForDisplay}
        />
      </div>

      <ScanFab href="/scan" />

      <PlateauAlertSheet
        open={dashboard.showPlateauAlert}
        onDietBreak={() => void dashboard.applyDietBreak()}
        onSmallReduction={() => void dashboard.applySmallReduction()}
        onDismiss={dashboard.dismissPlateauAlert}
      />
    </>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  return <DashboardContent key={user?.uid ?? 'signed-out'} uid={user?.uid} />;
}
