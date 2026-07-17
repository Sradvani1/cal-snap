# PR W08: Settings

**Status:** Implemented  
**Source of truth:** [`.cursor/plans/pr_w08_settings_c472ebf7.plan.md`](../../../.cursor/plans/pr_w08_settings_c472ebf7.plan.md), [PR-W02](./PR-W02.md) through [PR-W07](./PR-W07.md)

---

## 1. Objective

Deliver the Settings tab with profile editing (TDEE recalculation), macro sliders (sum = 100%), unit preferences, weekly weigh-in reminder prefs, CSV export, delete-all-data, About/science links, and sign-out — mirroring iOS PR-08.

---

## 2. In scope

- `profile-update-service.ts` — preview, apply, macro slider math (iOS `ProfileUpdateService` parity)
- `save-settings-profile.ts` — orchestrates apply + optional `saveWeighIn` when weight delta ≥ 0.05 kg
- `data-export.ts` — client-side CSV download
- `user-data-deletion.ts` — hard-delete meals, weigh-ins, profile, Storage prefix; clear uid-scoped localStorage
- `use-settings-form.ts` — draft, macros, preview, validation, dirty state
- `/settings` page with Profile, Macro, Units, Notifications, Data, About, Account sections
- `invalidateProfileQueries` for cross-tab refresh without full reload
- Unit tests porting iOS `SettingsTests`

---

## 3. Out of scope

- API keys, HealthKit, daily log reminder UI (W10)
- Password/email change, Firebase Auth account deletion
- Deficit slider in Settings
- Design tokens, copy module (W09)
- PWA, Playwright E2E (W10)

---

## 4. Files created

| Path | Purpose |
|------|---------|
| `lib/services/profile-update-service.ts` | Preview, apply, macro math |
| `lib/services/data-export.ts` | CSV generation + browser download |
| `lib/services/user-data-deletion.ts` | Scoped Firestore + Storage wipe |
| `lib/services/save-settings-profile.ts` | Save orchestration |
| `lib/settings/profile-draft-from-profile.ts` | Profile → editable draft |
| `lib/settings/validation.ts` | `canSaveSettings`, validation messages |
| `lib/settings/use-settings-form.ts` | Settings form hook |
| `lib/queries/invalidate-profile-queries.ts` | TanStack cache invalidation |
| `lib/queries/use-save-settings-profile.ts` | Save mutation |
| `lib/queries/use-export-data.ts` | Export mutation |
| `lib/queries/use-delete-all-data.ts` | Delete mutation + redirect |
| `components/settings/*` | Section cards, delete dialog |
| `tests/unit/profile-update-service.test.ts` | Macro + recalc + name tests |
| `tests/unit/data-export.test.ts` | CSV shape tests |
| `tests/unit/save-settings-profile.test.ts` | Weight path routing tests |

---

## 5. Files modified

| Path | Change |
|------|--------|
| `app/(app)/settings/page.tsx` | Full Settings screen (replaces stub) |
| `lib/repositories/meals.ts` | Added `fetchAllMeals` |
| `docs/implementation/web/README.md` | W08 → Implemented; locked deletion decision |

---

## 6. Tests

### Unit (merge gate)

```bash
cd calsnap-web && pnpm test
```

Covers:

- `adjustMacroPercents` sums to 100; invalid triple fails; `normalizedMacroPercents` fixes 33/33/33
- Taller height → higher TDEE/target; lighter weight → lower; deficit preserved
- Empty display name valid for save
- CSV headers/rows; no photo column
- Weight unchanged → `saveProfile`; delta ≥ 0.05 kg → `saveWeighIn`

### Merge gate

```bash
cd calsnap-web && pnpm install && pnpm test && pnpm lint && pnpm build
```

---

## 7. Manual test plan

1. Emulator + `pnpm dev`; user with meals, weigh-ins, completed onboarding
2. Settings tab loads all sections (not stub)
3. Edit display name to blank → Save succeeds; dashboard greeting uses "Today"
4. Change height → preview TDEE/target update; Save → dashboard ring updates without reload
5. Change current weight by ≥0.5 kg → Save creates weigh-in; progress history shows entry
6. Adjust protein slider → carbs/fat rebalance; sum stays 100; invalid state disables Save
7. Toggle lbs/kg → weight stepper range changes; saved values remain correct in kg
8. Toggle ft/in height → imperial pickers appear; saved `heightCm` consistent
9. Change weigh-in reminder weekday/time → Save → profile doc fields updated
10. Export CSV → file downloads with correct headers and rows
11. Delete all data → confirm → redirected to onboarding; Firestore collections empty
12. Sign out → `/login`
13. Mobile 320px: sections scroll; save button reachable; sliders usable

---

## 8. Web deltas vs iOS PR-08

| Area | iOS | Web W08 |
|------|-----|---------|
| API keys | Gemini + USDA Keychain | Omitted (server Gemini) |
| HealthKit | Toggles + Sync Now | Omitted |
| Daily log reminder | Deferred to PR-10 | Deferred to W10 |
| Unit prefs | `UserDefaults` | `ProfileDoc` fields |
| Cross-tab refresh | `profileDataRevision` | `invalidateProfileQueries` |
| CSV share | `UIActivityViewController` | Browser file download |
| Data delete | SwiftData cascade | Firestore batch delete + Storage `listAll` |
| Post-delete | Empty local store | Redirect `/onboarding`; Auth session kept |
| Auto-save on leave | `onDisappear` save | Explicit Save only |
| Weigh-in `source` column | `sourceIsHealthKit` | `source` = `manual` |

---

## 9. Pull request

**Title:** PR W08: Settings

**Summary**

- Replaces Settings stub with profile editing, macro sliders, unit/reminder prefs, CSV export, and delete-all-data.
- Ports iOS PR-08 services with web-specific persistence (Firestore/Storage) and TanStack invalidation.
- Keeps Firebase Auth signed in after delete; redirects to onboarding for re-setup.

**Test plan:** merge gate commands above + manual checklist in §7.
