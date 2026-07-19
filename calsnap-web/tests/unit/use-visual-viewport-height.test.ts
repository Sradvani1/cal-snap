import { afterEach, describe, expect, it, vi } from 'vitest';

import { getVisualViewportHeight } from '@/lib/hooks/use-visual-viewport-height';

type VisualViewportMock = {
  height: number;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
};

function createVisualViewport(
  overrides: Partial<VisualViewportMock> = {},
): VisualViewportMock {
  return {
    height: 800,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    ...overrides,
  };
}

describe('getVisualViewportHeight', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null during SSR (no window)', () => {
    const savedWindow = globalThis.window;
    // @ts-expect-error — simulate SSR
    delete globalThis.window;
    expect(getVisualViewportHeight()).toBeNull();
    globalThis.window = savedWindow;
  });

  it('returns null when visualViewport is unavailable', () => {
    vi.stubGlobal('window', { visualViewport: undefined, innerHeight: 800 });
    expect(getVisualViewportHeight()).toBeNull();
  });

  it('returns the visual viewport height', () => {
    vi.stubGlobal('window', {
      visualViewport: createVisualViewport({ height: 700 }),
      innerHeight: 800,
    });
    expect(getVisualViewportHeight()).toBe(700);
  });
});
