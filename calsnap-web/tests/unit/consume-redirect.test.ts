import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Auth, UserCredential } from 'firebase/auth';

const getRedirectResult = vi.hoisted(() => vi.fn());

vi.mock('firebase/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('firebase/auth')>()),
  getRedirectResult,
}));

import { consumeRedirect } from '@/lib/auth/auth-context';

describe('consumeRedirect', () => {
  beforeEach(() => {
    getRedirectResult.mockReset();
  });

  it('allows a later redirect read after an earlier failure', async () => {
    const firstError = new Error('temporary redirect failure');
    const result = {} as UserCredential;
    getRedirectResult
      .mockRejectedValueOnce(firstError)
      .mockResolvedValueOnce(result);

    await expect(consumeRedirect({} as Auth)).rejects.toBe(firstError);
    await expect(consumeRedirect({} as Auth)).resolves.toBe(result);
    expect(getRedirectResult).toHaveBeenCalledTimes(2);
  });
});
