import { afterEach, describe, expect, it, vi } from 'vitest';
import { shouldUseGoogleRedirect } from '@/lib/auth/google-sign-in-strategy';

describe('shouldUseGoogleRedirect', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses redirect on iPhone', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    });
    expect(shouldUseGoogleRedirect()).toBe(true);
  });

  it('uses popup on desktop Chrome', () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    expect(shouldUseGoogleRedirect()).toBe(false);
  });
});
