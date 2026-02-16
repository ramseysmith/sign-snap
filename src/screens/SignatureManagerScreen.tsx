import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { SignatureManagerScreenProps, SignatureType } from '../types';
import { useSignatureStore } from '../store/useSignatureStore';
import SignatureTypeToggle from '../components/SignatureTypeToggle';
import SignaturePreviewCard from '../components/SignaturePreviewCard';
import ActionButton from '../components/ActionButton';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../utils/constants';

export default function SignatureManagerScreen({
  navigation,
}: SignatureManagerScreenProps) {
  const [signatureType, setSignatureType] = useState<SignatureType>('signature');
  const { savedSignatures, removeSignature } = useSignatureStore();

  const filteredSignatures = useMemo(
    () => savedSignatures.filter((s) => s.type === signatureType),
    [savedSignatures, signatureType]
  );

  const handleDeleteSignature = (id: string) => {
    removeSignature(id);
  };

  const handleCreateNew = () => {
    // No signature limit - users can create unlimited signatures
    navigation.navigate('Signature', { signatureType });
  };

  const signatureCount = savedSignatures.filter((s) => s.type === 'signature').length;
  const initialsCount = savedSignatures.filter((s) => s.type === 'initials').length;

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
            My Signatures
          </Text>
          <Text style={styles.subtitle}>
            Manage your saved signatures and initials
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <SignatureTypeToggle
            selectedType={signatureType}
            onTypeChange={setSignatureType}
          />
        </Animated.View>

        <Animated.View
          style={styles.statsContainer}
          entering={FadeInDown.delay(150).springify()}
          accessibilityLabel={`You have ${signatureCount} signatures and ${initialsCount} initials`}
        >
          <View style={styles.statItem}>
            <Text style={styles.statValue} accessibilityLabel={`${signatureCount} signatures`}>
              {signatureCount}
            </Text>
            <Text style={styles.statLabel}>Signatures</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue} accessibilityLabel={`${initialsCount} initials`}>
              {initialsCount}
            </Text>
            <Text style={styles.statLabel}>Initials</Text>
          </View>
        </Animated.View>

        {filteredSignatures.length > 0 ? (
          <Animated.View
            style={styles.listContainer}
            entering={FadeInDown.delay(200).springify()}
          >
            <Text style={styles.sectionTitle} accessibilityRole="header">
              {signatureType === 'signature' ? 'Signatures' : 'Initials'}
            </Text>
            <View style={styles.signaturesList}>
              {filteredSignatures.map((sig, index) => (
                <Animated.View
                  key={sig.id}
                  entering={FadeInDown.delay(250 + index * 50).springify()}
                >
                  <SignaturePreviewCard
                    signature={sig}
                    onDelete={() => handleDeleteSignature(sig.id)}
                    showActions={true}
                  />
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        ) : (
          <Animated.View
            style={styles.emptyState}
            entering={FadeIn.delay(200).duration(400)}
          >
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>
                {signatureType === 'signature' ? '✍️' : '🔤'}
              </Text>
            </View>
            <Text style={styles.emptyText}>
              No {signatureType === 'signature' ? 'signatures' : 'initials'} saved yet
            </Text>
            <Text style={styles.emptySubtext}>
              Create one to use when signing documents
            </Text>
            <ActionButton
              title={`Create ${signatureType === 'signature' ? 'Signature' : 'Initials'}`}
              onPress={handleCreateNew}
              style={styles.createButton}
              accessibilityLabel={`Create new ${signatureType}`}
              accessibilityHint="Opens the signature creation screen"
            />
          </Animated.View>
        )}
      </ScrollView>

      {filteredSignatures.length > 0 && (
        <Animated.View
          style={styles.footer}
          entering={FadeInUp.delay(300).springify()}
        >
          <ActionButton
            title={`Create New ${signatureType === 'signature' ? 'Signature' : 'Initials'}`}
            onPress={handleCreateNew}
            accessibilityLabel={`Create new ${signatureType}`}
            accessibilityHint="Opens the signature creation screen"
          />
        </Animated.View>
      )}
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
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.lg,
  },
  listContainer: {
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
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 20,
  },
  createButton: {
    minWidth: 200,
  },
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
    ...SHADOWS.lg,
  },
});
