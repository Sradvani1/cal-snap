import { afterEach, describe, expect, it, vi } from 'vitest';
import { withRetry } from '@/lib/gemini/retry';

describe('withRetry', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the first successful result without retrying', async () => {
    const fn = vi.fn().mockResolvedValue('ok');

    await expect(
      withRetry(fn, { label: 'test', shouldRetry: () => true }),
    ).resolves.toBe('ok');

    expect(fn).toHaveBeenCalledOnce();
  });

  it('retries a retryable failure and stops after success', async () => {
    vi.useFakeTimers();
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValueOnce('ok');

    const resultPromise = withRetry(fn, {
      label: 'test',
      shouldRetry: () => true,
    });
    await vi.advanceTimersByTimeAsync(2_000);

    await expect(resultPromise).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('does not exceed the attempt limit', async () => {
    const error = new Error('permanent');
    const fn = vi.fn().mockRejectedValue(error);

    await expect(
      withRetry(fn, {
        label: 'test',
        maxAttempts: 3,
        shouldRetry: () => true,
      }),
    ).rejects.toBe(error);

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not start another attempt after the deadline', async () => {
    vi.useFakeTimers();
    const fn = vi.fn().mockRejectedValue(new Error('timeout'));
    const resultPromise = withRetry(fn, {
      label: 'test',
      deadline: Date.now() + 1_000,
      shouldRetry: () => true,
    });
    const rejection = expect(resultPromise).rejects.toThrow('timeout');

    await vi.advanceTimersByTimeAsync(1_100);

    await rejection;
    expect(fn).toHaveBeenCalledOnce();
  });
});
