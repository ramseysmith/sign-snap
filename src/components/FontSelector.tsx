import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SignatureFont } from '../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../utils/constants';

interface FontSelectorProps {
  fonts: SignatureFont[];
  selectedFont: SignatureFont;
  onFontSelect: (font: SignatureFont) => void;
  previewText: string;
}

const fontDisplayNames: Record<SignatureFont, string> = {
  'dancing-script': 'Dancing Script',
  'great-vibes': 'Great Vibes',
  'pacifico': 'Pacifico',
  'allura': 'Allura',
  'sacramento': 'Sacramento',
};

const fontFamilyMap: Record<SignatureFont, string> = {
  'dancing-script': 'DancingScript',
  'great-vibes': 'GreatVibes',
  'pacifico': 'Pacifico',
  'allura': 'Allura',
  'sacramento': 'Sacramento',
};

export function getFontFamily(font: SignatureFont): string {
  return fontFamilyMap[font];
}

export default function FontSelector({
  fonts,
  selectedFont,
  onFontSelect,
  previewText,
}: FontSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Font Style</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {fonts.map((font) => (
          <TouchableOpacity
            key={font}
            style={[
              styles.fontOption,
              selectedFont === font && styles.fontOptionSelected,
            ]}
            onPress={() => onFontSelect(font)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.fontPreview,
                { fontFamily: fontFamilyMap[font] },
              ]}
              numberOfLines={1}
            >
              {previewText || 'Abc'}
            </Text>
            <Text
              style={[
                styles.fontName,
                selectedFont === font && styles.fontNameSelected,
              ]}
            >
              {fontDisplayNames[font]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  scrollContent: {
    paddingRight: SPACING.md,
    gap: SPACING.sm,
  },
  fontOption: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  fontOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceLight,
  },
  fontPreview: {
    fontSize: 24,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  fontName: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  fontNameSelected: {
    color: COLORS.primary,
  },
});
