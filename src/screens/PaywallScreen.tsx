import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { PurchasesPackage } from 'react-native-purchases';
import { PaywallScreenProps } from '../types';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import {
  fetchAvailablePackages,
  purchasePackage,
  restorePurchases,
} from '../services/purchaseService';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, ANIMATION } from '../utils/constants';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BENEFITS = [
  {
    icon: '📄',
    title: 'Unlimited Document Signing',
    description: 'Sign as many documents as you need',
  },
  {
    icon: '🚫',
    title: 'No Advertisements',
    description: 'Enjoy a clean, distraction-free experience',
  },
  {
    icon: '⚡',
    title: 'Priority Support',
    description: 'Get help faster when you need it',
  },
];

interface BouncingEmojiProps {
  emoji: string;
  delay?: number;
  style?: any;
}

function BouncingEmoji({ emoji, delay = 0, style }: BouncingEmojiProps) {
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 400 }),
          withTiming(0, { duration: 400 })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.Text style={[style, animatedStyle]}>
      {emoji}
    </Animated.Text>
  );
}

interface PlanCardProps {
  pkg: PurchasesPackage;
  isSelected: boolean;
  onSelect: () => void;
  showShimmer?: boolean;
  info: {
    label: string;
    price: string;
    period: string;
    savings: string | null;
    badge: string | null;
  };
}

function PlanCard({ pkg, isSelected, onSelect, showShimmer, info }: PlanCardProps) {
  const scale = useSharedValue(1);
  const shimmerTranslate = useSharedValue(-150);

  React.useEffect(() => {
    if (showShimmer) {
      shimmerTranslate.value = withRepeat(
        withDelay(
          2500,
          withTiming(SCREEN_WIDTH, { duration: 1800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [showShimmer]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shimmerTranslate.value },
      { skewX: '-20deg' },
    ],
  }));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, ANIMATION.springBouncy);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, ANIMATION.springBouncy);
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect();
  }, [onSelect]);

  return (
    <View style={styles.planCardWrapper}>
      {info.badge && (
        <View style={[
          styles.planBadge,
          info.badge === 'Best Value' && styles.planBadgeBestValue,
          info.badge === 'Cheapest' && styles.planBadgeCheapest
        ]}>
          <Text style={styles.planBadgeText}>{info.badge}</Text>
        </View>
      )}
      <AnimatedPressable
        style={[
          styles.planCard,
          isSelected && styles.planCardSelected,
          showShimmer && styles.planCardShimmer,
          animatedStyle,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`${info.label} plan, ${info.price}${info.period}${info.savings ? `, ${info.savings}` : ''}`}
      >
        {showShimmer && (
          <AnimatedLinearGradient
            colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.planShimmer, shimmerStyle]}
          />
        )}

        <View style={styles.planInfo}>
          <Text style={[
            styles.planLabel,
            isSelected && styles.planLabelSelected
          ]}>
            {info.label}
          </Text>
          {info.savings && (
            <Text style={styles.planSavings}>{info.savings}</Text>
          )}
        </View>

        <View style={styles.planPriceContainer}>
          <Text style={[
            styles.planPrice,
            isSelected && styles.planPriceSelected
          ]}>
            {info.price}
          </Text>
          <Text style={styles.planPeriod}>{info.period}</Text>
        </View>

        <View style={[
          styles.radioButton,
          isSelected && styles.radioButtonSelected
        ]}>
          {isSelected && <View style={styles.radioButtonInner} />}
        </View>
      </AnimatedPressable>
    </View>
  );
}

