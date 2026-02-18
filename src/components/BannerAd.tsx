import React, { useState } from 'react';
import { View, StyleSheet, Text, useWindowDimensions } from 'react-native';
import {
  BannerAd as GoogleBannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';
import { ADMOB_CONFIG } from '../config/monetization';
import { useIsPremium } from '../store/useSubscriptionStore';
import { COLORS, FONT_SIZES } from '../utils/constants';

// Use test ads in development
const isDevelopment = __DEV__;

interface BannerAdProps {
  size?: BannerAdSize;
}

// Standard banner height is 50pt, adaptive banners vary but typically 50-90pt
const BANNER_HEIGHT = 50;

export default function BannerAd({
  size = BannerAdSize.BANNER,
}: BannerAdProps) {
  const isPremium = useIsPremium();
  const [adFailed, setAdFailed] = useState(false);
  const { width: screenWidth } = useWindowDimensions();

  // Don't show ads to premium users
  if (isPremium) {
    return null;
  }

  // Use test ad unit ID in development for reliable ad loading
  const adUnitId = isDevelopment ? TestIds.BANNER : ADMOB_CONFIG.bannerAdUnitId;

  return (
    <View style={styles.container}>
      {adFailed ? (
        <View style={[styles.placeholder, { width: screenWidth, height: BANNER_HEIGHT }]}>
          <Text style={styles.placeholderText}>Ad</Text>
        </View>
      ) : (
        <GoogleBannerAd
          unitId={adUnitId}
          size={size}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdLoaded={() => {
            setAdFailed(false);
          }}
          onAdFailedToLoad={(error) => {
            console.log('Banner ad failed to load:', error);
            setAdFailed(true);
          }}
        />
      )}
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
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLight,
  },
  placeholderText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
