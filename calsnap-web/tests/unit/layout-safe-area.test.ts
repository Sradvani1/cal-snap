import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { layout } from '@/lib/design/layout';

describe('layout safe-area tokens', () => {
  it('exports tabBar, content, and fixed token groups', () => {
    expect(layout.tabBar.height).toBe('var(--app-tab-bar-content-height)');
    expect(layout.tabBar.nav).toContain('pb-safe');
    expect(layout.content.bottomPadding).toBe('pb-tab-content');
    expect(layout.content.bottomPaddingWithSaveBar).toBe('pb-tab-content-with-save-bar');
    expect(layout.fixed.aboveTabBar).toBe('bottom-above-tab-bar');
  });

  it('references safe-area CSS variables in globals.css', () => {
    const globals = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8');

    expect(globals).toContain('--safe-area-top: env(safe-area-inset-top, 0px)');
    expect(globals).toContain('--safe-area-bottom: env(safe-area-inset-bottom, 0px)');
    expect(globals).toContain('--app-tab-bar-height: calc(var(--app-tab-bar-content-height) + var(--safe-area-bottom))');
    expect(globals).toContain('--app-save-bar-height: calc(2.75rem + 1.5rem + 1px)');
    expect(globals).toContain(
      '--app-content-bottom-padding: calc(var(--app-tab-bar-height) + 1rem)',
    );
    expect(globals).toContain('.pb-tab-content');
    expect(globals).toContain('.pb-sheet-safe');
    expect(globals).toContain('.bottom-above-tab-bar');
    expect(globals).toContain('.pt-safe');
  });

  it('uses 0px fallbacks when safe-area env vars are unavailable', () => {
    const globals = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8');

    expect(globals).toMatch(/env\(safe-area-inset-top,\s*0px\)/);
    expect(globals).toMatch(/env\(safe-area-inset-bottom,\s*0px\)/);
  });
});
