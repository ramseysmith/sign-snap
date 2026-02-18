import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  LayoutChangeEvent,
  Modal,
  Pressable,
} from 'react-native';
import Pdf from 'react-native-pdf';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlaceSignatureScreenProps } from '../types';
import { useDocumentStore } from '../store/useDocumentStore';
import { embedSignatureOnPdf } from '../services/pdfService';
import SignatureDraggable, { SignatureDraggableRef } from '../components/SignatureDraggable';
import PageSelector from '../components/PageSelector';
import ActionButton from '../components/ActionButton';
import UpgradePrompt from '../components/UpgradePrompt';
import { useDocumentLimit } from '../hooks/useDocumentLimit';
import { useRewardedAd } from '../hooks/useRewardedAd';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { FREE_TIER_LIMITS } from '../config/monetization';
import { COLORS, SPACING, FONT_SIZES, SIGNATURE_DEFAULT_SIZE, BORDER_RADIUS } from '../utils/constants';

interface PdfPageInfo {
  width: number;
  height: number;
}

interface RenderedPdfInfo {
  // The actual rendered size of the PDF on screen
  renderedWidth: number;
  renderedHeight: number;
  // Offset from container edges (letterboxing)
  offsetX: number;
  offsetY: number;
  // Original PDF dimensions
  pdfWidth: number;
  pdfHeight: number;
}

