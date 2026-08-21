# CalSnap iOS Rebuild — Master Plan

> **Status:** Cancelled (August 2026) before Phase 0 began — decision was to keep CalSnap
> web-only for personal and family use. Retained for reference only; do not execute.
> **Source of truth for parity:** the active Next.js PWA in `calsnap-web/` (V1 complete).
> **Reference only (do not port as-is):** `archive/ios/` — local-only SwiftData app, 7-step
> onboarding, per-user API keys, native Gemini SDK, iOS 26 target.

---

## Recommendation

Rebuild from scratch in a new active `ios/` directory. The archived iOS app's data layer is
fundamentally incompatible with the Firebase backend (local-only SwiftData, `UUID` IDs,
`photoData`, `sourceIsHealthKit`, HealthKit/API-key onboarding steps). Its design tokens,
`NutritionCalculator` math, and a handful of SwiftUI views remain reusable *source material*,
but the app is otherwise reconstructed to match the web's contracts exactly.

## Confirmed decisions

| Decision | Choice |
|----------|--------|
| AI / Gemini | Reuse existing `POST /api/analyze-meal` (JPEG + optional description + Firebase ID token) |
| Scope | Strict feature parity with web V1 — no HealthKit, Widget, local notifications, or Siri |
| Auth | Firebase email/password + Google Sign-In (same project) |
| Deployment target | iOS 17 |
| Data layer | Firestore (Firebase iOS SDK) with offline persistence — **no SwiftData** |

## Architecture

iOS uses the Firebase client SDKs (Auth, Firestore, Storage) against the **same** backend and
project as the web app. No backend changes are required: Firestore and Storage rules already
key on `request.auth.uid`.

| Concern | Web | iOS |
|---------|-----|-----|
| Auth | Firebase JS SDK, `signInWithRedirect` | Firebase iOS SDK + GoogleSignIn |
| Session gate | `useRequireAuth()` in `(app)/layout` | `@MainActor` auth state + protected root |
| Data | Firestore via repositories | Firestore via repositories, snapshot listeners |
| Caching | TanStack Query v5 | `@MainActor @Observable` view models + snapshot listeners |
| AI | Vercel route handler + Admin SDK | `POST /api/analyze-meal` with Bearer ID token |
| Secrets | server-only `GEMINI_API_KEY` | none — Gemini key never ships in the app |
| Copy | `lib/copy` (type-safe keys) | Swift string catalog mirroring the same keys |
| Tests | Vitest (unit) + emulators (integration) | XCTest (unit) + emulators (integration) |

### Key data contracts (port verbatim)

- `users/{uid}/profile/main` — `ProfileDoc` (`lib/models/profile-doc.ts`)
- `users/{uid}/meals/{mealId}` — `MealEntryDoc` incl. `items[]` (`meal-entry-doc.ts`, `food-item-doc.ts`)
- `users/{uid}/weighIns/{weighInId}` — `WeighInDoc` (`weigh-in-doc.ts`)
- `users/{uid}/favorites/{favoriteId}` — `FavoriteMealDoc` (`favorite-meal-doc.ts`)
- Storage: `users/{uid}/meals/{...}` (meal photos, JPEG)

All internal units are metric (kg, cm, grams); display conversion (lbs/kg, ft-in/cm) is
formatter-only — matches the web and the archived app's rules.

### Notable web V1 behaviors to reproduce

- **Macro targets** use the fiber-adjusted "remaining calories" method
  (`nutrition/calculator.ts` → `macroTargets()` returns `{ proteinG, totalCarbsG, fatG, fiberG }`;
  fiber = 14 g / 1000 kcal, taxed at 2 kcal/g).
- **Fat split** — meal/food items carry `saturatedFatG`/`unsaturatedFatG`; the dashboard fat bar
  renders a sat/unsat opacity split with solid fallback for old data. `totalFatG` stays
  authoritative for all calorie math.
- **Onboarding** is 5 steps: `welcome → profileSetup → goalSetup → caloriePreview → done`
  (no HealthKit, no API keys, no display-name requirement).
- **AI insight feature was removed** in Phase 4 — analytics is timeframe picker + calorie
  adherence + macro trends + fiber only.
