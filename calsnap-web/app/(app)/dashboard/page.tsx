'use client';

import { useCallback, useMemo, useState } from 'react';
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
import { MacroBreakdownSheet } from '@/components/dashboard/MacroBreakdownSheet';
import { WeighInReminderBanner } from '@/components/dashboard/WeighInReminderBanner';
import { WeighInSheet } from '@/components/progress/WeighInSheet';
import { copy } from '@/lib/copy';
import { layout } from '@/lib/design/layout';
import type { FoodItem } from '@/lib/models/food-item';
import { cn } from '@/lib/utils/cn';
import { useWeighInReminder } from '@/lib/queries/use-weigh-in-reminder';

function DashboardContent({ uid }: { uid: string | undefined }) {
  const dashboard = useDashboard(uid);
  const profileQuery = useProfile(uid);
  const plateau = usePlateauAlert(uid);
  const reminder = useWeighInReminder(uid);
  const [showWeighInSheet, setShowWeighInSheet] = useState(false);
  const [macroSheet, setMacroSheet] = useState<{
    items: FoodItem[];
    macro: 'protein' | 'carbs' | 'fat' | 'fiber';
  } | null>(null);

  const profile = profileQuery.data?.profile;
  const profileExtras = profileQuery.data?.extras;

  const sheetReady = useMemo(
    () => Boolean(profile && profileExtras && uid),
    [profile, profileExtras, uid],
  );

  const handleMacroClick = useCallback(
    (macro: 'protein' | 'carbs' | 'fat' | 'fiber') => {
      const allItems: FoodItem[] = [];
      const meals = Object.values(dashboard.mealsByType);
      for (const mealList of meals) {
        if (mealList) {
          for (const meal of mealList) {
            allItems.push(...meal.items);
          }
        }
      }
      const field = `${macro}G` as keyof FoodItem;
      const filtered = allItems.filter((i) => (i[field] as number) > 0);
      filtered.sort((a, b) => (b[field] as number) - (a[field] as number));
      setMacroSheet({ items: filtered, macro });
    },
    [dashboard.mealsByType],
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
          segments={dashboard.ringSegments}
          target={dashboard.target}
        />

        <MacroBarCard
          proteinConsumed={dashboard.proteinConsumed}
          proteinTarget={dashboard.macros.proteinG}
          carbsConsumed={dashboard.carbsConsumed}
          carbsTarget={dashboard.macros.carbsG}
          saturatedFatConsumed={dashboard.saturatedFatConsumed}
          unsaturatedFatConsumed={dashboard.unsaturatedFatConsumed}
          fatTarget={dashboard.macros.fatG}
          fiberConsumed={dashboard.fiberConsumed}
          fiberTarget={dashboard.macros.fiberG}
          onMacroClick={handleMacroClick}
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

      {macroSheet && (
        <MacroBreakdownSheet
          open
          onOpenChange={() => setMacroSheet(null)}
          items={macroSheet.items}
          macro={macroSheet.macro}
        />
      )}
    </>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  return <DashboardContent key={user?.uid ?? 'signed-out'} uid={user?.uid} />;
}
