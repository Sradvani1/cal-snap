# CalSnap Web

Mobile-first Next.js app for CalSnap. See the [web implementation docs](../docs/implementation/web/README.md) for stack details and open decisions.

## Prerequisites

- Node.js 20+ (`.nvmrc` pins 22)
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
pnpm test:e2e         # Playwright happy path (required in CI)
pnpm test:e2e:ui      # Playwright UI mode
pnpm lint
pnpm build            # next build --webpack (Serwist PWA)
pnpm emulators        # Start Auth + Firestore + Storage emulators
```

## Auth workflow (W02)

1. User signs in via email/password or Google redirect
2. Client POSTs ID token to `/api/auth/session` → httpOnly `__session` cookie
3. `middleware.ts` verifies session for protected routes
4. Onboarding gate: `(app)/layout` reads Firestore profile; incomplete → `/onboarding`

### Google OAuth setup

1. Enable Google provider in Firebase Console → Authentication
2. Add authorized domains: `localhost`, your Vercel preview domain
3. Web uses `signInWithRedirect` only (no popup)

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

## Web vs iOS deltas (W01–W02)

| Concept | iOS | Web |
|---------|-----|-----|
| IDs | `UUID` | Firebase Auth UID |
| Profile storage | SwiftData | `users/{uid}/profile/main` |
| Onboarding steps | 7 (incl. HealthKit, API keys) | 5 |
| Google sign-in | N/A | `signInWithRedirect` |
| Unit prefs | UserDefaults | Fields on profile doc |

## Vercel deploy

Set **Root Directory** to `calsnap-web`. Add all env vars from `.env.local.example`.

## Source of truth

- `docs/technical-spec.md` — models, constants, calculator
- `docs/implementation/web/PR-W10.md` — W10 acceptance checklist and QA matrix
