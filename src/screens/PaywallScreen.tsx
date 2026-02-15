import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PurchasesPackage } from 'react-native-purchases';
import { PaywallScreenProps } from '../types';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import {
  fetchAvailablePackages,
  purchasePackage,
  restorePurchases,
} from '../services/purchaseService';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../utils/constants';

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

export default function PaywallScreen({ navigation }: PaywallScreenProps) {
  const {
    availablePackages,
    isPurchasing,
    isRestoring,
    isPremium,
  } = useSubscriptionStore();

  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPackages();
  }, []);

  useEffect(() => {
    // Auto-select the yearly package (best value)
    if (availablePackages.length > 0 && !selectedPackage) {
      const yearlyPkg = availablePackages.find(
        (pkg) => pkg.packageType === 'ANNUAL'
      );
      const monthlyPkg = availablePackages.find(
        (pkg) => pkg.packageType === 'MONTHLY'
      );
      setSelectedPackage(yearlyPkg || monthlyPkg || availablePackages[0]);
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

    const result = await purchasePackage(selectedPackage);

    if (result.success) {
      Alert.alert(
        '🎉 Welcome to Premium!',
        'Thank you for subscribing. Enjoy unlimited signatures and an ad-free experience!',
        [{ text: 'Let\'s Go!', onPress: () => navigation.goBack() }]
      );
    } else if (result.error && !result.error.includes('cancelled')) {
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

  const getPackageInfo = (pkg: PurchasesPackage) => {
    const price = pkg.product.priceString;

    switch (pkg.packageType) {
      case 'WEEKLY':
        return {
          label: 'Weekly',
          price: price,
          period: '/week',
          savings: null,
          badge: null,
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
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header with gradient */}
      <LinearGradient
        colors={['#6C63FF', '#8B7FFF', '#A599FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.premiumIcon}>👑</Text>
          <Text style={styles.headerTitle}>Go Premium</Text>
          <Text style={styles.headerSubtitle}>
            Unlock the full power of SignSnap
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Benefits */}
        <View style={styles.benefitsSection}>
          {BENEFITS.map((benefit, index) => (
            <View key={index} style={styles.benefitRow}>
              <View style={styles.benefitIconContainer}>
                <Text style={styles.benefitIcon}>{benefit.icon}</Text>
              </View>
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>{benefit.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Plans */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading plans...</Text>
          </View>
        ) : (
          <View style={styles.plansSection}>
            {availablePackages.map((pkg) => {
              const info = getPackageInfo(pkg);
              const isSelected = selectedPackage?.identifier === pkg.identifier;

              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={[
                    styles.planCard,
                    isSelected && styles.planCardSelected,
                  ]}
                  onPress={() => setSelectedPackage(pkg)}
                  activeOpacity={0.8}
                >
                  {info.badge && (
                    <View style={[
                      styles.planBadge,
                      info.badge === 'Best Value' && styles.planBadgeBestValue
                    ]}>
                      <Text style={styles.planBadgeText}>{info.badge}</Text>
                    </View>
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
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.subscribeButton,
            (!selectedPackage || isPurchasing) && styles.subscribeButtonDisabled
          ]}
          onPress={handlePurchase}
          disabled={!selectedPackage || isPurchasing}
          activeOpacity={0.9}
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
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={isRestoring}
        >
          <Text style={styles.restoreButtonText}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
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
    alignItems: 'center',
    marginTop: 16,
  },
  premiumIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  benefitsSection: {
    marginBottom: SPACING.xl,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  benefitIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  plansSection: {
    gap: SPACING.sm,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
    overflow: 'visible',
  },
  planCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
  },
  planBadge: {
    position: 'absolute',
    top: -12,
    left: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  planBadgeBestValue: {
    backgroundColor: '#FFB800',
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  planInfo: {
    flex: 1,
  },
  planLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  planLabelSelected: {
    color: COLORS.primary,
  },
  planSavings: {
    fontSize: FONT_SIZES.xs,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 2,
  },
  planPriceContainer: {
    alignItems: 'flex-end',
    marginRight: SPACING.md,
  },
  planPrice: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  planPriceSelected: {
    color: COLORS.primary,
  },
  planPeriod: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    padding: SPACING.lg,
    paddingBottom: 34,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  subscribeButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  restoreButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  legalText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});
