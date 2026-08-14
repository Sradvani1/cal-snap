# PR WR08: Production, PWA & Security Hardening

**Status:** Implemented  
**Historical note:** This is an archived review-sprint plan; references to the removed insight route
and former E2E counts are historical only.
**Sprint:** Post-build review WR08 ([REVIEW-MASTER-PLAN.md](./REVIEW-MASTER-PLAN.md)) — **final review-sprint PR**  
**Depends on:** [PR-WR07.md](./PR-WR07.md) (206 unit / 11 integration / 17 E2E)  
**Reviews:** [PR-W10.md](./PR-W10.md) + [historical rollout record](../build/ROLLOUT.md) Phases 4–5

---

## 1. Audit checklist

### 1.1 PWA (`app/sw.ts`, `manifest.webmanifest`, install prompt)

| Check | Expected | Result |
|-------|----------|--------|
| `display: standalone`, icons 192+512 | Present | **Pass** |
| `start_url: /dashboard`, `scope: /` | Present | **Pass** |
| SW builds via `next build --webpack` | `public/sw.js` emitted | **Pass** |
| `NetworkOnly` for `/api/*`, navigations, `/__/auth/*`, Firebase hosts | `sw.ts` lines 19–38 | **Pass** |
| Install banner after onboarding | `markPwaInstallEligible` + `InstallPromptBanner` | **Pass** |
| SW disabled in dev | Serwist `disable: development` in `next.config.ts` | **Pass** — PWA QA needs preview/prod build |
| Maskable icons (`purpose: maskable`) | Optional | **Defer P3** — `purpose: any` only; manual Android install QA |

### 1.2 Privacy (`/privacy`, `lib/copy/privacy.ts`)

| Check | Expected | Result |
|-------|----------|--------|
| Public without login | `middleware.ts` `PUBLIC_PATHS` includes `/privacy` | **Pass** |
| Firebase Auth, Firestore, Storage, Gemini server-side | Copy sections accurate | **Pass** |
| No third-party analytics | Stated in `notCollected` | **Pass** |
| Delete-all flow matches `user-data-deletion.ts` | Auth account retained | **Pass** — WR06 E2E green |
| Session cookie disclosure | HTTP-only auth cookie paragraph | **Fixed** — WR08-PRIV-01 |

### 1.3 Security rules

| Check | Verification | Result |
|-------|--------------|--------|
| Firestore owner-only profile/meals/weighIns | `firestore.rules` | **Pass** |
| Storage owner-only meal photos | `storage.rules` | **Pass** |
| Unauthenticated deny | `profile-firestore.test.ts`, `storage-rules.test.ts` | **Pass** |
| Cross-user deny — profile | `profile-firestore.test.ts` | **Pass** |
| Cross-user deny — meals | Integration test | **Fixed** — WR08-RULE-01 |
| Cross-user deny — weighIns | Integration test | **Fixed** — WR08-RULE-02 |
| Invalid storage path default deny | Firebase default deny | **Pass** — documented |
| Rules deployed to prod | Operator checklist | **Done** — SA 2026-07-01 (`calsnap-web`) |

### 1.4 Environment (`.env.local.example` vs ROLLOUT 5.2)

| Variable group | Result |
|----------------|--------|
| `NEXT_PUBLIC_FIREBASE_*` + `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false` | **Pass** |
| `FIREBASE_ADMIN_*` trio for session cookies | **Pass** |
| `GEMINI_API_KEY` server-only | **Pass** |
| Vercel never emulator=true warning | **Fixed** — WR08-ENV-01 |

### 1.5 API routes

| Route | Check | Result |
|-------|-------|--------|
| `POST /api/analyze-meal` | Missing key → 503 + `AnalysisUnavailable`; no session → 401 | **Pass** — `analyze-meal-route.test.ts` |
| `POST /api/generate-insight` | Same 503 pattern; session → 401 | **Pass** — `generate-insight-route.test.ts` |
| Client 503 UX | `use-meal-scanner.ts` branches on `code` | **Pass** |
| E2E regression | `scanner-error-manual-entry.spec.ts` | **Pass** — 17 E2E green |

### 1.6 Deletion lifecycle (`user-data-deletion.ts`)

