import { describe, expect, it } from 'vitest';
import { errorRetryAction } from '@/lib/scanner/error-retry-action';
import type { ScannerErrorKind } from '@/lib/scanner/use-meal-scanner';

describe('errorRetryAction', () => {
  it('retries recoverable analysis errors', () => {
    const retryable: ScannerErrorKind[] = ['offline', 'api', 'parse', 'unrecognizable'];
    for (const error of retryable) {
      expect(errorRetryAction(error)).toBe('retry');
    }
  });

  it('discards when the photo could not be prepared', () => {
    expect(errorRetryAction('photoPrep')).toBe('discard');
  });
});
