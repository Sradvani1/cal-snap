# PHASE: Insight Gating Dedup + Dashboard Weight-Trend Redesign

**Status:** Implemented (not yet committed)
**App:** `calsnap-web` (Next.js 16 App Router PWA)
**Trigger:** Feature-review of two analytics surfaces — the AI insight generator and the dashboard weight-trend sparkline.

---

## Objective

Two independent cleanups uncovered during a feature walkthrough:

1. **Insight gating duplication.** The "≥3 logged days" rule that gates the AI insight feature was hardcoded in two places (`build-analytics-snapshot.ts` and `app/api/generate-insight/route.ts`). No drift had occurred yet, but the rule had no single source of truth and could silently diverge.
2. **Misleading weight-trend chart.** The dashboard `WeightTrendMiniChart` auto-scaled its Y-axis to only the logged weigh-ins and used index-based X positioning with no goal reference and no time context. A sub-kilogram fluctuation rendered as dramatically as a multi-kilogram drop.

Neither was a critical/security issue; both were design-quality fixes.

---

## What shipped

| Area | Implementation |
|------|----------------|
| Insight threshold constant | `lib/analytics/analytics-types.ts` — `ANALYTICS_MIN_INSIGHT_LOGGED_DAYS = 3` |
| Snapshot gating | `lib/analytics/build-analytics-snapshot.ts` — `hasEnoughData = loggedDayCount >= ANALYTICS_MIN_INSIGHT_LOGGED_DAYS` |
| API gating | `app/api/generate-insight/route.ts` — `loggedDayCount < ANALYTICS_MIN_INSIGHT_LOGGED_DAYS` |
| Goal weight in dashboard data | `lib/queries/use-dashboard.ts` — `goalWeightKg: profile?.goalWeightKg ?? 0` |
| Goal prop pass-through | `app/(app)/dashboard/page.tsx` — `goalWeightKg={dashboard.goalWeightKg}` |
| Chart rework | `components/dashboard/WeightTrendMiniChart.tsx` — anchored Y-axis, dashed goal line, date-based X, range caption |
| Date helper | `lib/utilities/unit-formatters.ts` — `formatDateShort(date)` |
| Copy | `lib/copy/dashboard.ts` — `dashboard.weight.goalLine`, `dashboard.weight.range`, updated `dashboard.weight.trendA11y` |

---

## Key decisions

1. **Keep server-side enforcement; de-dup the constant.** The API route's `loggedDayCount < 3` check is the real trust boundary (the client payload is untrusted), so it was *not* removed. Instead the magic number `3` was extracted into `ANALYTICS_MIN_INSIGHT_LOGGED_DAYS` and referenced by both the client snapshot gate and the server route. One source of truth, no weakened security.

2. **Did NOT move aggregation server-side.** A previous review noted the insight API blindly trusts client-sent aggregates (`averageDailyCalories`, `adherencePercent`, etc.), which a motivated user could forge. We deliberately did *not* address that here — it is low-risk (coaching prose only, no writes) and out of scope for this cleanup. Flagged in Next-phase context below.

3. **Y-axis anchoring uses starting + goal weights.** The sparkline min/max now includes `startingWeightKg` and `goalWeightKg` (when `> 0`), with a small fixed vertical padding. This makes the line's vertical position meaningful relative to start/goal instead of purely relative to itself.

4. **X-axis mapped to real dates, not index.** Points are positioned by `entry.date` between earliest and latest weigh-in. Two weigh-ins a day apart and a month apart now render distinctly. Date span is `end - start` with a `|| 1` guard for the degenerate single-point case.

5. **Goal line is visual only, no new data fetch.** The dashed `goalWeightKg` line reuses the profile value already present in `useDashboard`, so no extra Firestore read was introduced.

6. **No Firestore schema changes, no new API.** All changes are client-side rendering + one constant extraction. The insight API contract is byte-for-byte unchanged.

---

## Architecture & component relationships

### AI Insight feature (unchanged structure, de-duped gate)

```
Analytics page (app/(app)/analytics/page.tsx)
  useAnalytics(uid, range)                         [client]
    ├─ fetchMealsInRange / fetchWeighInsInWindow   → Firestore reads
    ├─ getProfileWithExtras                       → Firestore read
    └─ buildAnalyticsSnapshot(...)
         └─ hasEnoughData = loggedDayCount >= ANALYTICS_MIN_INSIGHT_LOGGED_DAYS

  AnalyticsInsightCard (button, gated by hasEnoughData)
    → useGenerateInsight().mutateAsync(snapshot.insightPayload)
        → POST /api/generate-insight  (Bearer idToken)
            ├─ verifyBearerToken
            ├─ parseAnalyticsInsightPayload (Zod)
            ├─ loggedDayCount < ANALYTICS_MIN_INSIGHT_LOGGED_DAYS → 400 insufficientDays
            └─ generateAnalyticsInsight → Gemini (free-text string, never stored)
```

The insight string is held only in React component state (`insightState`); it is never written to Firestore. Trigger is a manual "Generate insight" button, visible only when `hasEnoughData` (≥3 distinct logged days) — *not* tied to the selected timeframe window length.

### Dashboard weight trend (reworked chart)

