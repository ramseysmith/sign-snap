import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SavedSignature } from '../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../utils/constants';

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
  const handleDelete = () => {
    Alert.alert(
      'Delete Signature',
      `Are you sure you want to delete "${signature.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

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

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.containerSelected]}
      onPress={onSelect}
      activeOpacity={0.7}
      disabled={!onSelect}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: signature.base64 }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1}>
          {signature.name}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{getMethodLabel()}</Text>
          <Text style={styles.metaDot}>{'\u2022'}</Text>
          <Text style={styles.metaText}>
            {signature.type === 'signature' ? 'Signature' : 'Initials'}
          </Text>
        </View>
      </View>

      {showActions && onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.deleteText}>X</Text>
        </TouchableOpacity>
      )}

      {isSelected && <View style={styles.selectedIndicator} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  containerSelected: {
    borderColor: COLORS.primary,
  },
  imageContainer: {
    width: 80,
    height: 50,
    backgroundColor: COLORS.text,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
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
  metaText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  metaDot: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginHorizontal: SPACING.xs,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  selectedIndicator: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 12,
    height: 12,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
  },
});
