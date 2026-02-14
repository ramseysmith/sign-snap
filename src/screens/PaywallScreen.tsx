import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { PurchasesPackage } from 'react-native-purchases';
import { PaywallScreenProps } from '../types';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import {
  fetchAvailablePackages,
  purchasePackage,
  restorePurchases,
  getPackagePricePerPeriod,
} from '../services/purchaseService';
import { PREMIUM_BENEFITS } from '../config/monetization';
import ActionButton from '../components/ActionButton';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../utils/constants';

export default function PaywallScreen({ navigation }: PaywallScreenProps) {
  const {
    availablePackages,
    isPurchasing,
    isRestoring,
    purchaseError,
    isPremium,
  } = useSubscriptionStore();

  const [selectedPackage, setSelectedPackage] =
    useState<PurchasesPackage | null>(null);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [useRevenueCatUI, setUseRevenueCatUI] = useState(true);

  useEffect(() => {
    loadPackages();
    presentRevenueCatPaywall();
  }, []);

  useEffect(() => {
    // Auto-select the monthly package if available
    if (availablePackages.length > 0 && !selectedPackage) {
      const monthlyPkg = availablePackages.find(
        (pkg) => pkg.packageType === 'MONTHLY'
      );
      setSelectedPackage(monthlyPkg || availablePackages[0]);
    }
  }, [availablePackages, selectedPackage]);

  useEffect(() => {
    // Close paywall if user becomes premium
    if (isPremium) {
      navigation.goBack();
    }
  }, [isPremium, navigation]);

  const presentRevenueCatPaywall = async () => {
    try {
      // Try to present RevenueCat's native paywall
      const paywallResult = await RevenueCatUI.presentPaywall();

      switch (paywallResult) {
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED:
          // Success - navigation will happen via isPremium effect
          break;
        case PAYWALL_RESULT.CANCELLED:
        case PAYWALL_RESULT.NOT_PRESENTED:
          // User cancelled or paywall couldn't be presented
          // Fall back to custom UI
          setUseRevenueCatUI(false);
          break;
        case PAYWALL_RESULT.ERROR:
          console.log('RevenueCat paywall error, falling back to custom UI');
          setUseRevenueCatUI(false);
          break;
      }
    } catch (error) {
      console.log('RevenueCat UI not available, using custom paywall:', error);
      setUseRevenueCatUI(false);
    }
  };

  const loadPackages = async () => {
    setIsLoadingPackages(true);
    await fetchAvailablePackages();
    setIsLoadingPackages(false);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    const result = await purchasePackage(selectedPackage);

    if (result.success) {
      Alert.alert(
        'Welcome to Premium!',
        'Thank you for subscribing. Enjoy unlimited signatures and ad-free experience!',
        [{ text: 'Continue', onPress: () => navigation.goBack() }]
      );
    } else if (result.error) {
      Alert.alert('Purchase Failed', result.error);
    }
  };

  const handleRestore = async () => {
    const result = await restorePurchases();

    if (result.success) {
      if (result.isPremium) {
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
      Alert.alert('Restore Failed', result.error);
    }
  };

  const getPackageLabel = (pkg: PurchasesPackage): string => {
    switch (pkg.packageType) {
      case 'WEEKLY':
        return 'Weekly';
      case 'MONTHLY':
        return 'Monthly';
      case 'ANNUAL':
        return 'Yearly';
      default:
        return pkg.identifier;
    }
  };

  const getPackageBadge = (pkg: PurchasesPackage): string | null => {
    switch (pkg.packageType) {
      case 'MONTHLY':
        return 'Popular';
      case 'ANNUAL':
        return 'Best Value';
      default:
        return null;
    }
  };

  const renderBenefitIcon = (iconType: string) => {
    switch (iconType) {
      case 'unlimited':
        return <Text style={styles.benefitIconText}>Unlimited</Text>;
      case 'no-ads':
        return <Text style={styles.benefitIconText}>No Ads</Text>;
      case 'priority':
        return <Text style={styles.benefitIconText}>VIP</Text>;
      default:
        return <Text style={styles.benefitIconText}>+</Text>;
    }
  };

  // If RevenueCat UI is being used, show loading while it presents
  if (useRevenueCatUI) {
    return (
      <View style={styles.loadingFullScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Custom fallback UI
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Upgrade to Premium</Text>
          <Text style={styles.subtitle}>
            Unlock unlimited signatures and remove all ads
          </Text>
        </View>

        <View style={styles.benefitsContainer}>
          {PREMIUM_BENEFITS.map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                {renderBenefitIcon(benefit.icon)}
              </View>
              <View style={styles.benefitText}>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>
                  {benefit.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {isLoadingPackages ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading plans...</Text>
          </View>
        ) : (
          <View style={styles.plansContainer}>
            <Text style={styles.sectionTitle}>Choose Your Plan</Text>
            {availablePackages.map((pkg) => {
              const isSelected = selectedPackage?.identifier === pkg.identifier;
              const badge = getPackageBadge(pkg);

              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={[
                    styles.planCard,
                    isSelected && styles.planCardSelected,
                  ]}
                  onPress={() => setSelectedPackage(pkg)}
                  activeOpacity={0.7}
                >
                  {badge && (
                    <View style={styles.planBadge}>
                      <Text style={styles.planBadgeText}>{badge}</Text>
                    </View>
                  )}
                  <View style={styles.planContent}>
                    <Text
                      style={[
                        styles.planLabel,
                        isSelected && styles.planLabelSelected,
                      ]}
                    >
                      {getPackageLabel(pkg)}
                    </Text>
                    <Text
                      style={[
                        styles.planPrice,
                        isSelected && styles.planPriceSelected,
                      ]}
                    >
                      {getPackagePricePerPeriod(pkg)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radioOuter,
                      isSelected && styles.radioOuterSelected,
                    ]}
                  >
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {purchaseError && (
          <Text style={styles.errorText}>{purchaseError}</Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <ActionButton
          title={isPurchasing ? 'Processing...' : 'Subscribe Now'}
          onPress={handlePurchase}
          disabled={!selectedPackage || isPurchasing || isLoadingPackages}
          loading={isPurchasing}
          size="large"
        />
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={isRestoring}
        >
          <Text style={styles.restoreText}>
            {isRestoring ? 'Restoring...' : 'Restore Purchases'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.legalText}>
          Cancel anytime. Subscription auto-renews until cancelled.
        </Text>
      </View>
    </View>
  );
}

/**
 * Present RevenueCat paywall directly (can be called from anywhere)
 */
export async function presentPaywall(): Promise<boolean> {
  try {
    const result = await RevenueCatUI.presentPaywall();
    return result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;
  } catch (error) {
    console.error('Failed to present paywall:', error);
    return false;
  }
}

/**
 * Present RevenueCat paywall if user doesn't have entitlement
 */
export async function presentPaywallIfNeeded(): Promise<boolean> {
  try {
    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: 'SignSnap Premium',
    });
    return result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;
  } catch (error) {
    console.error('Failed to present paywall:', error);
    return false;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingFullScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  benefitsContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  benefitIconText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
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
  },
  plansContainer: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  planCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceLight,
  },
  planBadge: {
    position: 'absolute',
    top: -10,
    right: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  planBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.text,
  },
  planContent: {
    flex: 1,
  },
  planLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  planLabelSelected: {
    color: COLORS.primary,
  },
  planPrice: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  planPriceSelected: {
    color: COLORS.text,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  restoreText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  legalText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
