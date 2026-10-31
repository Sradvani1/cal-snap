'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { AuthProvider } from '@/lib/auth/auth-context';
import { createQueryClient } from '@/lib/queries/query-client';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider onSignOut={() => queryClient.clear()}>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
