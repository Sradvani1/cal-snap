const BASE_DELAY_MS = 1000;

export interface WithRetryOptions {
  maxAttempts?: number;
  shouldRetry: (error: unknown) => boolean;
  label: string;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  { maxAttempts = 3, shouldRetry, label }: WithRetryOptions,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      if (attempt > 1) {
        console.error(`[${label}] succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt === maxAttempts;
      const retryable = shouldRetry(error);

      if (!retryable || isLastAttempt) {
        break;
      }

      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1) + Math.random() * 500;
      console.error(
        `[${label}] attempt ${attempt}/${maxAttempts} failed, retrying in ${Math.round(delay)}ms`,
        error instanceof Error ? error.message : String(error),
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.error(
    `[${label}] failed after ${maxAttempts} attempts`,
    lastError instanceof Error ? lastError.message : lastError,
  );
  throw lastError;
}
