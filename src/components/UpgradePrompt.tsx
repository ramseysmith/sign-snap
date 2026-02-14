import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { FREE_TIER_LIMITS } from '../config/monetization';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../utils/constants';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UpgradePromptProps {
  currentCount: number;
  itemType?: 'signature' | 'initials';
  variant?: 'banner' | 'card';
  onUpgrade?: () => void;
}

export default function UpgradePrompt({
  currentCount,
  itemType = 'signature',
  variant = 'banner',
  onUpgrade,
}: UpgradePromptProps) {
  const navigation = useNavigation<NavigationProp>();
  const maxAllowed = FREE_TIER_LIMITS.maxSavedSignatures;
  const remaining = Math.max(0, maxAllowed - currentCount);
  const isAtLimit = currentCount >= maxAllowed;

  const handleUpgradePress = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigation.navigate('Paywall');
    }
  };

  if (variant === 'card') {
    return (
      <View style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            {isAtLimit ? 'Signature Limit Reached' : 'Free Plan'}
          </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {currentCount}/{maxAllowed}
            </Text>
          </View>
        </View>
        <Text style={styles.cardDescription}>
          {isAtLimit
            ? `You've saved ${maxAllowed} ${itemType}s. Upgrade to save unlimited ${itemType}s.`
            : `You have ${remaining} ${itemType} slot${remaining !== 1 ? 's' : ''} remaining.`}
        </Text>
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={handleUpgradePress}
          activeOpacity={0.7}
        >
          <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
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
            ? `Limit reached (${currentCount}/${maxAllowed})`
            : `Free: ${currentCount}/${maxAllowed} ${itemType}s`}
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
  upgradeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
});
