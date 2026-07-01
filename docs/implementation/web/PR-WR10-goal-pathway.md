# PR-WR10 — Goal Pathway MVP (Web)

Computed goal target date replaces user-picked dates. Weight is ground truth for the timeline; calorie budget stays a stable plan.

**UX:** Set your goal weight and pace — we'll estimate when you'll get there. The date updates when you weigh in.

## Design contract

- **User inputs:** current weight, goal weight, activity, deficit (250–500 default 350, 750 with unlock).
- **System outputs:** daily calorie target + `goalTargetDate` via `computeGoalTargetDate()` → `projectedGoalDate()`.
- **`startingWeightKg`:** set once at onboarding; never updated on goal/deficit/weigh-in changes.
- **`goalTargetDate`:** computed only; recomputed on onboarding save, settings save, weigh-in save, and plateau actions that change `deficitKcal`.
- **Calorie budget:** not auto-tuned from meal logs (out of scope).

### Reference dates

| Write path | `referenceDate` |
|---|---|
| Onboarding save | today |
| Settings save (no weigh-in) | today |
| Weigh-in save | normalized weigh-in date |
| Plateau `updateCalorieTargets` | today |

## Acceptance criteria

- [x] Onboarding goal step has no date picker; goal weight must be below current weight.
- [x] Calorie preview shows **estimated goal date** that updates with deficit slider.
- [x] Saved profile has `goalTargetDate` computed at onboarding (reference: today); not user input.
- [x] `startingWeightKg` unchanged after settings save and weigh-ins.
- [x] Settings: goal weight + deficit editable (shared `DeficitSlider`, 750 unlock); estimated goal date read-only live preview; save recomputes stored date (reference: today).
- [x] Weigh-in save recomputes `goalTargetDate` from new weight (reference: weigh-in date).
- [x] Progress stat shows stored `profile.goalTargetDate` — label **"Estimated goal date"**; null → em dash or "Maintaining" when deficit 0.
- [x] Goal ≥ current blocked in settings validation.
- [x] Diet break / at-goal → `goalTargetDate` null.
- [x] All unit tests pass (`pnpm test`); onboarding e2e helper updated (run with emulators via `pnpm test:e2e`).

## Test plan

### Automated

```bash
cd calsnap-web && pnpm test
cd calsnap-web && pnpm test:integration   # weigh-in goalTargetDate persistence
cd calsnap-web && pnpm test:e2e           # onboarding flow (emulators required)
```

### Manual (see [ROLLOUT.md](./ROLLOUT.md) Phase 2)

1. Onboarding goal step: no date picker; estimated date on calorie step updates with deficit slider.
2. Settings: deficit slider + read-only estimated date preview; save updates stored date.
3. Weigh-in: stored estimated goal date shifts after logging weight.
4. Progress stat label reads **Estimated goal date** and matches profile after saves.

## Out of scope

- iOS (`CalSnap/`) parity
- Goal-reached celebration or journey reset
- Auto-adjusting calorie budget from meal logs vs weight
- Empirical TDEE refinement
- Extending goal date during 2-week diet break (date goes null; acceptable for MVP)

## Known limitations

**Existing profiles before this PR** may still store a user-picked `goalTargetDate` until the next write path runs (settings save, weigh-in, or plateau action). Progress displays the stored value as-is; it is not lazily recomputed on read. New onboarding and any profile edit will use the engine-computed date.

## Key files

- `calsnap-web/lib/nutrition/goal-pathway.ts` — `computeGoalTargetDate()`, `validateGoalBelowCurrent()`, `formatEstimatedGoalDate()`
- `calsnap-web/components/onboarding/DeficitSlider.tsx` — shared deficit UI
- `calsnap-web/lib/repositories/profile.ts` — save paths + `updateCalorieTargets`
- `calsnap-web/lib/services/profile-update-service.ts` — settings `apply()` deficit fix
- `calsnap-web/lib/services/weigh-in-service.ts` — weigh-in recompute
