# PR Addendum: Single-User, Local-Only Profile Simplification

This addendum updates the product and implementation direction for CalSnap to reflect the current app strategy: **one user per installed iPhone app, local-only storage, no account system, and no in-app multi-user switching**. It should be applied across the existing PR history as a corrective scope decision, with the primary implementation work centered on the onboarding, dashboard, and settings surfaces where multi-user assumptions were introduced.

## Why this change is needed

The current spec and implemented PRs still reflect an earlier MVP concept in which one iPhone installation could support two local profiles (for example, the user and a partner). That made sense as an exploration, but it no longer matches the product being built.

CalSnap is now a **single-user, single-device nutrition tracker**:
- The app runs locally on one iPhone.
- There is no sign-in or cloud account system.
- There is no need for profile switching on one device.
- Each installation represents one person’s nutrition log and weight history.

This addendum removes unnecessary complexity from onboarding, dashboard state, settings, and profile management.

## Product decision

CalSnap is a **local-only, single-user iPhone app**.

### Canonical rules

- One app install corresponds to one active person.
- The app does **not** support partner mode or dual-user mode.
- The app does **not** require authentication.
- The app does **not** require a name during onboarding.
- A user name may be stored later as an **optional display preference** in Settings.
- All meal, weight, analytics, and settings data belong to the single local profile.

## Scope placement

This is not a brand-new feature PR. It is a **product-direction correction** that should be reflected as an addendum touching prior PR scopes where the older assumption was encoded.

### Primary PRs affected

- **PR2** — onboarding and profile creation
- **PR3** — dashboard active-user state and profile switcher
- **PR8** — settings profile management and partner add/remove flow

## PR2 addendum: onboarding and profile creation

PR2 is the main place this change should be applied.

### Revised PR2 objective

Replace the dual-profile onboarding model with a **single-profile onboarding flow** for one local user. Onboarding collects the user’s biological and goal inputs needed for calorie-target calculation, requests HealthKit authorization, optionally stores API keys, and persists exactly one `UserProfile`.

### Revised onboarding rules

- Remove the optional partner concept entirely.
- Remove the requirement for a name on the Welcome or Profile Setup steps.
- Do not block onboarding on missing name input.
- Persist exactly one local `UserProfile` on onboarding completion.
- Keep API key entry optional as already defined.
- Keep HealthKit authorization in onboarding.

### Welcome step changes

Replace the current welcome step that asks for “Your name” and “Partner’s name” with a simpler intro:
- App name
- Tagline/value proposition
- Short note that CalSnap works fully on-device and stores data locally
- Continue button

### Profile setup changes

Profile setup should collect only the information required for calculations and personalization:
- Sex
- Date of birth
- Height
- Current weight

A user name should **not** appear here.

### Goal setup and preview

Goal setup, calorie target preview, HealthKit, and API key steps remain conceptually the same, but all logic should assume exactly one profile draft.

### ViewModel simplification

`OnboardingViewModel` should be simplified from dual-profile orchestration to one draft only.

#### Remove

- `profileB`
- `currentProfileIndex`
- computed `activeProfile` switching between profile A and B
- dual-user loop logic in `advance()`
- any partner-name branching from Welcome

#### Keep / simplify

- One `profileDraft`
- one target-calculation path
- one `saveProfile(context:)`
- HealthKit request flow
- API key storage and validation flow

### Persistence rule

On onboarding completion:
1. Save exactly one `UserProfile`
2. Save entered API keys if present
3. Mark onboarding complete via existing launch gating behavior

There is no `activeUserId` concept needed for onboarding anymore.

### PR2 acceptance criteria replacement

Replace the multi-profile assumptions with:
- Full onboarding flow navigable on iPhone simulator
- Exactly one `UserProfile` persisted to SwiftData on completion
- HealthKit authorization request fires on the HealthKit step
- Gemini API key stored in Keychain, not UserDefaults
- App skips onboarding on second launch if a profile exists
- No required name field in onboarding

### PR2 test updates

Replace or revise tests that depend on names and dual-user logic.

Suggested updated tests:
- `testOnboardingValidation()` — missing required biometric fields blocks advance where appropriate; missing name does not matter
- `testGoalDateMinimum()` — unchanged intent
- `testProfilePersistence()` — one `ProfileDraft` maps to one persisted `UserProfile`

## PR3 addendum: dashboard simplification

