# CalSnap Web

Mobile-first Next.js app for CalSnap. See the [web implementation docs](../docs/implementation/web/README.md) for stack details and open decisions.

## Prerequisites

- Node.js 20+ (`.nvmrc` pins 22)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm` or `corepack enable`)

## Setup

```bash
cd calsnap-web
pnpm install
cp .env.local.example .env.local
# Fill NEXT_PUBLIC_FIREBASE_* before W02 auth work
```

## Commands

```bash
pnpm dev          # http://localhost:3000 — placeholder home page
pnpm test         # Vitest unit tests
pnpm lint
pnpm build        # production build (no Firebase env required for W01 placeholder)
```

## Firebase emulators (W01 config only)

Emulator ports are defined in `firebase.json`. Start with the demo project alias (no real Firebase login required for W01):

```bash
npx -y firebase-tools@latest emulators:start --project demo-calsnap
```

Create and link a real Firebase project before W02.

## Web vs iOS deltas (W01)

| Concept | iOS | Web |
|---------|-----|-----|
| IDs | `UUID` | `string` (Firebase Auth UID / Firestore doc id) |
| Meal photo | `photoData: Data?` | `photoStoragePath?: string` |
| Activity level storage | Codable raw strings (`"Moderately Active"`) | camelCase union (`moderatelyActive`, …) in Firestore |

## Vercel deploy

Set **Root Directory** to `calsnap-web`. Install: `pnpm install`. Build: `pnpm build`. Add `NEXT_PUBLIC_FIREBASE_*` env vars before W02.

## Source of truth

- `docs/technical-spec.md` — models, constants, calculator
- `docs/implementation/web/PR-W01.md` — W01 acceptance checklist
