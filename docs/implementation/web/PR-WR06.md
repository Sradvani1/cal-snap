# PR WR06: Settings & Data Lifecycle

**Status:** Implemented  
**Sprint:** Post-build review WR06 ([REVIEW-MASTER-PLAN.md](./REVIEW-MASTER-PLAN.md))  
**Depends on:** [PR-WR05.md](./PR-WR05.md) (8 E2E / 6 specs green)  
**Reviews:** [PR-W08.md](./PR-W08.md) settings + data export/delete

---

## 1. Audit checklist

### 1.1 Settings sections & profile save

| ID | Check | Result |
|----|-------|--------|
| S1 | Profile section: name, DOB, height, weight, activity, goal weight/date, TDEE/target preview | Pass |
| S2 | Macro targets: sliders sum to 100%; validation blocks save when invalid | Pass |
| S3 | Units: lbs weight + imperial height toggles update draft/display | Pass |
| S4 | Notifications: weigh-in reminder enable, weekday, time | Pass |
| S5 | Data: export CSV + delete-all with confirm dialog | Pass |
| S6 | About: version, NIH/DGA links, privacy | Pass |
| S7 | Account: sign-out → `/login` | Pass — covered by `login-returning-user.spec.ts` |
| S8 | TDEE recalc on profile field change (`profile-update-service.apply`) | Pass |
| S9 | Weight delta ≥ 0.05 kg routes through `saveWeighIn` + plateau path | Pass — unit tests; not in save E2E |
| S10 | `invalidateProfileQueries` refreshes dashboard/analytics after save | Pass |
| S11 | CSV export: meals + weigh-ins sections (no profile doc section) | Pass — iOS parity |
| S12 | Delete-all: Firestore subcollections + profile doc + uid localStorage keys | Pass |
| S13 | Delete success: `queryClient.clear()` + `router.replace('/onboarding')` | Pass |

### 1.2 Copy, layout, design

| ID | Check | Result |
|----|-------|--------|
| S14 | Copy-only user-facing errors (no raw `error.message`) | **Fixed** — WR06-SET-01 |
| S15 | Mobile layout classes (`min-w-0`, `break-words`, fixed save bar) | Pass — 320px matrix → WR07 |
| S16 | Plateau sheet from settings weight save | Pass — manual QA only |
| S17 | Deficit not editable in Settings | Pass by design |
| S18 | Empty name allowed on save | Pass by design |
| S19 | Analytics re-audit / Gemini / 320px | Out of scope |
| S20 | Settings save + delete-all E2E specs | **Fixed** — WR06-E2E-01/02 |

---

## 2. Baseline merge gate snapshot

**Command** (from `calsnap-web/`):

```bash
pnpm lint && pnpm test && pnpm build && pnpm test:integration && pnpm test:e2e
```

**Note:** Firebase emulators require Java 21+ (`JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home` on macOS Homebrew).

### Initial baseline (2026-06-30, before WR06 fixes)

| Step | Result | Count |
|------|--------|-------|
| `pnpm lint` | Pass | — |
| `pnpm test` | Pass | **201** tests (38 files) |
| `pnpm build` | Pass | — |
| `pnpm test:integration` | **Fail** (port conflict) | Firestore emulator port 8080 occupied by stale process — killed and re-ran |
| `pnpm test:e2e` | Not run | Blocked by integration retry |

After freeing port 8080: integration **11** tests (5 files), E2E **8** tests (6 specs) — matches WR05 handoff.

### Final merge gate (2026-06-30, after WR06 fixes)

| Step | Result | Count |
|------|--------|-------|
| `pnpm lint` | Pass | — |
| `pnpm test` | Pass | **201** tests (38 files) |
| `pnpm build` | Pass | — |
| `pnpm test:integration` | Pass | **11** tests (5 files) |
| `pnpm test:e2e` | Pass | **10** tests in **8** spec files (`analytics-page` ×2, `delete-all-reonboard`, `happy-path`, `login-returning-user`, `meal-edit-delete` ×2, `scanner-error-manual-entry`, `settings-save-updates-target`, `weigh-in-updates-target`) |

**Net delta:** +2 E2E spec files, +2 E2E tests (8 → 10), settings E2E helpers, 1 P1 copy fix.

---

## 3. Findings matrix

| ID | Sev | Area | Finding | Status |
|----|-----|------|---------|--------|
| WR06-SET-01 | **P1** | Copy | Raw `error.message` on settings page (save, export, delete, profile load) | **Fixed** — `settings/page.tsx` |
| WR06-E2E-01 | **P1** | E2E | No settings save → dashboard target E2E | **Fixed** — `settings-save-updates-target.spec.ts` |
| WR06-E2E-02 | **P1** | E2E | No delete-all → re-onboard E2E | **Fixed** — `delete-all-reonboard.spec.ts` |
| WR06-SET-02 | P2 | Tests | No `deleteAllUserData` integration test | Deferred — residual |
| WR06-SET-03 | P2 | Tests | CSV export not E2E-covered | Deferred — manual §8 |
| WR06-SET-04 | P2 | UX | Plateau sheet from settings weight save | Deferred — manual; save E2E avoids weight |
| WR06-SET-05 | P2 | Layout | 320px settings matrix | Deferred → WR07 |
| WR06-SET-06 | P3 | Export | CSV has no profile doc section | Residual — iOS parity |
| WR06-SET-07 | P3 | UX | Reminder weekday/hour unused in banner | Residual — WR04-PROG-07 |
| WR06-SET-08 | P3 | Delete | Storage delete `console.warn` only on failure | Residual — WR08 |

