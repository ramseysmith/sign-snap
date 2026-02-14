import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SignatureInputMethod } from '../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../utils/constants';

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
    icon: 'Pencil',
    label: 'Draw',
    description: 'Sign with your finger',
  },
  {
    method: 'image',
    icon: 'Camera',
    label: 'Photo',
    description: 'Take or upload a photo',
  },
  {
    method: 'typed',
    icon: 'Type',
    label: 'Type',
    description: 'Type with a stylish font',
  },
];

export default function SignatureMethodSelector({
  onMethodSelect,
}: SignatureMethodSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New</Text>
      <View style={styles.methodsRow}>
        {methods.map((option) => (
          <TouchableOpacity
            key={option.method}
            style={styles.methodCard}
            onPress={() => onMethodSelect(option.method)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>{option.icon}</Text>
            </View>
            <Text style={styles.methodLabel}>{option.label}</Text>
            <Text style={styles.methodDescription}>{option.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  methodsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  methodCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  methodLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  methodDescription: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
