import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { copy } from '@/lib/copy';

afterEach(() => {
  vi.doUnmock('@/lib/design/motion');
  vi.resetModules();
});

describe('Skeleton primitive', () => {
  it('omits animate-pulse when reduced motion is preferred', async () => {
    vi.doMock('@/lib/design/motion', () => ({
      useReducedMotion: () => true,
    }));

    const { Skeleton } = await import('@/components/design/Skeleton');
    const html = renderToStaticMarkup(React.createElement(Skeleton, { className: 'h-4 w-20' }));

    expect(html).not.toContain('animate-pulse');
  });

  it('applies animate-pulse when motion is allowed', async () => {
    const { Skeleton } = await import('@/components/design/Skeleton');
    const html = renderToStaticMarkup(React.createElement(Skeleton, { className: 'h-4 w-20' }));

    expect(html).toContain('animate-pulse');
  });
});

describe('gate skeleton smoke renders', () => {
  it('renders AppShellSkeleton without tab navigation landmark', async () => {
    const { AppShellSkeleton } = await import('@/components/app/AppShellSkeleton');
    const html = renderToStaticMarkup(
      React.createElement('main', { 'aria-busy': true }, React.createElement(AppShellSkeleton)),
    );

    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain(copy('common.nav.main'));
    expect(html).not.toMatch(/<nav\b/);
  });

  it('renders AuthFormSkeleton', async () => {
    const { AuthFormSkeleton } = await import('@/components/auth/AuthFormSkeleton');
    const html = renderToStaticMarkup(React.createElement(AuthFormSkeleton));

    expect(html).toContain('aria-busy="true"');
  });

  it('renders MealDetailSkeleton detail variant', async () => {
    const { MealDetailSkeleton } = await import('@/components/meal-log/MealDetailSkeleton');
    const html = renderToStaticMarkup(
      React.createElement(MealDetailSkeleton, { variant: 'detail' }),
    );

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aspect-[4/3]');
  });

  it('renders MealDetailSkeleton edit variant without photo', async () => {
    const { MealDetailSkeleton } = await import('@/components/meal-log/MealDetailSkeleton');
    const html = renderToStaticMarkup(
      React.createElement(MealDetailSkeleton, { variant: 'edit', showPhoto: false }),
    );

    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain('aspect-[4/3]');
  });
});
