# CalSnap Web

Mobile-first Next.js 16.2.9 app for CalSnap. See the [documentation index](../docs/README.md)
for current system details, operations, QA status, and historical build records.

**Deploying?** Follow the [Rollout Guide](../docs/build/ROLLOUT.md): test on emulators first, then wire up Firebase cloud and Vercel.

## Prerequisites

- Node.js 22 (`.nvmrc` and CI use Node 22)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm` or `corepack enable`)
- [Firebase CLI](https://firebase.google.com/docs/cli) for emulators (optional)

## Setup

```bash
cd calsnap-web
pnpm install
cp .env.local.example .env.local
```

Fill in `.env.local`:

- `NEXT_PUBLIC_FIREBASE_*` — from Firebase console or use demo values for emulators
- `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` — for local Auth + Firestore emulators
- `FIREBASE_ADMIN_*` — service account credentials (production); optional with emulators

## Commands

```bash
pnpm dev              # http://localhost:3000 (webpack; required with Serwist)
pnpm test             # Vitest unit tests (merge gate)
pnpm test:integration # Firestore + Storage rules via emulators (required in CI)
pnpm lint
pnpm build            # next build --webpack (Serwist PWA)
pnpm emulators        # Start Auth + Firestore + Storage emulators
```

## Auth workflow

1. User signs in via email/password or Google redirect (`signInWithRedirect` only)
2. Firebase Auth SDK holds client session; no httpOnly cookies or middleware
3. Protected routes: `(app)/layout` uses `useRequireAuth()` + `useProfile()` for onboarding gate
4. The Gemini API route (`/api/analyze-meal`) verifies `Authorization: Bearer` ID tokens server-side

Meal analysis accepts an optional image and/or text description, rejects requests with neither,
and keeps Gemini credentials server-side. The edit-detail flow at `/log/[mealId]` is the canonical
meal editor; there is no separate scan edit route or insight-generation API.

### Google OAuth setup

1. Enable Google provider in Firebase Console → Authentication
2. Add authorized domains: `localhost`, your Vercel URL, and any custom domain
3. Mobile Safari requires the `/__/auth/*` reverse proxy in `next.config.ts` and `authDomain` matching your app host (handled via `resolve-auth-domain.ts`)
4. Start Google sign-in from `/login` — redirect returns to the same URL

### Production env (Vercel)

- `FIREBASE_ADMIN_CLIENT_EMAIL` + `FIREBASE_ADMIN_PRIVATE_KEY` — required for Bearer token verification on API routes
- `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false`
- `GEMINI_API_KEY`
- Redeploy after env changes

See the historical [PR-WR09-auth-reset.md](../docs/build/PR-WR09-auth-reset.md) and [rollout guide](../docs/build/ROLLOUT.md).

## Firebase emulators

```bash
# Terminal 1
pnpm emulators

# Terminal 2 (with NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true in .env.local)
pnpm dev
```

Emulator UI: http://localhost:4000

Deploy Firestore rules (not merge-gated):

```bash
firebase deploy --only firestore:rules --project <your-project>
```

## Web vs iOS deltas

| Concept | iOS | Web |
|---------|-----|-----|
| IDs | `UUID` | Firebase Auth UID |
| Profile storage | SwiftData | `users/{uid}/profile/main` |
| Onboarding steps | 7 (incl. HealthKit, API keys) | 5 |
| Google sign-in | N/A | `signInWithRedirect` |
| Unit prefs | UserDefaults | Fields on profile doc |

## Vercel deploy

See the [rollout guide](../docs/build/ROLLOUT.md) for the checklist. Summary: set **Root Directory** to `calsnap-web`; add all env vars from `.env.local.example`; set `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false`.

## Documentation

- [`../docs/README.md`](../docs/README.md) — project documentation index
- [`../docs/build/README.md`](../docs/build/README.md) — completed V1 plans and build records

## V1 validation status

Automated lint, unit, production build, client-secret scan, and Firebase emulator integration
verification are complete. Remaining validation requires an operator: production smoke QA with
cloud Firebase and real Gemini, Lighthouse captures, iPhone/Safari standalone-PWA checks, and
the five-profile production preflight.
