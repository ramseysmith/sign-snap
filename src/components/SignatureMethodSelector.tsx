import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SignatureInputMethod } from '../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, ANIMATION } from '../utils/constants';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SignatureMethodSelectorProps {
  onMethodSelect: (method: SignatureInputMethod) => void;
}

interface MethodOption {
  method: SignatureInputMethod;
  icon: string;
  label: string;
  description: string;
}

const methods: MethodOption[] = [
  {
    method: 'draw',
    icon: '✏️',
    label: 'Draw',
    description: 'Sign with your finger',
  },
  {
    method: 'image',
    icon: '📷',
    label: 'Photo',
    description: 'Capture your signature',
  },
  {
    method: 'typed',
    icon: '⌨️',
    label: 'Type',
    description: 'Choose a stylish font',
  },
];

interface MethodCardProps {
  option: MethodOption;
  onPress: () => void;
  delay: number;
}

function MethodCard({ option, onPress, delay }: MethodCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, ANIMATION.springBouncy);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, ANIMATION.springBouncy);
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <Animated.View
      style={styles.cardWrapper}
      entering={FadeInDown.delay(delay).springify()}
    >
      <AnimatedPressable
        style={[styles.methodCard, animatedStyle]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`${option.label} signature method`}
        accessibilityHint={option.description}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>{option.icon}</Text>
        </View>
        <Text style={styles.methodLabel}>{option.label}</Text>
        <Text style={styles.methodDescription}>{option.description}</Text>
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function SignatureMethodSelector({
  onMethodSelect,
}: SignatureMethodSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        Create New
      </Text>
      <View style={styles.methodsRow}>
        {methods.map((option, index) => (
          <MethodCard
            key={option.method}
            option={option}
            onPress={() => onMethodSelect(option.method)}
            delay={100 + index * 50}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  methodsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  cardWrapper: {
    flex: 1,
  },
  methodCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconText: {
    fontSize: 24,
  },
  methodLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  methodDescription: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
});
