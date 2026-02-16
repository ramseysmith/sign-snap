import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { FREE_TIER_LIMITS } from '../config/monetization';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, ANIMATION } from '../utils/constants';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UpgradePromptProps {
  documentsSignedCount: number;
  additionalCredits?: number;
  adsWatched?: number;
  variant?: 'banner' | 'card' | 'limit-reached';
  onUpgrade?: () => void;
  onWatchAds?: () => void;
}

interface AnimatedButtonProps {
  onPress: () => void;
  style: any;
  children: React.ReactNode;
  accessibilityLabel: string;
  accessibilityHint?: string;
}

function AnimatedButton({ onPress, style, children, accessibilityLabel, accessibilityHint }: AnimatedButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, ANIMATION.springBouncy);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, ANIMATION.springBouncy);
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [onPress]);

  return (
    <AnimatedPressable
      style={[style, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      {children}
    </AnimatedPressable>
  );
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

  const handleUpgradePress = useCallback(() => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigation.navigate('Paywall');
    }
  }, [onUpgrade, navigation]);

  // Limit reached variant - shows both options
  if (variant === 'limit-reached') {
    return (
      <Animated.View
        style={styles.limitContainer}
        entering={FadeInDown.springify()}
      >
        <View style={styles.limitHeader}>
          <View style={styles.limitIconContainer}>
            <Text style={styles.limitIcon}>📄</Text>
          </View>
          <Text style={styles.limitTitle} accessibilityRole="header">
            Document Limit Reached
          </Text>
        </View>
        <Text style={styles.limitDescription}>
          You've used your {maxAllowed} free document signings. Choose how to continue:
        </Text>

        <AnimatedButton
          style={styles.upgradeButton}
          onPress={handleUpgradePress}
          accessibilityLabel="Upgrade to Premium"
          accessibilityHint="Opens the premium subscription options"
        >
          <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          <Text style={styles.upgradeButtonSubtext}>Unlimited documents, no ads</Text>
        </AnimatedButton>

        <View style={styles.dividerRow} accessibilityElementsHidden>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <AnimatedButton
          style={styles.watchAdsButton}
          onPress={onWatchAds || (() => {})}
          accessibilityLabel={`Watch ${adsWatched > 0 ? adsUntilNextCredit : adsPerCredit} ads for one more document`}
          accessibilityHint="Watch rewarded ads to earn additional document signing credits"
        >
          <Text style={styles.watchAdsButtonText}>Watch Ads for More Documents</Text>
          <Text style={styles.watchAdsButtonSubtext}>
            {adsWatched > 0
              ? `${adsUntilNextCredit} more ad${adsUntilNextCredit !== 1 ? 's' : ''} = 1 document`
              : `${adsPerCredit} ads = 1 document signing`}
          </Text>
        </AnimatedButton>

        {adsWatched > 0 && (
          <Animated.View
            style={styles.progressContainer}
            entering={FadeInDown.delay(100).springify()}
          >
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(adsWatched / adsPerCredit) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {adsWatched}/{adsPerCredit} ads watched
            </Text>
          </Animated.View>
        )}
      </Animated.View>
    );
  }

  if (variant === 'card') {
    return (
      <Animated.View
        style={styles.cardContainer}
        entering={FadeInDown.springify()}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} accessibilityRole="header">
            {isAtLimit ? 'Document Limit Reached' : 'Free Plan'}
          </Text>
          <View style={[styles.countBadge, isAtLimit && styles.countBadgeLimit]}>
            <Text
              style={styles.countBadgeText}
              accessibilityLabel={`${totalRemaining} documents remaining`}
            >
              {totalRemaining} left
            </Text>
          </View>
        </View>
        <Text style={styles.cardDescription}>
          {isAtLimit
            ? `You've used your ${maxAllowed} free document signings. Upgrade or watch ads for more.`
            : `You have ${totalRemaining} document signing${totalRemaining !== 1 ? 's' : ''} remaining.`}
        </Text>
        <AnimatedButton
          style={styles.upgradeCardButton}
          onPress={handleUpgradePress}
          accessibilityLabel="Upgrade to Premium"
          accessibilityHint="Opens the premium subscription options"
        >
          <Text style={styles.upgradeCardButtonText}>Upgrade to Premium</Text>
        </AnimatedButton>
      </Animated.View>
    );
  }

  // Banner variant
  const bannerScale = useSharedValue(1);

  const bannerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bannerScale.value }],
  }));

  const handleBannerPressIn = useCallback(() => {
    bannerScale.value = withSpring(0.98, ANIMATION.springBouncy);
  }, [bannerScale]);

  const handleBannerPressOut = useCallback(() => {
    bannerScale.value = withSpring(1, ANIMATION.springBouncy);
  }, [bannerScale]);

  const handleBannerPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleUpgradePress();
  }, [handleUpgradePress]);

  return (
    <AnimatedPressable
      style={[
        styles.bannerContainer,
        isAtLimit && styles.bannerContainerLimit,
        bannerAnimatedStyle,
      ]}
      onPress={handleBannerPress}
      onPressIn={handleBannerPressIn}
      onPressOut={handleBannerPressOut}
      accessibilityRole="button"
      accessibilityLabel={isAtLimit ? 'Document limit reached, upgrade for unlimited' : `Free plan: ${totalRemaining} documents left`}
      accessibilityHint="Tap to view premium upgrade options"
    >
      <View style={styles.bannerContent}>
        <Text style={[styles.bannerText, isAtLimit && styles.bannerTextLimit]}>
          {isAtLimit
            ? `Limit reached - Upgrade for unlimited`
            : `Free: ${totalRemaining} document${totalRemaining !== 1 ? 's' : ''} left`}
        </Text>
        <View style={styles.bannerActionContainer}>
          <Text style={styles.bannerAction}>Upgrade</Text>
          <Text style={styles.bannerArrow}>→</Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  // Banner styles
  bannerContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  bannerContainerLimit: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primary,
    ...SHADOWS.glow,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  bannerTextLimit: {
    color: COLORS.text,
  },
  bannerActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  bannerAction: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.primary,
  },
  bannerArrow: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },

  // Card styles
  cardContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  countBadge: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  countBadgeLimit: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primary,
  },
  countBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
  cardDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  upgradeCardButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
    ...SHADOWS.md,
    shadowColor: COLORS.primary,
  },
  upgradeCardButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Limit reached styles
  limitContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.glow,
  },
  limitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  limitIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  limitIcon: {
    fontSize: 24,
  },
  limitTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
  },
  limitDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  upgradeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
    ...SHADOWS.md,
    shadowColor: COLORS.primary,
  },
  upgradeButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  upgradeButtonSubtext: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginHorizontal: SPACING.lg,
  },
  watchAdsButton: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    minHeight: 56,
    justifyContent: 'center',
  },
  watchAdsButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  watchAdsButtonSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  progressContainer: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    fontWeight: '500',
  },
});
