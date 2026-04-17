# SignSnap — Feature Specifications

## Review Prompt

**Goal:** Ask users to leave a 5-star review immediately after a successful document export — the clearest "I just got value" moment in the app.

### Library
`expo-store-review`

### Trigger Conditions (ALL must be true)
1. The current export succeeded without error.
2. The user has completed at least **3** successful document exports (tracked cumulatively in AsyncStorage under `signsnap.reviewPrompt.v1`).
3. At least **60 days** have passed since the last review prompt (or the user has never been prompted).
4. Fewer than **3** review prompts have been shown in the last **365 days** (Apple policy cap).
5. The user is not a first-time free-tier user who just hit the paywall — guarded by: `isPremium === true` OR `documentsSignedCount >= 3`. This ensures the prompt never appears right after a friction/upgrade moment.
6. `StoreReview.isAvailableAsync()` returns `true`.
7. `StoreReview.hasAction()` returns `true`.

### Paywall Exclusion Rule
The review prompt **must never appear** on the Paywall screen or immediately after a purchase flow. Enforcement: the trigger fires only from the `FinalPreviewScreen` auto-save success path, which is never reached during or after a paywall interaction in the same session. Additionally, the free-tier guard (condition 5 above) prevents prompting users whose first exports brought them to the paywall.

### Timing
The native review sheet is shown **2 seconds** after the "Document Signed!" success banner appears, giving the user a moment to feel the win.

### Persistence (`signsnap.reviewPrompt.v1` AsyncStorage key)
```json
{
  "totalExports": 0,
  "lastPromptAt": null,
  "promptTimestamps": []
}
```

### Implementation
- Hook: `src/hooks/useReviewPrompt.ts`
  - Exports `useReviewPrompt()` → `{ maybeRequestReview({ exportSucceeded }) }`
  - Exports `resetReviewPromptState()` for dev tooling
- Integration: `FinalPreviewScreen` auto-save success path
- All errors are caught silently (`console.log` only)

### Developer Testing
A **"Reset Review Prompt State"** button is available in the Settings screen (Customer Center) under a `__DEV__`-only "Developer Tools" section. Tapping it clears the AsyncStorage key so the next export re-evaluates all conditions from scratch.
