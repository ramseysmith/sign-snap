import { useEffect, useState, useCallback, useRef } from 'react';
import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { ADMOB_CONFIG } from '../config/monetization';
import { useIsPremium } from '../store/useSubscriptionStore';
import { USE_TEST_ADS } from '../utils/buildConfig';

const adUnitId = USE_TEST_ADS ? TestIds.INTERSTITIAL : ADMOB_CONFIG.interstitialAdUnitId;

// Safety timeout in case ad gets stuck (30 seconds)
const AD_TIMEOUT_MS = 30000;

interface UseInterstitialAdReturn {
  isLoaded: boolean;
  isShowing: boolean;
  isLoading: boolean;
  error: string | null;
  showAd: (onComplete?: () => void) => void;
  /** Retry loading the ad */
  retryLoad: () => void;
}

export function useInterstitialAd(): UseInterstitialAdReturn {
  const isPremium = useIsPremium();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isShowing, setIsShowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const adRef = useRef<InterstitialAd | null>(null);
  const onCompleteRef = useRef<(() => void) | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

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
        setIsLoading(false);
        setError(null);
        retryCountRef.current = 0;
      }
    );

    const unsubscribeClosed = interstitial.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        setIsShowing(false);
        setIsLoaded(false);
        setIsLoading(true);

        // Call the completion callback
        callComplete();

        // Reload the ad for next time
        interstitial.load();
      }
    );

    const unsubscribeError = interstitial.addAdEventListener(
      AdEventType.ERROR,
      (adError: any) => {
        console.log('Interstitial ad error:', adError);
        setIsShowing(false);
        setIsLoaded(false);
        setIsLoading(false);

        // Call completion callback even on error
        callComplete();

        // Handle no-fill errors with retry logic
        const isNoFill = adError?.message?.includes('no-fill') || adError?.code === 'no-fill';

        if (isNoFill && retryCountRef.current < maxRetries) {
          retryCountRef.current += 1;
          const retryDelay = Math.min(2000 * retryCountRef.current, 10000);
          console.log(`Retrying interstitial ad load in ${retryDelay}ms (attempt ${retryCountRef.current}/${maxRetries})`);
          setIsLoading(true);
          setTimeout(() => {
            interstitial.load();
          }, retryDelay);
        } else if (isNoFill) {
          setError('No ads available right now. Please try again later.');
        } else {
          setError('Failed to load ad. Please try again.');
          // Try to reload after a delay for non-no-fill errors
          setTimeout(() => {
            setIsLoading(true);
            interstitial.load();
          }, 3000);
        }
      }
    );

    // Load the initial ad
    setIsLoading(true);
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
        setError(null);

        // Set a safety timeout in case the ad gets stuck
        timeoutRef.current = setTimeout(() => {
          console.log('Interstitial ad timeout - forcing completion');
          setIsShowing(false);
          setIsLoaded(false);
          callComplete();

          // Try to reload ad for next time
          if (adRef.current) {
            setIsLoading(true);
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

  const retryLoad = useCallback(() => {
    if (adRef.current && !isLoading && !isLoaded) {
      setError(null);
      setIsLoading(true);
      retryCountRef.current = 0;
      adRef.current.load();
    }
  }, [isLoading, isLoaded]);

  return {
    isLoaded,
    isShowing,
    isLoading,
    error,
    showAd,
    retryLoad,
  };
}
