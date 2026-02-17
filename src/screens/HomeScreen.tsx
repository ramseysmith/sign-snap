import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { HomeScreenProps } from '../types';
import { useDocumentStore } from '../store/useDocumentStore';
import { usePermissions } from '../hooks/usePermissions';
import { useIsPremium } from '../store/useSubscriptionStore';
import { imagesToPdf } from '../services/pdfService';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, ANIMATION } from '../utils/constants';
import BannerAd from '../components/BannerAd';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ActionCardProps {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  delay?: number;
  accessibilityHint: string;
}

function ActionCard({ icon, title, description, onPress, delay = 0, accessibilityHint }: ActionCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, ANIMATION.springBouncy);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, ANIMATION.springBouncy);
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <AnimatedPressable
        style={[styles.actionCard, animatedStyle]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={accessibilityHint}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
        <View style={styles.cardArrow}>
          <Text style={styles.cardArrowText}>›</Text>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}


export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { setCurrentDocument, resetWorkflow } = useDocumentStore();
  const { requestCameraPermission, requestMediaLibraryPermission } = usePermissions();
  const isPremium = useIsPremium();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUseCamera = async () => {
    const granted = await requestCameraPermission();
    if (granted) {
      navigation.navigate('Camera');
    }
  };

  const handlePickFromLibrary = async () => {
    const granted = await requestMediaLibraryPermission();
    if (!granted) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      setIsProcessing(true);
      const imageUris = result.assets.map((asset) => asset.uri);
      const pdfUri = await imagesToPdf(imageUris);
      const documentName = `Scanned_${new Date().toISOString().slice(0, 10)}.pdf`;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCurrentDocument(pdfUri, documentName);
      navigation.navigate('DocumentPreview', {
        documentUri: pdfUri,
        documentName,
        isFromCamera: true,
      });
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to process images. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScanDocument = () => {
    Alert.alert(
      'Add Document',
      'How would you like to add your document?',
      [
        { text: 'Use Camera', onPress: handleUseCamera },
        { text: 'Choose from Library', onPress: handlePickFromLibrary },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleUploadPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      if (asset) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCurrentDocument(asset.uri, asset.name);
        navigation.navigate('DocumentPreview', {
          documentUri: asset.uri,
          documentName: asset.name,
        });
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to load document. Please try again.');
    }
  };

  const handleViewDocuments = () => {
    navigation.navigate('Documents');
  };

  const handleManageSignatures = () => {
    resetWorkflow();
    navigation.navigate('SignatureManager');
  };

  const handleSubscription = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPremium) {
      navigation.navigate('CustomerCenter');
    } else {
      navigation.navigate('Paywall');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={styles.header}
          entering={FadeInDown.delay(100).springify()}
        >
          <View style={styles.titleRow}>
            <Text style={styles.title} accessibilityRole="header">SignSnap</Text>
            <Pressable
              style={[styles.premiumBadge, isPremium && styles.premiumBadgeActive]}
              onPress={handleSubscription}
              accessibilityRole="button"
              accessibilityLabel={isPremium ? "Premium subscription active" : "Upgrade to premium"}
              accessibilityHint={isPremium ? "View subscription details" : "View premium subscription options"}
            >
              <Text style={styles.premiumBadgeText}>
                {isPremium ? '✦ Premium' : 'Upgrade'}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.subtitle}>Sign documents in seconds</Text>
        </Animated.View>

        <View style={styles.actions}>
          <ActionCard
            icon="📷"
            title="Scan Document"
            description="Use your camera to scan a physical document"
            onPress={handleScanDocument}
            delay={200}
            accessibilityHint="Opens camera to scan a document"
          />
          <ActionCard
            icon="📄"
            title="Upload PDF"
            description="Choose a PDF file from your device"
            onPress={handleUploadPdf}
            delay={300}
            accessibilityHint="Opens file picker to select a PDF"
          />
        </View>

        <View style={styles.linksContainer}>
          <ActionCard
            icon="📁"
            title="My Documents"
            description="View and manage your signed documents"
            onPress={handleViewDocuments}
            delay={400}
            accessibilityHint="Opens your saved documents"
          />
          <ActionCard
            icon="✍️"
            title="My Signatures"
            description="Manage your saved signatures"
            onPress={handleManageSignatures}
            delay={450}
            accessibilityHint="Opens signature management"
          />
        </View>
      </View>
      <BannerAd />
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.processingText}>Creating PDF...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  header: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  premiumBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  premiumBadgeActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.glow,
  },
  premiumBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  actions: {
    gap: SPACING.md,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 28,
  },
  cardContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  cardArrow: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardArrowText: {
    fontSize: 24,
    color: COLORS.textSecondary,
    fontWeight: '300',
    marginTop: -2,
  },
  linksContainer: {
    marginTop: 'auto',
    gap: SPACING.md,
    paddingBottom: SPACING.md,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  processingText: {
    marginTop: SPACING.md,
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
});