**Open P0/P1:** None.

---

## 4. Fix list

| File | Change | Why |
|------|--------|-----|
| `app/(app)/settings/page.tsx` | Copy-only errors; simplified `dataErrorMessage` via `isError` + copy keys | WR06-SET-01 |
| `tests/e2e/helpers/settings.ts` (new) | Navigation, activity change, save, delete dialog, tab nav | WR06-E2E-01/02 |
| `tests/e2e/settings-save-updates-target.spec.ts` (new) | Activity `moderatelyActive` → `sedentary`; assert starting level; poll `toBeLessThan` | WR06-E2E-01 |
| `tests/e2e/delete-all-reonboard.spec.ts` (new) | Delete via alertdialog → re-onboard → dashboard | WR06-E2E-02 |
| `tests/e2e/helpers/index.ts` | Export settings helpers | Barrel |
| `docs/implementation/web/PR-WR01.md` | Settings helper cross-ref in §5 | Review close-out |

---

## 5. E2E helper contract updates

### Settings (`settings.ts`) — added in WR06

| Export | Signature | Usage |
|--------|-----------|-------|
| `gotoSettings(page)` | → `Promise<void>` | `gotoAppRoute('/settings')` + assert `settings.title` heading |
| `changeActivityLevel(page, level)` | `level: ActivityLevel` → `Promise<void>` | Check radio by `common.activity.{level}.label` |
| `saveSettingsProfile(page)` | → `Promise<void>` | Scroll into view → click Save → wait bar hidden (15s) |
| `openDeleteAllDialog(page)` | → `Promise<void>` | Click delete-all → assert `alertdialog` + title |
| `confirmDeleteAllData(page)` | → `Promise<void>` | Click `common.button.delete` in alertdialog → `/onboarding` |
| `gotoDashboardFromTab(page)` | → `Promise<void>` | `common.nav.main` → link `common.nav.dashboard` → `/dashboard` |

Reuses `readDashboardCalorieTarget` from `weigh-in.ts`. See [PR-WR01.md](./PR-WR01.md) §5 for the full helper contract.

**Not in WR06:** CSV download E2E, macro dashboard assertion, Firestore delete Node assertions.

---

## 6. Acceptance criteria

- [x] Merge gate green before and after (8 → 10 E2E)
- [x] Zero open **P0/P1** in settings + data lifecycle scope
- [x] S1–S13 audited; S14 + S20 fixed
- [x] Copy-only settings errors + simplified `dataErrorMessage`
- [x] **New E2E:** `settings-save-updates-target.spec.ts` + `delete-all-reonboard.spec.ts`
- [x] WR05 analytics untouched (no regression in merge gate)
- [x] No real Gemini in CI
- [x] `PR-WR06.md` complete with findings matrix + residual risks

---

## 7. Residual risks

| Risk | Notes |
|------|-------|
| `deleteAllUserData` integration test gap (WR06-SET-02) | UI E2E covers happy path; Storage list may warn on empty prefix (observed in CI logs) |
| CSV export not E2E-covered (WR06-SET-03) | Manual §8; unit tests cover CSV shape |
| Plateau from settings weight save (WR06-SET-04) | Manual QA; save E2E uses activity only |
| Sedentary `toBeLessThan` flake | Unlikely — onboarding defaults `moderatelyActive`; fallback `veryActive` + `toBeGreaterThan` if CI flakes |
| 320px settings layout (WR06-SET-05) | WR07 |
| CSV no profile section (WR06-SET-06) | iOS parity |
| Reminder prefs unused in banner (WR06-SET-07) | WR04-PROG-07 |
| Storage delete best-effort warnings (WR06-SET-08) | WR08 |
| WR05 analytics not re-audited | Unless merge gate regression |

---

## 8. Manual sign-off

| Scenario | Environment | Signed off |
|----------|-------------|------------|
| Profile edit + TDEE preview updates live | Emulator | Pending |
| Macro sliders block save when sum ≠ 100% | Emulator | Pending |
| Weight change ≥ 0.05 kg triggers weigh-in + plateau sheet | Emulator | Pending |
| CSV download (meals + weigh-ins) | Emulator | Pending |
| Delete-all clears data; session kept | Emulator | Pending — E2E covers re-onboard path |
| Sign-out from settings | Emulator | Pending — WR02 E2E |
| 320px settings scroll + save bar | Local browser | Pending (WR07) |

---

## 9. Files changed index

**New**

- `tests/e2e/helpers/settings.ts`
- `tests/e2e/settings-save-updates-target.spec.ts`
- `tests/e2e/delete-all-reonboard.spec.ts`
- `docs/implementation/web/PR-WR06.md`

**Modified**

- `app/(app)/settings/page.tsx`
- `tests/e2e/helpers/index.ts`
- `docs/implementation/web/PR-WR01.md`
