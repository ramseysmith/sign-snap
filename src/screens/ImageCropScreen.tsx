import React, { useState, useCallback } from 'react';
import {
  View,
  Image,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
  Text,
  Pressable,
  Alert,
} from 'react-native';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as ImageManipulator from 'expo-image-manipulator';
import DocumentScanner, { ResponseType } from 'react-native-document-scanner-plugin';
import { ImageCropScreenProps } from '../types';
import { useDocumentStore } from '../store/useDocumentStore';
import { imagesToPdf } from '../services/pdfService';
import ActionButton from '../components/ActionButton';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../utils/constants';

const MIN_CROP_SIZE = 50;
const HANDLE_SIZE = 32;
const HANDLE_HIT_SLOP = 20;
const EDGE_HIT_WIDTH = 44;

type HandleType =
  | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
  | 'top' | 'bottom' | 'left' | 'right'
  | 'move';

export default function ImageCropScreen({ navigation, route }: ImageCropScreenProps) {
  const { imageUri } = route.params;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { setCurrentDocument } = useDocumentStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [imageLayout, setImageLayout] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const [originalImageSize, setOriginalImageSize] = useState({ width: 0, height: 0 });

  // Calculate image display dimensions
  const maxImageHeight = screenHeight - 220;
  const maxImageWidth = screenWidth - 32;

  // Crop box shared values
  const cropX = useSharedValue(50);
  const cropY = useSharedValue(50);
  const cropWidth = useSharedValue(200);
  const cropHeight = useSharedValue(280);

  // Store initial values when image loads for reset functionality
  const [initialCrop, setInitialCrop] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const handleImageLoad = useCallback((event: { nativeEvent: { source: { width: number; height: number } } }) => {
    const { width: imgWidth, height: imgHeight } = event.nativeEvent.source;
    setOriginalImageSize({ width: imgWidth, height: imgHeight });

    // Calculate display size maintaining aspect ratio
    const aspectRatio = imgWidth / imgHeight;
    let displayWidth = maxImageWidth;
    let displayHeight = displayWidth / aspectRatio;

    if (displayHeight > maxImageHeight) {
      displayHeight = maxImageHeight;
      displayWidth = displayHeight * aspectRatio;
    }

    const x = (screenWidth - displayWidth) / 2;
    const y = 16;

    setImageLayout({ width: displayWidth, height: displayHeight, x, y });

    // Initialize crop box to cover most of the image
    const padding = 20;
    const initCrop = {
      x: padding,
      y: padding,
      width: displayWidth - padding * 2,
      height: displayHeight - padding * 2,
    };
    setInitialCrop(initCrop);

    cropX.value = initCrop.x;
    cropY.value = initCrop.y;
    cropWidth.value = initCrop.width;
    cropHeight.value = initCrop.height;
  }, [screenWidth, maxImageWidth, maxImageHeight]);

  const handleReset = useCallback(() => {
    cropX.value = withSpring(initialCrop.x);
    cropY.value = withSpring(initialCrop.y);
    cropWidth.value = withSpring(initialCrop.width);
    cropHeight.value = withSpring(initialCrop.height);
  }, [initialCrop]);

  // Auto-detect document edges using the scanner plugin
  const handleAutoDetect = useCallback(async () => {
    setIsDetecting(true);
    try {
      // Use document scanner to detect edges
      const result = await DocumentScanner.scanDocument({
        croppedImageQuality: 100,
        maxNumDocuments: 1,
        responseType: ResponseType.ImageFilePath,
      });

      if (result.scannedImages && result.scannedImages.length > 0) {
        // Go directly to document preview with the scanned image
        await goToDocumentPreview(result.scannedImages[0]);
      }
    } catch (error: any) {
      // User cancelled or error occurred
      if (error?.message !== 'User canceled the document scanner') {
        Alert.alert(
          'Detection Failed',
          'Could not auto-detect document edges. Please adjust manually.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsDetecting(false);
    }
  }, [navigation]);

  // Store start values for gestures
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startWidth = useSharedValue(0);
  const startHeight = useSharedValue(0);

  // Create gesture for a specific handle
  const createHandleGesture = (handleType: HandleType) => {
    return Gesture.Pan()
      .onStart(() => {
        startX.value = cropX.value;
        startY.value = cropY.value;
        startWidth.value = cropWidth.value;
        startHeight.value = cropHeight.value;
      })
      .onUpdate((event) => {
        const { translationX, translationY } = event;

        switch (handleType) {
          case 'move':
            // Move entire crop box
            const newMoveX = startX.value + translationX;
            const newMoveY = startY.value + translationY;
            cropX.value = Math.max(0, Math.min(newMoveX, imageLayout.width - cropWidth.value));
            cropY.value = Math.max(0, Math.min(newMoveY, imageLayout.height - cropHeight.value));
            break;

          case 'topLeft':
            // Resize from top-left corner
            const tlNewX = Math.max(0, Math.min(startX.value + translationX, startX.value + startWidth.value - MIN_CROP_SIZE));
            const tlNewY = Math.max(0, Math.min(startY.value + translationY, startY.value + startHeight.value - MIN_CROP_SIZE));
            cropWidth.value = startWidth.value + (startX.value - tlNewX);
            cropHeight.value = startHeight.value + (startY.value - tlNewY);
            cropX.value = tlNewX;
            cropY.value = tlNewY;
            break;

          case 'topRight':
            // Resize from top-right corner
            const trNewY = Math.max(0, Math.min(startY.value + translationY, startY.value + startHeight.value - MIN_CROP_SIZE));
            const trNewWidth = Math.max(MIN_CROP_SIZE, Math.min(startWidth.value + translationX, imageLayout.width - startX.value));
            cropWidth.value = trNewWidth;
            cropHeight.value = startHeight.value + (startY.value - trNewY);
            cropY.value = trNewY;
            break;

          case 'bottomLeft':
            // Resize from bottom-left corner
            const blNewX = Math.max(0, Math.min(startX.value + translationX, startX.value + startWidth.value - MIN_CROP_SIZE));
            const blNewHeight = Math.max(MIN_CROP_SIZE, Math.min(startHeight.value + translationY, imageLayout.height - startY.value));
            cropWidth.value = startWidth.value + (startX.value - blNewX);
            cropHeight.value = blNewHeight;
            cropX.value = blNewX;
            break;

          case 'bottomRight':
            // Resize from bottom-right corner
            cropWidth.value = Math.max(MIN_CROP_SIZE, Math.min(startWidth.value + translationX, imageLayout.width - startX.value));
            cropHeight.value = Math.max(MIN_CROP_SIZE, Math.min(startHeight.value + translationY, imageLayout.height - startY.value));
            break;

          case 'top':
            // Resize top edge only
            const topNewY = Math.max(0, Math.min(startY.value + translationY, startY.value + startHeight.value - MIN_CROP_SIZE));
            cropHeight.value = startHeight.value + (startY.value - topNewY);
            cropY.value = topNewY;
            break;

          case 'bottom':
            // Resize bottom edge only
            cropHeight.value = Math.max(MIN_CROP_SIZE, Math.min(startHeight.value + translationY, imageLayout.height - startY.value));
            break;

          case 'left':
            // Resize left edge only
            const leftNewX = Math.max(0, Math.min(startX.value + translationX, startX.value + startWidth.value - MIN_CROP_SIZE));
            cropWidth.value = startWidth.value + (startX.value - leftNewX);
            cropX.value = leftNewX;
            break;

          case 'right':
            // Resize right edge only
            cropWidth.value = Math.max(MIN_CROP_SIZE, Math.min(startWidth.value + translationX, imageLayout.width - startX.value));
            break;
        }
      });
  };

  // Create all gestures
  const moveGesture = createHandleGesture('move');
  const topLeftGesture = createHandleGesture('topLeft');
  const topRightGesture = createHandleGesture('topRight');
  const bottomLeftGesture = createHandleGesture('bottomLeft');
  const bottomRightGesture = createHandleGesture('bottomRight');
  const topGesture = createHandleGesture('top');
  const bottomGesture = createHandleGesture('bottom');
  const leftGesture = createHandleGesture('left');
  const rightGesture = createHandleGesture('right');

  const cropBoxStyle = useAnimatedStyle(() => ({
    left: cropX.value,
    top: cropY.value,
    width: cropWidth.value,
    height: cropHeight.value,
  }));

  // Overlay styles for darkening outside crop area
  const topOverlayStyle = useAnimatedStyle(() => ({
    height: cropY.value,
  }));

  const bottomOverlayStyle = useAnimatedStyle(() => ({
    top: cropY.value + cropHeight.value,
    height: imageLayout.height - (cropY.value + cropHeight.value),
  }));

  const leftOverlayStyle = useAnimatedStyle(() => ({
    top: cropY.value,
    width: cropX.value,
    height: cropHeight.value,
  }));

  const rightOverlayStyle = useAnimatedStyle(() => ({
    top: cropY.value,
    left: cropX.value + cropWidth.value,
    width: imageLayout.width - (cropX.value + cropWidth.value),
    height: cropHeight.value,
  }));

  // Navigate to document preview with a PDF created from the image
  const goToDocumentPreview = async (croppedImageUri: string) => {
    try {
      const pdfUri = await imagesToPdf([croppedImageUri]);
      const documentName = `Scanned_${new Date().toISOString().slice(0, 10)}.pdf`;
      setCurrentDocument(pdfUri, documentName);
      navigation.replace('DocumentPreview', {
        documentUri: pdfUri,
        documentName,
        isFromCamera: true,
      });
    } catch (error) {
      console.error('Error creating PDF:', error);
      Alert.alert('Error', 'Failed to create PDF. Please try again.');
    }
  };

  const handleCrop = async () => {
    if (imageLayout.width === 0 || originalImageSize.width === 0) return;

    setIsProcessing(true);
    try {
      // Calculate scale factor between display size and original image
      const scaleX = originalImageSize.width / imageLayout.width;
      const scaleY = originalImageSize.height / imageLayout.height;

      // Convert crop coordinates to original image coordinates
      const originX = Math.round(cropX.value * scaleX);
      const originY = Math.round(cropY.value * scaleY);
      const width = Math.round(cropWidth.value * scaleX);
      const height = Math.round(cropHeight.value * scaleY);

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX,
              originY,
              width,
              height,
            },
          },
        ],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Go to document preview with cropped image
      await goToDocumentPreview(result.uri);
    } catch (error) {
      console.error('Error cropping image:', error);
      Alert.alert('Error', 'Failed to crop image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = async () => {
    // Go directly to document preview with original image (no crop)
    setIsProcessing(true);
    await goToDocumentPreview(imageUri);
    setIsProcessing(false);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Header with instructions */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Adjust the crop area to fit your document</Text>
        <View style={styles.headerButtons}>
          <Pressable style={styles.headerButton} onPress={handleAutoDetect} disabled={isDetecting}>
            <Text style={styles.headerButtonText}>
              {isDetecting ? 'Detecting...' : 'Auto-Detect'}
            </Text>
          </Pressable>
          <Pressable style={styles.headerButton} onPress={handleReset}>
            <Text style={styles.headerButtonText}>Reset</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUri }}
          style={[
            styles.image,
            {
              width: imageLayout.width || maxImageWidth,
              height: imageLayout.height || maxImageHeight,
            },
          ]}
          onLoad={handleImageLoad}
          resizeMode="contain"
        />

        {imageLayout.width > 0 && (
          <View
            style={[
              styles.cropOverlayContainer,
              {
                left: imageLayout.x,
                top: imageLayout.y,
                width: imageLayout.width,
                height: imageLayout.height,
              },
            ]}
          >
            {/* Dark overlays outside crop area */}
            <Animated.View style={[styles.overlay, styles.overlayTop, topOverlayStyle]} />
            <Animated.View style={[styles.overlay, styles.overlayBottom, bottomOverlayStyle]} />
            <Animated.View style={[styles.overlay, styles.overlayLeft, leftOverlayStyle]} />
            <Animated.View style={[styles.overlay, styles.overlayRight, rightOverlayStyle]} />

            {/* Crop box */}
            <Animated.View style={[styles.cropBox, cropBoxStyle]}>
              {/* Move gesture area (center) */}
              <GestureDetector gesture={moveGesture}>
                <View style={styles.moveArea}>
                  {/* Grid lines */}
                  <View style={styles.gridContainer}>
                    <View style={[styles.gridLine, styles.gridLineVertical, { left: '33%' }]} />
                    <View style={[styles.gridLine, styles.gridLineVertical, { left: '66%' }]} />
                    <View style={[styles.gridLine, styles.gridLineHorizontal, { top: '33%' }]} />
                    <View style={[styles.gridLine, styles.gridLineHorizontal, { top: '66%' }]} />
                  </View>
                </View>
              </GestureDetector>

              {/* Edge handles */}
              <GestureDetector gesture={topGesture}>
                <View style={[styles.edgeHandle, styles.edgeTop]} />
              </GestureDetector>
              <GestureDetector gesture={bottomGesture}>
                <View style={[styles.edgeHandle, styles.edgeBottom]} />
              </GestureDetector>
              <GestureDetector gesture={leftGesture}>
                <View style={[styles.edgeHandle, styles.edgeLeft]} />
              </GestureDetector>
              <GestureDetector gesture={rightGesture}>
                <View style={[styles.edgeHandle, styles.edgeRight]} />
              </GestureDetector>

              {/* Corner handles */}
              <GestureDetector gesture={topLeftGesture}>
                <View style={[styles.cornerHandle, styles.cornerTopLeft]}>
                  <View style={[styles.cornerVisual, styles.cornerVisualTopLeft]} />
                </View>
              </GestureDetector>
              <GestureDetector gesture={topRightGesture}>
                <View style={[styles.cornerHandle, styles.cornerTopRight]}>
                  <View style={[styles.cornerVisual, styles.cornerVisualTopRight]} />
                </View>
              </GestureDetector>
              <GestureDetector gesture={bottomLeftGesture}>
                <View style={[styles.cornerHandle, styles.cornerBottomLeft]}>
                  <View style={[styles.cornerVisual, styles.cornerVisualBottomLeft]} />
                </View>
              </GestureDetector>
              <GestureDetector gesture={bottomRightGesture}>
                <View style={[styles.cornerHandle, styles.cornerBottomRight]}>
                  <View style={[styles.cornerVisual, styles.cornerVisualBottomRight]} />
                </View>
              </GestureDetector>
            </Animated.View>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <ActionButton
          title="Skip"
          onPress={handleSkip}
          variant="secondary"
          disabled={isProcessing}
          style={styles.controlButton}
        />
        <ActionButton
          title={isProcessing ? 'Cropping...' : 'Crop'}
          onPress={handleCrop}
          loading={isProcessing}
          disabled={isProcessing || imageLayout.width === 0}
          style={styles.controlButton}
        />
      </View>

      {(isProcessing || isDetecting) && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.processingText}>
            {isDetecting ? 'Detecting document...' : 'Cropping...'}
          </Text>
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  headerButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 16,
  },
  image: {
    borderRadius: BORDER_RADIUS.md,
  },
  cropOverlayContainer: {
    position: 'absolute',
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayTop: {
    top: 0,
    left: 0,
    right: 0,
  },
  overlayBottom: {
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayLeft: {
    left: 0,
  },
  overlayRight: {
    right: 0,
  },
  cropBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
  },
  moveArea: {
    flex: 1,
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  gridLineVertical: {
    width: 1,
    height: '100%',
  },
  gridLineHorizontal: {
    width: '100%',
    height: 1,
  },
  // Edge handles - invisible but large hit area
  edgeHandle: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  edgeTop: {
    top: -EDGE_HIT_WIDTH / 2,
    left: HANDLE_SIZE,
    right: HANDLE_SIZE,
    height: EDGE_HIT_WIDTH,
  },
  edgeBottom: {
    bottom: -EDGE_HIT_WIDTH / 2,
    left: HANDLE_SIZE,
    right: HANDLE_SIZE,
    height: EDGE_HIT_WIDTH,
  },
  edgeLeft: {
    left: -EDGE_HIT_WIDTH / 2,
    top: HANDLE_SIZE,
    bottom: HANDLE_SIZE,
    width: EDGE_HIT_WIDTH,
  },
  edgeRight: {
    right: -EDGE_HIT_WIDTH / 2,
    top: HANDLE_SIZE,
    bottom: HANDLE_SIZE,
    width: EDGE_HIT_WIDTH,
  },
  // Corner handles - large hit area
  cornerHandle: {
    position: 'absolute',
    width: HANDLE_SIZE + HANDLE_HIT_SLOP,
    height: HANDLE_SIZE + HANDLE_HIT_SLOP,
    zIndex: 10,
  },
  cornerTopLeft: {
    top: -(HANDLE_SIZE + HANDLE_HIT_SLOP) / 2,
    left: -(HANDLE_SIZE + HANDLE_HIT_SLOP) / 2,
  },
  cornerTopRight: {
    top: -(HANDLE_SIZE + HANDLE_HIT_SLOP) / 2,
    right: -(HANDLE_SIZE + HANDLE_HIT_SLOP) / 2,
  },
  cornerBottomLeft: {
    bottom: -(HANDLE_SIZE + HANDLE_HIT_SLOP) / 2,
    left: -(HANDLE_SIZE + HANDLE_HIT_SLOP) / 2,
  },
  cornerBottomRight: {
    bottom: -(HANDLE_SIZE + HANDLE_HIT_SLOP) / 2,
    right: -(HANDLE_SIZE + HANDLE_HIT_SLOP) / 2,
  },
  // Corner visual elements
  cornerVisual: {
    position: 'absolute',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
  },
  cornerVisualTopLeft: {
    bottom: 0,
    right: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: COLORS.primary,
  },
  cornerVisualTopRight: {
    bottom: 0,
    left: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: COLORS.primary,
  },
  cornerVisualBottomLeft: {
    top: 0,
    right: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: COLORS.primary,
  },
  cornerVisualBottomRight: {
    top: 0,
    left: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: COLORS.primary,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  controlButton: {
    flex: 1,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    marginTop: SPACING.md,
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
  },
});
