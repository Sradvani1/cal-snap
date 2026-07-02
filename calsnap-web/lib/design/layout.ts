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
    /** Documented content row height before safe-area inset (min-h-11 + py-2 + border). */
    height: 'var(--app-tab-bar-content-height)',
    nav: 'fixed inset-x-0 bottom-0 z-10 border-t border-cs-border bg-cs-surface/80 backdrop-blur-md pb-safe',
  },
  content: {
    bottomPadding: 'pb-tab-content',
    bottomPaddingWithSaveBar: 'pb-tab-content-with-save-bar',
  },
  fixed: {
    aboveTabBar: 'bottom-above-tab-bar',
  },
  elevation: {
    fab: 'shadow-lg dark:shadow-lg',
  },
  touchTarget: 'min-h-11 min-w-11',
} as const;
