import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SignatureScreenProps } from '../types';
import { useDocumentStore } from '../store/useDocumentStore';
import SignaturePad, { SignaturePadRef } from '../components/SignaturePad';
import ActionButton from '../components/ActionButton';
import { COLORS, SPACING, FONT_SIZES } from '../utils/constants';

export default function SignatureScreen({ navigation }: SignatureScreenProps) {
  const signaturePadRef = useRef<SignaturePadRef>(null);
  const { setSignature, currentPage } = useDocumentStore();
  const [signatureData, setSignatureData] = useState<string | null>(null);

  const handleClear = () => {
    signaturePadRef.current?.clearSignature();
    setSignatureData(null);
  };

  const handleDone = () => {
    if (signaturePadRef.current?.isEmpty()) {
      Alert.alert('No Signature', 'Please draw your signature before continuing.');
      return;
    }
    signaturePadRef.current?.getSignature();
  };

  const handleSignatureChange = (signature: string) => {
    setSignatureData(signature);
    setSignature(signature);
    navigation.navigate('PlaceSignature', { pageIndex: currentPage });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Draw Your Signature</Text>
        <Text style={styles.subtitle}>
          Use your finger to sign in the area below
        </Text>
      </View>

      <View style={styles.canvasContainer}>
        <SignaturePad
          ref={signaturePadRef}
          onSignatureChange={handleSignatureChange}
          penColor="#000000"
          backgroundColor="rgba(255,255,255,1)"
        />
      </View>

      <View style={styles.footer}>
        <ActionButton
          title="Clear"
          onPress={handleClear}
          variant="outline"
          style={styles.button}
        />
        <ActionButton
          title="Done"
          onPress={handleDone}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  canvasContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  button: {
    flex: 1,
  },
});
