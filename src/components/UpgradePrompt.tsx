import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { FREE_TIER_LIMITS } from '../config/monetization';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../utils/constants';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UpgradePromptProps {
  documentsSignedCount: number;
  additionalCredits?: number;
  adsWatched?: number;
  variant?: 'banner' | 'card' | 'limit-reached';
  onUpgrade?: () => void;
  onWatchAds?: () => void;
}

export default function UpgradePrompt({
  documentsSignedCount,
  additionalCredits = 0,
  adsWatched = 0,
  variant = 'banner',
  onUpgrade,
  onWatchAds,
}: UpgradePromptProps) {
  const navigation = useNavigation<NavigationProp>();
  const maxAllowed = FREE_TIER_LIMITS.maxDocumentSignings;
  const adsPerCredit = FREE_TIER_LIMITS.rewardedAdsPerDocument;

  const baseRemaining = Math.max(0, maxAllowed - documentsSignedCount);
  const totalRemaining = baseRemaining + additionalCredits;
  const isAtLimit = totalRemaining <= 0;
  const adsUntilNextCredit = adsPerCredit - adsWatched;

  const handleUpgradePress = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigation.navigate('Paywall');
    }
  };

  // Limit reached variant - shows both options
  if (variant === 'limit-reached') {
    return (
      <View style={styles.limitContainer}>
        <View style={styles.limitHeader}>
          <Text style={styles.limitIcon}>📄</Text>
          <Text style={styles.limitTitle}>Document Limit Reached</Text>
        </View>
        <Text style={styles.limitDescription}>
          You've used your {maxAllowed} free document signings. Choose how to continue:
        </Text>

        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={handleUpgradePress}
          activeOpacity={0.7}
        >
          <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          <Text style={styles.upgradeButtonSubtext}>Unlimited documents, no ads</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.watchAdsButton}
          onPress={onWatchAds}
          activeOpacity={0.7}
        >
          <Text style={styles.watchAdsButtonText}>Watch Ads for More Documents</Text>
          <Text style={styles.watchAdsButtonSubtext}>
            {adsWatched > 0
              ? `${adsUntilNextCredit} more ad${adsUntilNextCredit !== 1 ? 's' : ''} = 1 document`
              : `${adsPerCredit} ads = 1 document signing`}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (variant === 'card') {
    return (
      <View style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            {isAtLimit ? 'Document Limit Reached' : 'Free Plan'}
          </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {totalRemaining} left
            </Text>
          </View>
        </View>
        <Text style={styles.cardDescription}>
          {isAtLimit
            ? `You've used your ${maxAllowed} free document signings. Upgrade or watch ads for more.`
            : `You have ${totalRemaining} document signing${totalRemaining !== 1 ? 's' : ''} remaining.`}
        </Text>
        <TouchableOpacity
          style={styles.upgradeCardButton}
          onPress={handleUpgradePress}
          activeOpacity={0.7}
        >
          <Text style={styles.upgradeCardButtonText}>Upgrade to Premium</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Banner variant
  return (
    <TouchableOpacity
      style={[styles.bannerContainer, isAtLimit && styles.bannerContainerLimit]}
      onPress={handleUpgradePress}
      activeOpacity={0.8}
    >
      <View style={styles.bannerContent}>
        <Text style={styles.bannerText}>
          {isAtLimit
            ? `Limit reached - Upgrade for unlimited`
            : `Free: ${totalRemaining} document${totalRemaining !== 1 ? 's' : ''} left`}
        </Text>
        <Text style={styles.bannerAction}>Upgrade</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Banner styles
  bannerContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bannerContainerLimit: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primary,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  bannerAction: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Card styles
  cardContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  countBadge: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  countBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  cardDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  upgradeCardButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  upgradeCardButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Limit reached styles
  limitContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  limitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  limitIcon: {
    fontSize: 24,
  },
  limitTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  limitDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  upgradeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  upgradeButtonSubtext: {
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginHorizontal: SPACING.md,
  },
  watchAdsButton: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  watchAdsButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  watchAdsButtonSubtext: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
