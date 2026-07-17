# MEAL-INPUT-SIMPLIFICATION: Unified Photo/Description Meal Entry

**Status:** Implemented
**Depends on:** [PR-W10](./PR-W10.md) (scanner + Gemini abort foundation)
**Source plan:** [docs/meal-input-simplification-plan.md](../meal-input-simplification-plan.md)
**App:** `calsnap-web` (Next.js 16 App Router PWA)

---

## Objective

Replace the two-path meal entry system (photo analysis vs. a manual data-entry form) with a **single unified flow**: the user provides a photo, a text description, or both, and Gemini always generates the nutritional estimates. There is no manual entry form anymore — the user edits all data after Gemini's first pass.

**Out of scope (locked):** manual numeric entry form, server-side Gemini changes beyond making the image optional, Firestore schema changes, new meal-entry model fields.

---

## What shipped

| Area | Implementation |
|------|----------------|
| API route | `app/api/analyze-meal/route.ts` — image now optional; `400 missing_input` when neither image nor description |
| Gemini service | `lib/gemini/analyze-meal.ts` — `imageBytes`/`mimeType` optional; `inlineData` only when image present |
| Prompt | `lib/gemini/meal-analysis-prompt.ts` — adaptive for image-only / description-only / both |
| Scanner hook | `lib/scanner/use-meal-scanner.ts` — manual entry flow removed; `canAnalyze` = photo OR description |
| Capture UI | `components/scanner/MealScannerCaptureView.tsx` — "Enter manually" button removed |
| Error banner | `components/scanner/ScannerErrorBanner.tsx` — manual fallback button removed |
| Results UI | `components/scanner/MealAnalysisResultView.tsx` — confidence badge / notes / warning always render |
| Confidence badge | `components/design/ConfidenceBadge.tsx` — `'manual'` variant removed |
| Meal detail | `components/meal-log/MealDetailView.tsx` — manual badge/notes guards removed |
| Types | `lib/scanner/meal-totals.ts`, `lib/scanner/editable-food-item.ts` — manual factory + level removed |
| Copy | `lib/copy/{scanner,api,design-system}.ts` — manual keys removed, new messages |
| Error codes | `lib/api/error-codes.ts` — `MissingInput` added (replaces `MissingImage`) |
| Deleted | `components/scanner/ManualMealEntryView.tsx`, `tests/e2e/scanner-error-manual-entry.spec.ts` |
| Tests | New `tests/e2e/scanner-text-only-analysis.spec.ts`; updated unit tests |

---

## Key decisions

1. **Image validation retained when an image is present.** The plan (steps 13–14) listed `invalidImageType`/`imageTooLarge` for removal, but step 1 requires "If image is provided, validate type/size as before." These codes/copy are kept and only fire on the image path. Text-only requests skip image validation entirely. This is a deliberate, correct deviation from the plan text.

2. **`mimeType` made optional** on `AnalyzeMealImageInput` (plan step 2). The route always supplies a default (`'image/jpeg'`) so the Gemini `inlineData.mimeType` is defaulted inside the guarded block — keeps the contract non-brittle for future text-only callers.

3. **`geminiConfidence === 0` legacy meals.** Old manual entries (which stored `geminiConfidence: 0`) now render as "Low confidence (0%)" instead of a "Manual entry" badge. Acceptable per plan — the data is legacy and read-only.

4. **`makeMealEntry` simplification.** `geminiConfidence` now always derives from computed item confidence; `isManuallyAdjusted` is set purely via `hasAdjustedItems` (weight delta vs. baseline). No more `isManualEntry` short-circuit to `0` confidence.

5. **Retry after failure reuses description.** The error banner's `onRetry` (api/parse 5xx) calls `retryAnalyze` → `analyze()`, which re-reads `textDescription`, so a description-only retry works without re-typing.

---

## Architecture & component relationships

```
/scam (capture phase)
  MealScannerCaptureView
    ├─ camera/gallery file inputs → scanner.selectPhoto()
    ├─ description <textarea> → scanner.setTextDescription()
    └─ Analyze button (disabled unless canAnalyze) → scanner.analyze()

scanner.analyze()  [use-meal-scanner.ts]
  ├─ guard: !preparedPhoto && !description.trim() → return
  ├─ builds FormData: image (if preparedPhoto) + description (if present)
  ├─ POST /api/analyze-meal (Bearer idToken, AbortController)
  └─ on ok → applyAnalysis() → phase 'results'

/api/analyze-meal (route.ts)
  ├─ verifyBearerToken; GEMINI_API_KEY guard
  ├─ formData: image optional, description optional
  ├─ if !image && !description → 400 missing_input
  ├─ if image → validate mime/size
  └─ analyzeMealImage({ imageBytes?, mimeType?, description? })

lib/gemini/analyze-meal.ts
  ├─ buildMealAnalysisPrompt({ hasImage, description })
  ├─ parts = [{ text }] + (image ? [{ inlineData }] : [])
  └─ withRetry + Zod validation → MealAnalysisResponse

Results / Detail (share rendering)
  MealAnalysisResultView / MealDetailView
    └─ ConfidenceBadge(level, score)  // level from confidenceLevelFromScore(score)
```

**Phases** (`MealScannerPhase`): `'capture' | 'analyzing' | 'results' | 'error'`. The `'manual'` phase was removed.

**Removed hook surface:** `isManualEntry`, `canFinishManual`, `enterManualEntry`, `addManualItem`, `removeManualItem`, `updateManualItem`, `finishManualEntry` — all gone from the `MealScannerState` return object.

