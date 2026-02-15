import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  LayoutChangeEvent,
  Modal,
} from 'react-native';
import Pdf from 'react-native-pdf';
import { PlaceSignatureScreenProps } from '../types';
import { useDocumentStore } from '../store/useDocumentStore';
import { embedSignatureOnPdf } from '../services/pdfService';
import SignatureDraggable from '../components/SignatureDraggable';
import PageSelector from '../components/PageSelector';
import ActionButton from '../components/ActionButton';
import UpgradePrompt from '../components/UpgradePrompt';
import { useDocumentLimit } from '../hooks/useDocumentLimit';
import { useRewardedAd } from '../hooks/useRewardedAd';
import { COLORS, SPACING, FONT_SIZES, SIGNATURE_DEFAULT_SIZE } from '../utils/constants';

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

  const {
    canSignDocument,
    isAtLimit,
    isPremium,
    documentsSignedCount,
    additionalCredits,
    rewardedAdsWatched,
  } = useDocumentLimit();
  const { showRewardedAd, isLoaded: isRewardedAdLoaded, adsUntilCredit } = useRewardedAd();

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
      // Signature position is already relative to the PDF area (SignatureDraggable is inside PDF bounds)
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

  const handleConfirm = () => {
    // Check document limit before processing
    if (!canSignDocument) {
      setShowLimitModal(true);
      return;
    }
    processSignature();
  };

  const handleWatchAds = () => {
    setShowLimitModal(false);
    showRewardedAd(
      () => {
        // Reward earned - check if we now have credits
        Alert.alert(
          'Ad Completed!',
          `${adsUntilCredit - 1} more ad${adsUntilCredit - 1 !== 1 ? 's' : ''} until you earn another document signing.`,
          [{ text: 'OK' }]
        );
      },
      () => {
        // Ad closed - show modal again if still at limit
        // Small delay to let state update
        setTimeout(() => {
          if (!canSignDocument) {
            setShowLimitModal(true);
          }
        }, 500);
      }
    );
  };

  const handleUpgrade = () => {
    setShowLimitModal(false);
    navigation.navigate('Paywall');
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
          Drag to position • Pinch to resize
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
          fitPolicy={0}
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
              variant="outline"
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
