import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SignatureManagerScreenProps, SignatureType } from '../types';
import { useSignatureStore } from '../store/useSignatureStore';
import SignatureTypeToggle from '../components/SignatureTypeToggle';
import SignaturePreviewCard from '../components/SignaturePreviewCard';
import ActionButton from '../components/ActionButton';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../utils/constants';

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
    navigation.navigate('Signature', { signatureType });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Signatures</Text>
          <Text style={styles.subtitle}>
            Manage your saved signatures and initials
          </Text>
        </View>

        <SignatureTypeToggle
          selectedType={signatureType}
          onTypeChange={setSignatureType}
        />

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {savedSignatures.filter((s) => s.type === 'signature').length}
            </Text>
            <Text style={styles.statLabel}>Signatures</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {savedSignatures.filter((s) => s.type === 'initials').length}
            </Text>
            <Text style={styles.statLabel}>Initials</Text>
          </View>
        </View>

        {filteredSignatures.length > 0 ? (
          <View style={styles.listContainer}>
            <Text style={styles.sectionTitle}>
              {signatureType === 'signature' ? 'Signatures' : 'Initials'}
            </Text>
            <View style={styles.signaturesList}>
              {filteredSignatures.map((sig) => (
                <SignaturePreviewCard
                  key={sig.id}
                  signature={sig}
                  onDelete={() => handleDeleteSignature(sig.id)}
                  showActions={true}
                />
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>
              {signatureType === 'signature' ? 'Signature' : 'ABC'}
            </Text>
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
            />
          </View>
        )}
      </ScrollView>

      {filteredSignatures.length > 0 && (
        <View style={styles.footer}>
          <ActionButton
            title={`Create New ${signatureType === 'signature' ? 'Signature' : 'Initials'}`}
            onPress={handleCreateNew}
          />
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
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
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
    padding: SPACING.xl,
  },
  emptyIcon: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  createButton: {
    minWidth: 200,
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});
