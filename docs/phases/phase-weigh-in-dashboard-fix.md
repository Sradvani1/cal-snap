# Phase: Dashboard Weigh-In Display Fix

**Date:** 2026-07-16
**Scope:** calsnap-web — dashboard weight trend chart and weigh-in cache invalidation
**Status:** Complete

---

## 1. Problem

The dashboard's `WeightTrendMiniChart` showed "Log your first weigh-in" even when the user had already logged weight records. Two root causes:

1. **Misleading copy**: The sparkline requires 2+ weigh-ins to draw a line. With exactly 1 weigh-in, `hasChart` was `false`, so the fallback rendered — showing "Log your first weigh-in" for a user who HAD logged a weigh-in.
2. **7-day window too narrow**: The chart query only fetched weigh-ins from the last 7 days. If the user's last weigh-in was 8+ days ago, the chart showed no data.

A secondary issue: cache invalidation after saving a weigh-in used an exact window key match. If the tab was opened on a different day than the weigh-in was logged, the React Query cache wasn't invalidated and the dashboard showed stale data.

---

## 2. What Changed

### Files Modified (5)

| File | Change |
|------|--------|
| `lib/copy/dashboard.ts` | Added `dashboard.weight.oneWeighIn` copy key |
| `components/dashboard/WeightTrendMiniChart.tsx` | Differentiates 0 vs 1 weigh-ins; shows correct copy and weight value |
| `lib/queries/use-recent-weigh-ins.ts` | Widened chart window from 7 → 30 days |
| `lib/queries/invalidate-weigh-ins.ts` | Prefix invalidation instead of exact window key match |
| `lib/queries/use-log-weigh-in.ts` | Removed `windowKey` argument and unused `localDayKey` import |

### No Files Added or Deleted

---

## 3. Key Decisions

1. **30-day chart window** — Most users weigh in weekly. 30 days captures ~4 data points, enough for a meaningful trend line without being too wide.

2. **Prefix cache invalidation** — Instead of passing the exact window key (which could mismatch due to stale mount time), invalidate all `weighIns` queries for the user by prefix: `['weighIns', uid]`. Simple and handles any window key.

3. **Differentiated copy for 0 vs 1 weigh-ins** — 0 weigh-ins shows "Log your first weigh-in". 1 weigh-in shows the actual logged weight + "Log another weigh-in to see your trend". 2+ shows the sparkline chart.

4. **No "Starting weight" label for 1 weigh-in** — When there's 1 weigh-in, the weight value is the user's actual logged weight, not a "starting weight". The label is only shown for 0 weigh-ins (profile's starting weight).

---

## 4. Architecture & Component Relationships

```
Dashboard Page (page.tsx)
  |
  +--> useDashboard(uid) [use-dashboard.ts]
  |     |
  |     +--> useRecentWeighIns(uid, now) [use-recent-weigh-ins.ts]
  |     |     |
  |     |     +--> lastNDaysWindow(30, now) => { start, end }  [date-window.ts]
  |     |     |     start = today - 29 days (midnight)
  |     |     |     end = tomorrow (midnight)
  |     |     |
  |     |     +--> fetchWeighInsInWindow(uid, start, end)  [weigh-ins.ts]
  |     |     |
  |     |     +--> Returns { chartWeighIns, plateauWeighIns }
  |     |
  |     +--> chartWeighIns = weighInsQuery.data?.chartWeighIns ?? []
  |
  +--> WeightTrendMiniChart(weighIns=chartWeighIns, ...)
        |
        +--> weighIns.length === 0: "Log your first weigh-in"
        +--> weighIns.length === 1: Show weight + "Log another weigh-in to see your trend"
        +--> weighIns.length >= 2: Sparkline chart
```

### Cache Invalidation Flow

```
User logs weigh-in
  --> useLogWeighIn mutation
    --> saveWeighIn (Firestore write)
    --> onSuccess: invalidateWeighInQueries(queryClient, uid)
         --> invalidates ['profile', uid]
         --> invalidates ['allWeighIns', uid]
         --> invalidates ['weighIns', uid] (prefix match — covers all window keys)
         --> invalidates analytics queries
  --> React Query refetches weighIns query
  --> Dashboard re-renders with fresh data
```

---

## 5. API Contracts

### `invalidateWeighInQueries` (updated signature)

```typescript
// Before:
function invalidateWeighInQueries(queryClient: QueryClient, uid: string, windowKey?: string): void

// After:
function invalidateWeighInQueries(queryClient: QueryClient, uid: string): void
```

The `windowKey` parameter was removed. Invalidation now uses prefix matching on `['weighIns', uid]`, which invalidates all window-keyed weigh-in queries for the user.

### Query Keys

```typescript
weighIns: (uid: string, windowKey: string) => ['weighIns', uid, windowKey]
```

Prefix invalidation with `queryKey: ['weighIns', uid]` matches all keys starting with `['weighIns', uid, ...]`.

---

## 6. Data Models (unchanged)

- `WeighIn` — `id`, `userId`, `date` (Date), `weightKg`, `calculatedTDEE?`, `adjustedDailyTarget?`, `bmi?`, `source?`, `createdAt?`
- `WeighInDoc` — Same but `date` and `createdAt` are Firestore `Timestamp`
- Firestore path: `users/{uid}/weighIns/{weighInId}`

No schema changes. No migration required.

---

## 7. Edge Cases & Invariants

| Case | Behavior |
|------|----------|
| 0 weigh-ins in 30-day window | Shows profile's `startingWeightKg` + "Starting weight" label + "Log your first weigh-in" |
| 1 weigh-in in 30-day window | Shows logged weight (no label) + "Log another weigh-in to see your trend" |
| 2+ weigh-ins in 30-day window | Shows sparkline chart |
| Weigh-in logged on different day than tab opened | Cache still invalidated via prefix match |
| Tab left open past midnight | Stale `now` reference — chart window doesn't update. Minor issue, not addressed in this phase. |

---

## 8. What Was NOT Changed

- `WeightTrendMiniChartSkeleton` — loading state unchanged
- `WeighInReminderBanner` — reminder logic unchanged (uses `fetchAllWeighIns`, not the 30-day window)
- `useDashboard` hook — stale `now` reference not addressed (minor, separate concern)
- Firestore schema or security rules
- Weigh-in logging flow (`WeighInSheet`, `saveWeighIn`)

---

## 9. Verification

```bash
npm run lint          # Clean
npx tsc --noEmit      # Only pre-existing test errors
```

---

## 10. Context for Next Phase

- The `useDashboard` hook still uses `useMemo(() => new Date(), [])` for `now`. If the user keeps the tab open past midnight, the 30-day window won't update. This is a minor issue — React Query's `windowKey` includes the day string, so the query key becomes stale but data remains from the correct window. A future fix could use a live clock or day-change listener.
- The `WeighInReminderBanner` uses `fetchAllWeighIns` (no date filter) and is unaffected by the window change.
- The sparkline chart still requires 2+ weigh-ins. With 1 weigh-in, the user sees their weight value and a prompt to log another — this is intentional since a trend line needs at least 2 points.
