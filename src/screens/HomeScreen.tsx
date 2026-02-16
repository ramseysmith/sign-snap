import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { HomeScreenProps } from '../types';
import { useDocumentStore } from '../store/useDocumentStore';
import { usePermissions } from '../hooks/usePermissions';
import { useIsPremium } from '../store/useSubscriptionStore';
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

interface LinkButtonProps {
  title: string;
  onPress: () => void;
  delay?: number;
}

function LinkButton({ title, onPress, delay = 0 }: LinkButtonProps) {
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

  return (
    <Animated.View entering={FadeInUp.delay(delay).springify()}>
      <AnimatedPressable
        style={[styles.documentsLink, animatedStyle]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        <Text style={styles.documentsLinkText}>{title}</Text>
        <Text style={styles.arrow}>→</Text>
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { setCurrentDocument } = useDocumentStore();
  const { requestCameraPermission } = usePermissions();
  const isPremium = useIsPremium();

  const handleScanDocument = async () => {
    const granted = await requestCameraPermission();
    if (granted) {
      navigation.navigate('Camera');
    }
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
          <LinkButton
            title="My Documents"
            onPress={handleViewDocuments}
            delay={400}
          />
          <LinkButton
            title="My Signatures"
            onPress={handleManageSignatures}
            delay={450}
          />
        </View>
      </View>
      <BannerAd />
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
    gap: SPACING.xs,
    paddingBottom: SPACING.md,
  },
  documentsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  documentsLinkText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.primary,
    marginRight: SPACING.sm,
  },
  arrow: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
  },
});
