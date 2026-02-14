import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';

let isInitialized = false;

/**
 * Initialize Google Mobile Ads SDK
 * Should be called once on app startup
 */
export async function initializeAds(): Promise<void> {
  if (isInitialized) {
    return;
  }

  try {
    // Configure ad settings
    await mobileAds().setRequestConfiguration({
      // Set max ad content rating
      maxAdContentRating: MaxAdContentRating.PG,

      // Enable tag for child-directed treatment if needed
      tagForChildDirectedTreatment: false,

      // Enable tag for users under age of consent if needed
      tagForUnderAgeOfConsent: false,

      // Test device IDs for development
      testDeviceIdentifiers: __DEV__ ? ['EMULATOR'] : [],
    });

    // Initialize the SDK
    await mobileAds().initialize();

    isInitialized = true;
    console.log('Mobile Ads SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Mobile Ads SDK:', error);
  }
}

/**
 * Check if ads are initialized
 */
export function isAdsInitialized(): boolean {
  return isInitialized;
}
