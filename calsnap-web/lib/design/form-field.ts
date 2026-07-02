/** Visible focus ring for keyboard users — shared by form inputs and auth fields. */
export const formFieldFocusRingClassName =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cs-primary focus-visible:ring-offset-2';

/** Shared styles for full-width form controls inside the page column. */
export const formFieldInputClassName = [
  'box-border w-full min-w-0 rounded-lg border border-cs-border bg-cs-surface px-3 py-2 text-base sm:text-sm text-cs-foreground',
  formFieldFocusRingClassName,
].join(' ');
