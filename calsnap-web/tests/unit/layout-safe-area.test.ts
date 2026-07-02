import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { layout } from '@/lib/design/layout';

describe('layout safe-area tokens', () => {
  it('exports tabBar and content token groups', () => {
    expect(layout.tabBar.height).toBe('var(--app-tab-bar-content-height)');
    expect(layout.tabBar.nav).toContain('pb-safe');
    expect(layout.tabBar.nav).toContain('shrink-0');
    expect(layout.tabBar.nav).not.toContain('fixed');
    expect(layout.content.bottomPadding).toBe('pb-6');
    expect(layout.content.mainScrollClass).toBe('app-main');
    expect(layout.content.onboardingMainScrollClass).toBe('onboarding-main');
  });

  it('references safe-area CSS variables in globals.css', () => {
    const globals = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8');

    expect(globals).toContain('--safe-area-top: env(safe-area-inset-top, 0px)');
    expect(globals).toContain('--safe-area-bottom: env(safe-area-inset-bottom, 0px)');
    expect(globals).toContain('--app-tab-bar-content-height: calc(2.75rem + 1rem + 1px)');
    expect(globals).toContain('.app-shell:has(> [role=\'status\']) .app-main');
    expect(globals).toContain('.pb-sheet-safe');
    expect(globals).toContain('.pt-safe');
    expect(globals).not.toContain('.pb-tab-content');
    expect(globals).not.toContain('.bottom-above-tab-bar');
  });

  it('uses 0px fallbacks when safe-area env vars are unavailable', () => {
    const globals = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8');

    expect(globals).toMatch(/env\(safe-area-inset-top,\s*0px\)/);
    expect(globals).toMatch(/env\(safe-area-inset-bottom,\s*0px\)/);
  });

  it('tab bar nav uses translucent blur material', () => {
    expect(layout.tabBar.nav).toContain('bg-cs-surface/80');
    expect(layout.tabBar.nav).toContain('backdrop-blur-md');
  });

  it('applies standalone-only top safe-area inset on main scroll shells', () => {
    const globals = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8');

    expect(globals).toContain('@media (display-mode: standalone)');
    expect(globals).toContain('.app-main');
    expect(globals).toContain('.onboarding-main');
    expect(globals).toContain('padding-top: var(--safe-area-top)');
  });

  it('disables vertical overscroll in standalone display mode only', () => {
    const globals = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8');

    expect(globals).toContain('overscroll-behavior-y: none');
  });

  it('defines sheet slide keyframes for mobile bottom sheets', () => {
    const globals = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8');

    expect(globals).toContain('@keyframes sheet-slide-in');
    expect(globals).toContain('@keyframes sheet-slide-out');
    expect(globals).toContain('.animate-sheet-slide-in');
    expect(globals).toContain('.animate-sheet-slide-out');
  });
});
