# CalSnap Web — Master Review & Improvement Plan

Post-build review sprint after the W01–W10 implementation series. Eight sequential PRs (**WR01–WR08**) audit consolidated feature areas, fix bugs, expand tests, and apply web-specific polish.

**Build sprint index:** [README.md](./README.md) · **Deploy guide:** [ROLLOUT.md](./ROLLOUT.md)

---

## Purpose

**In scope:** Spec parity with W01–W10, bug fixes, incremental E2E expansion, mobile/a11y/perf polish, production hardening.

**Out of scope (locked):** Web Push/FCM, historical meal log, USDA fallback, offline meal logging, HealthKit, password reset, Firebase Auth account deletion, alcohol analytics, swipe-to-delete, weigh-in edit/delete.

---

## Sharpened decisions (locked)

| Decision | Choice |
|----------|--------|
| Uncommitted WIP | Landed on `main` before review sprint (`ee134a0` + lint fixes) |
| Production infra | Firebase cloud + Vercel both live — WR08 validates real paths |
| E2E expansion | Incremental — each WR adds specs; CI stays green |
| Lighthouse | Document baseline in WR07; fix regressions + a11y failures; no CI gate |
| Deferred findings | Residual risks section in each `PR-WR0N.md` |
| Gemini in CI | Never — mock in unit/E2E; real API manual only (ROLLOUT Phase 3) |

---

## Pre-sprint status

- [x] Layout/input work landed (`HeightInputFields`, onboarding/settings overflow fixes)
- [x] ESLint clean on input components
- [x] `pnpm lint && pnpm test && pnpm build` green
- [x] `pnpm test:integration && pnpm test:e2e` green (WR01 — see [PR-WR01.md](./PR-WR01.md))

---

## Agent workflow (every WR PR)

Individual planning phases produce `docs/implementation/web/PR-WR0N.md` and `.cursor/plans/pr_wr0N_*.plan.md`.

1. Read W0N specs, product-research, technical-spec, and this doc
2. Run merge gate baseline before changes
3. Audit UI → hook → service → repository → API; log P0–P3 findings
4. Fix all P0/P1; P2 as time permits; defer P3 to **Residual risks**
5. Add regression tests; add listed E2E specs (merge-blocking)
6. Deliver green CI + manual QA sign-off + `PR-WR0N.md`

### Severity

| Level | Definition |
|-------|------------|
| P0 | Broken core flow, data loss, auth bypass |
| P1 | Feature incorrect vs spec, bad error handling |
| P2 | UX/a11y/mobile regression |
| P3 | Polish, perf, code quality |

### Merge gate

```bash
cd calsnap-web
pnpm lint && pnpm test && pnpm build && pnpm test:integration && pnpm test:e2e
```

---

## Dependency graph

```
WR01 → WR02 → WR03 → WR04 → WR05 → WR06 → WR07 → WR08
```

WR07 comes after functional PRs. WR08 validates production last.

---

## WR01 — Foundation, CI & Domain Logic

**Reviews:** W01 scaffold, shared `lib/` domain layer  
**Deliverable:** [PR-WR01.md](./PR-WR01.md)

### Audit scope

- `lib/nutrition/` — iOS `NutritionCalculator` parity
- `lib/models/` — Firestore mappers, activity level unions
- `lib/copy/` — no hardcoded user strings in `app/` or `components/`
- `.github/workflows/calsnap-web.yml`
- `tests/unit/` — edge case gaps

### E2E (merge-blocking)

- Shared E2E fixture utilities for downstream WR PRs

### Acceptance

- CI green; zero open P0/P1 in domain layer
- Nutrition calculator iOS parity test matrix

---

## WR02 — Auth, Session & Onboarding

**Reviews:** W02 Firebase Auth, middleware, 5-step onboarding

### Key paths

`lib/auth/`, `app/api/auth/session/`, `middleware.ts`, `app/(onboarding)/`, `components/onboarding/`, `firestore.rules`

### Checklist highlights

- Email + Google auth; session cookie; middleware redirects
- Google on custom domain via `/__/auth/*` proxy
- Post-auth: new user → onboarding; returning → dashboard
- Imperial/metric inputs round-trip (`HeightInputFields.tsx`)
- 320px onboarding layout; keyboard visibility

### E2E (merge-blocking)

