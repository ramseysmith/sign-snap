import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useSignatureStore } from '../store/useSignatureStore';
import { useIsPremium } from '../store/useSubscriptionStore';
import { FREE_TIER_LIMITS } from '../config/monetization';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UseSignatureLimitReturn {
  /** Whether the user can add a new signature */
  canAddSignature: boolean;
  /** Current number of saved signatures */
  currentCount: number;
  /** Maximum allowed signatures (free tier) */
  maxSignatures: number;
  /** Remaining signature slots */
  remainingSlots: number;
  /** Whether user has reached the limit */
  isAtLimit: boolean;
  /** Whether user is premium */
  isPremium: boolean;
  /**
   * Check limit and proceed with callback, or show upgrade prompt
   * @param callback Function to call if user can proceed
   */
  checkAndProceed: (callback: () => void) => void;
  /** Show upgrade prompt alert */
  showUpgradePrompt: () => void;
}

export function useSignatureLimit(): UseSignatureLimitReturn {
  const navigation = useNavigation<NavigationProp>();
  const { savedSignatures } = useSignatureStore();
  const isPremium = useIsPremium();

  const currentCount = savedSignatures.length;
  const maxSignatures = FREE_TIER_LIMITS.maxSavedSignatures;
  const remainingSlots = Math.max(0, maxSignatures - currentCount);
  const isAtLimit = !isPremium && currentCount >= maxSignatures;
  const canAddSignature = isPremium || currentCount < maxSignatures;

  const showUpgradePrompt = useCallback(() => {
    Alert.alert(
      'Signature Limit Reached',
      `You've saved ${maxSignatures} signatures on the free plan. Upgrade to Premium for unlimited signatures and an ad-free experience.`,
      [
        {
          text: 'Not Now',
          style: 'cancel',
        },
        {
          text: 'Upgrade Now',
          onPress: () => navigation.navigate('Paywall'),
        },
      ]
    );
  }, [navigation, maxSignatures]);

  const checkAndProceed = useCallback(
    (callback: () => void) => {
      if (canAddSignature) {
        callback();
      } else {
        showUpgradePrompt();
      }
    },
    [canAddSignature, showUpgradePrompt]
  );

  return {
    canAddSignature,
    currentCount,
    maxSignatures,
    remainingSlots,
    isAtLimit,
    isPremium,
    checkAndProceed,
    showUpgradePrompt,
  };
}
