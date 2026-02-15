import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SignatureFont } from '../types';
import { SPACING } from '../utils/constants';
import { getFontFamily } from './FontSelector';

interface TypedSignaturePreviewProps {
  text: string;
  font: SignatureFont;
  signatureType: 'signature' | 'initials';
}

const TypedSignaturePreview = forwardRef<View, TypedSignaturePreviewProps>(
  ({ text, font, signatureType }, ref) => {
    const displayText = text || (signatureType === 'signature' ? 'Your Name' : 'AB');

    return (
      <View ref={ref} style={styles.signatureArea} collapsable={false}>
        <Text
          style={[
            styles.signatureText,
            { fontFamily: getFontFamily(font) },
            signatureType === 'initials' && styles.initialsText,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {displayText}
        </Text>
      </View>
    );
  }
);

TypedSignaturePreview.displayName = 'TypedSignaturePreview';

export default TypedSignaturePreview;

const styles = StyleSheet.create({
  signatureArea: {
    backgroundColor: 'transparent',
    padding: SPACING.lg,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signatureText: {
    fontSize: 48,
    color: '#000000',
  },
  initialsText: {
    fontSize: 64,
  },
});