| Step | Result |
|------|--------|
| meals → weighIns → profile → storage prefix → localStorage | **Pass** |
| WR06 E2E `delete-all-reonboard.spec.ts` | **Pass** |
| Storage prefix list permission on empty prefix | **Defer P3** — WR06-SET-08 `console.warn` only |

**Open P0/P1 from audit:** None.

---

## 2. Baseline merge gate snapshot

**Command** (from `calsnap-web/`):

```bash
pnpm lint && pnpm test && pnpm build && pnpm test:integration && pnpm test:e2e
```

**Note:** Firebase emulators require Java 21+ (`JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home` on macOS Homebrew).

### Initial baseline (2026-06-30, before WR08 fixes)

| Step | Result | Count |
|------|--------|-------|
| `pnpm lint` | Pass | — |
| `pnpm test` | Pass | **206** tests (38 files) |
| `pnpm build` | Pass | — |
| `pnpm test:integration` | Pass | **11** tests (5 files) |
| `pnpm test:e2e` | Pass | **17** tests (9 spec files) |

### Final merge gate (2026-06-30, after WR08 fixes)

| Step | Result | Count |
|------|--------|-------|
| `pnpm lint` | Pass | — |
| `pnpm test` | Pass | **211** tests (39 files) |
| `pnpm build` | Pass | — |
| `pnpm test:integration` | Pass | **15** tests (5 files) |
| `pnpm test:e2e` | Pass | **17** tests (9 spec files) |

**Unit delta:** +5 (`use-log-meal.test.ts` — compensating Storage delete + review cases).  
**Integration delta:** +4 (cross-uid deny on meals ×2, weighIns ×2).  
**E2E delta:** None (locked — no new merge-blocking specs).

---

## 3. Findings matrix

| ID | Sev | Area | Finding | Status |
|----|-----|------|---------|--------|
| WR08-STOR-01 | P2 | Scanner/log | Storage orphan if `createMeal` fails after photo upload | **Fixed** — compensating `deleteMealPhoto` in `logMeal` |
| WR08-STOR-02 | P2 | Tests | Unit test for orphan cleanup | **Fixed** — `use-log-meal.test.ts` |
| WR08-RULE-01 | P2 | Rules | No cross-user deny test for meals | **Fixed** — `meal-crud-firestore.test.ts` |
| WR08-RULE-02 | P2 | Rules | No cross-user deny test for weighIns | **Fixed** — `weigh-in-firestore.test.ts` |
| WR08-PRIV-01 | P2 | Privacy | Session cookie not disclosed in `/privacy` | **Fixed** — `privacy.section.session.*` |
| WR08-ENV-01 | P2 | Env | Missing Vercel emulator=false warning in example | **Fixed** — `.env.local.example` comment |
| WR08-RATE-01 | P3 | API abuse | No per-uid rate limit on Gemini routes | **Documented** — §6; no code (locked) |
| WR08-PWA-01 | P3 | PWA | Icons lack `purpose: maskable` | **Defer** — manual Android install QA |
| WR08-STOR-03 | P3 | Deletion | Delete-all Storage prefix `console.warn` on empty prefix | **Defer** — WR06-SET-08 carryover |
| WR08-GEM-01 | — | Prod | Gemini 503 on missing key | **Closed** — unit test + route audit; do not unset prod key |

**Open P0/P1:** None.

---

## 4. Fix list

| File | Change | Why |
|------|--------|-----|
| `lib/repositories/meals.ts` | Export `deleteMealPhoto(path)`; reuse in `deleteMeal` | WR08-STOR-01 shared helper |
| `lib/queries/use-log-meal.ts` | Extract `logMeal`; try/catch + compensating delete; preserve existing `photoStoragePath` when no new upload | WR08-STOR-01 + review fix |
| `tests/unit/use-log-meal.test.ts` (new) | 5 tests — upload success, Firestore fail cleanup, no-photo fail, preserve existing path, delete fail rethrow | WR08-STOR-02 + review |
| `tests/integration/meal-crud-firestore.test.ts` | Cross-uid read/write deny | WR08-RULE-01 |
| `tests/integration/weigh-in-firestore.test.ts` | Cross-uid read/write deny | WR08-RULE-02 |
| `lib/copy/privacy.ts` | Session cookie section | WR08-PRIV-01 |
| `app/privacy/page.tsx` | Render session section | WR08-PRIV-01 |
| `.env.local.example` | Never set emulator=true on Vercel | WR08-ENV-01 |
| `docs/build/PR-WR08.md` | This document | Sprint deliverable |
| `docs/build/README.md` | WR02–WR08 index → Implemented | Sprint close-out |
| `docs/build/REVIEW-MASTER-PLAN.md` | WR08 deliverable + sprint status + success criteria | Sprint close-out |

