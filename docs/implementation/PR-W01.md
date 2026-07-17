# PR W01: Project Scaffold and Core Infrastructure

**Status:** Implemented  
**Source of truth:** [`docs/technical-spec.md`](../../technical-spec.md) (Global Constants, NutritionCalculator, models), [`docs/engineering-rules.md`](../../engineering-rules.md), [`.cursor/plans/calsnap_web_prs_4a5e9349.plan.md`](../../../.cursor/plans/calsnap_web_prs_4a5e9349.plan.md)

---

## 1. Objective

Establish the CalSnap Web skeleton in `calsnap-web/` with Next.js App Router, ported domain types and `NutritionCalculator`, Vitest parity tests, Firebase client SDK init (unused in UI), emulator config, and a placeholder home page. No auth, Firestore usage, API routes, or feature screens.

---

## 2. In scope

- Next.js app via `create-next-app` — App Router, TypeScript strict, Tailwind, ESLint, pnpm
- `lib/constants.ts` — full `AppConstants` from iOS (excluding `AppStorageKey`)
- `lib/models/*` — `BiologicalSex`, `ActivityLevel`, `MealType`, `MacroSplit`, `UserProfile`, `MealEntry`, `FoodItem`, `WeighIn`
- `lib/nutrition/calculator.ts` — all 13 calculator functions from iOS
- `lib/firebase/client.ts` — lazy singleton init (`getFirebaseApp`, `getFirebaseAuth`, `getFirestoreDb`, `getFirebaseStorage`)
- `firebase.json` + `.firebaserc` (demo-calsnap) — emulator ports only
- Placeholder `app/page.tsx` — "CalSnap" + tagline; no Firebase imports
- Vitest: `nutrition-calculator.test.ts` (13), `meal-type.test.ts` (4), `firebase-client.test.ts` (smoke)
- Root `.gitignore` updates; `calsnap-web/README.md`; `.env.local.example`
- `docs/implementation/web/README.md` + this file

---

## 3. Out of scope

- Auth UI, middleware, Firestore rules/repositories
- API routes, Gemini, shadcn/ui, TanStack Query, zod
- PWA, tab navigation, feature screens, CI
- Any changes under `CalSnap/` iOS tree

---

## 4. Files created

| Path | Purpose |
|------|---------|
| `calsnap-web/` | Next.js App Router project root |
| `calsnap-web/lib/constants.ts` | `AppConstants` port |
| `calsnap-web/lib/models/*` | Domain types with web ID/photo deltas |
| `calsnap-web/lib/nutrition/calculator.ts` | Pure nutrition math (13 functions) |
| `calsnap-web/lib/firebase/client.ts` | Lazy Firebase SDK init |
| `calsnap-web/firebase.json` | Emulator ports (auth 9099, firestore 8080, storage 9199, UI 4000) |
| `calsnap-web/.firebaserc` | Default project `demo-calsnap` |
| `calsnap-web/.env.local.example` | `NEXT_PUBLIC_FIREBASE_*` placeholders |
| `calsnap-web/.nvmrc` | Node 22 |
| `calsnap-web/vitest.config.ts` | Vitest + `@/*` alias |
| `calsnap-web/tests/unit/*.test.ts` | Calculator, MealType, Firebase smoke tests |
| `calsnap-web/app/layout.tsx` | Root layout, metadata title "CalSnap" |
| `calsnap-web/app/page.tsx` | Placeholder home screen |
| `calsnap-web/README.md` | Dev commands, env vars, iOS deltas |
| `docs/implementation/web/README.md` | Web stack summary + open decisions |
| `docs/implementation/web/PR-W01.md` | This checklist |

---

## 5. Files modified

| Path | Change |
|------|--------|
| `.gitignore` | Ignore `calsnap-web/node_modules`, `.next`, `.env.local`, `.vercel`, `coverage/` |
| `README.md` | One-line pointer to `calsnap-web/README.md` |

---

## 6. Tests

### `nutrition-calculator.test.ts` (13 cases)

| Test | Verifies |
|------|----------|
| bmr male | 80 kg, 178 cm, 51 yr → **1663** (±1) |
| bmr female | 65 kg, 163 cm, 48 yr → **1268** (±1) |
| tdee | BMR 1700 × 1.55 → **2635** |
| dailyTarget floor | TDEE 2000, deficit 1000, male → target **1500**, deficit **750**, warning contains `"1500"` |
| dailyTarget warnings | TDEE 3000, deficit 800 → deficit **750**, **2** warnings |
| macroTargets | 2000 kcal, 0.28/0.47/0.25 → protein **140**, carbs **235**, fat **55.6** |
| bmi | 80 kg, 178 cm → **25.2** |
| ageFromDateOfBirth | Fixed reference date → **35** |
| isOnPlateau | 80.0, 80.1, 80.15 → **true** |
| isOnPlateau insufficient | 2 entries → **false** |
| isOnPlateau spread too large | 80.0, 80.15, 80.25 → **false** |
| isOnPlateau unsorted input | 4 entries out of order → **true** |
| weightProjection | 12 weeks → **13** pairs, strictly decreasing |

