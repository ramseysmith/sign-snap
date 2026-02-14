import { Platform } from 'react-native';

// RevenueCat Configuration
// Replace these with your actual RevenueCat API keys from the dashboard
export const REVENUECAT_CONFIG = {
  apiKey: Platform.select({
    ios: 'YOUR_REVENUECAT_IOS_API_KEY',
    android: 'YOUR_REVENUECAT_ANDROID_API_KEY',
    default: 'YOUR_REVENUECAT_IOS_API_KEY',
  }) as string,
  entitlementId: 'premium',
  offeringId: 'default',
};

// RevenueCat Product Identifiers
export const PRODUCT_IDS = {
  weekly: 'signsnap_premium_weekly',
  monthly: 'signsnap_premium_monthly',
  yearly: 'signsnap_premium_yearly',
} as const;

// AdMob Configuration
// Replace these with your actual AdMob IDs from the dashboard
export const ADMOB_CONFIG = {
  // App IDs (configured in app.json)
  appId: Platform.select({
    ios: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX',
    android: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX',
    default: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX',
  }) as string,

  // Banner Ad Unit IDs
  bannerAdUnitId: Platform.select({
    ios: 'ca-app-pub-3940256099942544/2934735716', // Test ID
    android: 'ca-app-pub-3940256099942544/6300978111', // Test ID
    default: 'ca-app-pub-3940256099942544/6300978111',
  }) as string,

  // Interstitial Ad Unit IDs
  interstitialAdUnitId: Platform.select({
    ios: 'ca-app-pub-3940256099942544/4411468910', // Test ID
    android: 'ca-app-pub-3940256099942544/1033173712', // Test ID
    default: 'ca-app-pub-3940256099942544/1033173712',
  }) as string,
};

// Free Tier Limits
export const FREE_TIER_LIMITS = {
  maxSavedSignatures: 2,
  showAds: true,
};

// Premium Benefits
export const PREMIUM_BENEFITS = [
  {
    icon: 'unlimited',
    title: 'Unlimited Signatures',
    description: 'Save as many signatures as you need',
  },
  {
    icon: 'no-ads',
    title: 'Ad-Free Experience',
    description: 'No more interruptions while signing',
  },
  {
    icon: 'priority',
    title: 'Priority Support',
    description: 'Get help faster when you need it',
  },
] as const;

// Subscription Plans Display Info
export const SUBSCRIPTION_PLANS = {
  weekly: {
    id: PRODUCT_IDS.weekly,
    title: 'Weekly',
    badge: null,
    savings: null,
  },
  monthly: {
    id: PRODUCT_IDS.monthly,
    title: 'Monthly',
    badge: 'Popular',
    savings: 'Save 50%',
  },
  yearly: {
    id: PRODUCT_IDS.yearly,
    title: 'Yearly',
    badge: 'Best Value',
    savings: 'Save 75%',
  },
} as const;

export type SubscriptionPlanType = keyof typeof SUBSCRIPTION_PLANS;
