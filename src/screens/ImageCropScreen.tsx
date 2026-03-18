import React, { useState, useCallback, useMemo } from 'react';
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
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import * as ImageManipulator from 'expo-image-manipulator';
import { ImageCropScreenProps } from '../types';
import { useDocumentStore } from '../store/useDocumentStore';
import { imagesToPdf } from '../services/pdfService';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS } from '../utils/constants';

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_CROP_SIZE = 60;
const HANDLE_SIZE = 28;
const HANDLE_HIT_SLOP = 22;
const EDGE_HIT_WIDTH = 44;

// ─── Icons ────────────────────────────────────────────────────────────────────

function SignIcon({ size = 24, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20h9"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RetakeIcon({ size = 24, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 4v6h6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.51 15a9 9 0 1 0 .49-4.95"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CropIcon({ size = 24, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.13 1L6 16a2 2 0 0 0 2 2h15"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M1 6.13L16 6a2 2 0 0 1 2 2v15"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ResetIcon({ size = 18, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 3v5h5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ImageCropScreen({ navigation, route }: ImageCropScreenProps) {
  const { imageUri } = route.params;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { setCurrentDocument } = useDocumentStore();

  const [showCropUI, setShowCropUI] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // imageLayout stored in state (for JSX sizing/positioning) and as shared
  // values (so gesture worklets always get the correct image bounds).
  const [imageLayout, setImageLayout] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const [originalImageSize, setOriginalImageSize] = useState({ width: 0, height: 0 });

  // Shared values for image display bounds — used inside gesture worklets so
  // they are never stale even when gestures are created with useMemo([]).
  const imgW = useSharedValue(0);
  const imgH = useSharedValue(0);

  // Crop box in display-image coordinates (origin = top-left of displayed image)
  const cropX = useSharedValue(0);
  const cropY = useSharedValue(0);
  const cropW = useSharedValue(0);
  const cropH = useSharedValue(0);

  // Gesture start snapshots
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startW = useSharedValue(0);
  const startH = useSharedValue(0);

  // Initial crop values for reset (set when image loads)
  const [initialCrop, setInitialCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });

  // ─── Image load ─────────────────────────────────────────────────────────────

  // Available space for the image on screen (approximate — footer ≈ 180px)
  const maxImgH = screenHeight - 180;
  const maxImgW = screenWidth - 32;

  const handleImageLoad = useCallback(
    (event: { nativeEvent: { source: { width: number; height: number } } }) => {
      const { width: srcW, height: srcH } = event.nativeEvent.source;
      setOriginalImageSize({ width: srcW, height: srcH });

      // Scale down to fit the available box while preserving aspect ratio
      const ratio = srcW / srcH;
      let dW = maxImgW;
      let dH = dW / ratio;
      if (dH > maxImgH) {
        dH = maxImgH;
        dW = dH * ratio;
      }

      // Center horizontally; top = paddingTop (16)
      const lx = (screenWidth - dW) / 2;
      const ly = 16;
      setImageLayout({ width: dW, height: dH, x: lx, y: ly });

      // Push dimensions to shared values so gesture worklets see them
      imgW.value = dW;
      imgH.value = dH;

      // Default crop = full image edge-to-edge (ideal for document scanning)
      const init = { x: 0, y: 0, w: dW, h: dH };
      setInitialCrop(init);
      cropX.value = init.x;
      cropY.value = init.y;
      cropW.value = init.w;
      cropH.value = init.h;
    },
    [screenWidth, maxImgW, maxImgH],
  );

  // ─── Reset ──────────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    cropX.value = withSpring(initialCrop.x);
    cropY.value = withSpring(initialCrop.y);
    cropW.value = withSpring(initialCrop.w);
    cropH.value = withSpring(initialCrop.h);
  }, [initialCrop]);

  // ─── Gestures ───────────────────────────────────────────────────────────────
  //
  // All gestures are created once (useMemo with []) and only reference shared
  // values, so their worklets always operate on fresh data regardless of
  // when the image loaded.

  const gestures = useMemo(() => {
    const snap = () => {
      'worklet';
      startX.value = cropX.value;
      startY.value = cropY.value;
      startW.value = cropW.value;
      startH.value = cropH.value;
    };

    const move = Gesture.Pan()
      .onStart(snap)
      .onUpdate(({ translationX: tx, translationY: ty }) => {
        'worklet';
        cropX.value = Math.max(0, Math.min(startX.value + tx, imgW.value - cropW.value));
        cropY.value = Math.max(0, Math.min(startY.value + ty, imgH.value - cropH.value));
      });

    const topLeft = Gesture.Pan()
      .onStart(snap)
      .onUpdate(({ translationX: tx, translationY: ty }) => {
        'worklet';
        const nx = Math.max(0, Math.min(startX.value + tx, startX.value + startW.value - MIN_CROP_SIZE));
        const ny = Math.max(0, Math.min(startY.value + ty, startY.value + startH.value - MIN_CROP_SIZE));
        cropX.value = nx;
        cropY.value = ny;
        cropW.value = startW.value + (startX.value - nx);
        cropH.value = startH.value + (startY.value - ny);
      });

    const topRight = Gesture.Pan()
      .onStart(snap)
      .onUpdate(({ translationX: tx, translationY: ty }) => {
        'worklet';
        const ny = Math.max(0, Math.min(startY.value + ty, startY.value + startH.value - MIN_CROP_SIZE));
        cropY.value = ny;
        cropW.value = Math.max(MIN_CROP_SIZE, Math.min(startW.value + tx, imgW.value - startX.value));
        cropH.value = startH.value + (startY.value - ny);
      });

    const bottomLeft = Gesture.Pan()
      .onStart(snap)
      .onUpdate(({ translationX: tx, translationY: ty }) => {
        'worklet';
        const nx = Math.max(0, Math.min(startX.value + tx, startX.value + startW.value - MIN_CROP_SIZE));
        cropX.value = nx;
        cropW.value = startW.value + (startX.value - nx);
        cropH.value = Math.max(MIN_CROP_SIZE, Math.min(startH.value + ty, imgH.value - startY.value));
      });

    const bottomRight = Gesture.Pan()
      .onStart(snap)
      .onUpdate(({ translationX: tx, translationY: ty }) => {
        'worklet';
        cropW.value = Math.max(MIN_CROP_SIZE, Math.min(startW.value + tx, imgW.value - startX.value));
        cropH.value = Math.max(MIN_CROP_SIZE, Math.min(startH.value + ty, imgH.value - startY.value));
      });

    const edgeTop = Gesture.Pan()
      .onStart(snap)
      .onUpdate(({ translationY: ty }) => {
        'worklet';
        const ny = Math.max(0, Math.min(startY.value + ty, startY.value + startH.value - MIN_CROP_SIZE));
        cropY.value = ny;
        cropH.value = startH.value + (startY.value - ny);
      });

    const edgeBottom = Gesture.Pan()
      .onStart(snap)
      .onUpdate(({ translationY: ty }) => {
        'worklet';
        cropH.value = Math.max(MIN_CROP_SIZE, Math.min(startH.value + ty, imgH.value - startY.value));
      });

    const edgeLeft = Gesture.Pan()
      .onStart(snap)
      .onUpdate(({ translationX: tx }) => {
        'worklet';
        const nx = Math.max(0, Math.min(startX.value + tx, startX.value + startW.value - MIN_CROP_SIZE));
        cropX.value = nx;
        cropW.value = startW.value + (startX.value - nx);
      });

    const edgeRight = Gesture.Pan()
      .onStart(snap)
      .onUpdate(({ translationX: tx }) => {
        'worklet';
        cropW.value = Math.max(MIN_CROP_SIZE, Math.min(startW.value + tx, imgW.value - startX.value));
      });

    return { move, topLeft, topRight, bottomLeft, bottomRight, edgeTop, edgeBottom, edgeLeft, edgeRight };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // ^ Only shared values are referenced in worklets — stable references, no deps needed.

  // ─── Animated styles ────────────────────────────────────────────────────────

  const cropBoxStyle = useAnimatedStyle(() => ({
    left: cropX.value,
    top: cropY.value,
    width: cropW.value,
    height: cropH.value,
  }));

  const topOverlayStyle = useAnimatedStyle(() => ({ height: cropY.value }));
  const bottomOverlayStyle = useAnimatedStyle(() => ({
    top: cropY.value + cropH.value,
    height: imgH.value - (cropY.value + cropH.value),
  }));
  const leftOverlayStyle = useAnimatedStyle(() => ({
    top: cropY.value,
    width: cropX.value,
    height: cropH.value,
  }));
  const rightOverlayStyle = useAnimatedStyle(() => ({
    top: cropY.value,
    left: cropX.value + cropW.value,
    width: imgW.value - (cropX.value + cropW.value),
    height: cropH.value,
  }));

  // ─── Navigation helper ──────────────────────────────────────────────────────

  const goToDocumentPreview = async (uri: string) => {
    try {
      const pdfUri = await imagesToPdf([uri]);
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

  // ─── Button handlers ────────────────────────────────────────────────────────

  const handleSign = async () => {
    setIsProcessing(true);
    await goToDocumentPreview(imageUri);
    setIsProcessing(false);
  };

  const handleRetake = () => {
    navigation.goBack();
  };

  const handleApplyCrop = async () => {
    const displayW = imgW.value;
    const displayH = imgH.value;
    const srcW = originalImageSize.width;
    const srcH = originalImageSize.height;

    if (displayW === 0 || srcW === 0) return;

    setIsProcessing(true);
    try {
      // Scale factors from display pixels → original image pixels
      const scaleX = srcW / displayW;
      const scaleY = srcH / displayH;

      // Read directly from shared values — always up to date, no stale-state risk
      const dispX = cropX.value;
      const dispY = cropY.value;
      const dispW = cropW.value;
      const dispH = cropH.value;

      // Convert to original image coordinates
      let originX = Math.round(dispX * scaleX);
      let originY = Math.round(dispY * scaleY);
      let width   = Math.round(dispW * scaleX);
      let height  = Math.round(dispH * scaleY);

      // Hard-clamp to original image bounds to prevent ImageManipulator errors
      originX = Math.max(0, Math.min(originX, srcW - 1));
      originY = Math.max(0, Math.min(originY, srcH - 1));
      width   = Math.max(1, Math.min(width,  srcW - originX));
      height  = Math.max(1, Math.min(height, srcH - originY));

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ crop: { originX, originY, width, height } }],
        { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG },
      );

      await goToDocumentPreview(result.uri);
    } catch (error) {
      console.error('Error cropping image:', error);
      Alert.alert('Error', 'Failed to crop image. Please try again.');
      setIsProcessing(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Crop mode header */}
      {showCropUI && (
        <View style={styles.cropHeader}>
          <Pressable style={styles.cropHeaderBtn} onPress={handleReset}>
            <ResetIcon size={16} color={COLORS.primary} />
            <Text style={styles.cropHeaderBtnText}>Reset</Text>
          </Pressable>
          <Text style={styles.cropHeaderTitle}>Adjust Crop</Text>
          <Pressable style={styles.cropHeaderBtn} onPress={() => setShowCropUI(false)}>
            <Text style={styles.cropHeaderBtnText}>Cancel</Text>
          </Pressable>
        </View>
      )}

      {/* Image + crop overlay */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUri }}
          style={[
            styles.image,
            {
              width: imageLayout.width || maxImgW,
              height: imageLayout.height || maxImgH,
            },
          ]}
          onLoad={handleImageLoad}
          resizeMode="stretch" // exact dimensions — no letterboxing inside the box
        />

        {/* Crop overlay — only rendered when crop UI is active */}
        {showCropUI && imageLayout.width > 0 && (
          <View
            style={[
              styles.cropOverlay,
              {
                left: imageLayout.x,
                top: imageLayout.y,
                width: imageLayout.width,
                height: imageLayout.height,
              },
            ]}
          >
            {/* Dark masks outside the crop box */}
            <Animated.View style={[styles.mask, styles.maskTop, topOverlayStyle]} />
            <Animated.View style={[styles.mask, styles.maskBottom, bottomOverlayStyle]} />
            <Animated.View style={[styles.mask, styles.maskLeft, leftOverlayStyle]} />
            <Animated.View style={[styles.mask, styles.maskRight, rightOverlayStyle]} />

            {/* Crop box */}
            <Animated.View style={[styles.cropBox, cropBoxStyle]}>
              {/* Move (drag entire box) */}
              <GestureDetector gesture={gestures.move}>
                <View style={styles.moveArea}>
                  {/* Rule-of-thirds grid */}
                  <View style={StyleSheet.absoluteFill}>
                    <View style={[styles.grid, styles.gridV, { left: '33.3%' }]} />
                    <View style={[styles.grid, styles.gridV, { left: '66.6%' }]} />
                    <View style={[styles.grid, styles.gridH, { top: '33.3%' }]} />
                    <View style={[styles.grid, styles.gridH, { top: '66.6%' }]} />
                  </View>
                </View>
              </GestureDetector>

              {/* Edge handles */}
              <GestureDetector gesture={gestures.edgeTop}>
                <View style={[styles.edgeHandle, styles.edgeTop]} />
              </GestureDetector>
              <GestureDetector gesture={gestures.edgeBottom}>
                <View style={[styles.edgeHandle, styles.edgeBottom]} />
              </GestureDetector>
              <GestureDetector gesture={gestures.edgeLeft}>
                <View style={[styles.edgeHandle, styles.edgeLeft]} />
              </GestureDetector>
              <GestureDetector gesture={gestures.edgeRight}>
                <View style={[styles.edgeHandle, styles.edgeRight]} />
              </GestureDetector>

              {/* Corner handles */}
              <GestureDetector gesture={gestures.topLeft}>
                <View style={[styles.cornerHitbox, styles.cornerTL]}>
                  <View style={[styles.corner, styles.cornerTLVisual]} />
                </View>
              </GestureDetector>
              <GestureDetector gesture={gestures.topRight}>
                <View style={[styles.cornerHitbox, styles.cornerTR]}>
                  <View style={[styles.corner, styles.cornerTRVisual]} />
                </View>
              </GestureDetector>
              <GestureDetector gesture={gestures.bottomLeft}>
                <View style={[styles.cornerHitbox, styles.cornerBL]}>
                  <View style={[styles.corner, styles.cornerBLVisual]} />
                </View>
              </GestureDetector>
              <GestureDetector gesture={gestures.bottomRight}>
                <View style={[styles.cornerHitbox, styles.cornerBR]}>
                  <View style={[styles.corner, styles.cornerBRVisual]} />
                </View>
              </GestureDetector>
            </Animated.View>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {showCropUI ? (
          <>
            <Text style={styles.footerHint}>Drag handles or edges to adjust the crop area</Text>
            <Pressable
              style={[styles.applyBtn, isProcessing && styles.btnDisabled]}
              onPress={handleApplyCrop}
              disabled={isProcessing || imageLayout.width === 0}
            >
              <CropIcon size={20} color={COLORS.text} />
              <Text style={styles.applyBtnText}>
                {isProcessing ? 'Cropping...' : 'Apply Crop'}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.question}>Is your document capture ready?</Text>
            <View style={styles.actionRow}>
              <Pressable
                style={[styles.actionBtn, styles.actionBtnPrimary]}
                onPress={handleSign}
                disabled={isProcessing}
              >
                <SignIcon size={26} color={COLORS.text} />
                <Text style={styles.actionBtnLabel}>Sign</Text>
              </Pressable>

              <Pressable
                style={[styles.actionBtn, styles.actionBtnSecondary]}
                onPress={handleRetake}
                disabled={isProcessing}
              >
                <RetakeIcon size={26} color={COLORS.text} />
                <Text style={styles.actionBtnLabel}>Retake</Text>
              </Pressable>

              <Pressable
                style={[styles.actionBtn, styles.actionBtnOutline]}
                onPress={() => setShowCropUI(true)}
                disabled={isProcessing}
              >
                <CropIcon size={26} color={COLORS.primary} />
                <Text style={[styles.actionBtnLabel, styles.actionBtnLabelOutline]}>Crop</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>

      {/* Processing overlay */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.processingText}>Processing…</Text>
        </View>
      )}
    </GestureHandlerRootView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CORNER_HITBOX = HANDLE_SIZE + HANDLE_HIT_SLOP;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Crop header ──
  cropHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cropHeaderTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  cropHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    minWidth: 64,
  },
  cropHeaderBtnText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // ── Image area ──
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 16,
  },
  image: {
    borderRadius: BORDER_RADIUS.sm,
  },

  // ── Crop overlay ──
  cropOverlay: {
    position: 'absolute',
    // overflow: hidden removed — masks extend to image edges naturally
  },
  mask: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  maskTop:    { top: 0, left: 0, right: 0 },
  maskBottom: { left: 0, right: 0, bottom: 0 },
  maskLeft:   { left: 0 },
  maskRight:  { right: 0 },

  // ── Crop box ──
  cropBox: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  moveArea: {
    flex: 1,
  },
  grid: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  gridV: { width: 1, height: '100%' },
  gridH: { width: '100%', height: 1 },

  // ── Edge handles (invisible wide hit areas) ──
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

  // ── Corner handles ──
  cornerHitbox: {
    position: 'absolute',
    width: CORNER_HITBOX,
    height: CORNER_HITBOX,
    zIndex: 10,
  },
  cornerTL: { top: -CORNER_HITBOX / 2, left: -CORNER_HITBOX / 2 },
  cornerTR: { top: -CORNER_HITBOX / 2, right: -CORNER_HITBOX / 2 },
  cornerBL: { bottom: -CORNER_HITBOX / 2, left: -CORNER_HITBOX / 2 },
  cornerBR: { bottom: -CORNER_HITBOX / 2, right: -CORNER_HITBOX / 2 },

  corner: {
    position: 'absolute',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
  },
  cornerTLVisual: {
    bottom: 0,
    right: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#fff',
  },
  cornerTRVisual: {
    bottom: 0,
    left: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#fff',
  },
  cornerBLVisual: {
    top: 0,
    right: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#fff',
  },
  cornerBRVisual: {
    top: 0,
    left: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#fff',
  },

  // ── Footer ──
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
  },
  question: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.xs,
  },
  actionBtnPrimary: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.md,
    shadowColor: COLORS.primary,
  },
  actionBtnSecondary: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  actionBtnLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  actionBtnLabelOutline: {
    color: COLORS.primary,
  },
  footerHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    width: '100%',
    ...SHADOWS.md,
    shadowColor: COLORS.primary,
  },
  applyBtnText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  btnDisabled: {
    opacity: 0.5,
  },

  // ── Processing overlay ──
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    marginTop: SPACING.md,
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
  },
});