- Login returning user skips onboarding
- Google auth: manual on production Vercel only

---

## WR03 — Dashboard & Meal Scanner

**Reviews:** W03 dashboard + W04 scanner/AI pipeline

### Checklist highlights

- Calorie ring, macros, meals, sparkline, plateau sheet
- Tab nav + unsaved-work guard
- Photo → compress → `/api/analyze-meal` (mocked in CI)
- Manual fallback on 503/timeout
- AbortController + generation guard
- Real Gemini: manual ROLLOUT Phase 3 only

### E2E (merge-blocking)

- Scanner error path: mock 503 → manual entry

---

## WR04 — Meal Log & Progress

**Reviews:** W05 meal log + W06 weigh-in/progress

### Checklist highlights

- Meal list, detail, edit, delete, share card
- Weigh-in → TDEE recalc → dashboard target update
- Progress chart, history, reminder banner (7+ days overdue)

### E2E (merge-blocking)

- Meal edit + delete
- Weigh-in updates dashboard calorie target

---

## WR05 — Analytics & Insights

**Reviews:** W07 analytics + AI insights

### Checklist highlights

- Timeframe picker (7D/30D/90D/custom)
- ±10% adherence band; macro/fiber/pattern charts
- Insight requires ≥3 logged days; aggregates-only prompt
- Real Gemini insight: manual ROLLOUT Phase 3 only

### E2E (merge-blocking)

- Analytics page renders with seeded emulator data

---

## WR06 — Settings & Data Lifecycle

**Reviews:** W08 settings, export, delete-all

### Checklist highlights

- Profile/macros/units save and recalculate targets
- CSV export; delete-all → re-onboard
- Settings mobile layout

### E2E (merge-blocking)

- Settings profile edit → dashboard target change
- Delete all data → re-onboard

---

## WR07 — Mobile UX, Accessibility & Performance

**Reviews:** W09 design system + cross-cutting polish

### Checklist highlights

- 320px width + 200% zoom on all routes
- Keyboard matrix (auth, onboarding, settings, weigh-in, manual meal)
- Touch targets ≥44px; dark mode; focus indicators
- Copy audit — all strings in `lib/copy/`
- Mobile Lighthouse baseline in `PR-WR07.md` (document only)
- Bundle/query/image optimization where obvious

### E2E (merge-blocking)

- Playwright viewport tests at 320px for critical routes

---

## WR08 — Production, PWA & Security

**Reviews:** W10 PWA + ROLLOUT Phases 4–5 against **live Firebase + Vercel**

### Checklist highlights

- PWA manifest, SW, install prompt; standalone dashboard
- `/privacy` accuracy
- Firestore + Storage rules audit
- Vercel env vars; session cookie on production
- Full production smoke test (email + Google, real Gemini, PWA on devices)

---

## Test gap inventory

| Gap | Target WR |
|-----|-----------|
| E2E: login returning user | WR02 |
| E2E: scanner 503 → manual entry | WR03 |
| E2E: meal edit/delete | WR04 |
| E2E: weigh-in → target update | WR04 |
| E2E: analytics page | WR05 |
| E2E: settings save | WR06 |
| E2E: delete all data | WR06 |
| E2E: 320px viewport | WR07 |
| Real Gemini | WR03, WR05, WR08 — manual only |

---

## Documentation deliverables

| Artifact | Path |
|----------|------|
| Master plan | `docs/implementation/web/REVIEW-MASTER-PLAN.md` |
| Per-PR spec | `docs/implementation/web/PR-WR01.md` … `PR-WR08.md` |
| Per-PR Cursor plan | `.cursor/plans/pr_wr0N_*.plan.md` |
| Lighthouse baseline | `PR-WR07.md` |
| Production smoke | `PR-WR08.md` |

---

## Success criteria (sprint complete)

1. ROLLOUT Phases 1–5 manual QA signed off
2. CI merge gate green on `main`
3. E2E covers signup, login, onboarding, scan (mocked), log, edit, delete, weigh-in, settings
4. Real Gemini scan + insight on production Firebase + Vercel
5. Lighthouse baseline documented; no open P0/P1 a11y issues
6. PWA install on iOS Safari + Android Chrome
7. Zero open P0/P1 vs W01–W10 acceptance criteria
8. Each `PR-WR0N.md` has findings matrix + residual risks
