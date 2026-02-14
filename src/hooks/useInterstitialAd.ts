import { useEffect, useState, useCallback, useRef } from 'react';
import {
  InterstitialAd,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { ADMOB_CONFIG } from '../config/monetization';
import { useIsPremium } from '../store/useSubscriptionStore';

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

  useEffect(() => {
    // Don't load ads for premium users
    if (isPremium) {
      return;
    }

    const interstitial = InterstitialAd.createForAdRequest(
      ADMOB_CONFIG.interstitialAdUnitId,
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
        if (onCompleteRef.current) {
          onCompleteRef.current();
          onCompleteRef.current = null;
        }

        // Reload the ad for next time
        interstitial.load();
      }
    );

    const unsubscribeError = interstitial.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.log('Interstitial ad error:', error);
        setIsLoaded(false);

        // Call completion callback even on error
        if (onCompleteRef.current) {
          onCompleteRef.current();
          onCompleteRef.current = null;
        }
      }
    );

    // Load the initial ad
    interstitial.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, [isPremium]);

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
        adRef.current.show();
      } else {
        // If ad isn't loaded, just call complete callback
        onComplete?.();
      }
    },
    [isPremium, isLoaded]
  );

  return {
    isLoaded,
    isShowing,
    showAd,
  };
}
