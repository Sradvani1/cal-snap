'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notSignedInError } from '@/lib/copy/errors';
import type { ProfileExtras } from '@/lib/models/profile-doc';
import type { UserProfile } from '@/lib/models/user-profile';
import { invalidateWeighInQueries } from '@/lib/queries/invalidate-weigh-ins';
import { saveWeighIn, type SaveWeighInResult } from '@/lib/services/weigh-in-service';

export interface LogWeighInInput {
  profile: UserProfile;
  profileExtras: ProfileExtras;
  newWeightKg: number;
  date: Date;
}

export function useLogWeighIn(uid: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LogWeighInInput): Promise<SaveWeighInResult> => {
      if (!uid) {
        throw notSignedInError();
      }
      return saveWeighIn({
        uid,
        profile: input.profile,
        profileExtras: input.profileExtras,
        newWeightKg: input.newWeightKg,
        date: input.date,
      });
    },
    onSuccess: () => {
      if (!uid) {
        return;
      }
      invalidateWeighInQueries(queryClient, uid);
    },
  });
}