---

## 5. Integration test delta

| File | New tests |
|------|-----------|
| `meal-crud-firestore.test.ts` | `denies cross-uid write on meals`, `denies cross-uid read on meals` |
| `weigh-in-firestore.test.ts` | `denies cross-uid write on weighIns`, `denies cross-uid read on weighIns` |

**Net integration delta:** +4 (11 → 15). Mirrors `profile-firestore.test.ts` `assertFails` / `assertSucceeds` pattern.

---

## 6. Abuse / rate-limit notes (WR08-RATE-01)

**Implemented (session gate):**

- `POST /api/analyze-meal` and `POST /api/generate-insight` require a valid session via `verifyApiSession` — anonymous Gemini access is blocked.
- `GEMINI_API_KEY` is server-only on Vercel; not exposed to the browser.

**Residual (P3 — no code in v1):**

- Authenticated users can call Gemini routes repeatedly; cost exposure is operator-funded with no per-uid throttle.
- Mitigation options for a future release: Redis/Upstash rate limit, WAF rules, or Firebase App Check — out of scope for WR08 (locked sharpen decision).
- Cross-reference: `WR03-SCAN-04` closed as documented residual.

---

## 7. Residual risks

| Risk | Notes |
|------|-------|
| No per-uid Gemini rate limit | §6; operator monitors API usage |
| Maskable PWA icons | P3 — add if Android Lighthouse installability fails |
| Delete-all Storage prefix warnings | P3 — best-effort wipe; user-visible data cleared via per-meal delete + prefix |
| Log-meal compensating delete | P3 — `deleteMealPhoto` swallows Storage errors; orphan may remain if cleanup fails after Firestore write failure |
| Rules deploy drift | Operator must run `firebase deploy --only firestore:rules,storage` to same `projectId` as Vercel |
| Google OAuth | Production custom domain only — email auth OK on preview |
| Real Gemini in CI | Never — manual production smoke only |
| Lighthouse scores | Manual §8; fix P0/P1 a11y only; scores not CI-gated |
| Firestore read failure → onboarding redirect | WR02 documented; no UX fix |

---

## 8. Manual sign-off (consolidated WR02–WR07 + ROLLOUT 4–5)

**Environment:** Live Firebase cloud + Vercel production URL unless noted.  
**Operator:** Run on real devices where marked. Fill initials + date when complete.  
**Policy:** Manual items do not block merge; remain **Pending** until operator runs them.

### Operator pre-flight