```
Dashboard page (app/(app)/dashboard/page.tsx)
  useDashboard(uid)                               [client]
    ├─ useProfile → startingWeightKg, goalWeightKg, useLbsForDisplay
    ├─ useRecentWeighIns → chartWeighIns (all weigh-ins)
    └─ returns { chartWeighIns, startingWeightKg, goalWeightKg, useLbsForDisplay, ... }

  WeightTrendMiniChart
    ├─ sparklinePoints(weighIns, min, max, useLbs)   // X by date, Y anchored to start/goal
    ├─ goal line (dashed) at goalWeightKg
    ├─ range caption: formatDateShort(start) – formatDateShort(end)
    └─ < 2 weigh-ins → single big number (starting or lone weigh-in) + CTA
```

`WeightProgressView` (Progress page) remains the full-featured view (progress bar, projection, stats grid) and was **not** touched.

---

## API contract (unchanged)

`POST /api/generate-insight` — no behavioral change. Request body validated by `analyticsInsightPayloadSchema` (Zod); `loggedDayCount` rule now references the shared constant. Responses unchanged:

| Status | Code | Trigger |
|--------|------|---------|
| 401 | `unauthorized` | missing/invalid bearer token |
| 503 | `insight_unavailable` | `GEMINI_API_KEY` unset |
| 400 | `invalid_json` | malformed body |
| 400 | `invalid_payload` | Zod validation failure |
| 400 | `insufficient_logged_days` | `loggedDayCount < ANALYTICS_MIN_INSIGHT_LOGGED_DAYS` |
| 502 | `empty_insight_response` / `insight_generation_failed` | Gemini errors |
| 200 | — | `{ insight: string }` |

---

## Data model (unchanged)

No `MealEntry`, `WeighIn`, or `UserProfile` schema fields added or removed.

- `WeighIn` (`lib/models/weigh-in.ts`): `{ id, userId, date: Date, weightKg, ... }` — `date` now drives sparkline X positioning.
- `UserProfile` (`lib/models/user-profile.ts`): `startingWeightKg`, `goalWeightKg` already existed; `goalWeightKg` is newly surfaced into the dashboard mini-chart.
- Insight payload (`AnalyticsInsightPayload`): unchanged shape; only the gating threshold constant moved.

---

## Test status

| Check | Result |
|-------|--------|
| `tsc --noEmit` (touched files) | **clean** — no errors in changed files |
| `pnpm lint` | **clean** on changed files |
| Pre-existing test failures | Unrelated: Firebase emulator `Firestore` type mismatches in `tests/integration/*` and mock type issues in `tests/unit/*` (present before this change; environment/SDK only) |
| No new unit/integration tests added | This was a rendering + constant extraction change; existing insight tests (`generate-insight-route.test.ts`, `analytics-insight-prompt.test.ts`) still cover the gated behavior |

**Note:** The `< 2 weigh-ins` empty-state and the goal-line/range-caption paths are not covered by automated tests. A visual build check is recommended before deploy (PWA/offline behavior only exists in `next build --webpack` preview/prod, not `pnpm dev`).

---

## Next-phase context / notes

- **Untrusted insight aggregates (deferred).** `POST /api/generate-insight` accepts client-computed stats (`averageDailyCalories`, `adherencePercent`, `actualMacroSplit`, etc.) and forwards them to Gemini. A user could forge flattering numbers. Risk is low (read-only coaching text, no persistence), but if the feature grows (e.g. storing insights, or surfacing them to others), move aggregation server-side using `uid` + date range from Firestore. The shared `ANALYTICS_MIN_INSIGHT_LOGGED_DAYS` constant is the right anchor if/when that refactor happens.
- **No caching / idempotency on insight calls.** Every button click re-calls Gemini and pays token cost, even for an identical payload. `contextKey` only guards React state. If cost becomes a concern, consider server-side caching keyed by payload hash or a short TTL.
- **Insight visibility mental model.** The button appears based on `hasEnoughData` (≥3 distinct logged days), which users perceive as the timeframe toggle. The 7D default rarely accumulates 3 days; 30D/90D usually does — hence the "only shows at 30D+" observation. If product wants explicit control, gate on window length instead, or add a tooltip explaining the ≥3-day requirement.
- **Weight-trend axis edge cases.** When `startingWeightKg` or `goalWeightKg` is `0` (unset profile), they're excluded from the min/max via the `> 0` filter, so the axis falls back to logged-weigh-in-only scaling (previous behavior). Goal line simply does not render.
- **Build command.** Validate PWA/chart behavior with `next build --webpack` + preview; `pnpm dev` disables the service worker and `public/sw.js`.

---

## Files changed (summary)

**Modified:**
- `calsnap-web/lib/analytics/analytics-types.ts` — added `ANALYTICS_MIN_INSIGHT_LOGGED_DAYS`
- `calsnap-web/lib/analytics/build-analytics-snapshot.ts` — gate uses shared constant
- `calsnap-web/app/api/generate-insight/route.ts` — gate uses shared constant
- `calsnap-web/lib/queries/use-dashboard.ts` — added `goalWeightKg` to return
- `calsnap-web/app/(app)/dashboard/page.tsx` — passes `goalWeightKg` to chart
- `calsnap-web/components/dashboard/WeightTrendMiniChart.tsx` — anchored Y-axis, goal line, date-based X, range caption, a11y update
- `calsnap-web/lib/utilities/unit-formatters.ts` — added `formatDateShort`
- `calsnap-web/lib/copy/dashboard.ts` — new/updated weight copy keys
