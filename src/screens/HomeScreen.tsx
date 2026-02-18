import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  Pressable,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  withTiming,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { HomeScreenProps } from '../types';
import { useDocumentStore } from '../store/useDocumentStore';
import { usePermissions } from '../hooks/usePermissions';
import { useIsPremium, useSubscriptionStore } from '../store/useSubscriptionStore';
import { useDocumentLimit } from '../hooks/useDocumentLimit';
import { useRewardedAd } from '../hooks/useRewardedAd';
import { imagesToPdf } from '../services/pdfService';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, ANIMATION } from '../utils/constants';
import { FREE_TIER_LIMITS } from '../config/monetization';
import BannerAd from '../components/BannerAd';
import UpgradePrompt from '../components/UpgradePrompt';
import ActionButton from '../components/ActionButton';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface ActionCardProps {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  delay?: number;
  accessibilityHint: string;
}

function ActionCard({ icon, title, description, onPress, delay = 0, accessibilityHint }: ActionCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, ANIMATION.springBouncy);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, ANIMATION.springBouncy);
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <AnimatedPressable
        style={[styles.actionCard, animatedStyle]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={accessibilityHint}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
        <View style={styles.cardArrow}>
          <Text style={styles.cardArrowText}>›</Text>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}


export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { setCurrentDocument, resetWorkflow } = useDocumentStore();
  const { requestCameraPermission, requestMediaLibraryPermission } = usePermissions();
  const isPremium = useIsPremium();
  const { remainingSignings, documentsSignedCount, rewardedAdsWatched, additionalCredits } = useDocumentLimit();
  const { showRewardedAd, isLoaded: isRewardedAdLoaded, isLoading: isAdLoading, error: adError, retryLoad } = useRewardedAd();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Shimmer animation for upgrade badge
  const shimmerTranslate = useSharedValue(-100);

  useEffect(() => {
    if (!isPremium) {
      shimmerTranslate.value = withRepeat(
        withDelay(
          2500,
          withTiming(100, { duration: 1800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [isPremium]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shimmerTranslate.value },
      { skewX: '-20deg' },
    ],
  }));

  // Bounce animation for "no signings left" banner
  const bounceScale = useSharedValue(1);

  useEffect(() => {
    if (remainingSignings <= 0 && !isPremium) {
      // Start a subtle repeating bounce animation
      bounceScale.value = withRepeat(
        withSequence(
          withDelay(2000, withSpring(1.03, { damping: 8, stiffness: 200 })),
          withSpring(1, { damping: 8, stiffness: 200 })
        ),
        -1, // Repeat indefinitely
        false
      );
    } else {
      bounceScale.value = 1;
    }
  }, [remainingSignings, isPremium]);

  const bounceAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bounceScale.value }],
  }));

  const handleWatchAds = () => {
    if (!isRewardedAdLoaded) {
      if (adError) {
        Alert.alert(
          'Ads Unavailable',
          'No ads are available right now. This can happen on simulators or when network conditions are poor. Would you like to try again?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: retryLoad },
          ]
        );
      } else if (isAdLoading) {
        Alert.alert(
          'Loading Ad',
          'The ad is still loading. Please wait a moment and try again.',
          [{ text: 'OK' }]
        );
      } else {
        // Try to load again
        retryLoad();
        Alert.alert(
          'Loading Ad',
          'Loading an ad for you. Please try again in a few seconds.',
          [{ text: 'OK' }]
        );
      }
      return;
    }

    showRewardedAd(
      () => {
        // Reward earned - modal will refresh with updated progress
      },
      () => {
        // Ad closed - check if user now has credits
        setTimeout(() => {
          const state = useSubscriptionStore.getState();
          if (state.additionalDocumentCredits > 0) {
            setShowLimitModal(false);
            Alert.alert('Credit Earned!', 'You can now sign 1 more document.');
          }
        }, 100);
      }
    );
  };

  const handleUpgrade = () => {
    setShowLimitModal(false);
    navigation.navigate('Paywall');
  };

  const handleBannerPress = () => {
    if (remainingSignings <= 0) {
      // At limit - show the upgrade/watch ads modal
      setShowLimitModal(true);
    } else if (__DEV__) {
      // Debug mode - show state info
      Alert.alert(
        'Signing Status (Debug)',
        `Documents signed: ${documentsSignedCount}\nFree limit: ${FREE_TIER_LIMITS.maxDocumentSignings}\nAdditional credits: ${additionalCredits}\nAds watched: ${rewardedAdsWatched}/5\nRemaining: ${remainingSignings}`,
        [
          { text: 'OK' },
          {
            text: 'Reset',
            style: 'destructive',
            onPress: () => {
              useSubscriptionStore.getState().reset();
              Alert.alert('Reset', 'Document count has been reset to 0');
            },
          },
        ]
      );
    } else {
      // Production with signings left - go to paywall
      navigation.navigate('Paywall');
    }
  };

  const handleUseCamera = async () => {
    const granted = await requestCameraPermission();
    if (granted) {
      navigation.navigate('Camera');
    }
  };

  const handlePickFromLibrary = async () => {
    const granted = await requestMediaLibraryPermission();
    if (!granted) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      setIsProcessing(true);
      const imageUris = result.assets.map((asset) => asset.uri);
      const pdfUri = await imagesToPdf(imageUris);
      const documentName = `Scanned_${new Date().toISOString().slice(0, 10)}.pdf`;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCurrentDocument(pdfUri, documentName);
      navigation.navigate('DocumentPreview', {
        documentUri: pdfUri,
        documentName,
        isFromCamera: true,
      });
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to process images. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScanDocument = () => {
    Alert.alert(
      'Add Document',
      'How would you like to add your document?',
      [
        { text: 'Use Camera', onPress: handleUseCamera },
        { text: 'Choose from Library', onPress: handlePickFromLibrary },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleUploadPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      if (asset) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCurrentDocument(asset.uri, asset.name);
        navigation.navigate('DocumentPreview', {
          documentUri: asset.uri,
          documentName: asset.name,
        });
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to load document. Please try again.');
    }
  };

  const handleViewDocuments = () => {
    navigation.navigate('Documents');
  };

  const handleManageSignatures = () => {
    resetWorkflow();
    navigation.navigate('SignatureManager');
  };

  const handleSubscription = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPremium) {
      navigation.navigate('CustomerCenter');
    } else {
      navigation.navigate('Paywall');
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Animated.View
          style={styles.header}
          entering={FadeInDown.delay(100).springify()}
        >
          <View style={styles.titleRow}>
            <Text style={styles.title} accessibilityRole="header">SignSnap</Text>
            <Pressable
              style={[styles.premiumBadge, isPremium && styles.premiumBadgeActive]}
              onPress={handleSubscription}
              accessibilityRole="button"
              accessibilityLabel={isPremium ? "Premium subscription active" : "Upgrade to premium"}
              accessibilityHint={isPremium ? "View subscription details" : "View premium subscription options"}
            >
              {!isPremium && (
                <AnimatedLinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={[styles.shimmer, shimmerStyle]}
                />
              )}
              <Text style={styles.premiumBadgeText}>
                {isPremium ? '✦ Premium' : 'Upgrade'}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.subtitle}>Sign documents in seconds</Text>
          {!isPremium && (
            <AnimatedPressable
              style={[
                styles.limitBanner,
                remainingSignings <= 0 && styles.limitBannerWarning,
                remainingSignings <= 0 && bounceAnimatedStyle,
              ]}
              onPress={handleBannerPress}
              accessibilityRole="button"
              accessibilityLabel={`${remainingSignings} document signings remaining`}
            >
              <Text style={styles.limitBannerText}>
                {remainingSignings > 0
                  ? `${remainingSignings} free signing${remainingSignings !== 1 ? 's' : ''} left`
                  : 'No signings left - Tap to watch ads'}
              </Text>
              {rewardedAdsWatched > 0 && (
                <Text style={styles.limitBannerSubtext}>
                  {rewardedAdsWatched}/5 ads toward next signing
                </Text>
              )}
            </AnimatedPressable>
          )}
        </Animated.View>

        <View style={styles.actionsContainer}>
          <ActionCard
            icon="📷"
            title="Scan Document"
            description="Use your camera to scan a physical document"
            onPress={handleScanDocument}
            delay={200}
            accessibilityHint="Opens camera to scan a document"
          />
          <ActionCard
            icon="📄"
            title="Upload PDF"
            description="Choose a PDF file from your device"
            onPress={handleUploadPdf}
            delay={300}
            accessibilityHint="Opens file picker to select a PDF"
          />
          <ActionCard
            icon="📁"
            title="My Documents"
            description="View and manage your signed documents"
            onPress={handleViewDocuments}
            delay={400}
            accessibilityHint="Opens your saved documents"
          />
          <ActionCard
            icon="✍️"
            title="My Signatures"
            description="Manage your saved signatures"
            onPress={handleManageSignatures}
            delay={450}
            accessibilityHint="Opens signature management"
          />
          </View>
        </View>
      </SafeAreaView>
      <BannerAd />
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.processingText}>Creating PDF...</Text>
        </View>
      )}

      {/* Limit Reached Modal */}
      <Modal
        visible={showLimitModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLimitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <UpgradePrompt
              documentsSignedCount={documentsSignedCount}
              additionalCredits={additionalCredits}
              adsWatched={rewardedAdsWatched}
              variant="limit-reached"
              onUpgrade={handleUpgrade}
              onWatchAds={handleWatchAds}
              isAdLoading={isAdLoading}
              isAdReady={isRewardedAdLoaded}
            />
            <ActionButton
              title="Cancel"
              onPress={() => setShowLimitModal(false)}
              variant="secondary"
              style={styles.cancelButton}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  header: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  premiumBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  premiumBadgeActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.glow,
  },
  premiumBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.text,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 30,
    left: 0,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  limitBanner: {
    marginTop: 32,
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  limitBannerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  limitBannerSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primaryLight,
    fontWeight: '600',
    marginTop: 4,
  },
  limitBannerWarning: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
  },
  cancelButton: {
    marginTop: SPACING.md,
  },
  actionsContainer: {
    flex: 1,
    justifyContent: 'space-evenly',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 90,
    ...SHADOWS.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  cardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 1,
  },
  cardDescription: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  cardArrow: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardArrowText: {
    fontSize: 24,
    color: COLORS.textSecondary,
    fontWeight: '300',
    marginTop: -2,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  processingText: {
    marginTop: SPACING.md,
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
});
