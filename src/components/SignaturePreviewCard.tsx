import React, { useCallback } from 'react';
import { View, Text, Image, StyleSheet, Alert, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SavedSignature } from '../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, ANIMATION } from '../utils/constants';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SignaturePreviewCardProps {
  signature: SavedSignature;
  isSelected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export default function SignaturePreviewCard({
  signature,
  isSelected = false,
  onSelect,
  onDelete,
  showActions = true,
}: SignaturePreviewCardProps) {
  const scale = useSharedValue(1);
  const deleteScale = useSharedValue(1);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedDeleteStyle = useAnimatedStyle(() => ({
    transform: [{ scale: deleteScale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, ANIMATION.springBouncy);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, ANIMATION.springBouncy);
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect?.();
  }, [onSelect]);

  const handleDeletePressIn = useCallback(() => {
    deleteScale.value = withSpring(0.9, ANIMATION.springBouncy);
  }, [deleteScale]);

  const handleDeletePressOut = useCallback(() => {
    deleteScale.value = withSpring(1, ANIMATION.springBouncy);
  }, [deleteScale]);

  const handleDelete = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Signature',
      `Are you sure you want to delete "${signature.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onDelete?.();
          },
        },
      ]
    );
  }, [signature.name, onDelete]);

  const getMethodLabel = () => {
    switch (signature.inputMethod) {
      case 'draw':
        return 'Drawn';
      case 'image':
        return 'Photo';
      case 'typed':
        return 'Typed';
      default:
        return '';
    }
  };

  const getMethodIcon = () => {
    switch (signature.inputMethod) {
      case 'draw':
        return '✏️';
      case 'image':
        return '📷';
      case 'typed':
        return '⌨️';
      default:
        return '';
    }
  };

  return (
    <AnimatedPressable
      style={[
        styles.container,
        isSelected && styles.containerSelected,
        animatedContainerStyle,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onSelect}
      accessibilityRole="button"
      accessibilityLabel={`${signature.name}, ${getMethodLabel()} ${signature.type}`}
      accessibilityHint={onSelect ? "Double tap to select this signature" : undefined}
      accessibilityState={{ selected: isSelected }}
    >
      <View style={[styles.imageContainer, isSelected && styles.imageContainerSelected]}>
        <Image
          source={{ uri: signature.base64 }}
          style={styles.image}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1}>
          {signature.name}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.methodIcon}>{getMethodIcon()}</Text>
          <Text style={styles.metaText}>{getMethodLabel()}</Text>
          <View style={styles.metaDot} />
          <Text style={styles.metaText}>
            {signature.type === 'signature' ? 'Signature' : 'Initials'}
          </Text>
        </View>
      </View>

      {showActions && onDelete && (
        <AnimatedPressable
          style={[styles.deleteButton, animatedDeleteStyle]}
          onPress={handleDelete}
          onPressIn={handleDeletePressIn}
          onPressOut={handleDeletePressOut}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${signature.name}`}
          accessibilityHint="Double tap to delete this signature"
        >
          <Text style={styles.deleteText}>✕</Text>
        </AnimatedPressable>
      )}

      {isSelected && (
        <View style={styles.selectedIndicator}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  containerSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
    ...SHADOWS.glow,
  },
  imageContainer: {
    width: 80,
    height: 50,
    backgroundColor: COLORS.canvas,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainerSelected: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  name: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  metaText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.textMuted,
    marginHorizontal: SPACING.sm,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deleteText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  checkmark: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: 'bold',
  },
});