### `meal-type.test.ts` (4 cases)

Hour 10 → breakfast; 11 → lunch; 17 → snack; 18 → dinner.

### `firebase-client.test.ts`

Mocks all six `NEXT_PUBLIC_FIREBASE_*` vars; exercises `getFirebaseApp`, `getFirebaseAuth`, `getFirestoreDb`, and `getFirebaseStorage` without throw.

---

## 7. Post-review fixes

| Fix | File |
|-----|------|
| Un-ignore `.env.local.example` for commit | `calsnap-web/.gitignore` (`!.env.local.example`) |
| Remove dark-mode / Geist CSS (W09 deferred) | `calsnap-web/app/globals.css` |
| Smoke-test all Firebase client exports | `tests/unit/firebase-client.test.ts` |

Verified after fixes: `pnpm test` (18/18), `pnpm lint`, `pnpm build`; no `GEMINI_API_KEY` in `.next/static`.

---

## 8. Acceptance criteria mapping

| Criterion | Satisfied by |
|-----------|--------------|
| `pnpm dev` runs; placeholder visible | `app/page.tsx` |
| `pnpm test` all green | `tests/unit/*.test.ts` |
| `pnpm build` succeeds locally | Next.js production build; no Firebase import in `app/` |
| Full NutritionCalculator API ported | `lib/nutrition/calculator.ts` |
| Domain types exported for W02 | `lib/models/index.ts` |
| Firebase lazy init + smoke test | `lib/firebase/client.ts`, `firebase-client.test.ts` |
| MealType hour boundaries tested | `meal-type.test.ts` |
| `firebase.json` emulator ports | `firebase.json` |
| No secrets in client bundle | Build grep; only `NEXT_PUBLIC_*` when Firebase wired |
| Root `.gitignore` covers web artifacts | `.gitignore` diff |
| Web implementation docs | `docs/implementation/web/` |

---

## 9. Vercel setup (post-merge, not merge gate)

1. Import repo in Vercel
2. Set **Root Directory** = `calsnap-web`
3. Framework: Next.js; Install: `pnpm install`; Build: `pnpm build`
4. Add `NEXT_PUBLIC_FIREBASE_*` before W02 (not required for W01 placeholder)

W01 merge gate: local `pnpm install && pnpm test && pnpm lint && pnpm build`.

---

## 10. Definition of done

- [x] `calsnap-web/` scaffold with App Router, TS strict, Tailwind, ESLint, pnpm
- [x] Vitest + `.nvmrc` (22) + `engines.node >= 20`
- [x] Full `lib/constants.ts`, `lib/models/*`, `lib/nutrition/calculator.ts`
- [x] `lib/firebase/client.ts` (lazy); `firebase.json`; `.firebaserc`; `.env.local.example`
- [x] Placeholder `app/page.tsx` — no Firebase in UI
- [x] Tests: 13 + 4 + 1 smoke
- [x] Root `.gitignore` + README pointer
- [x] `docs/implementation/web/README.md` + `PR-W01.md`

- [x] Post-review: `.env.local.example` committable; light-only CSS; full Firebase smoke test

---

## 11. Pull request

**Title:** PR W01: Web scaffold and core infrastructure

**Summary**

- Adds `calsnap-web/` Next.js app with ported `NutritionCalculator`, domain types, Vitest tests, Firebase client init (unused in UI), emulator config, and placeholder home page.
- Web deltas: Firestore-oriented string IDs; meal photos as Storage paths; `ActivityLevel` camelCase union (not iOS display strings).
- No auth, API routes, Gemini, shadcn, or feature screens.

**Test plan**

```bash
cd calsnap-web
pnpm install
pnpm test    # 18/18
pnpm lint
pnpm build
pnpm dev     # placeholder at http://localhost:3000
```

**Vercel (optional for W01):** Root Directory = `calsnap-web`; Install `pnpm install`; Build `pnpm build`. Add `NEXT_PUBLIC_FIREBASE_*` before W02.

---

## 12. PR description snippet

> **PR W01: Web scaffold and core infrastructure**
>
> Adds `calsnap-web/` Next.js app with ported `NutritionCalculator`, domain types, Vitest tests, Firebase client init (unused), emulator config, and placeholder page. No auth, API routes, or feature UI.
>
> **Web deltas:** Firestore-oriented string IDs; meal photos as Storage paths; ActivityLevel camelCase union (not iOS display strings).
>
> **Test plan:** `cd calsnap-web && pnpm test && pnpm lint && pnpm build`
