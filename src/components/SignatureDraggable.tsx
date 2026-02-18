import React, { useEffect, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, Image, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { COLORS, SIGNATURE_DEFAULT_SIZE, BORDER_RADIUS, ANIMATION } from '../utils/constants';

// Inline worklet function for clamping values
const clamp = (value: number, min: number, max: number): number => {
  'worklet';
  return Math.min(Math.max(value, min), max);
};

const MIN_SCALE = 0.2;
const MAX_SCALE = 3;
const SCALE_STEP = 0.15;

interface SignatureDraggableProps {
  signatureBase64: string;
  containerWidth: number;
  containerHeight: number;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
  onPositionChange?: (x: number, y: number, width: number, height: number) => void;
}

export interface SignatureDraggableRef {
  increaseSize: () => void;
  decreaseSize: () => void;
}

const SignatureDraggable = forwardRef<SignatureDraggableRef, SignatureDraggableProps>(function SignatureDraggable({
  signatureBase64,
  containerWidth,
  containerHeight,
  initialX = 50,
  initialY = 50,
  initialWidth = SIGNATURE_DEFAULT_SIZE.width,
  initialHeight = SIGNATURE_DEFAULT_SIZE.height,
  onPositionChange,
}, ref) {
  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // Calculate current dimensions based on scale
  const currentWidth = useDerivedValue(() => initialWidth * scale.value);
  const currentHeight = useDerivedValue(() => initialHeight * scale.value);

  // Report initial position on mount
  useEffect(() => {
    if (onPositionChange) {
      onPositionChange(initialX, initialY, initialWidth, initialHeight);
    }
  }, []);

  // Expose resize methods via ref
  useImperativeHandle(ref, () => ({
    increaseSize: () => {
      const newScale = clamp(scale.value + SCALE_STEP, MIN_SCALE, MAX_SCALE);
      const newWidth = initialWidth * newScale;
      const newHeight = initialHeight * newScale;

      // Clamp position to keep signature within bounds
      const clampedX = clamp(translateX.value, 0, containerWidth - newWidth);
      const clampedY = clamp(translateY.value, 0, containerHeight - newHeight);

      translateX.value = clampedX;
      translateY.value = clampedY;
      scale.value = withSpring(newScale, ANIMATION.springBouncy);

      if (onPositionChange) {
        onPositionChange(clampedX, clampedY, newWidth, newHeight);
      }
    },
    decreaseSize: () => {
      const newScale = clamp(scale.value - SCALE_STEP, MIN_SCALE, MAX_SCALE);
      const newWidth = initialWidth * newScale;
      const newHeight = initialHeight * newScale;

      scale.value = withSpring(newScale, ANIMATION.springBouncy);

      if (onPositionChange) {
        onPositionChange(translateX.value, translateY.value, newWidth, newHeight);
      }
    },
  }), [containerWidth, containerHeight, initialWidth, initialHeight, onPositionChange]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      'worklet';
      const newX = clamp(
        startX.value + event.translationX,
        0,
        containerWidth - currentWidth.value
      );
      const newY = clamp(
        startY.value + event.translationY,
        0,
        containerHeight - currentHeight.value
      );
      translateX.value = newX;
      translateY.value = newY;
    })
    .onEnd(() => {
      'worklet';
      if (onPositionChange) {
        runOnJS(onPositionChange)(
          translateX.value,
          translateY.value,
          currentWidth.value,
          currentHeight.value
        );
      }
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      'worklet';
      savedScale.value = scale.value;
    })
    .onUpdate((event) => {
      'worklet';
      const newScale = clamp(savedScale.value * event.scale, MIN_SCALE, MAX_SCALE);
      const newWidth = initialWidth * newScale;
      const newHeight = initialHeight * newScale;

      // Clamp position to keep signature within bounds after resize
      translateX.value = clamp(translateX.value, 0, containerWidth - newWidth);
      translateY.value = clamp(translateY.value, 0, containerHeight - newHeight);
      scale.value = newScale;
    })
    .onEnd(() => {
      'worklet';
      if (onPositionChange) {
        runOnJS(onPositionChange)(
          translateX.value,
          translateY.value,
          currentWidth.value,
          currentHeight.value
        );
      }
    });

  const composedGestures = Gesture.Simultaneous(panGesture, pinchGesture);

  // Use left/top positioning instead of translate + scale to ensure accurate coordinates
  const animatedStyle = useAnimatedStyle(() => ({
    left: translateX.value,
    top: translateY.value,
    width: currentWidth.value,
    height: currentHeight.value,
  }));

  return (
    <GestureDetector gesture={composedGestures}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <View style={styles.signatureWrapper}>
          <Image
            source={{ uri: signatureBase64 }}
            style={styles.signature}
            resizeMode="contain"
          />
        </View>
        <View style={styles.resizeHandle} />
      </Animated.View>
    </GestureDetector>
  );
});

export default SignatureDraggable;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  signatureWrapper: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signature: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  resizeHandle: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.text,
  },
});
