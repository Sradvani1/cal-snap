'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notSignedInError } from '@/lib/copy/errors';
import { localDayKey } from '@/lib/dashboard/date-window';
import type { MealEntry } from '@/lib/models/meal-entry';
import { invalidateMealQueries } from '@/lib/queries/invalidate-meals';
import {
  createMeal,
  deleteMealPhoto,
  uploadMealPhoto,
} from '@/lib/repositories/meals';

export interface LogMealInput {
  entry: MealEntry;
  photoBlob?: Blob;
}

export async function logMeal(
  uid: string | undefined,
  { entry, photoBlob }: LogMealInput,
): Promise<MealEntry> {
  if (!uid) {
    throw notSignedInError();
  }

  let uploadedPhotoPath: string | undefined;
  if (photoBlob) {
    uploadedPhotoPath = await uploadMealPhoto(uid, entry.id, photoBlob);
  }

  const entryWithPhoto: MealEntry = {
    ...entry,
    photoStoragePath: uploadedPhotoPath ?? entry.photoStoragePath,
  };

  try {
    await createMeal(entryWithPhoto);
  } catch (error) {
    if (uploadedPhotoPath) {
      try {
        await deleteMealPhoto(uploadedPhotoPath);
      } catch {
        // Best-effort cleanup — original meal write error takes precedence.
      }
    }
    throw error;
  }

  return entryWithPhoto;
}

export function useLogMeal(uid: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LogMealInput) => logMeal(uid, input),
    onSuccess: (entry) => {
      if (!uid) {
        return;
      }
      const dayKey = localDayKey(entry.timestamp);
      invalidateMealQueries(queryClient, uid, dayKey);
    },
  });
}
