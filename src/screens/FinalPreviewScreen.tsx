import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import Pdf from 'react-native-pdf';
import { FinalPreviewScreenProps } from '../types';
import { useDocumentStore } from '../store/useDocumentStore';
import { shareDocument } from '../services/shareService';
import { saveDocument } from '../services/fileService';
import ActionButton from '../components/ActionButton';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../utils/constants';
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
    canSignDocument,
    isAtLimit,
    isPremium,
    remainingSignings,
    incrementDocumentsSigned,
    useDocumentCredit,
    adsNeededForNextCredit,
  } = useDocumentLimit();
  const { showRewardedAd, isLoaded: isRewardedAdLoaded, adsUntilCredit } = useRewardedAd();

  // Count this document signing when user arrives at this screen
  useEffect(() => {
    if (!hasCountedDocument && !isPremium) {
      incrementDocumentsSigned();
      setHasCountedDocument(true);
    }
  }, [hasCountedDocument, isPremium, incrementDocumentsSigned]);

  const handleShare = async () => {
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

    // Show interstitial ad before saving (for free users)
    showAd(async () => {
      setIsSaving(true);
      try {
        const signedName = documentName.replace('.pdf', '_signed.pdf');
        const savedDoc = await saveDocument(signedPdfUri, signedName);
        addSavedDocument(savedDoc);
        setIsSaved(true);
        Alert.alert('Saved', 'Document saved to your library.');
      } catch (error) {
        console.error('Error saving document:', error);
        Alert.alert('Error', 'Failed to save document. Please try again.');
      } finally {
        setIsSaving(false);
      }
    });
  };

  const handleDone = () => {
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
      <View style={styles.successBanner}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successText}>Document Signed Successfully!</Text>
      </View>

      <View style={styles.pdfContainer}>
        <Pdf
          source={{ uri: signedPdfUri, cache: true }}
          style={styles.pdf}
          enablePaging={true}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.actionRow}>
          <ActionButton
            title={isSharing ? 'Sharing...' : 'Share'}
            onPress={handleShare}
            variant="outline"
            loading={isSharing}
            disabled={isSharing}
            style={styles.actionButton}
          />
          <ActionButton
            title={isSaved ? 'Saved ✓' : isSaving ? 'Saving...' : 'Save'}
            onPress={handleSave}
            variant={isSaved ? 'secondary' : 'outline'}
            loading={isSaving}
            disabled={isSaving || isSaved}
            style={styles.actionButton}
          />
        </View>
        <ActionButton
          title="Done"
          onPress={handleDone}
          size="large"
          style={styles.doneButton}
        />
      </View>
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
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  successIcon: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.background,
    fontWeight: 'bold',
  },
  successText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
    fontWeight: '600',
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
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
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
