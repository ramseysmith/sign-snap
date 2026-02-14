import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  BannerAd as GoogleBannerAd,
  BannerAdSize,
} from 'react-native-google-mobile-ads';
import { ADMOB_CONFIG } from '../config/monetization';
import { useIsPremium } from '../store/useSubscriptionStore';
import { COLORS, SPACING } from '../utils/constants';

interface BannerAdProps {
  size?: BannerAdSize;
}

export default function BannerAd({
  size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
}: BannerAdProps) {
  const isPremium = useIsPremium();

  // Don't show ads to premium users
  if (isPremium) {
    return null;
  }

  return (
    <View style={styles.container}>
      <GoogleBannerAd
        unitId={ADMOB_CONFIG.bannerAdUnitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={(error) => {
          console.log('Banner ad failed to load:', error);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: SPACING.xs,
  },
});