- **Favorites** are first-class (grid + detail sheet + "log for today"; `useCount`/`lastUsedAt`;
  auto-name from first 3 items, 40-char truncation).
- **Settings** includes profile, macro targets, units, weigh-in reminder toggle, CSV export,
  delete-all-data, about, and account sign-out.
- **Delete-all-data** wipes `meals`, `weighIns`, `favorites`, `profile/main`, and the Storage
  prefix `users/{uid}/meals` (batch-delete, per-doc photo cleanup).

---

## Phases

Each phase runs: **detailed planning doc → implementation → unit tests → acceptance pass**.
Planning records live in this directory (`docs/ios/`) under a per-phase filename, mirroring the
web's `docs/build/` convention. Implementation lands in `ios/` as reviewable PR-sized units.

### Phase 0 — Foundation & Tooling

**Plan:**
- Decide project generation: XcodeGen (`project.yml`, matches `archive/ios/project.yml`) vs a
  hand-maintained `.xcodeproj`. Recommend XcodeGen.
- Decide Swift concurrency: Firebase iOS SDK is not fully `Sendable`-annotated, so
  `SWIFT_STRICT_CONCURRENCY` and `@preconcurrency import` strategy must be settled here.
- Dependency set (SPM only): `firebase-ios-sdk` (Auth, Firestore, Storage), `GoogleSignIn`.
  No other third-party deps.
- CI: GitHub Actions macOS runner — build + `xcodebuild test` (unit) + emulator integration.
- Secrets: `GoogleService-Info.plist` git-ignored; Google Sign-In client ID + URL scheme; API
  base URL as build config. Never commit credentials.

**Implement:** `ios/` scaffold, `project.yml`, `.gitignore`, `.xcconfig` for env, README,
minimal buildable app, CI workflow.

**Accept:** project builds/runs on simulator; CI builds green on macOS.

### Phase 1 — Auth & Navigation Shell

**Plan:** port `lib/auth/auth-context.tsx`, `useRequireAuth`, `resolve-auth-domain`;
Google Sign-In URL-scheme setup; route structure.

**Implement:** Firebase config, `AuthService`/`AuthState` (`@MainActor @Observable`),
email/password + Google sign-in, login/signup screens, protected-route gate, tab shell
(Dashboard / Log / Progress / Analytics / Settings) with per-tab `NavigationStack`.

**Accept:** sign in/out works against cloud and emulators; unauthenticated users gated;
Google sign-in completes end-to-end.

### Phase 2 — Models, Repositories & Backend Contracts

**Plan:** port every Firestore document contract + mapper from `lib/models/*-doc.ts` and
`lib/repositories/*.ts` into Swift `Codable` structs.

**Implement:** Swift models (`UserProfile`, `MealEntry`, `FoodItem`, `WeighIn`, `FavoriteMeal`,
enums `MealType`/`ActivityLevel`/`BiologicalSex`), Firestore repositories, Storage upload/download,
`Timestamp` mapping, emulator support.

**Accept:** unit tests round-trip every doc type; emulator integration test reads/writes under
`users/{uid}/...`.

### Phase 3 — Nutrition Core & Onboarding (5 steps)

**Plan:** port `nutrition/calculator.ts` and `goal-pathway.ts` exactly, including test vectors.

**Implement:** `NutritionCalculator` (Mifflin-St Jeor BMR, TDEE, daily-target floor + deficit cap,
fiber-adjusted macro targets, goal projection, plateau detection); onboarding screens
(Welcome → Profile Setup → Goal Setup → Calorie Preview → Done); save profile; onboarding gate.

**Accept:** unit tests match web vectors (BMR male 1663 / female 1268, macro-target 2000 kcal →
140 g protein / 235 g carbs / 55.6 g fat, etc.); full onboarding persists profile; second launch
skips onboarding.

### Phase 4 — Dashboard

**Plan:** port `aggregate-meals.ts`, `calorie-progress.ts`, `date-window.ts`, `greeting.ts`,
`plateau-state.ts`, `weigh-in-reminder.ts`.

**Implement:** calorie ring, macro bar (sat/unsat fat split), today's meals, weigh-in reminder
banner, plateau alert sheet, FAB → scanner, weight-trend mini chart.

**Accept:** live Firestore data; ring/macro math matches web; plateau + reminder behavior identical.

