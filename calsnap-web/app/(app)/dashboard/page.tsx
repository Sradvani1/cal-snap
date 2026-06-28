'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth/use-auth';
import { useDashboard } from '@/lib/queries/use-dashboard';
import { usePlateauAlert } from '@/lib/queries/use-plateau-alert';
import { useProfile } from '@/lib/queries/use-profile';
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
import { WeighInSheet } from '@/components/progress/WeighInSheet';

function DashboardContent({ uid }: { uid: string | undefined }) {
  const dashboard = useDashboard(uid);
  const profileQuery = useProfile(uid);
  const plateau = usePlateauAlert(uid);
  const [showWeighInSheet, setShowWeighInSheet] = useState(false);

  const profile = profileQuery.data?.profile;
  const profileExtras = profileQuery.data?.extras;

  const sheetReady = useMemo(
    () => Boolean(profile && profileExtras && uid),
    [profile, profileExtras, uid],
  );

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
        {(dashboard.error || plateau.actionError) && (
          <SessionErrorBanner
            message={
              dashboard.error instanceof Error
                ? dashboard.error.message
                : plateau.actionError ?? 'Failed to load dashboard'
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
          onLogWeighIn={() => setShowWeighInSheet(true)}
        />
      </div>

      <ScanFab href="/scan" />

      {sheetReady && profile && profileExtras && uid && (
        <WeighInSheet
          open={showWeighInSheet}
          uid={uid}
          profile={profile}
          profileExtras={profileExtras}
          onClose={() => setShowWeighInSheet(false)}
          onSaved={() => setShowWeighInSheet(false)}
        />
      )}

      <PlateauAlertSheet
        open={plateau.showPlateauAlert}
        onDietBreak={() => void plateau.applyDietBreak()}
        onSmallReduction={() => void plateau.applySmallReduction()}
        onDismiss={plateau.dismissPlateauAlert}
      />
    </>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  return <DashboardContent key={user?.uid ?? 'signed-out'} uid={user?.uid} />;
}