| Check | Signed off |
|-------|------------|
| Vercel production env complete ([ROLLOUT 5.2](../build/ROLLOUT.md)) | Pending |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false` on Vercel | Pending |
| Firebase authorized domains include production Vercel URL | Pending |
| Rules deployed: `pnpm exec firebase deploy --only firestore:rules,storage` | **Done** — SA 2026-07-01 (`calsnap-web`; rules already matched repo) |
| `GEMINI_API_KEY` set on Vercel; redeploy if changed | Pending |

### Core flows (production URL)

| # | Scenario | Source | Signed off |
|---|----------|--------|------------|
| 1 | Email signup → onboarding → dashboard | ROLLOUT 4.7 / 5.5 | Pending |
| 2 | Returning user login skips onboarding | WR02 | Pending — CI E2E covers emulator |
| 3 | Google OAuth popup (desktop) + redirect (mobile) | WR02 | Pending |
| 4 | Real Gemini scan → log → photo in cloud Storage | WR03 | Pending |
| 5 | Meal edit + delete → dashboard updates | WR04 | Pending — CI E2E covers emulator |
| 6 | Weigh-in → calorie target update | WR04 | Pending — CI E2E covers emulator |
| 7 | Analytics insight (≥3 days data, real Gemini) | WR05 | Pending |
| 8 | Settings profile save → target change | WR06 | Pending — CI E2E covers emulator |
| 9 | CSV export download | WR06 | Pending |
| 10 | Delete all data → re-onboard | WR06 | Pending — CI E2E covers emulator |
| 11 | Session cookie — no post-login kick to `/login` | ROLLOUT troubleshooting | Pending |
| 12 | Scanner 503 when key missing | WR03 | **Done (CI)** — unit + E2E mock; do not unset prod key |

### PWA + polish (devices required)

| # | Scenario | Pass criteria | Signed off |
|---|----------|---------------|------------|
| 13 | Add to Home Screen — iOS Safari | Installs; opens standalone | Pending |
| 14 | Add to Home Screen — Android Chrome | `beforeinstallprompt` CTA or manual | Pending |
| 15 | PWA standalone → logged-in dashboard | No login redirect loop | Pending |
| 16 | Weigh-in reminder banner (7+ days overdue) | WR04 manual | Pending |
| 17 | `/privacy` accuracy review | Matches live practices | Pending |
| 18 | Mobile Lighthouse ×3 (dashboard, scan, settings) | Record scores; fix P0/P1 a11y | Pending |
| 19 | 320px + 200% zoom spot-check | WR07 matrix | Pending |
| 20 | Keyboard matrix (auth, onboarding, settings, weigh-in, manual meal) | WR07 matrix | Pending |

### Mobile Lighthouse baseline (production or preview HTTPS)

| Page | Perf | A11y | Best Practices | SEO | Date | Signed off |
|------|------|------|----------------|-----|------|------------|
| `/dashboard` | Pending | Pending | Pending | Pending | — | Pending |
| `/scan` | Pending | Pending | Pending | Pending | — | Pending |
| `/settings` | Pending | Pending | Pending | Pending | — | Pending |

**Informative targets:** Perf ≥70, A11y ≥90 per page. Record all scores even if below targets.

### WR02–WR07 carryover (superseded by matrix above)

WR02 Google OAuth, WR03 real Gemini scan, WR04 share card + reminder banner, WR05 insight generation, WR06 CSV + macro slider UX, WR07 dark mode + reduced motion — all consolidated into rows 1–20 above.

---

## 9. Sprint completion sign-off

From [REVIEW-MASTER-PLAN.md](./REVIEW-MASTER-PLAN.md) success criteria:

| Criterion | Status |
|-----------|--------|
| ROLLOUT Phases 4–5 signed off in §8 | Pending operator |
| CI merge gate green on `main` | **Done** — 211 / 15 / 17 |
| E2E covers signup through settings (17 tests) | **Done** |
| Real Gemini scan + insight on production | Pending operator (§8 rows 4, 7) |
| Lighthouse baseline captured; no open P0/P1 a11y | Pending operator (§8 row 18) |
| PWA install iOS + Android | Pending operator (§8 rows 13–14) |
| Zero open P0/P1 vs W01–W10 | **Done** — audit clean |
| All eight `PR-WR0N.md` docs with findings + residual risks | **Done** |

**Review sprint code complete.** Manual production smoke (§8) remains operator responsibility.

---

## 10. Acceptance criteria

- [x] Merge gate green before and after; counts documented in §2
- [x] Zero open **P0/P1** in WR08 audit scope
- [x] Storage orphan compensating delete + unit test
- [x] Cross-user Firestore deny tests for meals + weighIns
- [x] Privacy session cookie disclosure
- [x] `.env.local.example` Vercel emulator warning
- [x] Rate limiting documented only (no code)
- [x] 17 E2E unchanged (no new merge-blocking specs)
- [x] `PR-WR08.md` complete with findings + §8 sign-off table
- [ ] §8 manual production smoke (operator — pending)

---

## 11. Files changed index

**New**

- `tests/unit/use-log-meal.test.ts`
- `docs/build/PR-WR08.md`

**Modified**

- `lib/repositories/meals.ts`
- `lib/queries/use-log-meal.ts`
- `tests/integration/meal-crud-firestore.test.ts`
- `tests/integration/weigh-in-firestore.test.ts`
- `lib/copy/privacy.ts`
- `app/privacy/page.tsx`
- `.env.local.example`
- `docs/build/README.md`
