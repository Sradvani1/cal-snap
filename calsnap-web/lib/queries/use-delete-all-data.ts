'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { deleteAllUserData } from '@/lib/services/user-data-deletion';

export function useDeleteAllData(uid: string | undefined) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      if (!uid) {
        throw new Error('Not signed in');
      }
      await deleteAllUserData(uid);
    },
    onSuccess: () => {
      queryClient.clear();
      router.replace('/onboarding');
    },
  });
}
