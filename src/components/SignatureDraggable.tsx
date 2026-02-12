import React from 'react';
import { StyleSheet, Image, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { COLORS, SIGNATURE_DEFAULT_SIZE, BORDER_RADIUS } from '../utils/constants';
import { clamp } from '../utils/helpers';

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

export default function SignatureDraggable({
  signatureBase64,
  containerWidth,
  containerHeight,
  initialX = 50,
  initialY = 50,
  initialWidth = SIGNATURE_DEFAULT_SIZE.width,
  initialHeight = SIGNATURE_DEFAULT_SIZE.height,
  onPositionChange,
}: SignatureDraggableProps) {
  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      const newX = clamp(
        startX.value + event.translationX,
        0,
        containerWidth - initialWidth * scale.value
      );
      const newY = clamp(
        startY.value + event.translationY,
        0,
        containerHeight - initialHeight * scale.value
      );
      translateX.value = newX;
      translateY.value = newY;
    })
    .onEnd(() => {
      onPositionChange?.(
        translateX.value,
        translateY.value,
        initialWidth * scale.value,
        initialHeight * scale.value
      );
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((event) => {
      scale.value = clamp(savedScale.value * event.scale, 0.5, 3);
    })
    .onEnd(() => {
      onPositionChange?.(
        translateX.value,
        translateY.value,
        initialWidth * scale.value,
        initialHeight * scale.value
      );
    });

  const composedGestures = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composedGestures}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <View style={styles.signatureWrapper}>
          <Image
            source={{ uri: signatureBase64 }}
            style={[styles.signature, { width: initialWidth, height: initialHeight }]}
            resizeMode="contain"
          />
        </View>
        <View style={styles.resizeHandle} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  signatureWrapper: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.sm,
    padding: 4,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
  },
  signature: {
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
