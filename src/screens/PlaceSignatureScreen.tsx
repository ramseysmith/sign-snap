import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  LayoutChangeEvent,
} from 'react-native';
import Pdf from 'react-native-pdf';
import { PlaceSignatureScreenProps } from '../types';
import { useDocumentStore } from '../store/useDocumentStore';
import { embedSignatureOnPdf } from '../services/pdfService';
import SignatureDraggable from '../components/SignatureDraggable';
import PageSelector from '../components/PageSelector';
import ActionButton from '../components/ActionButton';
import { COLORS, SPACING, FONT_SIZES, SIGNATURE_DEFAULT_SIZE } from '../utils/constants';

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
  const [signaturePosition, setSignaturePosition] = useState({
    x: 50,
    y: 50,
    width: SIGNATURE_DEFAULT_SIZE.width,
    height: SIGNATURE_DEFAULT_SIZE.height,
  });

  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerDimensions({ width, height });
    setViewDimensions({ width, height });
  }, [setViewDimensions]);

  const handlePositionChange = useCallback(
    (x: number, y: number, width: number, height: number) => {
      setSignaturePosition({ x, y, width, height });
    },
    []
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleConfirm = async () => {
    if (!currentDocumentUri || !signatureBase64) {
      Alert.alert('Error', 'Missing document or signature data');
      return;
    }

    setIsProcessing(true);

    try {
      const placement = {
        x: signaturePosition.x,
        y: signaturePosition.y,
        width: signaturePosition.width,
        height: signaturePosition.height,
        pageIndex: currentPage,
      };

      setSignaturePlacement(placement);

      const signedPdfUri = await embedSignatureOnPdf(
        currentDocumentUri,
        signatureBase64,
        placement,
        containerDimensions
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
          onPageChanged={(page) => handlePageChange(page - 1)}
          enablePaging={true}
          horizontal={true}
        />

        {containerDimensions.width > 0 && (
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <SignatureDraggable
              signatureBase64={signatureBase64}
              containerWidth={containerDimensions.width}
              containerHeight={containerDimensions.height}
              initialX={signaturePosition.x}
              initialY={signaturePosition.y}
              initialWidth={SIGNATURE_DEFAULT_SIZE.width}
              initialHeight={SIGNATURE_DEFAULT_SIZE.height}
              onPositionChange={handlePositionChange}
            />
          </View>
        )}
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
});