PR3 should be updated to remove all active-user and profile-switching concepts.

### Revised PR3 objective

The dashboard is the primary home screen for the single local user. It shows calorie progress, macro breakdown, today’s meals, weight trend, and quick-add entry without any profile switching UI.

### Remove from PR3

- `ProfileSwitcherView`
- `@AppStorage(AppStorageKey.activeUserId)` ownership in `DashboardView`
- `switchUser(to:)`
- active-user selection menus
- multi-profile fallback logic

### Replace with

- `DashboardViewModel` loads the single persisted `UserProfile`
- if no profile exists, onboarding gating should already handle it
- all meal and weigh-in queries resolve against the single profile’s `id`

### Dashboard header

The header should no longer show a switcher. It can show:
- greeting only, or
- greeting plus optional display name if later set in Settings

If no display name exists, use a neutral heading such as “Today” or “Welcome back.”

### PR3 acceptance criteria replacement

- Dashboard renders with real data from the single persisted profile
- No profile switcher is shown
- Calorie ring animates on load
- FAB navigates to MealScannerView
- Plateau alert fires when detected for the current user

## PR8 addendum: settings simplification

PR8 should retain profile editing, but remove partner and multi-user management.

### Remove from PR8

- partner add/remove flow
- any abbreviated onboarding flow for a second profile
- any per-user cleanup based on active-user switching
- any UI language implying multiple people use one installation

### Add / retain in PR8

- profile editing for the single local user
- optional display name field in Settings
- existing calorie/macronutrient recalculation behavior
- API key management
- HealthKit settings
- notifications settings
- data export
- scoped delete for the single user’s local data

### Optional display name rule

The profile name becomes an optional field managed in Settings rather than a required onboarding field.

Behavior:
- If empty, the app uses neutral UI copy and no personalized greeting.
- If set, the app may use it in greetings, profile summary cards, or export metadata.
- Clearing the name is allowed.

## Data model guidance

To minimize churn, the existing `UserProfile.name: String` field may remain in the schema initially even though onboarding no longer requires it.

### Recommended near-term approach

- Keep `UserProfile.name` in the model for now
- Populate it with an empty string by default during onboarding
- Treat it as an optional display field in product behavior
- Avoid a schema migration unless there is a broader model cleanup pass later

This keeps implementation simple while aligning the user experience with the new product direction.

## RootView and launch gating

`RootView` should continue using persisted profile existence to decide between onboarding and the main app.

### New rule

- No profile exists → show onboarding
- One profile exists → show app
- More than one profile exists should be treated as legacy/debug state, not a supported product condition

If multiple profiles are found because of old builds or test data, the app may:
- use the first profile temporarily, and/or
- clean this up through a later migration or debug utility

But the user-facing product should document and assume exactly one profile.

## Legacy / migration note

This addendum applies going forward. Existing local development data may still contain multiple profiles from the old spec.

That does not require an immediate migration PR, but the implementation should be defensive:
- onboarding should only create one profile
- dashboard/settings should operate on a single resolved profile
- partner-management UI should be removed

A cleanup migration can be considered later if old local test data becomes a practical issue.

## Implementation checklist

### PR2

- Remove partner-name input from Welcome step
- Remove required name field from onboarding
- Collapse onboarding to one profile draft
- Remove dual-user loop logic
- Save exactly one `UserProfile`
- Update tests and documentation

### PR3

- Remove profile switcher UI
- Remove `activeUserId` app-storage dependency from dashboard flow
- Simplify `DashboardViewModel.loadToday(...)` to single-profile resolution
- Update tests and documentation

### PR8

- Remove partner add/remove flow
- Add optional display-name field to Settings profile section
- Update settings copy to reflect single local user
- Update tests and documentation

## Suggested acceptance criteria for the addendum

- CalSnap behaves as a single-user app from onboarding through settings
- Onboarding does not require a user name
- The app persists exactly one profile in normal operation
- The dashboard contains no profile-switching UI
- Settings allow editing an optional display name
- No product copy suggests a partner or dual-user flow

## Why this is the right simplification

This change removes product and engineering complexity that no longer serves the app:
- fewer onboarding branches
- simpler dashboard state
- simpler settings architecture
- less confusing positioning for real users
- cleaner alignment with a local-only iPhone app

It keeps the useful part of `UserProfile` — storing the one person’s biometrics, targets, and preferences — while dropping the unnecessary shared-device model.
