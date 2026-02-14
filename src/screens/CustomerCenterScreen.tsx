import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { CustomerInfo } from 'react-native-purchases';
import { CustomerCenterScreenProps } from '../types';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import {
  getCustomerInfo,
  restorePurchases,
} from '../services/purchaseService';
import ActionButton from '../components/ActionButton';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../utils/constants';

export default function CustomerCenterScreen({
  navigation,
}: CustomerCenterScreenProps) {
  const { isPremium, isRestoring } = useSubscriptionStore();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCustomerInfo();
  }, []);

  const loadCustomerInfo = async () => {
    setIsLoading(true);
    const info = await getCustomerInfo();
    setCustomerInfo(info);
    setIsLoading(false);
  };

  const handleRestore = async () => {
    const result = await restorePurchases();

    if (result.success) {
      if (result.isPremium) {
        Alert.alert(
          'Purchases Restored',
          'Your premium subscription has been restored!'
        );
        loadCustomerInfo();
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

  const handleManageSubscription = () => {
    // Open the subscription management page in the respective app store
    const url = customerInfo?.managementURL;
    if (url) {
      Linking.openURL(url);
    } else {
      // Fallback to generic subscription settings
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    }
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@signsnap.app?subject=SignSnap%20Premium%20Support');
  };

  const handleUpgrade = () => {
    navigation.navigate('Paywall');
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getActiveSubscription = () => {
    if (!customerInfo) return null;
    const entitlement = customerInfo.entitlements.active['SignSnap Premium'];
    return entitlement || null;
  };

  const activeSubscription = getActiveSubscription();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <View style={[styles.statusBadge, isPremium && styles.statusBadgePremium]}>
          <Text style={styles.statusText}>
            {isPremium ? 'Premium' : 'Free'}
          </Text>
        </View>
        <Text style={styles.title}>
          {isPremium ? 'Premium Member' : 'Free Plan'}
        </Text>
        <Text style={styles.subtitle}>
          {isPremium
            ? 'Thank you for being a premium subscriber!'
            : 'Upgrade to unlock all features'}
        </Text>
      </View>

      {isPremium && activeSubscription ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription Details</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Plan</Text>
              <Text style={styles.detailValue}>
                {activeSubscription.productIdentifier.includes('weekly')
                  ? 'Weekly'
                  : activeSubscription.productIdentifier.includes('monthly')
                  ? 'Monthly'
                  : 'Yearly'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Started</Text>
              <Text style={styles.detailValue}>
                {formatDate(activeSubscription.originalPurchaseDate)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {activeSubscription.willRenew ? 'Renews' : 'Expires'}
              </Text>
              <Text style={styles.detailValue}>
                {formatDate(activeSubscription.expirationDate)}
              </Text>
            </View>
            {!activeSubscription.willRenew && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningText}>
                  Your subscription will not renew. Re-subscribe to keep premium features.
                </Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <View style={styles.upgradeCard}>
            <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
            <Text style={styles.upgradeDescription}>
              Get unlimited signatures, remove all ads, and enjoy priority support.
            </Text>
            <ActionButton
              title="View Plans"
              onPress={handleUpgrade}
              style={styles.upgradeButton}
            />
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.actionsCard}>
          {isPremium && (
            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleManageSubscription}
            >
              <Text style={styles.actionText}>Manage Subscription</Text>
              <Text style={styles.actionArrow}>Go</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleRestore}
            disabled={isRestoring}
          >
            <Text style={styles.actionText}>
              {isRestoring ? 'Restoring...' : 'Restore Purchases'}
            </Text>
            {isRestoring && (
              <ActivityIndicator size="small" color={COLORS.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionItem, styles.actionItemLast]}
            onPress={handleContactSupport}
          >
            <Text style={styles.actionText}>Contact Support</Text>
            <Text style={styles.actionArrow}>Email</Text>
          </TouchableOpacity>
        </View>
      </View>

      {customerInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer ID</Text>
          <Text style={styles.customerId}>
            {customerInfo.originalAppUserId}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  statusBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.sm,
  },
  statusBadgePremium: {
    backgroundColor: COLORS.primary,
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
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
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  detailCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  warningBanner: {
    backgroundColor: COLORS.error + '20',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  warningText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    textAlign: 'center',
  },
  upgradeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  upgradeTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  upgradeDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  upgradeButton: {
    minWidth: 150,
  },
  actionsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionItemLast: {
    borderBottomWidth: 0,
  },
  actionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  actionArrow: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  customerId: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
});
