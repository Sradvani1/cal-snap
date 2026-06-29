'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { bootstrapFirebaseAuthRedirect } from '@/lib/auth/auth-bootstrap';
import { AuthProvider } from '@/lib/auth/auth-context';
import { createQueryClient } from '@/lib/queries/query-client';

if (typeof window !== 'undefined') {
  bootstrapFirebaseAuthRedirect();
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
