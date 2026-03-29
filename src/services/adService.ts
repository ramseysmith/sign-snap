import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';
import { USE_TEST_ADS } from '../utils/buildConfig';

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

      // Test device IDs — always includes known test devices; also adds EMULATOR in non-production builds
      testDeviceIdentifiers: [
        'ACE862E9-099A-4B0B-A553-7D075641C3CF', // personal test device
        ...(USE_TEST_ADS ? ['EMULATOR'] : []),
      ],
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
