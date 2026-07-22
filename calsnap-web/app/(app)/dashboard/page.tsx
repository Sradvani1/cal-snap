'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useDashboard } from '@/lib/queries/use-dashboard';
import { usePlateauAlert } from '@/lib/queries/use-plateau-alert';
import { useProfile } from '@/lib/queries/use-profile';
import { InlineErrorMessage } from '@/components/design/InlineErrorMessage';
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
  DashboardHeader,
  DashboardHeaderSkeleton,
} from '@/components/dashboard/DashboardHeader';
import { PlateauAlertSheet } from '@/components/dashboard/PlateauAlertSheet';
import { WeighInReminderBanner } from '@/components/dashboard/WeighInReminderBanner';
import { WeighInSheet } from '@/components/progress/WeighInSheet';
import { copy } from '@/lib/copy';
import { layout } from '@/lib/design/layout';
import { cn } from '@/lib/utils/cn';
import { useWeighInReminder } from '@/lib/queries/use-weigh-in-reminder';

function DashboardContent({ uid }: { uid: string | undefined }) {
  const dashboard = useDashboard(uid);
  const profileQuery = useProfile(uid);
  const plateau = usePlateauAlert(uid);
  const reminder = useWeighInReminder(uid);
  const [showWeighInSheet, setShowWeighInSheet] = useState(false);

  const profile = profileQuery.data?.profile;
  const profileExtras = profileQuery.data?.extras;

  const sheetReady = useMemo(
    () => Boolean(profile && profileExtras && uid),
    [profile, profileExtras, uid],
  );

  if (dashboard.isLoading) {
    return (
      <div className={cn(layout.pageShell, 'gap-6 py-8', layout.content.bottomPadding)}>
        <DashboardHeaderSkeleton />
        <CalorieRingCardSkeleton />
        <MacroBarCardSkeleton />
        <TodaysMealsSectionSkeleton />
      </div>
    );
  }

  if (dashboard.profileLoadFailed || !dashboard.profile) {
    return (
      <div className={cn(layout.pageShell, 'py-8', layout.content.bottomPadding)}>
        <InlineErrorMessage message={copy('dashboard.error.profileLoad')} />
      </div>
    );
  }

  return (
    <>
      <div className={cn(layout.pageShell, 'gap-6 py-8', layout.content.bottomPadding)}>
        {(dashboard.error || plateau.actionError) && (
          <InlineErrorMessage
            message={plateau.actionError ?? copy('dashboard.error.loadFailed')}
          />
        )}

        <DashboardHeader greeting={dashboard.greeting} date={dashboard.formattedDate} />

        {!reminder.isLoading && reminder.shouldShow && uid && (
          <WeighInReminderBanner
            uid={uid}
            onLogNow={() => setShowWeighInSheet(true)}
          />
        )}

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
          carbsTarget={dashboard.macros.totalCarbsG}
          fatConsumed={dashboard.fatConsumed}
          fatTarget={dashboard.macros.fatG}
          saturatedFatConsumed={dashboard.saturatedFatConsumed}
          unsaturatedFatConsumed={dashboard.unsaturatedFatConsumed}
          fiberConsumed={dashboard.fiberConsumed}
          fiberTarget={dashboard.macros.fiberG}
        />

        <TodaysMealsSection mealsByType={dashboard.mealsByType} />

      </div>

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
