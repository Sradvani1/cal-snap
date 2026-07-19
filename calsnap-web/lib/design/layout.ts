/** Shared dimensions from iOS DesignSystem components */
export const layout = {
  calorieRing: {
    size: 180,
    strokeWidth: 16,
    overStrokeWidth: 20,
  },
  macroBar: {
    height: 12,
    radius: 6,
    legendDot: 8,
  },
  sectionCard: {
    radius: 'rounded-2xl',
    padding: 'p-4 sm:p-6',
  },
  /** Constrains app pages to the content column and blocks horizontal overflow on mobile. */
  pageShell:
    'mx-auto flex w-full min-w-0 max-w-lg flex-col overflow-x-hidden px-4',
  tabBar: {
    /** Full visual footprint including safe-area inset. */
    height: 'var(--app-tab-bar-total-height)',
    /** In-flow flex footer inside a visualViewport-height shell — no fixed layer, immune to WKWebView deferred compositor repaint. */
    nav: 'shrink-0 z-10 border-t border-cs-border bg-cs-surface pb-safe',
  },
  content: {
    /** Content breathing room. Nav is in-flow so main content naturally clears it. */
    bottomPadding: 'pb-6',
    /**
     * Top safe-area for standalone PWA: apply `app-main` (or `onboarding-main`) on the
     * scroll shell; inset is applied via `@media (display-mode: standalone)` in globals.css.
     */
    mainScrollClass: 'app-main',
    onboardingMainScrollClass: 'onboarding-main',
  },
  touchTarget: 'min-h-11 min-w-11',
} as const;
