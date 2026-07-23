# Meal Input Simplification Plan

## Goal

Replace the two-path meal entry system (photo analysis vs manual form) with a single unified flow: the user provides a photo, a description, or both, and Gemini always generates the nutritional estimates. No manual data entry form. The user can edit all data after Gemini's first pass.

## Current State

The web app (`calsnap-web`) has two distinct entry paths on the `/scan` page:

1. **Photo path**: User selects a photo (camera/gallery) + optional description → Gemini analyzes → Results screen (editable)
2. **Manual path**: User clicks "Enter manually" → fills in food name, calories, macros, weight in form fields → Results screen

The API route `/api/analyze-meal` requires an `image` field in FormData (returns 400 `missing_image` if absent). The Gemini call (`analyzeMealImage`) always sends an image as `inlineData`.

## Proposed Changes

### 1. API Route: Make image optional (`app/api/analyze-meal/route.ts`)

- Change validation: `image` field becomes optional (remove the `missing_image` error check at line 32-34)
- If neither image nor description is provided, return 400 with a new error code `missing_input`
- If image is provided, validate type/size as before
- If only description is provided, skip image validation entirely
- Pass image bytes as `undefined` when not provided

### 2. Gemini Service: Handle text-only requests (`lib/gemini/analyze-meal.ts`)

- Update `AnalyzeMealImageInput` interface (line 29-33): make `imageBytes` and `mimeType` optional
- Update `analyzeMealImage()` to conditionally include `inlineData` in the parts array
- When no image: send only `{ text: prompt }` (text-only content)
- When image present: send both `{ text: prompt }` and `{ inlineData: ... }` (current behavior)
- The JSON schema and structured output remain the same for both paths

### 3. Prompt: Adaptive for all three cases (`lib/gemini/meal-analysis-prompt.ts`)

Update `buildMealAnalysisPrompt` to accept a new parameter indicating whether an image is present, and generate appropriate prompts:

- **Image only** (no description): Current prompt — analyze the visual meal image
- **Description only** (no image): New prompt section — estimate nutrition from the text description, use USDA database, lower confidence expected, flag uncertainty
- **Both**: Current prompt with enhanced description integration — use the description to refine visual estimates (e.g., "user says this is 200g of grilled chicken")

The function signature changes from `buildMealAnalysisPrompt(description?)` to `buildMealAnalysisPrompt(options: { hasImage: boolean; description?: string })`.

### 4. Scanner Hook: Remove manual entry flow (`lib/scanner/use-meal-scanner.ts`)

- Remove `'manual'` from `MealScannerPhase` type (line 37)
- Remove `isManualEntry` state (line 62) and all references to it
- Remove functions: `enterManualEntry` (307-315), `addManualItem` (317-319), `removeManualItem` (321-328), `updateManualItem` (330-337), `finishManualEntry` (339-350)
- Update `canAnalyze` (line 126): change from `Boolean(preparedPhoto) && phase !== 'analyzing'` to `(preparedPhoto !== null || textDescription.trim().length > 0) && phase !== 'analyzing'`
- Update `analyze()` (line 219-305):
  - Remove the early return when `!preparedPhoto` (line 220-222)
  - Conditionally build FormData: append image only if `preparedPhoto` exists, always append description if present
- Update `computedOverallConfidence` (line 101-106): remove `isManualEntry` check, always compute from items
- Update `canFinishManual` (line 119-124): remove entirely
- Update `hasUnsavedWork` (line 128-167): remove the `'manual'` case
- Update `makeMealEntry` (line 366-406): remove `isManualEntry` conditionals for `geminiConfidence`, `isManuallyAdjusted`, `estimationNotes`
- Update `loadForEditing` (line 413-451): remove `setIsManualEntry` call
- Update `discard` (line 453-472): remove `setIsManualEntry(false)`
- Update `reAnalyze` (line 478-486): remove `setIsManualEntry(false)`
- Remove `isManualEntry` from the return object (line 512)
- Remove `canFinishManual`, `enterManualEntry`, `addManualItem`, `removeManualItem`, `updateManualItem`, `finishManualEntry` from the return object

### 5. Capture View: Simplify UI (`components/scanner/MealScannerCaptureView.tsx`)

- Remove the "Enter manually" button (lines 102-109)
- Update the description textarea placeholder to indicate it can be used alone: "Describe your meal (e.g. \"2 eggs, 2 toast, coffee with milk\")"
- The "Analyze" button now enables when there's a photo OR a description (handled by `canAnalyze` change in the hook)

### 6. Error Banner: Remove manual entry fallback (`components/scanner/ScannerErrorBanner.tsx`)

- Remove `onManualEntry` prop (line 10)
- Remove the "Enter manually" button rendering (lines 45-56)
- Update error messages in copy to remove "or enter manually" text

### 7. Scan Page: Remove manual phase rendering (`app/(app)/scan/page.tsx`)

