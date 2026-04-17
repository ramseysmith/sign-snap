import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { useSubscriptionStore } from '../store/useSubscriptionStore';

const STORAGE_KEY = 'signsnap.reviewPrompt.v1';
const MIN_EXPORTS = 3;
const MIN_DAYS_BETWEEN_PROMPTS = 60;
const MAX_PROMPTS_PER_365_DAYS = 3;
const MS_PER_DAY = 86_400_000;

interface ReviewPromptState {
  totalExports: number;
  lastPromptAt: number | null;
  promptTimestamps: number[];
}

async function loadState(): Promise<ReviewPromptState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { totalExports: 0, lastPromptAt: null, promptTimestamps: [] };
}

async function saveState(state: ReviewPromptState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export async function resetReviewPromptState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function useReviewPrompt() {
  const { isPremium, documentsSignedCount } = useSubscriptionStore();

  const maybeRequestReview = useCallback(
    async ({ exportSucceeded }: { exportSucceeded: boolean }) => {
      if (!exportSucceeded) return;

      try {
        const state = await loadState();

        // Increment export count before evaluating
        const newTotalExports = state.totalExports + 1;
        await saveState({ ...state, totalExports: newTotalExports });

        if (newTotalExports < MIN_EXPORTS) return;

        const now = Date.now();

        // 60-day cooldown since last prompt
        if (
          state.lastPromptAt !== null &&
          now - state.lastPromptAt < MIN_DAYS_BETWEEN_PROMPTS * MS_PER_DAY
        ) {
          return;
        }

        // Max 3 prompts in the last 365 days
        const cutoff365 = now - 365 * MS_PER_DAY;
        const recentPrompts = (state.promptTimestamps ?? []).filter(
          (t) => t > cutoff365
        );
        if (recentPrompts.length >= MAX_PROMPTS_PER_365_DAYS) return;

        // Avoid prompting a first-time free user who just hit the paywall.
        // Gate: must be premium OR have at least MIN_EXPORTS completed exports
        // (meaning they've gotten value, not just hit the limit once).
        if (!isPremium && documentsSignedCount < MIN_EXPORTS) return;

        const isAvailable = await StoreReview.isAvailableAsync();
        if (!isAvailable) return;

        const hasAction = await StoreReview.hasAction();
        if (!hasAction) return;

        await StoreReview.requestReview();

        const updatedState = await loadState();
        await saveState({
          ...updatedState,
          lastPromptAt: now,
          promptTimestamps: [...(updatedState.promptTimestamps ?? []), now],
        });
      } catch (error) {
        console.log('[useReviewPrompt] silent error:', error);
      }
    },
    [isPremium, documentsSignedCount]
  );

  return { maybeRequestReview };
}
