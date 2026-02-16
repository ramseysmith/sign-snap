import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  Pressable,
  SafeAreaView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Haptics from 'expo-haptics';
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
import { useInterstitialAd } from '../hooks/useInterstitialAd';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, ANIMATION } from '../utils/constants';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ScreenMode = 'select' | 'draw';

interface HeaderButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'text' | 'outlined';
  accessibilityLabel: string;
  accessibilityHint?: string;
}

function HeaderButton({ title, onPress, variant = 'text', accessibilityLabel, accessibilityHint }: HeaderButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, ANIMATION.springBouncy);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, ANIMATION.springBouncy);
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <AnimatedPressable
      style={[
        styles.headerButton,
        variant === 'outlined' && styles.headerButtonOutlined,
        animatedStyle,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <Text style={[styles.headerButtonText, variant === 'outlined' && styles.headerButtonTextOutlined]}>
        {title}
      </Text>
    </AnimatedPressable>
  );
}

export default function SignatureScreen({ navigation, route }: SignatureScreenProps) {
  const initialType = route.params?.signatureType || 'signature';
  const [signatureType, setSignatureType] = useState<SignatureType>(initialType);
  const [screenMode, setScreenMode] = useState<ScreenMode>('select');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isLandscape, setIsLandscape] = useState(false);

  const signaturePadRef = useRef<SignaturePadRef>(null);
  const { setSignature, currentPage } = useDocumentStore();
  const {
    savedSignatures,
    setActiveSignature,
    addSignature,
    removeSignature,
  } = useSignatureStore();
  const { showAd } = useInterstitialAd();

  // Handle orientation changes
  useEffect(() => {
    return () => {
      // Reset to portrait when leaving the screen
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  const toggleOrientation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isLandscape) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      setIsLandscape(false);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
      setIsLandscape(true);
    }
  };

  // Filter signatures by current type
  const filteredSignatures = useMemo(
    () => savedSignatures.filter((s) => s.type === signatureType),
    [savedSignatures, signatureType]
  );

  const handleMethodSelect = (method: SignatureInputMethod) => {
    // No signature limit - users can create unlimited signatures
    if (method === 'draw') {
      setScreenMode('draw');
    } else if (method === 'image') {
      navigation.navigate('SignatureCapture', { signatureType });
    } else if (method === 'typed') {
      navigation.navigate('SignatureTyped', { signatureType });
    }
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    signaturePadRef.current?.clearSignature();
    setSignatureData(null);
  };

  const handleBackToSelect = async () => {
    // Reset to portrait when leaving draw mode
    if (isLandscape) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      setIsLandscape(false);
    }
    setScreenMode('select');
    setSignatureData(null);
  };

  const handleDrawDone = () => {
    if (signaturePadRef.current?.isEmpty()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Show interstitial ad after creating a new signature, then navigate
    showAd(() => {
      navigation.navigate('PlaceSignature', { pageIndex: currentPage });
    });
  };

  // Render draw mode
  if (screenMode === 'draw') {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View
          style={styles.drawHeader}
          entering={FadeIn.duration(200)}
        >
          <HeaderButton
            title="← Back"
            onPress={handleBackToSelect}
            accessibilityLabel="Go back"
            accessibilityHint="Return to signature selection"
          />
          <HeaderButton
            title={isLandscape ? '↺ Portrait' : '↻ Landscape'}
            onPress={toggleOrientation}
            variant="outlined"
            accessibilityLabel={isLandscape ? 'Switch to portrait' : 'Switch to landscape'}
            accessibilityHint="Rotate the drawing canvas"
          />
        </Animated.View>

        {!isLandscape && (
          <Animated.View
            style={styles.titleContainer}
            entering={FadeInDown.delay(100).springify()}
          >
            <Text style={styles.title} accessibilityRole="header">
              Draw Your {signatureType === 'signature' ? 'Signature' : 'Initials'}
            </Text>
            <Text style={styles.subtitle}>
              Use your finger to sign in the area below
            </Text>
          </Animated.View>
        )}

        <Animated.View
          style={styles.canvasContainer}
          entering={FadeIn.delay(150).duration(300)}
        >
          <SignaturePad
            ref={signaturePadRef}
            onSignatureChange={handleSignatureChange}
            penColor="#000000"
          />
        </Animated.View>

        <Animated.View
          style={styles.footer}
          entering={FadeInUp.delay(200).springify()}
        >
          <ActionButton
            title="Clear"
            onPress={handleClear}
            variant="outline"
            style={styles.button}
            accessibilityLabel="Clear signature"
            accessibilityHint="Erase the current drawing"
          />
          <ActionButton
            title="Done"
            onPress={handleDrawDone}
            style={styles.button}
            accessibilityLabel="Finish signature"
            accessibilityHint="Save and use this signature"
          />
        </Animated.View>
      </SafeAreaView>
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
        <Animated.View
          style={styles.header}
          entering={FadeInDown.springify()}
        >
          <Text style={styles.title} accessibilityRole="header">
            {signatureType === 'signature' ? 'Signature' : 'Initials'}
          </Text>
          <Text style={styles.subtitle}>
            Select a saved {signatureType} or create a new one
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <SignatureTypeToggle
            selectedType={signatureType}
            onTypeChange={setSignatureType}
          />
        </Animated.View>

        {filteredSignatures.length > 0 && (
          <Animated.View
            style={styles.savedSection}
            entering={FadeInDown.delay(150).springify()}
          >
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Saved {signatureType === 'signature' ? 'Signatures' : 'Initials'}
            </Text>
            <View style={styles.signaturesList}>
              {filteredSignatures.map((sig, index) => (
                <Animated.View
                  key={sig.id}
                  entering={FadeInDown.delay(200 + index * 50).springify()}
                >
                  <SignaturePreviewCard
                    signature={sig}
                    onSelect={() => handleSelectSignature(sig)}
                    onDelete={() => handleDeleteSignature(sig.id)}
                  />
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <SignatureMethodSelector onMethodSelect={handleMethodSelect} />
        </Animated.View>

        {filteredSignatures.length === 0 && (
          <Animated.View
            style={styles.emptyState}
            entering={FadeIn.delay(300).duration(400)}
          >
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>
                {signatureType === 'signature' ? '✍️' : '🔤'}
              </Text>
            </View>
            <Text style={styles.emptyText}>
              No saved {signatureType === 'signature' ? 'signatures' : 'initials'} yet.
            </Text>
            <Text style={styles.emptySubtext}>
              Create one using the options above.
            </Text>
          </Animated.View>
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
  drawHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  headerButtonOutlined: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  headerButtonTextOutlined: {
    color: COLORS.text,
  },
  titleContainer: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  savedSection: {
    marginTop: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  signaturesList: {
    gap: SPACING.md,
  },
  emptyState: {
    marginTop: SPACING.xxl,
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  canvasContainer: {
    flex: 1,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    backgroundColor: COLORS.canvas,
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
