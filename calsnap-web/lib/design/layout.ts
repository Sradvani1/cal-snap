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
  touchTarget: 'min-h-11 min-w-11',
} as const;
