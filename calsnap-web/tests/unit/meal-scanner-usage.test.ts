import { describe, expect, it } from 'vitest';
import { scanOutcomeEvent } from '@/lib/scanner/use-meal-scanner';
import { UsageEvent } from '@/lib/usage/events';

describe('scanner usage telemetry', () => {
  it('emits success only when analysis produces at least one item', () => {
    expect(scanOutcomeEvent(false)).toBe(UsageEvent.ScanFailed);
    expect(scanOutcomeEvent(true)).toBe(UsageEvent.ScanSucceeded);
  });
});
