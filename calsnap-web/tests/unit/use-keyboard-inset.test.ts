import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FocusEvent } from 'react';

import {
  computeKeyboardInset,
  scrollFormFieldIntoView,
} from '@/lib/hooks/use-keyboard-inset';

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

describe('computeKeyboardInset', () => {
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
    expect(computeKeyboardInset()).toBe(0);
  });

  it('returns a positive inset when the visual viewport shrinks', () => {
    window.visualViewport = createVisualViewport({ height: 500, offsetTop: 0 });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });

    expect(computeKeyboardInset()).toBe(300);
  });

  it('returns 0 when visualViewport is unavailable', () => {
    Object.defineProperty(window, 'visualViewport', { value: undefined, configurable: true });
    expect(computeKeyboardInset()).toBe(0);
  });
});

describe('computeKeyboardInset SSR snapshot', () => {
  it('returns 0 without window', () => {
    const savedWindow = globalThis.window;
    // @ts-expect-error — simulate SSR
    delete globalThis.window;

    expect(computeKeyboardInset()).toBe(0);

    globalThis.window = savedWindow;
  });
});

describe('scrollFormFieldIntoView', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('scrolls the focused field instead of the wrapper by default', () => {
    const wrapperScrollIntoView = vi.fn();
    const targetScrollIntoView = vi.fn();
    const matchMedia = vi.fn().mockReturnValue({ matches: false });
    vi.stubGlobal('window', { matchMedia });

    scrollFormFieldIntoView({
      currentTarget: { scrollIntoView: wrapperScrollIntoView },
      target: { scrollIntoView: targetScrollIntoView },
    } as unknown as FocusEvent<HTMLElement>);

    expect(targetScrollIntoView).toHaveBeenCalledWith({
      block: 'nearest',
      behavior: 'smooth',
    });
    expect(wrapperScrollIntoView).not.toHaveBeenCalled();
  });

  it('uses instant scroll when reduced motion is preferred', () => {
    const targetScrollIntoView = vi.fn();
    const matchMedia = vi.fn().mockReturnValue({ matches: true });
    vi.stubGlobal('window', { matchMedia });

    scrollFormFieldIntoView({
      target: { scrollIntoView: targetScrollIntoView },
    } as unknown as FocusEvent<HTMLElement>);

    expect(targetScrollIntoView).toHaveBeenCalledWith({
      block: 'nearest',
      behavior: 'instant',
    });
  });

  it('no-ops when the focus target is not an element', () => {
    const matchMedia = vi.fn().mockReturnValue({ matches: false });
    vi.stubGlobal('window', { matchMedia });

    expect(() =>
      scrollFormFieldIntoView({
        target: null,
      } as unknown as FocusEvent<HTMLElement>),
    ).not.toThrow();
  });
});
