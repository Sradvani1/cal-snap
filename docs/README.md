# CalSnap Documentation

The active product is the Next.js progressive web app in [`calsnap-web/`](../calsnap-web/).
The native iOS app and its specifications are preserved for historical reference under
[`archive/ios/`](../archive/ios/).

## Current Architecture

CalSnap is a mobile-first Next.js 16 progressive web app in `calsnap-web/`. It uses the
App Router, TypeScript, Tailwind CSS, React Query, and webpack builds. Serwist produces
the service worker and installable PWA behavior in preview and production; the service
worker is disabled during development.

Firebase Authentication supports email/password and Google redirect sign-in. The client
SDK owns the browser session, while `app/(app)/layout.tsx` uses `useRequireAuth()` for
protected routes and onboarding. There is no auth middleware or server session-cookie flow.

Each user's data is isolated by Firebase Auth UID:

```text
users/{uid}/profile/main
users/{uid}/meals/{mealId}
users/{uid}/weighIns/{weighInId}
users/{uid}/favorites/{favoriteId}
users/{uid}/meals/{mealId}/...   # meal photos in Storage
```

The browser sends meal images to `/api/analyze-meal` with a Firebase ID token. The server
verifies the token, calls Gemini with the server-only `GEMINI_API_KEY`, and validates the
structured response. Firebase Admin credentials and the Gemini key must never enter client
code or browser bundles.

## Verification and Operations

CI runs ESLint, Vitest unit tests, the production webpack build, the client-bundle secret
check, and Firebase emulator integration tests. Run the same checks from `calsnap-web/`:

```bash
pnpm lint
pnpm test
pnpm build
pnpm test:integration
```

UI flows are currently covered by manual QA. Operator checks include Google redirect sign-in,
PWA installation, real Gemini analysis, mobile keyboard/accessibility behavior, production
environment configuration, and Lighthouse capture. Use Node 22 and pnpm. Local development
uses the Firebase emulators; Vercel preview and production use cloud Firebase with
`NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false`.

The detailed historical rollout checklist remains in [`build/ROLLOUT.md`](build/ROLLOUT.md).
Internal telemetry setup and retention are documented in [usage analytics](usage-analytics.md).

## Deferred Decisions

- Gemini remains operator-funded for the current small user group.
- Photo retention policy is not finalized.
- Web Push is deferred in favor of in-app reminders.
- Auth-account deletion policy and failure recovery need a future product decision.
- Offline meal logging is not supported; only static PWA assets can be cached.
- USDA fallback is deferred; `usdaFoodId` is dormant.

See the [web developer guide](../calsnap-web/README.md) for setup and day-to-day commands.

## Historical Web Documentation

All completed web plans, implementation records, investigations, and baselines are together
in [`build/`](build/). The [build index](build/README.md) is the entry point.

## Repository Structure

```text
cal-snap/
├── calsnap-web/          # Active Next.js PWA
├── docs/                 # Current guidance and historical build records
│   ├── build/            # Completed web plans, implementation records, and baselines
│   └── ios/              # Cancelled iOS rebuild plan (reference only)
├── archive/ios/          # Archived iOS app and documentation
├── .github/workflows/    # Web CI
└── README.md
```

## iOS

The native iOS app is not being rebuilt. An App Store release was considered and cancelled in
August 2026; CalSnap remains a web-only PWA for personal and family use. The archived app under
[`archive/ios/`](archive/ios/) and the [cancelled rebuild plan](ios/README.md) are kept for
reference only.

## Archived iOS Documentation

The original Swift app, its implementation plans, and its platform-specific product
specification remain in [`archive/ios/`](../archive/ios/). See its [archive README](../archive/ios/README.md).
