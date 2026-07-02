import { describe, expect, it } from 'vitest';

import { createQueryClient } from '@/lib/queries/query-client';

describe('createQueryClient', () => {
  it('disables refetch on window focus', () => {
    const client = createQueryClient();
    expect(client.getDefaultOptions().queries?.refetchOnWindowFocus).toBe(false);
  });

  it('keeps a 30 second stale time', () => {
    const client = createQueryClient();
    expect(client.getDefaultOptions().queries?.staleTime).toBe(30_000);
  });
});
