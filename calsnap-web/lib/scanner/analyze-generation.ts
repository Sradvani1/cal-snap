/** Guards against applying stale analyze responses after cancel/retry/navigation. */
export function createAnalyzeGenerationGuard() {
  let generation = 0;

  return {
    start(): number {
      generation += 1;
      return generation;
    },
    invalidate(): void {
      generation += 1;
    },
    isCurrent(started: number): boolean {
      return started === generation;
    },
  };
}

export type AnalyzeGenerationGuard = ReturnType<typeof createAnalyzeGenerationGuard>;