- Remove import of `ManualMealEntryView` (line 9)
- Remove the `{scanner.phase === 'manual' && ...}` rendering (line 145)
- Remove `onManualEntry={scanner.enterManualEntry}` from `ScannerErrorBanner` (line 162)

### 8. Results View: Remove `isManualEntry` conditionals (`components/scanner/MealAnalysisResultView.tsx`)

- Remove `isManualEntry` references from confidence badge rendering (lines 108-111) — always show `ConfidenceBadge` with level/score
- Remove `isManualEntry` guard on all-items-flagged warning (line 139) — always show warning
- Remove `isManualEntry` guard on estimation notes (line 160) — always show notes
- The `isManualEntry` prop is no longer passed from the scan page or edit page

### 9. Confidence Badge: Remove manual variant (`components/design/ConfidenceBadge.tsx`)

- Remove the `'manual'` case from `confidenceLabel` (line 19-20)
- Remove `level !== 'manual'` conditionals (lines 30-31, 35-36) — always show level + percent

### 10. Confidence Types: Remove manual level (`lib/scanner/meal-totals.ts`)

- Remove `'manual'` from `ConfidenceLevel` type (line 59)
- Remove `isManual` parameter from `confidenceLevelFromScore` (line 61-75) — simplify to just score-based
- Remove `isManual` parameter from `hasAdjustedItems` (line 42-57) — the manual early-return was only for manual entries

### 11. Editable Food Item: Remove manual factory (`lib/scanner/editable-food-item.ts`)

- Remove `emptyManualEditableFoodItem()` function (lines 76-90)

### 12. Design Colors: Remove manual badge style (`lib/design/colors.ts`)

- Remove `'manual'` case from `confidenceBadgeStyles` (lines 108-112)

### 13. Copy Strings: Update copy (`lib/copy/scanner.ts`, `lib/copy/api.ts`, `lib/copy/design-system.ts`)

**scanner.ts** — Remove:
- `'scanner.capture.manualEntry': 'Enter manually'`
- `'scanner.manual.foodItem'`, `'scanner.manual.remove'`, `'scanner.manual.namePlaceholder'`, `'scanner.manual.weight'`, `'scanner.manual.calories'`, `'scanner.manual.optionalMacros'`, `'scanner.manual.addItem'`
- `'scanner.confidence.manual': 'Manual entry'`

Update:
- `'scanner.capture.prompt'`: Change to `'Take a photo, or describe your meal below'`
- `'scanner.capture.description'`: Change to `'Description'`
- `'scanner.capture.descriptionPlaceholder'`: Change to `'e.g. 2 eggs, 2 slices toast, coffee with milk'`
- `'scanner.error.api'`: Change from `'Analysis failed. The service may be unavailable — try again or enter manually.'` to `'Analysis failed. The service may be unavailable — try again.'`
- `'scanner.error.parse'`: Change from `'Could not read the analysis response. Try again or enter manually.'` to `'Could not read the analysis response. Try again.'`
- `'scanner.error.unrecognizable'`: Change from `'Could not identify food in this photo. Try a clearer image or enter manually.'` to `'Could not identify food from this input. Try a different photo or rephrase your description.'`

**api.ts** — Remove:
- `'api.analyze.missingImage'`
- `'api.analyze.invalidImageType'`
- `'api.analyze.imageTooLarge'`

Add:
- `'api.analyze.missingInput': 'Provide a photo or description to analyze'`

**design-system.ts** — Remove:
- `'designSystem.confidence.manualEntry'`

### 14. API Error Codes: Update (`lib/api/error-codes.ts`)

- Remove `MissingImage`, `InvalidImageType`, `ImageTooLarge`
- Add `MissingInput`

### 15. Edit Page: No changes needed (`app/(app)/scan/edit/[mealId]/page.tsx`)

- No changes needed — the edit page doesn't render manual entry or reference `isManualEntry` directly. It goes through `MealAnalysisResultView` which we update in step 8.

### 15b. Meal Detail View: Remove manual entry display (`components/meal-log/MealDetailView.tsx`)

**This file was missing from the original plan.** It renders the `/log/[mealId]` detail page and directly uses `isManualEntry` logic:

- Remove `isManualEntry` local variable (line 22) and the `confidenceLevelFromScore(score, isManualEntry)` call (line 23)
- Replace with: `const confidenceLevel = confidenceLevelFromScore(meal.geminiConfidence)` (updated signature from step 10)
- Remove the `isManualEntry` ternary for `ConfidenceBadge` (lines 63-67) — always render `<ConfidenceBadge level={confidenceLevel} score={meal.geminiConfidence} />`
- Remove the `!isManualEntry &&` guard on estimation notes (line 95) — always show notes if present

**Backward compatibility**: Existing meals with `geminiConfidence === 0` will show "Low confidence (0%)" instead of "Manual entry". This is acceptable — the data is legacy and read-only.

### 16. Delete Files

