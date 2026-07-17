# PR Gemini Retry: Harden Gemini API calls with retry and safety settings

**Status:** Ready for testing
**Sprint:** Reliability hardening
**Depends on:** None — standalone fix
**Scope:** Web only (`calsnap-web/`)

---

## 1. Problem

During a trial run, the Gemini API failed 3 consecutive times on the same image before succeeding on the 4th attempt (user-initiated retry each time). Root causes:

1. **Safety filter false positives** — No `safetySettings` were sent, so Gemini's default safety filters could non-deterministically block food photo responses (`finishReason: "SAFETY"` → empty content → error)
2. **No automatic retry** — Both `analyzeMealImage()` and `generateAnalyticsInsight()` made a single API call. The only retry was user-initiated via the "Retry" button.
3. **No production logging** — `console.error` calls were gated behind `NODE_ENV === 'development'`, making failures invisible in production.

---

## 2. Changes

### New: `calsnap-web/lib/gemini/retry.ts`

Shared `withRetry()` helper:
- 3 attempts max, exponential backoff (1s → 2s → 4s + random jitter)
- Caller-provided `shouldRetry(error)` predicate controls what's retryable
- Logs every retry attempt and final failure via `console.error`

### Modified: `calsnap-web/lib/gemini/analyze-meal.ts`

- Added `safetySettings` with all 4 harm categories set to `BLOCK_NONE` — eliminates Gemini safety filters falsely blocking food photos
- Wrapped `generateContent()` in `withRetry()` — transient failures auto-retry
- Added explicit `finishReason === 'SAFETY'` detection with new `safetyBlocked` error code
- Removed `NODE_ENV` guard on `console.error` — always logs in production
- `getGeminiClient()` and prompt building moved outside retry loop (no wasted retries on config errors)

### Modified: `calsnap-web/lib/gemini/generate-insight.ts`

- Added same `safetySettings` to `generateContent()`
- Wrapped in `withRetry()` with retry on empty response and network errors
- Always-on logging

---

## 3. Retry behavior

| Error | Retried? | Why |
|-------|----------|-----|
| Empty response | Yes | Transient — model may return content on retry |
| Invalid JSON | Yes | Transient — model sometimes wraps JSON in text |
| Safety block (`finishReason: "SAFETY"`) | Yes | Non-deterministic — safety scoring varies per call |
| Network error / timeout | Yes | Transient infrastructure issue |
| Rate limit (429) | Yes | Transient — backoff resolves it |
| Server error (500/503) | Yes | Transient |
| Invalid API key / auth failure | **No** | Config error — won't self-resolve |
| Schema validation failure | **No** | Structural mismatch — retrying same input won't fix it |
| Missing `GEMINI_API_KEY` | **No** | Config error — fails immediately outside retry loop |

---

## 4. Files changed

**New**

- `calsnap-web/lib/gemini/retry.ts`

**Modified**

- `calsnap-web/lib/gemini/analyze-meal.ts`
- `calsnap-web/lib/gemini/generate-insight.ts`

**Unchanged** (no changes needed)

- `calsnap-web/app/api/analyze-meal/route.ts` — error mapping already handles new codes via fallback
- `calsnap-web/app/api/generate-insight/route.ts` — same
- `calsnap-web/lib/scanner/use-meal-scanner.ts` — retries are server-side, transparent to client

---

## 5. Acceptance criteria

- [ ] Same photo analyzed 3x consecutively — no user-visible errors
- [ ] Safety-blocked response retries automatically (check server logs for `[analyzeMeal] attempt 1/3 failed, retrying`)
- [ ] Invalid API key fails immediately (no retry delay)
- [ ] Missing `GEMINI_API_KEY` fails immediately
- [ ] Rate-limited response retries with backoff
- [ ] Server logs show `[analyzeMeal] succeeded on attempt 2` for retried calls
- [ ] `generateInsight` retries on empty response
- [ ] No changes to error banner UX — same error messages for end users
- [ ] `pnpm lint` passes
- [ ] `npx tsc --noEmit` passes (no new errors in modified files)

---

## 6. Testing notes

**Manual test — retry behavior:**
1. Deploy to Vercel preview
2. Analyze a meal photo — check server logs for attempt tracking
3. If safety block occurs naturally, logs will show `[analyzeMeal] attempt 1/3 failed, retrying in Xms`
4. Analyze same photo again — should succeed without user-visible errors

**Manual test — auth failure (no retry):**
1. Temporarily set `GEMINI_API_KEY` to an invalid value
2. Attempt analysis — should fail immediately with no retry delay
3. Check logs: `[analyzeMeal] failed after 1 attempts` (not 3)

**Automated:**
- `pnpm lint` — 0 new errors
- `npx tsc --noEmit` — 0 new errors in modified files
