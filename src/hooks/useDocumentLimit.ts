import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useSubscriptionStore, useIsPremium } from '../store/useSubscriptionStore';
import { FREE_TIER_LIMITS } from '../config/monetization';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UseDocumentLimitReturn {
  /** Whether the user can sign a document */
  canSignDocument: boolean;
  /** Number of documents signed */
  documentsSignedCount: number;
  /** Maximum allowed document signings (free tier) */
  maxDocuments: number;
  /** Remaining document signings */
  remainingSignings: number;
  /** Additional credits from rewarded ads */
  additionalCredits: number;
  /** Number of rewarded ads watched towards next credit */
  rewardedAdsWatched: number;
  /** Ads needed for next credit */
  adsNeededForNextCredit: number;
  /** Whether user has reached the limit */
  isAtLimit: boolean;
  /** Whether user is premium */
  isPremium: boolean;
  /** Increment documents signed count */
  incrementDocumentsSigned: () => void;
  /** Use a document credit (returns true if successful) */
  useDocumentCredit: () => boolean;
  /**
   * Check document limit and proceed with callback, or show options
   * @param callback Function to call if user can proceed
   */
  checkAndProceed: (callback: () => void) => void;
  /** Show upgrade/rewarded ad options */
  showLimitOptions: (onWatchAds?: () => void) => void;
}

export function useDocumentLimit(): UseDocumentLimitReturn {
  const navigation = useNavigation<NavigationProp>();
  const isPremium = useIsPremium();
  const {
    documentsSignedCount,
    additionalDocumentCredits,
    rewardedAdsWatched,
    incrementDocumentsSigned,
    useDocumentCredit,
  } = useSubscriptionStore();

  const maxDocuments = FREE_TIER_LIMITS.maxDocumentSignings;
  const adsPerCredit = FREE_TIER_LIMITS.rewardedAdsPerDocument;

  // Calculate remaining signings (base + credits)
  const baseRemaining = Math.max(0, maxDocuments - documentsSignedCount);
  const remainingSignings = baseRemaining + additionalDocumentCredits;
  const isAtLimit = !isPremium && remainingSignings <= 0;
  const canSignDocument = isPremium || remainingSignings > 0;
  const adsNeededForNextCredit = adsPerCredit - rewardedAdsWatched;

  const showLimitOptions = useCallback(
    (onWatchAds?: () => void) => {
      Alert.alert(
        'Document Limit Reached',
        `You've used your ${maxDocuments} free document signings. Choose an option to continue:`,
        [
          {
            text: 'Watch Ads (5 ads = 1 document)',
            onPress: () => {
              if (onWatchAds) {
                onWatchAds();
              } else {
                // Navigate to a rewarded ad flow or show rewarded ad
                Alert.alert(
                  'Watch Rewarded Ads',
                  `Watch ${adsNeededForNextCredit} more ad${adsNeededForNextCredit !== 1 ? 's' : ''} to earn another document signing.`
                );
              }
            },
          },
          {
            text: 'Upgrade to Premium',
            onPress: () => navigation.navigate('Paywall'),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    },
    [navigation, maxDocuments, adsNeededForNextCredit]
  );

  const checkAndProceed = useCallback(
    (callback: () => void) => {
      if (canSignDocument) {
        callback();
      } else {
        showLimitOptions();
      }
    },
    [canSignDocument, showLimitOptions]
  );

  return {
    canSignDocument,
    documentsSignedCount,
    maxDocuments,
    remainingSignings,
    additionalCredits: additionalDocumentCredits,
    rewardedAdsWatched,
    adsNeededForNextCredit,
    isAtLimit,
    isPremium,
    incrementDocumentsSigned,
    useDocumentCredit,
    checkAndProceed,
    showLimitOptions,
  };
}