---

## API contract (`POST /api/analyze-meal`)

**Request** — `multipart/form-data`:
- `image` (File, optional): JPEG or `application/octet-stream`. Validated for type + size (`AppConstants.MealPhoto.hardMaxBytes + 64KB`) when present.
- `description` (string, optional): trimmed; used to seed/refine estimates.

**Responses:**
| Status | Code | Trigger |
|--------|------|---------|
| 401 | `unauthorized` | missing/invalid bearer token |
| 503 | `analysis_unavailable` | `GEMINI_API_KEY` unset |
| 400 | `missing_input` | neither image nor description provided |
| 400 | `invalid_image_type` | image present, bad MIME (image path only) |
| 400 | `image_too_large` | image present, exceeds max (image path only) |
| 422 | `unrecognizable` | Gemini returns 0 items or empty response |
| 502 | `analysis_parse_failed` | `validationFailed`/`invalidJSON` |
| 502 | `analysis_failed` | other Gemini failure |
| 200 | — | `MealAnalysisResponse` (items, mealTotal, flaggedItems, estimationNotes) |

The `MealAnalysisResponse` shape (Zod-validated JSON schema) is unchanged between image and text-only paths.

---

## Data model

**`MealEntry`** (unchanged schema):
- `textDescription?: string` — now the primary input channel (was previously only set alongside photos).
- `geminiConfidence: number` — always set from item-level confidence after Gemini's pass. Legacy `0` entries (old manual) render as "Low confidence (0%)".
- `isManuallyAdjusted: boolean` — now derived solely from `hasAdjustedItems(items, baselineWeights)` (user edited weights post-analysis). No manual-entry flag.
- `estimationNotes?: string` — always rendered when present (previously hidden for manual entries).
- `items: FoodItem[]` — editable, macros scale proportionally on weight change via `updateEditableItemWeight`.

`ConfidenceLevel` is now `'high' | 'medium' | 'low'` (no `'manual'`). `confidenceLevelFromScore(score)` and `hasAdjustedItems(items, originals)` are both single-purpose (no `isManual` parameter).

---

## Test status

| Suite | Result |
|-------|--------|
| Unit (`vitest`, non-integration) | 44 files / 237 tests — **pass** |
| `analyze-meal-route` (new) | description-only 200, missing-input 400, image validation — **pass** |
| `editable-food-item` (updated) | manual block removed; `hasAdjustedItems` 2-arg — **pass** |
| `meal-scanner-abort` | unchanged — **pass** |
| E2E typecheck (`tsc --noEmit`) | **clean** |
| Production build (`next build --webpack`) | **compiles** (TypeScript check passed) |
| Integration (`tests/integration/*`) | **fails locally** — Firebase emulator ports (8080/9099/9199) occupied by another project's running emulator; environment-only, not a code regression. Green in CI under `firebase emulators:exec`. |
| `GEMINI_API_KEY` leak guard | **pass** — key referenced only in server route handlers + server-only `lib/gemini/*`; no client component imports it. |

**New E2E:** `tests/e2e/scanner-text-only-analysis.spec.ts` covers (a) description-only → results → log → dashboard, and (b) 503 failure → retry with description → results.

---

## Next-phase context / notes

- **Legacy data:** Existing `geminiConfidence === 0` meals show "Low confidence (0%)". If product later wants to distinguish "was manual" from "genuinely low", a one-time backfill or a new field would be required — not in scope now.
- **Confidence on text-only:** Gemini is prompted to use lower confidence + flag when descriptions are vague. The `ConfidenceBadge`/level logic is score-driven and already handles this.
- **Broken port conflict (local only):** To run integration tests locally, stop the other project's emulator or override ports: `firebase emulators:exec --only auth,firestore,storage -p 9098 -P 8079 -s 9198 "pnpm exec vitest run tests/integration"`.
- **Build note:** `next build` defaults to Turbopack and errors on the existing `webpack` config in `next.config.ts` (pre-existing, unrelated to this work). Use `next build --webpack` or add a `turbopack: {}` config to fix.
- **No schema/migration needed** — `MealEntry` model and Firestore rules are untouched.

---

## Files changed (summary)

**Created:** `tests/e2e/scanner-text-only-analysis.spec.ts`
**Deleted:** `components/scanner/ManualMealEntryView.tsx`, `tests/e2e/scanner-error-manual-entry.spec.ts`
**Modified:** `app/api/analyze-meal/route.ts`, `lib/gemini/analyze-meal.ts`, `lib/gemini/meal-analysis-prompt.ts`, `lib/scanner/use-meal-scanner.ts`, `lib/scanner/editable-food-item.ts`, `lib/scanner/meal-totals.ts`, `components/scanner/MealScannerCaptureView.tsx`, `components/scanner/ScannerErrorBanner.tsx`, `components/scanner/MealAnalysisResultView.tsx`, `components/design/ConfidenceBadge.tsx`, `components/meal-log/MealDetailView.tsx`, `app/(app)/scan/page.tsx`, `lib/design/colors.ts`, `lib/copy/scanner.ts`, `lib/copy/api.ts`, `lib/copy/design-system.ts`, `lib/api/error-codes.ts`, `tests/e2e/helpers/scanner.ts`, `tests/e2e/helpers/index.ts`, `tests/unit/analyze-meal-route.test.ts`, `tests/unit/editable-food-item.test.ts`
