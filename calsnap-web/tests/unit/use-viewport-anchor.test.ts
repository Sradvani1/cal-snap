import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { computeViewportAnchorBottom } from '@/lib/hooks/use-viewport-anchor';

type VisualViewportMock = {
  height: number;
  offsetTop: number;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
};

function createVisualViewport(overrides: Partial<VisualViewportMock> = {}): VisualViewportMock {
  return {
    height: 800,
    offsetTop: 0,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    ...overrides,
  };
}

describe('computeViewportAnchorBottom', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      innerHeight: 800,
      visualViewport: createVisualViewport(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns 0 when the keyboard is closed', () => {
    expect(computeViewportAnchorBottom()).toBe(0);
  });

  it('returns the keyboard overlap when the visual viewport shrinks', () => {
    window.visualViewport = createVisualViewport({ height: 500, offsetTop: 0 }) as unknown as VisualViewport;
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });

    expect(computeViewportAnchorBottom()).toBe(300);
  });

  it('accounts for a scrolled visual viewport offset', () => {
    window.visualViewport = createVisualViewport({ height: 500, offsetTop: 50 }) as unknown as VisualViewport;
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });

    expect(computeViewportAnchorBottom()).toBe(250);
  });

  it('clamps to 0 when the visual viewport extends beyond the layout viewport', () => {
    window.visualViewport = createVisualViewport({ height: 900, offsetTop: 0 }) as unknown as VisualViewport;
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });

    expect(computeViewportAnchorBottom()).toBe(0);
  });

  it('returns 0 when visualViewport is unavailable', () => {
    Object.defineProperty(window, 'visualViewport', { value: undefined, configurable: true });
    expect(computeViewportAnchorBottom()).toBe(0);
  });
});

describe('computeViewportAnchorBottom SSR snapshot', () => {
  it('returns 0 without window', () => {
    const savedWindow = globalThis.window;
    // @ts-expect-error — simulate SSR
    delete globalThis.window;

    expect(computeViewportAnchorBottom()).toBe(0);

    globalThis.window = savedWindow;
  });
});
