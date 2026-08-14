# PR W06: Weight Logging and Progress

**Status:** Implemented  
**Source of truth:** [`.cursor/plans/pr_w06_weigh-in_40ae3488.plan.md`](../../../.cursor/plans/pr_w06_weigh-in_40ae3488.plan.md), [PR-W03](./PR-W03.md), [PR-W05](./PR-W05.md)

---

## 1. Objective

Deliver weekly weigh-in save with TDEE recalculation, full Progress tab (Recharts chart, stats, history), weigh-in sheet from dashboard and progress, query invalidation, and reminder preference fields on profile.

---

## 2. In scope

- `weigh-in-service.ts`: `recalculateWeighIn`, `saveWeighIn` with Firestore `writeBatch` (weigh-in + profile)
- Repository extensions: `fetchAllWeighIns`, `updateProfileAfterWeighIn`
- Pure progress stats in `lib/progress/*` with unit tests
- TanStack Query: `useAllWeighIns`, `useProgress`, `useLogWeighIn`, `usePlateauAlert`, `invalidateWeighInQueries`
- Progress UI: `WeightProgressView`, Recharts chart, stats grid, history list
- `WeighInSheet` from dashboard mini-chart and progress header
- Dashboard mini-chart: body links to `/progress`; "Log weigh-in" opens sheet
- Shared `usePlateauAlert` on dashboard and progress
- Optional `ProfileDoc` reminder fields with `resolveReminderPrefs()` read-time defaults
- "Remind me tomorrow" snooze via `localStorage` only

---

## 3. Out of scope

- HealthKit read/write
- Web Push / FCM notifications (W10)
- Settings UI for reminder day/time (W08)
- Analytics weight embed (W07)
- Weigh-in edit/delete
- shadcn / design tokens (W09)

---

## 4. Files created

| Path | Purpose |
|------|---------|
| `lib/services/weigh-in-service.ts` | Recalc + batch save + plateau detection |
| `lib/progress/progress-stats.ts` | Pure stats/chart derivations |
| `lib/progress/weigh-in-snooze.ts` | localStorage snooze for "Remind me tomorrow" |
| `lib/progress/reminder-prefs.ts` | Read-time defaults for reminder fields |
| `lib/progress/use-weigh-in-form.ts` | Weigh-in sheet form state |
| `lib/queries/invalidate-weigh-ins.ts` | Shared cache invalidation |
| `lib/queries/use-plateau-alert.ts` | Shared plateau hook |
| `lib/queries/use-all-weigh-ins.ts` | Full history query |
| `lib/queries/use-progress.ts` | Progress page data hook |
| `lib/queries/use-log-weigh-in.ts` | Save mutation |
| `components/progress/*` | Progress screen + weigh-in sheet |
| `tests/unit/weigh-in-service.test.ts` | Recalc + plateau on save |
| `tests/unit/progress-stats.test.ts` | Stats derivations |
| `tests/integration/weigh-in-firestore.test.ts` | Optional emulator batch save |

---

## 5. Files modified

| Path | Change |
|------|--------|
| `lib/repositories/weigh-ins.ts` | `fetchAllWeighIns` |
| `lib/repositories/profile.ts` | `updateProfileAfterWeighIn`, reminder defaults on create |
| `lib/models/weigh-in-doc.ts` | Optional `source: 'manual'` |
| `lib/models/profile-doc.ts` | Reminder pref fields |
| `lib/queries/query-keys.ts` | `allWeighIns` key |
| `lib/queries/use-dashboard.ts` | Plateau logic moved to `usePlateauAlert` |
| `components/dashboard/WeightTrendMiniChart.tsx` | Split tap targets |
| `app/(app)/dashboard/page.tsx` | Weigh-in sheet + shared plateau |
| `app/(app)/progress/page.tsx` | Full progress view |
| `package.json` | `recharts` |

---

## 6. Tests

### Unit (merge gate)

```bash
cd calsnap-web && pnpm test
```

### Integration (optional)

```bash
pnpm test:integration
```

### Merge gate

```bash
cd calsnap-web && pnpm install && pnpm test && pnpm lint && pnpm build
```

---

## 7. Manual test plan

1. Emulators + `pnpm dev`; complete onboarding
2. Dashboard: tap weight mini-chart → `/progress`
3. Dashboard: tap "Log weigh-in" → sheet with current weight prefilled
4. Enter new weight → TDEE/target preview updates before save
5. Toggle lbs/kg → displayed number converts; saved kg consistent
6. Save → sheet closes → dashboard ring target updates
7. Progress: chart shows actual line; with ≥2 weigh-ins dashed projection + goal line
8. Stats grid and history (newest first) populate
9. Log 3 weekly flat weigh-ins from Progress → plateau sheet on progress tab
10. "Remind me tomorrow" → no Firestore write; sheet closes
11. Backdate weigh-in → stored at start of local day; duplicate same-day allowed

---

## 8. Web deltas vs iOS PR-06

| Area | iOS | Web W06 |
|------|-----|---------|
| Persistence | SwiftData single context | Firestore `writeBatch` |
| HealthKit | Fire-and-forget write | Omitted |
| Notifications | `NotificationManager` | localStorage snooze only; delivery W10 |
| Current weight | Latest weigh-in | `ProfileDoc.currentWeightKg` on every save |
| Chart | Swift Charts | Recharts |
| Mini chart nav | NavigationStack push | Next.js `Link` to `/progress` |

---

## 9. Pull request

**Title:** PR W06: Weight logging and progress

**Summary**

- Adds weigh-in save pipeline with TDEE recalculation, Firestore batch write, and plateau detection.
- Replaces `/progress` stub with full chart (Recharts), stats grid, and history.
- Wires weigh-in sheet from dashboard and progress; dashboard mini-chart links to progress and logs weigh-ins.

**Test plan:** merge gate commands above + manual checklist.
