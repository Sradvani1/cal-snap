# AGENTS.md — CalSnap

This repo is a single active app: `calsnap-web/`, a Next.js 16 PWA. The iOS native app is archived under `archive/ios/` (read-only, not under active development). `docs/plans/` holds PR specs; `docs/build/` holds the build index, rollout, and baselines.

## Next.js 16 is non-standard

`calsnap-web` uses **Next.js 16.2.9** with breaking changes from prior versions. Before writing or editing any app code, read the bundled guides:

```bash
ls node_modules/next/dist/docs/   # skim the relevant topic; heed deprecation notices
```

Do not rely on Next.js knowledge from training data for routing, config, or data APIs.

## Toolchain

- **Package manager: pnpm.** `npm install` will not match the lockfile. Node 22 (`.nvmrc` pins 22; CI uses 22).
- **Dev/build use webpack, not Turbopack:** `pnpm dev` → `next dev --webpack`, `pnpm build` → `next build --webpack`. The `--webpack` flag is required (Serwist PWA integration).
- **Path alias `@/*`** maps to the `calsnap-web/` root (`tsconfig.json` `paths`). Import app code as `@/lib/...`, `@/components/...`.

## Commands

Run everything from `calsnap-web/`.

```bash
pnpm install
cp .env.local.example .env.local   # then fill Firebase + GEMINI_API_KEY
pnpm lint
pnpm test                          # unit (Vitest, node env)
pnpm test:integration              # Firestore/Auth/Storage via firebase emulators
pnpm test:e2e                      # Playwright; starts emulators + dev server itself
pnpm dev                           # http://localhost:3000
```

- **Single unit test:** `pnpm exec vitest run tests/unit/<file>.test.ts`
- **Integration tests require the Firebase emulators.** The `test:integration` script boots them automatically (`firebase emulators:exec --project demo-calsnap`). Running Vitest directly against `tests/integration` without emulators fails.
- **E2E** (`playwright.config.ts`) auto-starts the auth/firestore/storage emulators and the dev server, so just run `pnpm test:e2e`. It uses `.env.e2e` (copied to `.env.local` by the webServer hook) — do not commit `.env.local`.

## PWA / service worker

- Serwist service worker (`app/sw.ts` → `public/sw.js`) is **disabled in `development`** (`next.config.ts` `disable: NODE_ENV === 'development'`). PWA install, offline, and `public/sw.js` only exist in preview/prod builds. Validate PWA behavior on a build, not `pnpm dev`.

## Auth & API security (server-side)

- Protected routes use `useRequireAuth()` in `app/(app)/layout.tsx` (client gate). This is not a server middleware.
- API routes (`app/api/analyze-meal`, `app/api/generate-insight`) verify `Authorization: Bearer <idToken>` with the Firebase **admin** SDK (`lib/auth/verify-bearer-token.ts`). Client never holds `FIREBASE_ADMIN_*` or `GEMINI_API_KEY`.
- `GEMINI_API_KEY` is **server-only**. CI fails the build if it leaks into `.next/static` — never import it into client components or send it to the browser.
- Auth: email/password + Google via `signInWithRedirect` only (no popup). Mobile Safari needs the `/__/auth/*` reverse proxy in `next.config.ts` and `authDomain` matching the host (`lib/firebase/resolve-auth-domain.ts`).

## Firebase env

- `NEXT_PUBLIC_USE_FIREBASE_EMULATOR`: `true` for local emulators, **must be `false` on Vercel** (preview + prod use cloud Firebase).
- Emulator project is `demo-calsnap` (ports: auth 9099, firestore 8080, storage 9199, ui 4000).
- Firestore/Storage security rules are per-user (`users/{userId}/...`); deploy with `firebase deploy --only firestore:rules`.

## Copy / strings

All user-facing strings go through the type-safe copy system, not hardcoded text:

```ts
import { copy, type CopyKey } from '@/lib/copy';
copy('common.brand.calsnap');   // keys are checked at compile time
```

Keys live in `lib/copy/keys.ts` + per-feature modules. Add new keys there; do not inline literals in components.

## Conventions

- No husky / lint-staged / prettier / commitlint configured. Commit style is conventional-commit-ish but not enforced.
- CI (` .github/workflows/calsnap-web.yml`) triggers on `calsnap-web/**`; runs lint → unit → build → integration → e2e.
- iOS code in `archive/ios/` is preserved for reference only; do not port from it unless asked.
