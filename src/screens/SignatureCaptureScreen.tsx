import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ScreenOrientation from 'expo-screen-orientation';
import { SignatureCaptureScreenProps, SavedSignature } from '../types';
import { useDocumentStore } from '../store/useDocumentStore';
import { useSignatureStore } from '../store/useSignatureStore';
import { processSignatureImage, generateSignatureId } from '../services/signatureService';
import ActionButton from '../components/ActionButton';
import { useInterstitialAd } from '../hooks/useInterstitialAd';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../utils/constants';

type ScreenState = 'capture' | 'preview' | 'name';

export default function SignatureCaptureScreen({
  navigation,
  route,
}: SignatureCaptureScreenProps) {
  const { signatureType } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const [screenState, setScreenState] = useState<ScreenState>('capture');
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [processedBase64, setProcessedBase64] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [signatureName, setSignatureName] = useState(
    signatureType === 'signature' ? 'My Signature' : 'My Initials'
  );

  const cameraRef = useRef<CameraView>(null);
  const { setSignature, currentPage, currentDocumentUri } = useDocumentStore();
  const { addSignature, setActiveSignature } = useSignatureStore();
  const { showAd } = useInterstitialAd();

  // Ensure portrait orientation on this screen
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo?.uri) {
        setCapturedImageUri(photo.uri);
        const processed = await processSignatureImage(photo.uri);
        setProcessedBase64(processed);
        setScreenState('preview');
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePickImage = async () => {
    try {
      setIsProcessing(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 2],
      });

      if (!result.canceled && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setCapturedImageUri(imageUri);
        const processed = await processSignatureImage(imageUri);
        setProcessedBase64(processed);
        setScreenState('preview');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImageUri(null);
    setProcessedBase64(null);
    setScreenState('capture');
  };

  const handleContinue = () => {
    setScreenState('name');
  };

  const handleSave = () => {
    if (!processedBase64) return;

    const newSignature: SavedSignature = {
      id: generateSignatureId(),
      name: signatureName.trim() || (signatureType === 'signature' ? 'My Signature' : 'My Initials'),
      type: signatureType,
      inputMethod: 'image',
      base64: processedBase64,
      createdAt: Date.now(),
    };

    addSignature(newSignature);
    setActiveSignature(newSignature);
    setSignature(processedBase64);

    // Show interstitial ad after creating signature, then navigate
    showAd(() => {
      if (currentDocumentUri) {
        navigation.navigate('PlaceSignature', { pageIndex: currentPage });
      } else {
        Alert.alert(
          'Signature Saved',
          'Your signature has been saved. Upload a document to use it.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    });
  };

  // Permission loading state
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Permission denied state
  if (!permission.granted && screenState === 'capture') {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.permissionText}>
          Camera permission is needed to capture your signature
        </Text>
        <ActionButton
          title="Grant Permission"
          onPress={requestPermission}
          style={{ marginTop: SPACING.md }}
        />
        <ActionButton
          title="Choose from Gallery"
          onPress={handlePickImage}
          variant="outline"
          style={{ marginTop: SPACING.sm }}
        />
        <ActionButton
          title="Go Back"
          onPress={() => navigation.goBack()}
          variant="outline"
          style={{ marginTop: SPACING.sm }}
        />
      </View>
    );
  }

  // Name input state
  if (screenState === 'name') {
    return (
      <View style={styles.container}>
        <View style={styles.nameContainer}>
          <Text style={styles.title}>Name Your {signatureType === 'signature' ? 'Signature' : 'Initials'}</Text>
          <Text style={styles.subtitle}>
            Give it a name so you can identify it later
          </Text>

          {processedBase64 && (
            <View style={styles.previewSmall}>
              <Image
                source={{ uri: processedBase64 }}
                style={styles.previewImageSmall}
                resizeMode="contain"
              />
            </View>
          )}

          <TextInput
            style={styles.nameInput}
            value={signatureName}
            onChangeText={setSignatureName}
            placeholder="Enter a name..."
            placeholderTextColor={COLORS.textMuted}
            autoFocus
          />

          <View style={styles.footer}>
            <ActionButton
              title="Back"
              onPress={() => setScreenState('preview')}
              variant="outline"
              style={styles.button}
            />
            <ActionButton
              title="Save & Use"
              onPress={handleSave}
              style={styles.button}
            />
          </View>
        </View>
      </View>
    );
  }

  // Preview state
  if (screenState === 'preview' && processedBase64) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Preview</Text>
          <Text style={styles.subtitle}>
            This is how your {signatureType} will appear
          </Text>
        </View>

        <View style={styles.previewContainer}>
          <Image
            source={{ uri: processedBase64 }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.footer}>
          <ActionButton
            title="Retake"
            onPress={handleRetake}
            variant="outline"
            style={styles.button}
          />
          <ActionButton
            title="Continue"
            onPress={handleContinue}
            style={styles.button}
          />
        </View>
      </View>
    );
  }

  // Capture state
  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <View style={styles.overlay}>
          <View style={styles.instructionContainer}>
            <Text style={styles.instructionText}>
              Position your {signatureType} within the frame
            </Text>
          </View>

          <View style={styles.frameContainer}>
            <View style={styles.signatureFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </View>

          <Text style={styles.tipText}>
            For best results, use a white background with dark ink
          </Text>
        </View>
      </CameraView>

      <View style={styles.controls}>
        <ActionButton
          title="Gallery"
          onPress={handlePickImage}
          variant="secondary"
          size="small"
          disabled={isProcessing}
        />

        <View style={styles.captureButtonContainer}>
          <ActionButton
            title=""
            onPress={handleCapture}
            disabled={isProcessing}
            style={styles.captureButton}
          />
        </View>

        <ActionButton
          title="Cancel"
          onPress={() => navigation.goBack()}
          variant="secondary"
          size="small"
          disabled={isProcessing}
        />
      </View>

      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.processingText}>Processing...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  permissionText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  header: {
    padding: SPACING.lg,
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
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    padding: SPACING.lg,
  },
  instructionContainer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  instructionText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    backgroundColor: COLORS.overlay,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  frameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  signatureFrame: {
    width: '90%',
    aspectRatio: 3,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: COLORS.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  tipText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    backgroundColor: COLORS.overlay,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  captureButtonContainer: {
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.text,
    borderWidth: 4,
    borderColor: COLORS.primary,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    marginTop: SPACING.md,
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
  },
  previewContainer: {
    flex: 1,
    margin: SPACING.lg,
    backgroundColor: COLORS.text,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
  },
  button: {
    flex: 1,
  },
  nameContainer: {
    flex: 1,
    padding: SPACING.lg,
  },
  previewSmall: {
    height: 100,
    backgroundColor: COLORS.text,
    borderRadius: BORDER_RADIUS.md,
    marginVertical: SPACING.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImageSmall: {
    width: '100%',
    height: '100%',
  },
  nameInput: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
});
