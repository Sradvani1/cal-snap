import type { ScannerErrorKind } from '@/lib/scanner/use-meal-scanner';

/**
 * Action the error banner's retry button should take for a given error kind.
 * - `retry`: re-run analysis with the same input.
 * - `discard`: reset to capture (the current input can't be reused, e.g. a
 *   photo that failed preparation).
 */
export type ErrorRetryAction = 'retry' | 'discard';

export function errorRetryAction(error: ScannerErrorKind): ErrorRetryAction {
  return error === 'photoPrep' ? 'discard' : 'retry';
}
