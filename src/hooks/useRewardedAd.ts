import { useEffect, useState, useCallback, useRef } from 'react';
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { ADMOB_CONFIG } from '../config/monetization';
import { useSubscriptionStore, useIsPremium } from '../store/useSubscriptionStore';

// Use test ads in development
const adUnitId = __DEV__ ? TestIds.REWARDED : ADMOB_CONFIG.rewardedAdUnitId;

// Safety timeout in case ad gets stuck (45 seconds for rewarded - they're longer)
const AD_TIMEOUT_MS = 45000;

interface UseRewardedAdReturn {
  isLoaded: boolean;
  isShowing: boolean;
  /** Show a rewarded ad. Returns true if ad was shown, false otherwise. */
  showRewardedAd: (onRewarded?: () => void, onComplete?: () => void) => void;
  /** Number of ads watched towards next credit */
  adsWatched: number;
  /** Ads remaining until next document credit */
  adsUntilCredit: number;
}

export function useRewardedAd(): UseRewardedAdReturn {
  const isPremium = useIsPremium();
  const { addRewardedAdWatch, rewardedAdsWatched } = useSubscriptionStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isShowing, setIsShowing] = useState(false);
  const adRef = useRef<RewardedAd | null>(null);
  const onRewardedRef = useRef<(() => void) | null>(null);
  const onCompleteRef = useRef<(() => void) | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper to safely call and clear the completion callback
  const callComplete = useCallback(() => {
    // Clear timeout if it exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (onCompleteRef.current) {
      const callback = onCompleteRef.current;
      onCompleteRef.current = null;
      callback();
    }
  }, []);

  useEffect(() => {
    // Premium users don't need rewarded ads
    if (isPremium) {
      return;
    }

    const rewarded = RewardedAd.createForAdRequest(
      adUnitId,
      {
        requestNonPersonalizedAdsOnly: true,
      }
    );

    adRef.current = rewarded;

    const unsubscribeLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        setIsLoaded(true);
      }
    );

    const unsubscribeEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        // User earned the reward
        addRewardedAdWatch();
        if (onRewardedRef.current) {
          onRewardedRef.current();
          onRewardedRef.current = null;
        }
      }
    );

    const unsubscribeClosed = rewarded.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        setIsShowing(false);
        setIsLoaded(false);

        // Call the completion callback
        callComplete();

        // Reload the ad for next time
        rewarded.load();
      }
    );

    const unsubscribeError = rewarded.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.log('Rewarded ad error:', error);
        setIsShowing(false);
        setIsLoaded(false);

        // Call completion callback on error
        callComplete();

        // Try to reload the ad
        setTimeout(() => {
          rewarded.load();
        }, 1000);
      }
    );

    // Load the initial ad
    rewarded.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeError();
      // Clear any pending timeout on cleanup
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPremium, addRewardedAdWatch, callComplete]);

  const showRewardedAd = useCallback(
    (onRewarded?: () => void, onComplete?: () => void) => {
      // Store callbacks
      onRewardedRef.current = onRewarded || null;
      onCompleteRef.current = onComplete || null;

      if (isLoaded && adRef.current) {
        setIsShowing(true);

        // Set a safety timeout in case the ad gets stuck
        timeoutRef.current = setTimeout(() => {
          console.log('Rewarded ad timeout - forcing completion');
          setIsShowing(false);
          setIsLoaded(false);
          callComplete();

          // Try to reload ad for next time
          if (adRef.current) {
            adRef.current.load();
          }
        }, AD_TIMEOUT_MS);

        adRef.current.show();
      } else {
        // If ad isn't loaded, just call complete callback
        onComplete?.();
      }
    },
    [isLoaded, callComplete]
  );

  return {
    isLoaded,
    isShowing,
    showRewardedAd,
    adsWatched: rewardedAdsWatched,
    adsUntilCredit: 5 - rewardedAdsWatched,
  };
}
