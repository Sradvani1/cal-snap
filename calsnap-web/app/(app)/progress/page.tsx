'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/use-auth';
import { usePlateauAlert } from '@/lib/queries/use-plateau-alert';
import { useProfile } from '@/lib/queries/use-profile';
import { SessionErrorBanner } from '@/components/auth/SessionErrorBanner';
import { PlateauAlertSheet } from '@/components/dashboard/PlateauAlertSheet';
import { WeighInSheet } from '@/components/progress/WeighInSheet';
import { WeightProgressView } from '@/components/progress/WeightProgressView';

function ProgressContent({ uid }: { uid: string | undefined }) {
  const plateau = usePlateauAlert(uid);
  const profileQuery = useProfile(uid);
  const [showWeighInSheet, setShowWeighInSheet] = useState(false);

  const profile = profileQuery.data?.profile;
  const profileExtras = profileQuery.data?.extras;

  return (
    <>
      <div className="mx-auto max-w-lg px-4 py-8 pb-24">
        {plateau.actionError && (
          <SessionErrorBanner message={plateau.actionError} />
        )}
        {uid ? (
          <WeightProgressView
            uid={uid}
            onLogWeighIn={() => setShowWeighInSheet(true)}
          />
        ) : null}
      </div>

      {profile && profileExtras && uid && (
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

export default function ProgressPage() {
  const { user } = useAuth();
  return <ProgressContent key={user?.uid ?? 'signed-out'} uid={user?.uid} />;
}
