# PR W07: Analytics and Insights

**Status:** Implemented  
**Source of truth:** [`.cursor/plans/pr_w07_analytics_3e9b60cd.plan.md`](../../../.cursor/plans/pr_w07_analytics_3e9b60cd.plan.md), [PR-W03](./PR-W03.md), [PR-W06](./PR-W06.md)

---

## 1. Objective

Deliver dietary habit analytics over user-selected timeframes (7D / 30D / 90D / Custom), on-demand Gemini insight generation from aggregates only, and embedded all-time weight progress — mirroring iOS PR-07.

---

## 2. In scope

- Pure analytics aggregation in `lib/analytics/*` (port of iOS `AnalyticsAggregator`)
- `isCalorieIntakeOnTarget` in `calorie-progress.ts` (±10% band)
- `fetchMealsInRange` + `useAnalytics` TanStack Query hook
- `invalidateAnalyticsQueries` wired into meal CRUD invalidation
- `POST /api/generate-insight` — session auth, Zod-validated client payload, Gemini text-only
- `/analytics` page with Recharts sections, timeframe picker, custom range sheet
- Embedded `WeightProgressView` (`presentation="embedded"`) always visible below dietary sections
- Progress page discovery link: "Dietary analytics →"
- `usePlateauAlert` + `PlateauAlertSheet` on analytics page for embedded weigh-ins

---

## 3. Out of scope

- Settings, CSV export (W08)
- Design tokens, copy module (W09)
- PWA, E2E, Web Push (W10)
- Bottom-tab analytics entry or dashboard analytics link
- Alcohol analytics, scheduled insights, server-side aggregate recompute

---

## 4. Files created

| Path | Purpose |
|------|---------|
| `lib/analytics/analytics-types.ts` | Date ranges, summaries, insight payload types |
| `lib/analytics/analytics-aggregator.ts` | Pure aggregation functions |
| `lib/analytics/build-analytics-snapshot.ts` | Snapshot builder for UI + insight payload |
| `lib/queries/use-analytics.ts` | Analytics data hook |
| `lib/queries/invalidate-analytics.ts` | Cache invalidation |
| `lib/queries/use-generate-insight.ts` | Insight mutation hook |
| `lib/gemini/analytics-insight-prompt.ts` | Prompt builder (iOS parity) |
| `lib/gemini/analytics-insight-zod.ts` | Payload Zod schema |
| `lib/gemini/generate-insight.ts` | Gemini text generation |
| `app/api/generate-insight/route.ts` | Insight API route |
| `app/(app)/analytics/page.tsx` | Analytics screen |
| `components/analytics/*` | Section cards, charts, picker, empty state |
| `tests/unit/analytics-aggregator.test.ts` | Aggregator + adherence tests |
| `tests/unit/analytics-insight-prompt.test.ts` | Prompt content tests |
| `tests/unit/generate-insight-route.test.ts` | API route tests |

---

## 5. Files modified

| Path | Change |
|------|--------|
| `lib/dashboard/calorie-progress.ts` | Added `isCalorieIntakeOnTarget` |
| `lib/repositories/meals.ts` | Added `fetchMealsInRange` |
| `lib/queries/query-keys.ts` | Added `analyticsMeals` key |
| `lib/queries/invalidate-meals.ts` | Calls `invalidateAnalyticsQueries` |
| `components/progress/WeightProgressView.tsx` | `presentation` prop for embedded mode |
| `app/(app)/progress/page.tsx` | Link to `/analytics` |
| `app/(app)/analytics/page.tsx` | Context-keyed insight invalidation on profile change |
| `components/analytics/AnalyticsCustomRangeSheet.tsx` | Remount form on open for fresh date inputs |
| `lib/queries/invalidate-weigh-ins.ts` | Also invalidates analytics on weigh-in save |
| `lib/queries/use-plateau-alert.ts` | Invalidates analytics when plateau updates targets |
| `middleware.ts` | `/analytics` session protection |
| `lib/gemini/analytics-insight-zod.ts` | String length caps on prompt fields |
| `docs/implementation/web/README.md` | W07 index → Implemented |

---

## 6. Tests

### Unit (merge gate)

```bash
cd calsnap-web && pnpm test
```

Covers:

- `adherencePercent`, `dayOfWeekBreakdown`, `topFoods` (iOS `AnalyticsTests` parity)
- `chartDailySeries` zero-fill
- `isCalorieIntakeOnTarget` ±10% band
- Insight prompt content
- `POST /api/generate-insight` — 401, 503, 400, 200

### Merge gate

```bash
cd calsnap-web && pnpm install && pnpm test && pnpm lint && pnpm build
```

---

## 7. Manual test plan

1. Emulator + `pnpm dev`; user with ≥3 logged days in selected window
2. Progress → "Dietary analytics →" loads `/analytics`
3. Default 7D: calorie, macro, fiber, patterns sections populate
4. Switch 30D / 90D: sections refetch
5. Custom range: 14-day window; cancel reverts preset; max 365 days enforced
6. User with &lt;3 logged days: empty state + scan CTA; weight section still visible
7. Weight section shows all-time progress; log weigh-in from embedded CTA works
8. Log 3 flat weekly weigh-ins from analytics embed → plateau sheet on analytics tab
9. Generate insight → 2–3 sentence response; request body is aggregates only
10. Change timeframe → prior insight cleared
11. Log/edit/delete meal elsewhere → return to analytics → data refreshed
12. Unauthenticated `POST /api/generate-insight` → 401; `loggedDayCount: 2` → 400
13. Mobile 320px: segmented picker wraps; charts usable

---

## 8. Web deltas vs iOS PR-07

| Area | iOS | Web W07 |
|------|-----|---------|
| Navigation | Analytics tab | `/analytics` linked from Progress only |
| Persistence | SwiftData range fetch | Firestore `fetchMealsInRange` |
| Gemini auth | User BYOK | Server `GEMINI_API_KEY`; 503 when missing |
| Charts | Swift Charts | Recharts |
| Weight embed | `WeightProgressPresentation.embedded` | `presentation="embedded"` |
| Insight transport | In-process `GeminiService` | `POST /api/generate-insight` |

---

## 9. Pull request

**Title:** PR W07: Analytics and insights

**Summary**

- Adds pure analytics aggregation, timeframe picker, and Recharts dietary sections on `/analytics`.
- Adds server-side Gemini insight route using client-built aggregate payloads only.
- Embeds all-time weight progress on analytics; discovery via Progress page link.

**Test plan:** merge gate commands above + manual checklist in §7.
