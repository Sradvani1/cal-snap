import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  evaluateRecovery,
  isIOSStandalone,
} from '@/lib/hooks/use-ios-standalone-viewport-recovery';

// ---------------------------------------------------------------------------
// isIOSStandalone
// ---------------------------------------------------------------------------

describe('isIOSStandalone', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns false during SSR (no window)', () => {
    const savedWindow = globalThis.window;
    // @ts-expect-error — simulate SSR
    delete globalThis.window;
    expect(isIOSStandalone()).toBe(false);
    globalThis.window = savedWindow;
  });

  it('returns true when navigator.standalone === true', () => {
    vi.stubGlobal('navigator', { standalone: true, userAgent: 'iPhone', userAgentData: undefined });
    vi.stubGlobal('window', { matchMedia: vi.fn(() => ({ matches: false })) });
    expect(isIOSStandalone()).toBe(true);
  });

  it('returns true with iOS UA + matchMedia standalone match', () => {
    vi.stubGlobal('navigator', { standalone: undefined, userAgent: 'iPhone', userAgentData: undefined });
    vi.stubGlobal('window', { matchMedia: vi.fn(() => ({ matches: true })) });
    expect(isIOSStandalone()).toBe(true);
  });

  it('returns false with iOS UA but no standalone match', () => {
    vi.stubGlobal('navigator', { standalone: undefined, userAgent: 'iPhone', userAgentData: undefined });
    vi.stubGlobal('window', { matchMedia: vi.fn(() => ({ matches: false })) });
    expect(isIOSStandalone()).toBe(false);
  });

  it('returns false with non-iOS UA even with standalone match', () => {
    vi.stubGlobal('navigator', { standalone: undefined, userAgent: 'Android', userAgentData: undefined });
    // matchMedia returning true would normally match, but the UA check should prevent it
    vi.stubGlobal('window', { matchMedia: vi.fn(() => ({ matches: true })) });
    expect(isIOSStandalone()).toBe(false);
  });

  it('returns true with userAgentData platform iOS', () => {
    vi.stubGlobal('navigator', {
      standalone: undefined,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      userAgentData: { platform: 'iOS' },
    });
    vi.stubGlobal('window', { matchMedia: vi.fn(() => ({ matches: true })) });
    expect(isIOSStandalone()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// evaluateRecovery — pure state-machine transitions
// ---------------------------------------------------------------------------

describe('evaluateRecovery', () => {
  it('seeds baseline when null — no recovery', () => {
    const result = evaluateRecovery({
      baseline: null,
      keyboardWasOpen: false,
      currentHeight: 800,
      docHeight: 800,
    });
    expect(result).toEqual({
      recover: false,
      newBaseline: 800,
      newKeyboardWasOpen: false,
    });
  });

  it('updates baseline on a small resize when keyboard not open — no recovery', () => {
    const result = evaluateRecovery({
      baseline: 800,
      keyboardWasOpen: false,
      currentHeight: 790,
      docHeight: 800,
    });
    expect(result).toEqual({
      recover: false,
      newBaseline: 790,
      newKeyboardWasOpen: false,
    });
  });

  it('detects keyboard open when drop exceeds threshold', () => {
    const result = evaluateRecovery({
      baseline: 800,
      keyboardWasOpen: false,
      currentHeight: 500,
      docHeight: 800,
    });
    expect(result).toEqual({
      recover: false,
      newBaseline: 800,
      newKeyboardWasOpen: true,
    });
  });

  it('does not mark keyboard open for a drop just under threshold', () => {
    const result = evaluateRecovery({
      baseline: 800,
      keyboardWasOpen: false,
      currentHeight: 721, // 800 - 721 = 79 < 80
      docHeight: 800,
    });
    expect(result).toEqual({
      recover: false,
      newBaseline: 721,
      newKeyboardWasOpen: false,
    });
  });

  it('triggers recovery when height returns to baseline after keyboard open', () => {
    const result = evaluateRecovery({
      baseline: 800,
      keyboardWasOpen: true,
      currentHeight: 800,
      docHeight: 800,
    });
    expect(result).toEqual({
      recover: true,
      newBaseline: 800,
      newKeyboardWasOpen: false,
    });
  });

  it('triggers recovery when height returns within tolerance of baseline', () => {
    const result = evaluateRecovery({
      baseline: 800,
      keyboardWasOpen: true,
      currentHeight: 801, // within 2px
      docHeight: 800,
    });
    expect(result).toEqual({
      recover: true,
      newBaseline: 801,
      newKeyboardWasOpen: false,
    });
  });

  it('triggers recovery when height matches document element height (even if baseline drifted)', () => {
    // Simulates WebKit not restoring innerHeight but the rendered doc knows
    const result = evaluateRecovery({
      baseline: 800,
      keyboardWasOpen: true,
      currentHeight: 812,
      docHeight: 812,
    });
    expect(result).toEqual({
      recover: true,
      newBaseline: 812,
      newKeyboardWasOpen: false,
    });
  });

  it('does NOT trigger recovery when height differs from both baseline and docHeight', () => {
    const result = evaluateRecovery({
      baseline: 800,
      keyboardWasOpen: true,
      currentHeight: 650, // still recovering
      docHeight: 800,
    });
    expect(result).toEqual({
      recover: false,
      newBaseline: 800,
      newKeyboardWasOpen: true,
    });
  });

  it('resets keyboardWasOpen after recovery', () => {
    const first = evaluateRecovery({
      baseline: 800,
      keyboardWasOpen: true,
      currentHeight: 800,
      docHeight: 800,
    });
    expect(first.recover).toBe(true);
    expect(first.newKeyboardWasOpen).toBe(false);

    // Subsequent resize with keyboard still "closed" — should be a normal resize
    const second = evaluateRecovery({
      baseline: first.newBaseline,
      keyboardWasOpen: first.newKeyboardWasOpen,
      currentHeight: 790,
      docHeight: 800,
    });
    expect(second.recover).toBe(false);
    expect(second.newKeyboardWasOpen).toBe(false);
    expect(second.newBaseline).toBe(790);
  });

  it('handles two keyboard cycles correctly', () => {
    // Cycle 1: open
    const open1 = evaluateRecovery({
      baseline: 800, keyboardWasOpen: false, currentHeight: 500, docHeight: 800,
    });
    expect(open1.newKeyboardWasOpen).toBe(true);

    // Cycle 1: close
    const close1 = evaluateRecovery({
      baseline: 800, keyboardWasOpen: true, currentHeight: 800, docHeight: 800,
    });
    expect(close1.recover).toBe(true);
    expect(close1.newKeyboardWasOpen).toBe(false);

    // Cycle 2: open
    const open2 = evaluateRecovery({
      baseline: close1.newBaseline, keyboardWasOpen: false, currentHeight: 400, docHeight: 800,
    });
    expect(open2.newKeyboardWasOpen).toBe(true);

    // Cycle 2: close — use the derived baseline from close1
    const close2 = evaluateRecovery({
      baseline: close1.newBaseline, keyboardWasOpen: true, currentHeight: 800, docHeight: 800,
    });
    expect(close2.recover).toBe(true);
    expect(close2.newKeyboardWasOpen).toBe(false);
  });

  it('does not trigger recovery when within-keyboard resize stays far below baseline', () => {
    // Baseline 800. Keyboard opens, height drops to 500. keyboardWasOpen=true.
    // User switches keyboard type (emoji ↔ text), height changes slightly
    // but stays far below baseline. Recovery must NOT fire.
    const keyboardSwitch = evaluateRecovery({
      baseline: 800,
      keyboardWasOpen: true,
      currentHeight: 540, // within-keyboard height change (40px), still 260px below baseline
      docHeight: 800,
    });
    expect(keyboardSwitch).toEqual({
      recover: false,
      newBaseline: 800,
      newKeyboardWasOpen: true,
    });
  });

  it('does not recover when keyboardWasOpen is false and height matches baseline', () => {
    const result = evaluateRecovery({
      baseline: 800,
      keyboardWasOpen: false,
      currentHeight: 800,
      docHeight: 800,
    });
    // Normal idle resize — should just update baseline, not recover
    expect(result).toEqual({
      recover: false,
      newBaseline: 800,
      newKeyboardWasOpen: false,
    });
  });
});