export default function PaywallScreen({ navigation }: PaywallScreenProps) {
  const {
    availablePackages,
    isPurchasing,
    isRestoring,
    isPremium,
  } = useSubscriptionStore();

  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const subscribeScale = useSharedValue(1);
  const restoreScale = useSharedValue(1);

  const subscribeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: subscribeScale.value }],
  }));

  const restoreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: restoreScale.value }],
  }));

  useEffect(() => {
    loadPackages();
  }, []);

  useEffect(() => {
    // Auto-select the weekly package (cheapest)
    if (availablePackages.length > 0 && !selectedPackage) {
      const weeklyPkg = availablePackages.find(
        (pkg) => pkg.packageType === 'WEEKLY'
      );
      const monthlyPkg = availablePackages.find(
        (pkg) => pkg.packageType === 'MONTHLY'
      );
      setSelectedPackage(weeklyPkg || monthlyPkg || availablePackages[0]);
    }
  }, [availablePackages, selectedPackage]);

  useEffect(() => {
    if (isPremium) {
      navigation.goBack();
    }
  }, [isPremium, navigation]);

  const loadPackages = async () => {
    setIsLoading(true);
    await fetchAvailablePackages();
    setIsLoading(false);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await purchasePackage(selectedPackage);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Welcome to Premium!',
        'Thank you for subscribing. Enjoy unlimited signatures and an ad-free experience!',
        [{ text: 'Let\'s Go!', onPress: () => navigation.goBack() }]
      );
    } else if (result.error && !result.error.includes('cancelled')) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Purchase Failed', result.error);
    }
  };

  const handleRestore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await restorePurchases();

    if (result.success) {
      if (result.isPremium) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Purchases Restored',
          'Your premium subscription has been restored!',
          [{ text: 'Continue', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'No previous purchases were found for this account.'
        );
      }
    } else if (result.error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Restore Failed', result.error);
    }
  };

  const getPackageInfo = (pkg: PurchasesPackage) => {
    const price = pkg.product.priceString;

    switch (pkg.packageType) {
      case 'WEEKLY':
        return {
          label: 'Weekly',
          price: price,
          period: '/week',
          savings: null,
          badge: 'Cheapest',
        };
      case 'MONTHLY':
        return {
          label: 'Monthly',
          price: price,
          period: '/month',
          savings: null,
          badge: 'Popular',
        };
      case 'ANNUAL':
        return {
          label: 'Yearly',
          price: price,
          period: '/year',
          savings: 'Save 50%',
          badge: 'Best Value',
        };
      default:
        return {
          label: pkg.identifier,
          price: price,
          period: '',
          savings: null,
          badge: null,
        };
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleSubscribePressIn = useCallback(() => {
    subscribeScale.value = withSpring(0.96, ANIMATION.springBouncy);
  }, [subscribeScale]);

  const handleSubscribePressOut = useCallback(() => {
    subscribeScale.value = withSpring(1, ANIMATION.springBouncy);
  }, [subscribeScale]);

  const handleRestorePressIn = useCallback(() => {
    restoreScale.value = withSpring(0.96, ANIMATION.springBouncy);
  }, [restoreScale]);

  const handleRestorePressOut = useCallback(() => {
    restoreScale.value = withSpring(1, ANIMATION.springBouncy);
  }, [restoreScale]);

  return (
    <View style={styles.container}>
      {/* Header with gradient */}
      <Animated.View entering={FadeIn.duration(300)}>
        <LinearGradient
          colors={['#6C63FF', '#8B7FFF', '#A599FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerSpacer} />
            <View style={styles.headerContent}>
              <BouncingEmoji emoji="👑" style={styles.premiumIcon} delay={0} />
              <Text style={styles.headerTitle} accessibilityRole="header">
                Go Premium
              </Text>
            </View>
            <Pressable
              style={styles.closeButton}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close paywall"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Benefits */}
        <View style={styles.benefitsSection}>
          {BENEFITS.map((benefit, index) => (
            <Animated.View
              key={index}
              style={styles.benefitRow}
              entering={FadeInDown.delay(100 + index * 100).springify()}
            >
              <View style={styles.benefitIconContainer}>
                <Text style={styles.benefitIcon} accessibilityElementsHidden>
                  {benefit.icon}
                </Text>
              </View>
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>{benefit.description}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Plans */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText} accessibilityRole="alert">
              Loading plans...
            </Text>
          </View>
        ) : (
          <Animated.View
            style={styles.plansSection}
            entering={FadeInDown.delay(400).springify()}
            accessibilityRole="radiogroup"
            accessibilityLabel="Subscription plans"
          >
            {availablePackages.map((pkg, index) => {
              const info = getPackageInfo(pkg);
              const isSelected = selectedPackage?.identifier === pkg.identifier;
              const isYearly = pkg.packageType === 'ANNUAL';

              return (
                <Animated.View
                  key={pkg.identifier}
                  entering={FadeInDown.delay(450 + index * 50).springify()}
                >
                  <PlanCard
                    pkg={pkg}
                    isSelected={isSelected}
                    onSelect={() => setSelectedPackage(pkg)}
                    info={info}
                    showShimmer={isYearly}
                  />
                </Animated.View>
              );
            })}
          </Animated.View>
        )}
      </ScrollView>

      {/* Footer */}
      <Animated.View
        style={styles.footer}
        entering={FadeInUp.delay(500).springify()}
      >
        <AnimatedPressable
          style={[
            styles.subscribeButton,
            (!selectedPackage || isPurchasing) && styles.subscribeButtonDisabled,
            subscribeAnimatedStyle,
          ]}
          onPress={handlePurchase}
          onPressIn={handleSubscribePressIn}
          onPressOut={handleSubscribePressOut}
          disabled={!selectedPackage || isPurchasing}
          accessibilityRole="button"
          accessibilityLabel="Start premium subscription"
          accessibilityState={{ disabled: !selectedPackage || isPurchasing }}
        >
          <LinearGradient
            colors={(!selectedPackage || isPurchasing)
              ? ['#444', '#444']
              : ['#6C63FF', '#8B7FFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.subscribeButtonGradient}
          >
            {isPurchasing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.subscribeButtonText}>
                Start Premium
              </Text>
            )}
          </LinearGradient>
        </AnimatedPressable>

        <AnimatedPressable
          style={[styles.restoreButton, restoreAnimatedStyle]}
          onPress={handleRestore}
          onPressIn={handleRestorePressIn}
          onPressOut={handleRestorePressOut}
          disabled={isRestoring}
          accessibilityRole="button"
          accessibilityLabel="Restore previous purchases"
        >
          <Text style={styles.restoreButtonText}>
            {isRestoring ? 'Restoring...' : 'Restore Purchases'}
          </Text>
        </AnimatedPressable>

        <Text style={styles.legalText}>
          Cancel anytime. Subscription auto-renews until cancelled.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 54,
    paddingBottom: 14,
    paddingHorizontal: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 32,
    height: 32,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  premiumIcon: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.md,
  },
  benefitsSection: {
    flex: 1,
    justifyContent: 'space-evenly',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  benefitIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  benefitIcon: {
    fontSize: 22,
  },
  benefitTextContainer: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  benefitDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  plansSection: {
    flex: 1,
    justifyContent: 'space-evenly',
  },
  planCardWrapper: {
    position: 'relative',
    marginTop: 10,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    overflow: 'hidden',
    minHeight: 56,
  },
  planCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
    ...SHADOWS.glow,
  },
  planCardShimmer: {
    borderColor: '#FFB800',
  },
  planShimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 40,
    left: 0,
  },
  planBadge: {
    position: 'absolute',
    top: 0,
    left: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    zIndex: 10,
  },
  planBadgeBestValue: {
    backgroundColor: '#FFB800',
  },
  planBadgeCheapest: {
    backgroundColor: '#4CAF50',
  },
  planBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  planInfo: {
    flex: 1,
  },
  planLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  planLabelSelected: {
    color: COLORS.primary,
  },
  planSavings: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '700',
  },
  planPriceContainer: {
    alignItems: 'flex-end',
    marginRight: SPACING.sm,
  },
  planPrice: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
    color: COLORS.text,
  },
  planPriceSelected: {
    color: COLORS.primary,
  },
  planPeriod: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: COLORS.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  footer: {
    padding: SPACING.md,
    paddingBottom: 24,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  subscribeButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
    shadowColor: COLORS.primary,
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  subscribeButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    marginTop: SPACING.xs,
    minHeight: 36,
    justifyContent: 'center',
  },
  restoreButtonText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  legalText: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
});
