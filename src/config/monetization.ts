import { Platform } from 'react-native';

// RevenueCat Configuration
export const REVENUECAT_CONFIG = {
  apiKey: Platform.select({
    ios: 'test_twKLQWNtCZOtmiEAPZhzQyKfwON',
    android: 'test_twKLQWNtCZOtmiEAPZhzQyKfwON',
    default: 'test_twKLQWNtCZOtmiEAPZhzQyKfwON',
  }) as string,
  entitlementId: 'SignSnap Premium',
  offeringId: 'default',
};

// RevenueCat Product Identifiers
export const PRODUCT_IDS = {
  weekly: 'signsnap_premium_weekly',
  monthly: 'signsnap_premium_monthly',
  yearly: 'signsnap_premium_yearly',
} as const;

// AdMob Configuration
export const ADMOB_CONFIG = {
  // App IDs
  appId: Platform.select({
    ios: 'ca-app-pub-8327362355420246~7021937717',
    android: 'ca-app-pub-8327362355420246~7021937717',
    default: 'ca-app-pub-8327362355420246~7021937717',
  }) as string,

  // Banner Ad Unit IDs
  bannerAdUnitId: Platform.select({
    ios: 'ca-app-pub-8327362355420246/9512369685',
    android: 'ca-app-pub-8327362355420246/9512369685',
    default: 'ca-app-pub-8327362355420246/9512369685',
  }) as string,

  // Interstitial Ad Unit IDs
  interstitialAdUnitId: Platform.select({
    ios: 'ca-app-pub-8327362355420246/8199288012',
    android: 'ca-app-pub-8327362355420246/8199288012',
    default: 'ca-app-pub-8327362355420246/8199288012',
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