- `components/scanner/ManualMealEntryView.tsx` — entire file

### 17. Update Tests

**E2E: `tests/e2e/scanner-error-manual-entry.spec.ts`**
- This test covers the manual entry fallback flow. It needs to be rewritten or deleted.
- Option A: Delete the test entirely (the flow no longer exists)
- Option B: Rewrite to test that when analysis fails, user can retry or modify their description
- **Recommendation: Delete and replace** with a test for the new text-only analysis flow

**E2E: `tests/e2e/helpers/scanner.ts`**
- Remove `fillManualMealItem` helper (lines 22-32)
- Update `uploadTestPhotoAndAnalyze` if needed

**Unit: `tests/unit/analyze-meal-route.test.ts`**
- Remove the `MissingImage` / image validation tests
- Add test: returns 400 when neither image nor description provided
- Add test: returns 200 with description only (no image)

**Unit: `tests/unit/editable-food-item.test.ts`**
- Remove the `'manual entry semantics'` describe block (lines 66-78) — it tests `emptyManualEditableFoodItem` and `confidenceLevelFromScore(0, true)`, both of which are being removed
- Remove `emptyManualEditableFoodItem` from the import (line 4)
- Remove `confidenceLevelFromScore` from the import (line 9) — no longer used in this file after the manual test removal
- Update `'hasAdjustedItems'` test at line 126: change `hasAdjustedItems(items, originals, true)` to `hasAdjustedItems(items, originals)` — the `isManual` parameter is being removed

**Unit: `tests/unit/meal-scanner-abort.test.ts`** — no changes needed (tests only the generation guard, no manual entry logic)

### 18. MealEntry Model: No changes needed

The `MealEntry` model already stores `textDescription` and `geminiConfidence`. Existing meals with `geminiConfidence === 0` (old manual entries) will show "Low confidence (0%)" instead of the previous "Manual entry" badge. This is acceptable — the data is legacy and the badge change is cosmetic.

**Note**: The `isManuallyAdjusted` field on `MealEntry` will still be set to `true` when the user edits items after Gemini's initial analysis (via `hasAdjustedItems`), which is correct behavior.

## Flow After Changes

### New User Flow

1. User navigates to `/scan`
2. Capture view shows:
   - Photo area (camera + gallery buttons)
   - Description textarea (placeholder: "e.g. 2 eggs, 2 slices toast, coffee with milk")
   - "Analyze" button (enabled when photo OR description is provided)
3. User provides photo, description, or both → clicks "Analyze"
4. Gemini analyzes and returns structured JSON with food items, calories, macros, confidence
5. Results screen shows: photo (if provided), calorie total, macro grid, food items (editable), estimation notes, meal type selector
6. User can edit any item (name, weight — macros scale proportionally)
7. User clicks "Log this meal" to save

### Existing Meal Editing Flow (unchanged)

1. User navigates to meal detail → clicks "Edit" → lands on `/scan/edit/[mealId]`
2. Meal data loads into the results view
3. User edits items → clicks "Save changes"

## File Change Summary

| File | Action |
|------|--------|
| `app/api/analyze-meal/route.ts` | Modify: make image optional, add missing_input error |
| `lib/gemini/analyze-meal.ts` | Modify: optional image, conditional inlineData |
| `lib/gemini/meal-analysis-prompt.ts` | Modify: adaptive prompt for image/description/both |
| `lib/scanner/use-meal-scanner.ts` | Modify: remove manual entry, update canAnalyze |
| `lib/scanner/editable-food-item.ts` | Modify: remove `emptyManualEditableFoodItem` |
| `lib/scanner/meal-totals.ts` | Modify: remove manual confidence level |
| `components/scanner/MealScannerCaptureView.tsx` | Modify: remove manual button, update placeholder |
| `components/scanner/ScannerErrorBanner.tsx` | Modify: remove manual entry fallback |
| `components/scanner/MealAnalysisResultView.tsx` | Modify: remove isManualEntry conditionals |
| `components/design/ConfidenceBadge.tsx` | Modify: remove manual variant |
| `lib/design/colors.ts` | Modify: remove manual badge style |
| `lib/copy/scanner.ts` | Modify: update copy, remove manual keys |
| `lib/copy/api.ts` | Modify: update error messages |
| `lib/copy/design-system.ts` | Modify: remove manual entry key |
| `lib/api/error-codes.ts` | Modify: update error codes |
| `app/(app)/scan/page.tsx` | Modify: remove manual phase rendering |
| `components/meal-log/MealDetailView.tsx` | Modify: remove isManualEntry conditionals |
| `components/scanner/ManualMealEntryView.tsx` | **Delete** |
| `tests/e2e/scanner-error-manual-entry.spec.ts` | **Delete or rewrite** |
| `tests/e2e/helpers/scanner.ts` | Modify: remove manual helpers |
| `tests/unit/analyze-meal-route.test.ts` | Modify: update route tests |
