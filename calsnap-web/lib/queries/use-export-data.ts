'use client';

import { useMutation } from '@tanstack/react-query';
import { notSignedInError } from '@/lib/copy/errors';
import { fetchAllMeals } from '@/lib/repositories/meals';
import { fetchAllWeighIns } from '@/lib/repositories/weigh-ins';
import {
  exportFilename,
  makeCSV,
  triggerCSVDownload,
} from '@/lib/services/data-export';

export function useExportData(uid: string | undefined, displayName: string) {
  return useMutation({
    mutationFn: async (): Promise<void> => {
      if (!uid) {
        throw notSignedInError();
      }
      const [meals, weighIns] = await Promise.all([
        fetchAllMeals(uid, true),
        fetchAllWeighIns(uid, false),
      ]);
      const csv = makeCSV(meals, weighIns);
      triggerCSVDownload(csv, exportFilename(displayName));
    },
  });
}
