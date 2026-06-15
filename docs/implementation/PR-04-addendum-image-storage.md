# PR4 Addendum: Meal Photo Storage Optimization

**Parent:** [`PR-04.md`](./PR-04.md)  
**Status:** Implemented

This addendum is attached to **PR 4: Meal Scanner — Gemini Integration** because PR4 is where photo capture, library import, image preparation, Gemini analysis input, and `MealEntry.photoData` persistence were originally specified and implemented.

## Why this addendum exists

PR4 correctly introduced local meal-photo persistence through `MealEntry.photoData` using SwiftData `@Attribute(.externalStorage)`, and later hardening added orientation normalization plus in-memory downsampling for full-resolution library photos. However, the original PR4 materials did **not** explicitly define the persisted image resolution, compression policy, or per-meal storage budget.

This addendum closes that gap with a concrete, testable image-storage policy.

## Product decision

CalSnap stores **one optimized local copy** of each meal photo in app-private storage. It does **not** store the original full-resolution image after import/capture, and does **not** store both an original and a compressed derivative.

## Storage policy

### Canonical persisted asset

Every persisted meal photo must be normalized and downsampled before being written to `MealEntry.photoData`.

**Required policy:**

- Normalize orientation before any resize or encode step.
- Downsample to a **maximum long edge of 1280 px** (never upscale smaller inputs).
- Encode as **JPEG**.
- **Persisted photo format is always JPEG**, regardless of input source format (HEIC, PNG, camera JPEG, etc.).
- **Initial JPEG quality target: 0.72, tunable after validation** via `AppConstants.MealPhoto`.
- Preferred encoded payload: **<= 500 KB**.
- Soft upper bound: **<= 750 KB** for difficult images.
- Hard upper bound: **<= 1.0 MB** except documented fallback cases.
- **Quality and dimension floors:** do not reduce below the minimum visual-quality threshold (`minJPEGQuality`) or minimum long edge (`minLongEdgePx`) unless needed for hard-cap enforcement.

If the first encode exceeds the hard upper bound, the pipeline retries with lower quality and/or a smaller max long edge until the image falls below the ceiling.

### One-asset rule

The bytes saved in `MealEntry.photoData` are the only app-managed stored meal image.

Do not persist:

- Original HEIC/JPEG from camera or library
- A second "full-quality" app copy
- Separate thumbnail files in SwiftData

Thumbnails are generated at render time from the stored optimized image.

## Analysis vs persistence policy

Use a **single optimized image pipeline** (`MealPhotoProcessor`) for both:

1. Gemini analysis input
2. Persisted `MealEntry.photoData`

The app prepares one normalized, resized, compressed image asset and:

- sends those bytes to Gemini
- persists those same bytes to SwiftData on save

### Exception rule

If real-world testing shows Gemini materially benefits from a larger image than the persisted-photo budget allows, the app may temporarily create a larger in-memory analysis image, but it must still persist only the optimized storage version. This exception must not create a second persisted asset.

## Implementation

| File | Purpose |
|------|---------|
| `CalSnap/Core/Utilities/MealPhotoProcessor.swift` | Shared normalize / resize / JPEG encode pipeline with byte-budget retry |
| `CalSnap/Core/Utilities/Constants.swift` | `AppConstants.MealPhoto` policy constants |
| `CalSnap/Features/MealScanner/MealScannerViewModel.swift` | `preparedPhoto`, `setSelectedPhoto(from:)`, analyze/save reuse |
| `CalSnapTests/MealPhotoProcessorTests.swift` | Processor unit tests |

### ViewModel expectations

- Analysis uses `preparedPhoto.data`, not raw full-resolution input.
- `makeMealEntry()` stores `preparedPhoto.data` into `photoData`.
- Re-analysis of the same selected image reuses `preparedPhoto`.
- **Editing an existing meal reuses the already-optimized stored image** unless the user selects a new photo (`loadForEditing` wraps existing bytes via `prepared(fromPersistedJPEG:)` with no re-encode).

### Repository

No schema change. `MealRepository.save` continues to persist `MealEntry.photoData`; bytes must conform to this policy for new captures.

## Acceptance criteria

- Persisted meal photos are normalized and downsampled before save (only when long edge > 1280 px).
- Persisted format is always JPEG regardless of input source format.
- Saved meal photos never exceed the configured hard size ceiling in normal operation.
- Small images are not upscaled or unnecessarily bloated.
- Meal detail, dashboard thumbnails, and share flows render correctly from the optimized stored image.
- Gemini analysis succeeds using the optimized analysis/storage image.
- Importing a very large library image does not keep the original full-resolution payload as the persisted app copy.
- Edit flow reuses stored `photoData` without re-encoding unless the user picks a new photo.

## Tests

### `MealPhotoProcessorTests`

| Test | Verifies |
|------|----------|
| `testPrepareMealPhotoNormalizesOrientation` | Rotated input returns upright encoded image metadata |
| `testPrepareMealPhotoDownsamplesLargeImage` | Oversized image reduced to long edge <= 1280 px |
| `testPrepareMealPhotoUsesJPEGMimeType` | Output mime type is `image/jpeg` |
| `testPrepareMealPhotoEnforcesHardByteCeiling` | Noisy/large source re-encoded under max byte budget |
| `testPrepareMealPhotoDoesNotUpscaleOrBloatSmallImage` | 200×200 input stays 200×200 with modest byte size |

### `MealScannerViewModelTests`

| Test | Verifies |
|------|----------|
| `testMealEntryCreationStoresPreparedPhotoData` | `makeMealEntry()` uses processed bytes |
| `testEditMealReusesStoredPhotoData` | Edit path reuses stored bytes without re-encode |

## Migration / backward compatibility

Applies to PR4 behavior going forward. No immediate migration of already-saved photos. Legacy oversized photos pass through unchanged until the user selects a new photo.

Out of scope: storage management UI, bulk backfill/compaction, separate thumbnail persistence, cloud sync.