### Phase 5 — Meal Scanner & Gemini

**Plan:** port `meal-analysis-*` contracts, `use-meal-scanner.ts`, `meal-photo-processor.ts`
(JPEG quality/long-edge retry steps from `MealPhoto` constants), error codes.

**Implement:** PhotosUI camera/library picker, image processing, multipart
`POST /api/analyze-meal` with Bearer ID token, editable food items (weight-proportional scaling),
meal-type selector, estimation notes, confidence badge, manual-entry fallback, retry/abort,
log meal → Firestore + Storage.

**Accept:** camera/library → analysis → editable result → log; manual entry; error/retry states;
no Gemini key ships in the app.

### Phase 6 — Meal Log & Favorites

**Plan:** port meal-log components and the favorites flow (`favorite-meal-doc.ts`,
`use-save-favorite`, `use-log-from-favorite`, `FavoriteDetailSheet`).

**Implement:** daily log with date nav + swipe-to-delete, meal detail (read/edit/delete),
quick-look sheet, favorites grid + detail sheet + "log for today".

**Accept:** full meal CRUD; favorite save/log match web (auto-name truncation, `useCount`/`lastUsedAt`).

### Phase 7 — Progress (Weigh-ins)

**Plan:** port `weigh-in-service.ts`, `progress-stats.ts`, `weigh-in-reminder.ts`/`weigh-in-snooze.ts`.

**Implement:** weigh-in sheet, dynamic TDEE/target recalc on save, weight chart (Swift Charts)
with projection + goal line, stats grid, history list, reminder toggle.

**Accept:** recalc matches web math; chart renders projection/goal; reminder snooze works.

### Phase 8 — Analytics

**Plan:** port `analytics-aggregator.ts`, `build-analytics-snapshot.ts`, timeframe logic.
**Exclude** the AI insight feature (removed from web in Phase 4).

**Implement:** timeframe picker (7/30/90/custom range sheet), calorie adherence, macro trends,
fiber section, empty states.

**Accept:** all sections aggregate correctly per timeframe; custom range sheet works.

### Phase 9 — Settings

**Plan:** port `use-settings-form.ts`, `save-settings-profile.ts`, `data-export.ts`,
`user-data-deletion.ts`.

**Implement:** profile section, macro targets, units, weigh-in reminder toggle, data
(CSV export via share sheet, delete-all-data), about, account sign-out.

**Accept:** edits persist + propagate; CSV matches web headers; delete-all-data wipes
profile/meals/weigh-ins/favorites + Storage prefix.

### Phase 10 — Polish, Accessibility, QA & App Store

**Plan:** port design tokens/typography/colors; accessibility; dark mode; app icon/launch;
privacy manifest.

**Implement:** design-system pass, VoiceOver labels, Dynamic Type, Reduce Motion, dark mode,
app icon + launch screen, `PrivacyInfo.xcprivacy`, perf sweep (no formatter/sort allocation in
`body`, `LazyVStack`, cancellation on navigate-away).

**Accept:** light/dark inspection; Dynamic Type XL–XXXL; cold launch < 1.5s; TestFlight/App Store
build ready.

---

## Cross-cutting

- **Testing:** XCTest unit tests for every ported pure function (reuse web's fixtures/vectors);
  Firestore emulator integration tests; no UI/snapshot tests unless required.
- **Copy:** mirror the web's type-safe copy keys in a Swift string catalog — single source of
  truth for user-facing strings; English-only for v1.
- **Secrets:** `GoogleService-Info.plist`, Google Sign-In client ID + URL scheme, and the API
  base URL are build config — never committed; the Gemini key never touches the app.
- **Docs:** `docs/ios/README.md` index + per-phase plan/implementation records.

## Open items (resolve in Phase 0; non-blocking for this plan)

1. Firebase iOS app registration + Google Sign-In client ID/URL scheme (same project as web).
2. Emulator vs cloud backend for iOS dev (point Firestore/Storage/Auth SDK at local emulators).
3. `analyze-meal` accepts only `image/jpeg`/`application/octet-stream` — iOS must always upload
   JPEG (guaranteed by the `MealPhoto` constants).
4. Apple Developer account + App Store Connect for signing/TestFlight (needed only at Phase 10).
