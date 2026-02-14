import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SignatureType } from '../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../utils/constants';

interface SignatureTypeToggleProps {
  selectedType: SignatureType;
  onTypeChange: (type: SignatureType) => void;
}

export default function SignatureTypeToggle({
  selectedType,
  onTypeChange,
}: SignatureTypeToggleProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.option,
          selectedType === 'signature' && styles.optionSelected,
        ]}
        onPress={() => onTypeChange('signature')}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.optionText,
            selectedType === 'signature' && styles.optionTextSelected,
          ]}
        >
          Signature
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.option,
          selectedType === 'initials' && styles.optionSelected,
        ]}
        onPress={() => onTypeChange('initials')}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.optionText,
            selectedType === 'initials' && styles.optionTextSelected,
          ]}
        >
          Initials
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xs,
  },
  option: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: COLORS.primary,
  },
  optionText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  optionTextSelected: {
    color: COLORS.text,
  },
});
