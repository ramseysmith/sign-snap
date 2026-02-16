import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  FadeIn,
  FadeInDown,
  ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Pdf from 'react-native-pdf';
import { FinalPreviewScreenProps } from '../types';
import { useDocumentStore } from '../store/useDocumentStore';
import { shareDocument } from '../services/shareService';
import { saveDocument } from '../services/fileService';
import ActionButton from '../components/ActionButton';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, ANIMATION } from '../utils/constants';
import { useInterstitialAd } from '../hooks/useInterstitialAd';
import { useDocumentLimit } from '../hooks/useDocumentLimit';
import { useRewardedAd } from '../hooks/useRewardedAd';
import { FREE_TIER_LIMITS } from '../config/monetization';

export default function FinalPreviewScreen({
  navigation,
  route,
}: FinalPreviewScreenProps) {
  const { signedPdfUri, documentName } = route.params;
  const { addSavedDocument, resetWorkflow } = useDocumentStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasCountedDocument, setHasCountedDocument] = useState(false);
  const { showAd } = useInterstitialAd();
  const {
    isPremium,
    incrementDocumentsSigned,
  } = useDocumentLimit();
  const checkmarkScale = useSharedValue(0);

  // Animate checkmark on mount
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    checkmarkScale.value = withSequence(
      withSpring(1.2, ANIMATION.springBouncy),
      withSpring(1, ANIMATION.spring)
    );
  }, [checkmarkScale]);

  // Count this document signing when user arrives at this screen
  useEffect(() => {
    if (!hasCountedDocument && !isPremium) {
      incrementDocumentsSigned();
      setHasCountedDocument(true);
    }
  }, [hasCountedDocument, isPremium, incrementDocumentsSigned]);

  const checkmarkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
  }));

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Show interstitial ad before sharing (for free users)
    showAd(async () => {
      setIsSharing(true);
      await shareDocument(signedPdfUri);
      setIsSharing(false);
    });
  };

  const handleSave = async () => {
    if (isSaved) {
      Alert.alert('Already Saved', 'This document has already been saved.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Show interstitial ad before saving (for free users)
    showAd(async () => {
      setIsSaving(true);
      try {
        const signedName = documentName.replace('.pdf', '_signed.pdf');
        const savedDoc = await saveDocument(signedPdfUri, signedName);
        addSavedDocument(savedDoc);
        setIsSaved(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Saved', 'Document saved to your library.');
      } catch (error) {
        console.error('Error saving document:', error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', 'Failed to save document. Please try again.');
      } finally {
        setIsSaving(false);
      }
    });
  };

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Show interstitial ad before navigating home
    showAd(() => {
      resetWorkflow();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    });
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={styles.successBanner}
        entering={FadeIn.duration(300)}
      >
        <Animated.View style={[styles.checkmarkCircle, checkmarkAnimatedStyle]}>
          <Text style={styles.successIcon}>✓</Text>
        </Animated.View>
        <View style={styles.successTextContainer}>
          <Text style={styles.successTitle}>Document Signed!</Text>
          <Text style={styles.successSubtitle}>Ready to share or save</Text>
        </View>
      </Animated.View>

      <View style={styles.pdfContainer}>
        <Pdf
          source={{ uri: signedPdfUri, cache: true }}
          style={styles.pdf}
          enablePaging={true}
        />
      </View>

      <Animated.View
        style={styles.footer}
        entering={FadeInDown.delay(200).springify()}
      >
        <View style={styles.actionRow}>
          <ActionButton
            title={isSharing ? 'Sharing...' : 'Share'}
            onPress={handleShare}
            variant="outline"
            loading={isSharing}
            disabled={isSharing}
            style={styles.actionButton}
            accessibilityLabel="Share document"
            accessibilityHint="Opens share sheet to share the signed document"
          />
          <ActionButton
            title={isSaved ? 'Saved ✓' : isSaving ? 'Saving...' : 'Save'}
            onPress={handleSave}
            variant={isSaved ? 'secondary' : 'outline'}
            loading={isSaving}
            disabled={isSaving || isSaved}
            style={styles.actionButton}
            accessibilityLabel={isSaved ? "Document saved" : "Save document"}
            accessibilityHint="Saves the signed document to your library"
          />
        </View>
        <ActionButton
          title="Done"
          onPress={handleDone}
          size="large"
          style={styles.doneButton}
          accessibilityLabel="Finish and return home"
          accessibilityHint="Completes the signing process and returns to home screen"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  checkmarkCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    fontSize: 24,
    color: COLORS.background,
    fontWeight: 'bold',
  },
  successTextContainer: {
    flex: 1,
  },
  successTitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.background,
    fontWeight: '700',
  },
  successSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(15, 15, 26, 0.7)',
    marginTop: 2,
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
  },
  pdf: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
  },
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
    ...SHADOWS.lg,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
  },
  doneButton: {
    width: '100%',
  },
});
