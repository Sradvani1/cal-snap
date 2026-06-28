import { describe, expect, it } from 'vitest';
import { createAnalyzeGenerationGuard } from '@/lib/scanner/analyze-generation';

describe('createAnalyzeGenerationGuard', () => {
  it('accepts results for the current generation', () => {
    const guard = createAnalyzeGenerationGuard();
    const started = guard.start();
    expect(guard.isCurrent(started)).toBe(true);
  });

  it('ignores results after invalidate', () => {
    const guard = createAnalyzeGenerationGuard();
    const started = guard.start();
    guard.invalidate();
    expect(guard.isCurrent(started)).toBe(false);
  });

  it('ignores stale results when a newer analyze starts', () => {
    const guard = createAnalyzeGenerationGuard();
    const first = guard.start();
    const second = guard.start();
    expect(guard.isCurrent(first)).toBe(false);
    expect(guard.isCurrent(second)).toBe(true);
  });
});
