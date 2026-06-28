'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { notSignedInError } from '@/lib/copy/errors';
import { deleteAllUserData } from '@/lib/services/user-data-deletion';

export function useDeleteAllData(uid: string | undefined) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      if (!uid) {
        throw notSignedInError();
      }
      await deleteAllUserData(uid);
    },
    onSuccess: () => {
      queryClient.clear();
      router.replace('/onboarding');
    },
  });
}
