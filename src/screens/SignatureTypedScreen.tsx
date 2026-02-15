import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import { SignatureTypedScreenProps, SignatureFont, SavedSignature } from '../types';
import { useDocumentStore } from '../store/useDocumentStore';
import { useSignatureStore } from '../store/useSignatureStore';
import { generateSignatureId } from '../services/signatureService';
import FontSelector from '../components/FontSelector';
import TypedSignaturePreview from '../components/TypedSignaturePreview';
import ActionButton from '../components/ActionButton';
import { useInterstitialAd } from '../hooks/useInterstitialAd';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../utils/constants';

const AVAILABLE_FONTS: SignatureFont[] = [
  'dancing-script',
  'great-vibes',
  'pacifico',
  'allura',
  'sacramento',
];

export default function SignatureTypedScreen({
  navigation,
  route,
}: SignatureTypedScreenProps) {
  const { signatureType } = route.params;
  const [text, setText] = useState('');
  const [selectedFont, setSelectedFont] = useState<SignatureFont>('dancing-script');
  const [signatureName, setSignatureName] = useState(
    signatureType === 'signature' ? 'My Typed Signature' : 'My Typed Initials'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);

  const viewShotRef = useRef<ViewShot>(null);
  const { setSignature, currentPage } = useDocumentStore();
  const { addSignature, setActiveSignature } = useSignatureStore();
  const { showAd } = useInterstitialAd();

  const handleContinue = () => {
    if (!text.trim()) {
      Alert.alert(
        'No Text',
        `Please enter your ${signatureType === 'signature' ? 'name' : 'initials'}.`
      );
      return;
    }
    setShowNameInput(true);
  };

  const handleSave = async () => {
    if (!text.trim()) return;

    setIsProcessing(true);
    try {
      // Capture the signature view as an image
      const uri = await viewShotRef.current?.capture?.();

      if (!uri) {
        throw new Error('Failed to capture signature');
      }

      // Read the captured image as base64
      const response = await fetch(uri);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const newSignature: SavedSignature = {
        id: generateSignatureId(),
        name: signatureName.trim() || (signatureType === 'signature' ? 'My Typed Signature' : 'My Typed Initials'),
        type: signatureType,
        inputMethod: 'typed',
        base64: base64,
        createdAt: Date.now(),
        metadata: {
          fontFamily: selectedFont,
          text: text.trim(),
        },
      };

      addSignature(newSignature);
      setActiveSignature(newSignature);
      setSignature(base64);

      // Show interstitial ad after creating signature, then navigate
      showAd(() => {
        navigation.navigate('PlaceSignature', { pageIndex: currentPage });
      });
    } catch (error) {
      console.error('Error creating typed signature:', error);
      Alert.alert('Error', 'Failed to create signature. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (showNameInput) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>
              Name Your {signatureType === 'signature' ? 'Signature' : 'Initials'}
            </Text>
            <Text style={styles.subtitle}>
              Give it a name so you can identify it later
            </Text>
          </View>

          <View style={styles.previewWrapper}>
            <ViewShot
              ref={viewShotRef}
              options={{ format: 'png', quality: 1.0, result: 'data-uri' }}
            >
              <TypedSignaturePreview
                text={text}
                font={selectedFont}
                signatureType={signatureType}
              />
            </ViewShot>
          </View>

          <TextInput
            style={styles.nameInput}
            value={signatureName}
            onChangeText={setSignatureName}
            placeholder="Enter a name..."
            placeholderTextColor={COLORS.textMuted}
          />
        </ScrollView>

        <View style={styles.footer}>
          <ActionButton
            title="Back"
            onPress={() => setShowNameInput(false)}
            variant="outline"
            style={styles.button}
            disabled={isProcessing}
          />
          <ActionButton
            title={isProcessing ? 'Saving...' : 'Save & Use'}
            onPress={handleSave}
            style={styles.button}
            loading={isProcessing}
            disabled={isProcessing}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            Type Your {signatureType === 'signature' ? 'Signature' : 'Initials'}
          </Text>
          <Text style={styles.subtitle}>
            Enter your {signatureType === 'signature' ? 'name' : 'initials'} and choose a style
          </Text>
        </View>

        <TextInput
          style={styles.textInput}
          value={text}
          onChangeText={setText}
          placeholder={
            signatureType === 'signature'
              ? 'Enter your name...'
              : 'Enter your initials...'
          }
          placeholderTextColor={COLORS.textMuted}
          autoFocus
          autoCapitalize={signatureType === 'initials' ? 'characters' : 'words'}
          maxLength={signatureType === 'initials' ? 5 : 50}
        />

        <FontSelector
          fonts={AVAILABLE_FONTS}
          selectedFont={selectedFont}
          onFontSelect={setSelectedFont}
          previewText={text || (signatureType === 'signature' ? 'Name' : 'AB')}
        />

        <Text style={styles.previewLabel}>Preview</Text>
        <View style={styles.previewWrapper}>
          <ViewShot
            ref={viewShotRef}
            options={{ format: 'png', quality: 1.0, result: 'data-uri' }}
          >
            <TypedSignaturePreview
              text={text}
              font={selectedFont}
              signatureType={signatureType}
            />
          </ViewShot>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <ActionButton
          title="Cancel"
          onPress={() => navigation.goBack()}
          variant="outline"
          style={styles.button}
        />
        <ActionButton
          title="Continue"
          onPress={handleContinue}
          style={styles.button}
          disabled={!text.trim()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
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
  textInput: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  previewWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  nameInput: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.lg,
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  button: {
    flex: 1,
  },
});
