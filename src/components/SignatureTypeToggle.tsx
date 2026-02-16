import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SignatureType } from '../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, ANIMATION } from '../utils/constants';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SignatureTypeToggleProps {
  selectedType: SignatureType;
  onTypeChange: (type: SignatureType) => void;
}

interface ToggleOptionProps {
  type: SignatureType;
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

function ToggleOption({ type, label, isSelected, onPress }: ToggleOptionProps) {
  const scale = useSharedValue(1);
  const textColorProgress = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    textColorProgress.value = withTiming(isSelected ? 1 : 0, { duration: ANIMATION.fast });
  }, [isSelected, textColorProgress]);

  const animatedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      textColorProgress.value,
      [0, 1],
      [COLORS.textSecondary, COLORS.text]
    ),
  }));

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, ANIMATION.springBouncy);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, ANIMATION.springBouncy);
  }, [scale]);

  const handlePress = useCallback(() => {
    if (!isSelected) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }, [isSelected, onPress]);

  return (
    <AnimatedPressable
      style={[styles.option, animatedContainerStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="tab"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${label} type`}
      accessibilityHint={`Select ${label.toLowerCase()} as your signature type`}
    >
      <Animated.Text style={[styles.optionText, isSelected && styles.optionTextSelected, animatedTextStyle]}>
        {label}
      </Animated.Text>
    </AnimatedPressable>
  );
}

export default function SignatureTypeToggle({
  selectedType,
  onTypeChange,
}: SignatureTypeToggleProps) {
  const indicatorPosition = useSharedValue(selectedType === 'signature' ? 0 : 1);

  useEffect(() => {
    indicatorPosition.value = withSpring(
      selectedType === 'signature' ? 0 : 1,
      ANIMATION.spring
    );
  }, [selectedType, indicatorPosition]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    left: `${indicatorPosition.value * 50}%`,
  }));

  return (
    <View
      style={styles.container}
      accessibilityRole="tablist"
      accessibilityLabel="Signature type selector"
    >
      <Animated.View style={[styles.indicator, animatedIndicatorStyle]} />
      <ToggleOption
        type="signature"
        label="Signature"
        isSelected={selectedType === 'signature'}
        onPress={() => onTypeChange('signature')}
      />
      <ToggleOption
        type="initials"
        label="Initials"
        isSelected={selectedType === 'initials'}
        onPress={() => onTypeChange('initials')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xs,
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  indicator: {
    position: 'absolute',
    top: SPACING.xs,
    bottom: SPACING.xs,
    width: '50%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.glow,
  },
  option: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    minHeight: 44,
  },
  optionText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  optionTextSelected: {
    color: COLORS.text,
    fontWeight: '700',
  },
});
