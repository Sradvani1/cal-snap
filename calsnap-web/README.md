# CalSnap Web

Mobile-first Next.js app for CalSnap. See the [web build docs](../docs/build/README.md) for stack details and open decisions.

**Deploying?** Follow the phased [Rollout Guide](../docs/build/ROLLOUT.md): test on emulators first, then wire up Firebase cloud and Vercel.

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

## Auth workflow (WR09)

1. User signs in via email/password or Google redirect (`signInWithRedirect` only)
2. Firebase Auth SDK holds client session; no httpOnly cookies or middleware
3. Protected routes: `(app)/layout` uses `useRequireAuth()` + `useProfile()` for onboarding gate
4. Gemini API routes (`/api/analyze-meal`, `/api/generate-insight`) verify `Authorization: Bearer` ID tokens server-side

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

See [PR-WR09-auth-reset.md](../docs/plans/PR-WR09-auth-reset.md) and [ROLLOUT.md](../docs/build/ROLLOUT.md) §4.4, §5.2.

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

See **[docs/build/ROLLOUT.md](../docs/build/ROLLOUT.md)** (Phases 4–5) for the full checklist. Summary: set **Root Directory** to `calsnap-web`; add all env vars from `.env.local.example`; set `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false`.

## Source of truth

- `docs/build/README.md` — web build docs
- `docs/plans/PR-W10.md` — W10 acceptance checklist and QA matrix
