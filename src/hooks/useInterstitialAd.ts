import { useEffect, useState, useCallback, useRef } from 'react';
import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { ADMOB_CONFIG } from '../config/monetization';
import { useIsPremium } from '../store/useSubscriptionStore';

// Use test ads in development
const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : ADMOB_CONFIG.interstitialAdUnitId;

// Safety timeout in case ad gets stuck (30 seconds)
const AD_TIMEOUT_MS = 30000;

interface UseInterstitialAdReturn {
  isLoaded: boolean;
  isShowing: boolean;
  showAd: (onComplete?: () => void) => void;
}

export function useInterstitialAd(): UseInterstitialAdReturn {
  const isPremium = useIsPremium();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isShowing, setIsShowing] = useState(false);
  const adRef = useRef<InterstitialAd | null>(null);
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
    // Don't load ads for premium users
    if (isPremium) {
      return;
    }

    const interstitial = InterstitialAd.createForAdRequest(
      adUnitId,
      {
        requestNonPersonalizedAdsOnly: true,
      }
    );

    adRef.current = interstitial;

    const unsubscribeLoaded = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        setIsLoaded(true);
      }
    );

    const unsubscribeClosed = interstitial.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        setIsShowing(false);
        setIsLoaded(false);

        // Call the completion callback
        callComplete();

        // Reload the ad for next time
        interstitial.load();
      }
    );

    const unsubscribeError = interstitial.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.log('Interstitial ad error:', error);
        setIsShowing(false);
        setIsLoaded(false);

        // Call completion callback even on error
        callComplete();

        // Try to reload the ad
        setTimeout(() => {
          interstitial.load();
        }, 1000);
      }
    );

    // Load the initial ad
    interstitial.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
      // Clear any pending timeout on cleanup
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPremium, callComplete]);

  const showAd = useCallback(
    (onComplete?: () => void) => {
      // Premium users skip ads
      if (isPremium) {
        onComplete?.();
        return;
      }

      // Store the completion callback
      onCompleteRef.current = onComplete || null;

      if (isLoaded && adRef.current) {
        setIsShowing(true);

        // Set a safety timeout in case the ad gets stuck
        timeoutRef.current = setTimeout(() => {
          console.log('Interstitial ad timeout - forcing completion');
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
    [isPremium, isLoaded, callComplete]
  );

  return {
    isLoaded,
    isShowing,
    showAd,
  };
}