export default function PlaceSignatureScreen({
  navigation,
  route,
}: PlaceSignatureScreenProps) {
  const {
    currentDocumentUri,
    currentDocumentName,
    signatureBase64,
    totalPages,
    currentPage,
    setCurrentPage,
    setSignaturePlacement,
    setViewDimensions,
  } = useDocumentStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [pdfPageInfo, setPdfPageInfo] = useState<PdfPageInfo | null>(null);
  const [signaturePosition, setSignaturePosition] = useState({
    x: 50,
    y: 50,
    width: SIGNATURE_DEFAULT_SIZE.width,
    height: SIGNATURE_DEFAULT_SIZE.height,
  });
  const [showLimitModal, setShowLimitModal] = useState(false);
  const signatureRef = useRef<SignatureDraggableRef>(null);

  const {
    canSignDocument,
    isAtLimit,
    isPremium,
    documentsSignedCount,
    additionalCredits,
    rewardedAdsWatched,
    incrementDocumentsSigned,
  } = useDocumentLimit();
  const { showRewardedAd, isLoaded: isRewardedAdLoaded } = useRewardedAd();

  // Calculate how the PDF is rendered within the container
  const getRenderedPdfInfo = useCallback((): RenderedPdfInfo | null => {
    if (!pdfPageInfo || containerDimensions.width === 0) return null;

    const containerAspect = containerDimensions.width / containerDimensions.height;
    const pdfAspect = pdfPageInfo.width / pdfPageInfo.height;

    let renderedWidth: number;
    let renderedHeight: number;
    let offsetX: number;
    let offsetY: number;

    if (pdfAspect > containerAspect) {
      // PDF is wider - fit to width, letterbox top/bottom
      renderedWidth = containerDimensions.width;
      renderedHeight = containerDimensions.width / pdfAspect;
      offsetX = 0;
      offsetY = (containerDimensions.height - renderedHeight) / 2;
    } else {
      // PDF is taller - fit to height, letterbox left/right
      renderedHeight = containerDimensions.height;
      renderedWidth = containerDimensions.height * pdfAspect;
      offsetX = (containerDimensions.width - renderedWidth) / 2;
      offsetY = 0;
    }

    return {
      renderedWidth,
      renderedHeight,
      offsetX,
      offsetY,
      pdfWidth: pdfPageInfo.width,
      pdfHeight: pdfPageInfo.height,
    };
  }, [pdfPageInfo, containerDimensions]);

  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerDimensions({ width, height });
    setViewDimensions({ width, height });
  }, [setViewDimensions]);

  const handlePdfLoadComplete = useCallback((numberOfPages: number, path: string, size: { width: number; height: number }) => {
    setPdfPageInfo({ width: size.width, height: size.height });
  }, []);

  const handlePositionChange = useCallback(
    (x: number, y: number, width: number, height: number) => {
      setSignaturePosition({ x, y, width, height });
    },
    []
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const processSignature = async () => {
    if (!currentDocumentUri || !signatureBase64) {
      Alert.alert('Error', 'Missing document or signature data');
      return;
    }

    const renderedInfo = getRenderedPdfInfo();
    if (!renderedInfo) {
      Alert.alert('Error', 'PDF not loaded properly');
      return;
    }

    setIsProcessing(true);

    try {
      // Signature position is relative to the un-zoomed PDF overlay
      const placement = {
        x: signaturePosition.x,
        y: signaturePosition.y,
        width: signaturePosition.width,
        height: signaturePosition.height,
        pageIndex: currentPage,
      };

      setSignaturePlacement(placement);

      // Pass the rendered PDF dimensions (not container dimensions)
      const renderedDimensions = {
        width: renderedInfo.renderedWidth,
        height: renderedInfo.renderedHeight,
      };

      const signedPdfUri = await embedSignatureOnPdf(
        currentDocumentUri,
        signatureBase64,
        placement,
        renderedDimensions
      );

      navigation.navigate('FinalPreview', {
        signedPdfUri,
        documentName: currentDocumentName || 'signed_document.pdf',
      });
    } catch (error) {
      console.error('Error embedding signature:', error);
      Alert.alert('Error', 'Failed to embed signature. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    // Get fresh state directly from store (not from potentially stale hook values)
    const store = useSubscriptionStore.getState();
    const maxFree = FREE_TIER_LIMITS.maxDocumentSignings;
    const baseRemaining = Math.max(0, maxFree - store.documentsSignedCount);
    const totalRemaining = baseRemaining + store.additionalDocumentCredits;
    const canSign = store.isPremium || totalRemaining > 0;

    console.log('[SIGNING] handleConfirm - count:', store.documentsSignedCount, 'credits:', store.additionalDocumentCredits, 'canSign:', canSign);

    // Check document limit before processing
    if (!canSign) {
      setShowLimitModal(true);
      return;
    }

    // Deduct from user's signing allowance (for free users)
    if (!store.isPremium) {
      if (store.documentsSignedCount < maxFree) {
        // Still has free signings - increment the count
        store.incrementDocumentsSigned();
        console.log(`[SIGNING] Used free signing. New count: ${useSubscriptionStore.getState().documentsSignedCount}`);
      } else if (store.additionalDocumentCredits > 0) {
        // Using additional credits earned from ads
        store.useDocumentCredit();
        console.log(`[SIGNING] Used additional credit. Remaining: ${useSubscriptionStore.getState().additionalDocumentCredits}`);
      }

      // Force immediate persist to AsyncStorage
      const updatedState = useSubscriptionStore.getState();
      try {
        await AsyncStorage.setItem(
          'subscription-storage',
          JSON.stringify({
            state: {
              isPremium: updatedState.isPremium,
              documentsSignedCount: updatedState.documentsSignedCount,
              additionalDocumentCredits: updatedState.additionalDocumentCredits,
              rewardedAdsWatched: updatedState.rewardedAdsWatched,
            },
            version: 0,
          })
        );
        console.log(`[SIGNING] Persisted - count: ${updatedState.documentsSignedCount}, credits: ${updatedState.additionalDocumentCredits}`);
      } catch (e) {
        console.error('Failed to persist document count:', e);
      }
    }

    processSignature();
  };

  const handleWatchAds = () => {
    if (!isRewardedAdLoaded) {
      Alert.alert(
        'Ad Not Ready',
        'The ad is still loading. Please try again in a moment.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Don't hide the modal - it will stay behind the ad and show updated progress when ad closes
    showRewardedAd(
      () => {
        // Reward earned - modal will refresh with updated progress
      },
      () => {
        // Ad closed - check fresh state from store to see if user can now sign
        // Use setTimeout to allow zustand state to propagate
        setTimeout(() => {
          const state = useSubscriptionStore.getState();
          const baseRemaining = Math.max(0, FREE_TIER_LIMITS.maxDocumentSignings - state.documentsSignedCount);
          const totalRemaining = baseRemaining + state.additionalDocumentCredits;
          const canSign = state.isPremium || totalRemaining > 0;

          if (canSign) {
            // User earned enough credits to sign - close modal and proceed
            setShowLimitModal(false);
          }
          // If still at limit, modal stays visible with updated progress
        }, 100);
      }
    );
  };

  const handleUpgrade = () => {
    setShowLimitModal(false);
    navigation.navigate('Paywall');
  };

  const handleIncreaseSize = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    signatureRef.current?.increaseSize();
  };

  const handleDecreaseSize = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    signatureRef.current?.decreaseSize();
  };

  if (!currentDocumentUri || !signatureBase64) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Missing document or signature data</Text>
        <ActionButton
          title="Go Back"
          onPress={() => navigation.goBack()}
          variant="outline"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.instructionContainer}>
        <Text style={styles.instruction}>
          Drag signature to position • Pinch signature to resize
        </Text>
      </View>

      <View style={styles.pdfContainer} onLayout={handleContainerLayout}>
        <Pdf
          source={{ uri: currentDocumentUri, cache: true }}
          page={currentPage + 1}
          style={styles.pdf}
          onLoadComplete={handlePdfLoadComplete}
          onPageChanged={(page) => handlePageChange(page - 1)}
          enablePaging={true}
          horizontal={true}
          fitPolicy={2}
          minScale={1.0}
          maxScale={1.0}
        />

        {containerDimensions.width > 0 && (() => {
          const renderedInfo = getRenderedPdfInfo();
          if (!renderedInfo) return null;

          return (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  left: renderedInfo.offsetX,
                  top: renderedInfo.offsetY,
                  width: renderedInfo.renderedWidth,
                  height: renderedInfo.renderedHeight,
                  right: undefined,
                  bottom: undefined,
                }
              ]}
              pointerEvents="box-none"
            >
              <SignatureDraggable
                ref={signatureRef}
                signatureBase64={signatureBase64}
                containerWidth={renderedInfo.renderedWidth}
                containerHeight={renderedInfo.renderedHeight}
                initialX={Math.min(signaturePosition.x, renderedInfo.renderedWidth - SIGNATURE_DEFAULT_SIZE.width)}
                initialY={Math.min(signaturePosition.y, renderedInfo.renderedHeight - SIGNATURE_DEFAULT_SIZE.height)}
                initialWidth={SIGNATURE_DEFAULT_SIZE.width}
                initialHeight={SIGNATURE_DEFAULT_SIZE.height}
                onPositionChange={handlePositionChange}
              />
            </View>
          );
        })()}

      </View>

      <PageSelector
        totalPages={totalPages}
        currentPage={currentPage}
        onPageSelect={handlePageChange}
      />

      {/* Size control buttons */}
      <View style={styles.sizeControlsContainer}>
        <Text style={styles.sizeControlsLabel}>Signature Size</Text>
        <View style={styles.sizeControls}>
          <Pressable
            style={styles.sizeButton}
            onPress={handleDecreaseSize}
            accessibilityLabel="Decrease signature size"
            accessibilityRole="button"
          >
            <Text style={styles.sizeButtonText}>−</Text>
          </Pressable>
          <Pressable
            style={styles.sizeButton}
            onPress={handleIncreaseSize}
            accessibilityLabel="Increase signature size"
            accessibilityRole="button"
          >
            <Text style={styles.sizeButtonText}>+</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.footer}>
        <ActionButton
          title="Back"
          onPress={() => navigation.goBack()}
          variant="outline"
          style={styles.button}
        />
        <ActionButton
          title={isProcessing ? 'Processing...' : 'Confirm'}
          onPress={handleConfirm}
          loading={isProcessing}
          disabled={isProcessing}
          style={styles.button}
        />
      </View>

      {isProcessing && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.processingText}>Embedding signature...</Text>
        </View>
      )}

      {/* Document Limit Modal */}
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  instructionContainer: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  instruction: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    position: 'relative',
  },
  pdf: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
  },
  sizeControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
  },
  sizeControlsLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  sizeControls: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  sizeButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sizeButtonText: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text,
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  button: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    marginTop: SPACING.md,
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
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
});
