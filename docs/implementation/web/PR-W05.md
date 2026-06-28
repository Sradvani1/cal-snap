# PR W05: Meal Detail, Edit & Daily Log

**Status:** Implemented  
**Source of truth:** [`.cursor/plans/pr_w05_meal_log_ab7d342e.plan.md`](../../../.cursor/plans/pr_w05_meal_log_ab7d342e.plan.md), [PR-W03](./PR-W03.md), [PR-W04](./PR-W04.md)

---

## 1. Objective

Complete meal lifecycle on web: today's log tab, read-only detail, edit via pre-populated scanner, delete with confirmation, share summary card image, dashboard meal navigation, and full Daily Summary Footer.

---

## 2. In scope

- Repository CRUD: `fetchMeal`, `updateMeal`, `deleteMeal`, `getMealPhotoDownloadUrl`, `mealEntryToUpdateDoc`, `MealNotFoundError`
- TanStack Query: `useMeal`, `useUpdateMeal`, `useDeleteMeal`, shared `invalidateMealQueries`
- Scanner edit mode: `loadForEditing`, `editBaseline`, `/scan/edit/[mealId]`
- Routes: `/log` (today's grouped list), `/log/[mealId]` (detail), `/scan/edit/[mealId]` (edit)
- Share: text-only `MealShareCard` + `html2canvas` + Web Share API / download fallback
- Dashboard: meal rows link to detail; `DailySummaryFooter` fiber bands, net delta colors, macro split

---

## 3. Out of scope

- Historical log, edit photo replacement, swipe-reveal delete, dashboard-row delete
- List thumbnails, HealthKit, shadcn/design tokens (W09), rate limiting (W10)

---

## 4. Files created

| Path | Purpose |
|------|---------|
| `lib/repositories/meal-errors.ts` | `MealNotFoundError` |
| `lib/queries/invalidate-meals.ts` | Shared query invalidation |
| `lib/queries/use-meal.ts` | Single-meal query |
| `lib/queries/use-update-meal.ts` | Update mutation |
| `lib/queries/use-delete-meal.ts` | Delete mutation |
| `lib/scanner/edit-baseline.ts` | Edit baseline compare + edit-mode guard |
| `lib/dashboard/macro-split-caption.ts` | Footer macro split formatting |
| `components/meal-log/*` | List, row, detail, share card, share hook |
| `app/(app)/log/[mealId]/page.tsx` | Detail route |
| `app/(app)/scan/edit/[mealId]/page.tsx` | Edit scanner route |
| `tests/unit/meal-log-crud.test.ts` | CRUD + aggregate tests |
| `tests/unit/meal-share-card.test.ts` | Share card render test |
| `tests/integration/meal-crud-firestore.test.ts` | Optional emulator round-trip |

---

## 5. Files modified

| Path | Change |
|------|--------|
| `lib/models/meal-entry-doc.ts` | `mealEntryToUpdateDoc` |
| `lib/repositories/meals.ts` | fetch/update/delete/photo URL |
| `lib/scanner/use-meal-scanner.ts` | Edit mode |
| `components/scanner/MealAnalysisResultView.tsx` | `isEditing` UI |
| `components/scanner/FoodItemRow.tsx` | Optional read-only mode |
| `components/dashboard/TodaysMealsSection.tsx` | Uses `MealListSection` + links |
| `components/dashboard/DailySummaryFooter.tsx` | Full footer |
| `lib/queries/use-dashboard.ts` | Macro percents + net delta |
| `lib/queries/use-log-meal.ts` | Shared invalidation |
| `app/(app)/log/page.tsx` | Full log tab |
| `app/(app)/dashboard/page.tsx` | Footer props |
| `package.json` | `html2canvas` |

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

1. Emulators + `pnpm dev`; log 2–3 meals via `/scan`
2. Dashboard: tap meal row → detail; ring totals match
3. Log tab: four sections; empty sections show "Add …" → `/scan`
4. Detail: photo from Storage; read-only items; estimation notes on scanned meals
5. Edit → `/scan/edit/[id]` → results with read-only photo; Save → `/log/[id]`; dashboard updates
6. Delete from detail and log ⋯ menu → confirm → meal removed
7. Share → PNG shared or downloaded
8. Footer: fiber color bands, net kcal colors, macro split line

---

## 8. Web deltas vs iOS PR-05

| Area | iOS | Web W05 |
|------|-----|---------|
| Delete side effects | SwiftData + HK reversal | Firestore + Storage best-effort |
| Share | `ImageRenderer` | `html2canvas` + Web Share API |
| Swipe delete | Native `swipeActions` | ⋯ action menu on log rows |
| Edit photo | Can replace via capture | Read-only preview only |
| List thumbnails | Photo in row | Icon only; photo on detail |

---

## 9. Pull request

**Title:** PR W05: Meal detail, edit and daily log

**Summary**

- Adds meal fetch/update/delete, expanded `/log` tab, `/log/[mealId]` detail with share card, `/scan/edit/[mealId]` edit flow, dashboard meal navigation, and complete DailySummaryFooter.

**Test plan:** merge gate commands above + manual CRUD/share/footer checklist.
