export function resolveAuthDomain(options: {
  useEmulator: boolean;
  emulatorAuthDomain: string;
  browserHost: string | null;
  envAuthDomain: string | undefined;
  projectId: string;
}): string {
  if (options.useEmulator) {
    return options.emulatorAuthDomain;
  }
  if (options.browserHost) {
    return options.browserHost;
  }
  return options.envAuthDomain ?? `${options.projectId}.firebaseapp.com`;
}
