function isLocalDevHost(host: string): boolean {
  const hostname = host.split(':')[0].toLowerCase();
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export function resolveAuthDomain(options: {
  useEmulator: boolean;
  emulatorAuthDomain: string;
  browserHost: string | null;
  envAuthDomain: string | undefined;
  projectId: string;
}): string {
  const firebaseAppDomain =
    options.envAuthDomain ?? `${options.projectId}.firebaseapp.com`;

  if (options.useEmulator) {
    return options.emulatorAuthDomain;
  }

  // Local Next.js dev serves HTTP only. Firebase auth helpers always use HTTPS,
  // so localhost:3000 would become https://localhost:3000/__/auth/handler (broken).
  // Use the Firebase-hosted auth domain for local dev; production uses the app host + proxy.
  if (options.browserHost && !isLocalDevHost(options.browserHost)) {
    return options.browserHost;
  }

  return firebaseAppDomain;
}
