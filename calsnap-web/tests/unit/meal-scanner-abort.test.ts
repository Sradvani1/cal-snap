import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAnalyzeGenerationGuard } from '@/lib/scanner/analyze-generation';

describe('meal scanner analyze abort', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('ignores aborted fetch when generation was invalidated', async () => {
    const guard = createAnalyzeGenerationGuard();
    const generation = guard.start();
    const controller = new AbortController();

    vi.stubGlobal(
      'fetch',
      vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          const signal = init?.signal;
          if (!signal) {
            reject(new Error('Missing abort signal'));
            return;
          }
          if (signal.aborted) {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
            return;
          }
          signal.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        });
      }),
    );

    guard.invalidate();

    const fetchPromise = fetch('/api/analyze-meal', {
      method: 'POST',
      signal: controller.signal,
    });
    controller.abort();

    await expect(fetchPromise).rejects.toMatchObject({ name: 'AbortError' });
    expect(guard.isCurrent(generation)).toBe(false);
  });

  it('invalidates the in-flight generation before a retry restarts', () => {
    // Mirrors retryAnalyze: invalidate() the current request, then start() a new one.
    const guard = createAnalyzeGenerationGuard();
    const inFlight = guard.start();

    guard.invalidate();
    expect(guard.isCurrent(inFlight)).toBe(false);

    const retried = guard.start();
    expect(guard.isCurrent(inFlight)).toBe(false);
    expect(guard.isCurrent(retried)).toBe(true);
  });

  it('supersedes an earlier request when a new analyze starts', () => {
    const guard = createAnalyzeGenerationGuard();
    const first = guard.start();
    const second = guard.start();

    expect(guard.isCurrent(first)).toBe(false);
    expect(guard.isCurrent(second)).toBe(true);
  });
});
