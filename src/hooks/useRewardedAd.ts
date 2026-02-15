import { useEffect, useState, useCallback, useRef } from 'react';
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { ADMOB_CONFIG } from '../config/monetization';
import { useSubscriptionStore, useIsPremium } from '../store/useSubscriptionStore';

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

  useEffect(() => {
    // Premium users don't need rewarded ads
    if (isPremium) {
      return;
    }

    const rewarded = RewardedAd.createForAdRequest(
      ADMOB_CONFIG.rewardedAdUnitId,
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
        if (onCompleteRef.current) {
          onCompleteRef.current();
          onCompleteRef.current = null;
        }

        // Reload the ad for next time
        rewarded.load();
      }
    );

    const unsubscribeError = rewarded.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.log('Rewarded ad error:', error);
        setIsLoaded(false);

        // Call completion callback on error
        if (onCompleteRef.current) {
          onCompleteRef.current();
          onCompleteRef.current = null;
        }
      }
    );

    // Load the initial ad
    rewarded.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, [isPremium, addRewardedAdWatch]);

  const showRewardedAd = useCallback(
    (onRewarded?: () => void, onComplete?: () => void) => {
      // Store callbacks
      onRewardedRef.current = onRewarded || null;
      onCompleteRef.current = onComplete || null;

      if (isLoaded && adRef.current) {
        setIsShowing(true);
        adRef.current.show();
      } else {
        // If ad isn't loaded, just call complete callback
        onComplete?.();
      }
    },
    [isLoaded]
  );

  return {
    isLoaded,
    isShowing,
    showRewardedAd,
    adsWatched: rewardedAdsWatched,
    adsUntilCredit: 5 - rewardedAdsWatched,
  };
}
