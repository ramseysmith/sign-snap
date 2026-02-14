import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  SignatureScreenProps,
  SignatureType,
  SignatureInputMethod,
  SavedSignature,
} from '../types';
import { useDocumentStore } from '../store/useDocumentStore';
import { useSignatureStore, generateSignatureId } from '../store/useSignatureStore';
import SignaturePad, { SignaturePadRef } from '../components/SignaturePad';
import SignatureTypeToggle from '../components/SignatureTypeToggle';
import SignatureMethodSelector from '../components/SignatureMethodSelector';
import SignaturePreviewCard from '../components/SignaturePreviewCard';
import ActionButton from '../components/ActionButton';
import UpgradePrompt from '../components/UpgradePrompt';
import { useSignatureLimit } from '../hooks/useSignatureLimit';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../utils/constants';

type ScreenMode = 'select' | 'draw';

export default function SignatureScreen({ navigation, route }: SignatureScreenProps) {
  const initialType = route.params?.signatureType || 'signature';
  const [signatureType, setSignatureType] = useState<SignatureType>(initialType);
  const [screenMode, setScreenMode] = useState<ScreenMode>('select');
  const [signatureData, setSignatureData] = useState<string | null>(null);

  const signaturePadRef = useRef<SignaturePadRef>(null);
  const { setSignature, currentPage } = useDocumentStore();
  const {
    savedSignatures,
    setActiveSignature,
    addSignature,
    removeSignature,
  } = useSignatureStore();
  const { checkAndProceed, currentCount, isPremium } = useSignatureLimit();

  // Filter signatures by current type
  const filteredSignatures = useMemo(
    () => savedSignatures.filter((s) => s.type === signatureType),
    [savedSignatures, signatureType]
  );

  const handleMethodSelect = (method: SignatureInputMethod) => {
    // Check signature limit before creating a new one
    checkAndProceed(() => {
      if (method === 'draw') {
        setScreenMode('draw');
      } else if (method === 'image') {
        navigation.navigate('SignatureCapture', { signatureType });
      } else if (method === 'typed') {
        navigation.navigate('SignatureTyped', { signatureType });
      }
    });
  };

  const handleSelectSignature = (signature: SavedSignature) => {
    setActiveSignature(signature);
    setSignature(signature.base64);
    navigation.navigate('PlaceSignature', { pageIndex: currentPage });
  };

  const handleDeleteSignature = (id: string) => {
    removeSignature(id);
  };

  // Draw mode handlers
  const handleClear = () => {
    signaturePadRef.current?.clearSignature();
    setSignatureData(null);
  };

  const handleBackToSelect = () => {
    setScreenMode('select');
    setSignatureData(null);
  };

  const handleDrawDone = () => {
    if (signaturePadRef.current?.isEmpty()) {
      Alert.alert('No Signature', 'Please draw your signature before continuing.');
      return;
    }
    signaturePadRef.current?.getSignature();
  };

  const handleSignatureChange = (signature: string) => {
    setSignatureData(signature);

    // Create and save the new signature
    const newSignature: SavedSignature = {
      id: generateSignatureId(),
      name: signatureType === 'signature' ? 'My Signature' : 'My Initials',
      type: signatureType,
      inputMethod: 'draw',
      base64: signature,
      createdAt: Date.now(),
    };

    addSignature(newSignature);
    setActiveSignature(newSignature);
    setSignature(signature);
    navigation.navigate('PlaceSignature', { pageIndex: currentPage });
  };

  // Render draw mode
  if (screenMode === 'draw') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackToSelect} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            Draw Your {signatureType === 'signature' ? 'Signature' : 'Initials'}
          </Text>
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
            onPress={handleDrawDone}
            style={styles.button}
          />
        </View>
      </View>
    );
  }

  // Render select mode (hub)
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {signatureType === 'signature' ? 'Signature' : 'Initials'}
          </Text>
          <Text style={styles.subtitle}>
            Select a saved {signatureType} or create a new one
          </Text>
        </View>

        <SignatureTypeToggle
          selectedType={signatureType}
          onTypeChange={setSignatureType}
        />

        {!isPremium && (
          <UpgradePrompt
            currentCount={currentCount}
            itemType={signatureType}
            variant="banner"
          />
        )}

        {filteredSignatures.length > 0 && (
          <View style={styles.savedSection}>
            <Text style={styles.sectionTitle}>
              Saved {signatureType === 'signature' ? 'Signatures' : 'Initials'}
            </Text>
            <View style={styles.signaturesList}>
              {filteredSignatures.map((sig) => (
                <SignaturePreviewCard
                  key={sig.id}
                  signature={sig}
                  onSelect={() => handleSelectSignature(sig)}
                  onDelete={() => handleDeleteSignature(sig.id)}
                />
              ))}
            </View>
          </View>
        )}

        <SignatureMethodSelector onMethodSelect={handleMethodSelect} />

        {filteredSignatures.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No saved {signatureType === 'signature' ? 'signatures' : 'initials'} yet.
            </Text>
            <Text style={styles.emptySubtext}>
              Create one using the options above.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
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
    paddingBottom: SPACING.xxl,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  backButton: {
    marginBottom: SPACING.sm,
  },
  backButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
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
  savedSection: {
    marginTop: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  signaturesList: {
    gap: SPACING.md,
  },
  emptyState: {
    marginTop: SPACING.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  canvasContainer: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  button: {
    flex: 1,
  },
});
