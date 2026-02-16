import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, ANIMATION } from '../utils/constants';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PageSelectorProps {
  totalPages: number;
  currentPage: number;
  onPageSelect: (page: number) => void;
}

interface PageButtonProps {
  pageNumber: number;
  isActive: boolean;
  onPress: () => void;
}

function PageButton({ pageNumber, isActive, onPress }: PageButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, ANIMATION.springBouncy);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, ANIMATION.springBouncy);
  }, [scale]);

  const handlePress = useCallback(() => {
    if (!isActive) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }, [isActive, onPress]);

  return (
    <AnimatedPressable
      style={[
        styles.pageButton,
        isActive && styles.pageButtonActive,
        animatedStyle,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={`Page ${pageNumber}`}
      accessibilityHint={isActive ? 'Currently selected page' : `Go to page ${pageNumber}`}
    >
      <Text
        style={[
          styles.pageText,
          isActive && styles.pageTextActive,
        ]}
      >
        {pageNumber}
      </Text>
    </AnimatedPressable>
  );
}

export default function PageSelector({
  totalPages,
  currentPage,
  onPageSelect,
}: PageSelectorProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <Animated.View
      style={styles.container}
      entering={FadeIn.delay(100).duration(200)}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        accessibilityRole="tablist"
        accessibilityLabel="Page navigation"
      >
        {Array.from({ length: totalPages }, (_, index) => (
          <PageButton
            key={index}
            pageNumber={index + 1}
            isActive={currentPage === index}
            onPress={() => onPageSelect(index)}
          />
        ))}
      </ScrollView>
      <Text
        style={styles.pageInfo}
        accessibilityLabel={`Page ${currentPage + 1} of ${totalPages}`}
        accessibilityRole="text"
      >
        Page {currentPage + 1} of {totalPages}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  pageButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pageButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.glow,
  },
  pageText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  pageTextActive: {
    color: COLORS.text,
    fontWeight: '700',
  },
  pageInfo: {
    textAlign: 'center',
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    fontWeight: '500',
  },
});
