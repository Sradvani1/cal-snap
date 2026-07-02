import { afterEach, describe, expect, it, vi } from 'vitest';

import { scrollMainToTop } from '@/lib/app/scroll-main';
import { isTabRootPathname, TAB_ROOT_PATHS } from '@/lib/app/tab-navigation';

function stubMatchMedia(matches: boolean): void {
  vi.stubGlobal('window', {
    matchMedia: vi.fn().mockReturnValue({ matches }),
  });
}

describe('scrollMainToTop', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('scrolls to top with auto when reduced motion is preferred', () => {
    stubMatchMedia(true);
    const scrollTo = vi.fn();
    const main = { scrollTo } as unknown as HTMLElement;

    scrollMainToTop(main);

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });

  it('scrolls to top with smooth when motion is allowed', () => {
    stubMatchMedia(false);
    const scrollTo = vi.fn();
    const main = { scrollTo } as unknown as HTMLElement;

    scrollMainToTop(main);

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('no-ops when main is null', () => {
    stubMatchMedia(false);
    expect(() => scrollMainToTop(null)).not.toThrow();
  });
});

describe('isTabRootPathname', () => {
  it('matches tab root paths only', () => {
    for (const path of TAB_ROOT_PATHS) {
      expect(isTabRootPathname(path)).toBe(true);
    }
    expect(isTabRootPathname('/log/meal-1')).toBe(false);
    expect(isTabRootPathname('/analytics')).toBe(false);
  });
});
