import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import Pdf from 'react-native-pdf';
import { DocumentPreviewScreenProps } from '../types';
import { useDocumentStore } from '../store/useDocumentStore';
import { getPdfPageCount, getPdfPageDimensions } from '../services/pdfService';
import ActionButton from '../components/ActionButton';
import PageSelector from '../components/PageSelector';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../utils/constants';

export default function DocumentPreviewScreen({
  navigation,
  route,
}: DocumentPreviewScreenProps) {
  const { documentUri, documentName } = route.params;
  const {
    totalPages,
    currentPage,
    setTotalPages,
    setCurrentPage,
    setPdfDimensions,
  } = useDocumentStore();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPdfInfo();
  }, [documentUri]);

  const loadPdfInfo = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const pageCount = await getPdfPageCount(documentUri);
      setTotalPages(pageCount);
      setCurrentPage(0);

      const dimensions = await getPdfPageDimensions(documentUri, 0);
      setPdfDimensions(dimensions);
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError('Failed to load PDF. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    try {
      const dimensions = await getPdfPageDimensions(documentUri, page);
      setPdfDimensions(dimensions);
    } catch (err) {
      console.error('Error getting page dimensions:', err);
    }
  };

  const handleAddSignature = () => {
    navigation.navigate('Signature', { signatureType: 'signature' });
  };

  const handleAddInitials = () => {
    navigation.navigate('Signature', { signatureType: 'initials' });
  };

  if (isLoading) {
    return (
      <Animated.View
        style={styles.centerContainer}
        entering={FadeIn.duration(200)}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText} accessibilityRole="alert">
            Loading document...
          </Text>
        </View>
      </Animated.View>
    );
  }

  if (error) {
    return (
      <Animated.View
        style={styles.centerContainer}
        entering={FadeIn.duration(200)}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.errorText} accessibilityRole="alert">
            {error}
          </Text>
          <ActionButton
            title="Go Back"
            onPress={() => navigation.goBack()}
            variant="outline"
            accessibilityLabel="Go back to previous screen"
          />
        </View>
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={styles.pdfContainer}
        entering={FadeIn.duration(300)}
      >
        <Pdf
          source={{ uri: documentUri, cache: true }}
          page={currentPage + 1}
          style={styles.pdf}
          onLoadComplete={(numberOfPages) => {
            setTotalPages(numberOfPages);
          }}
          onPageChanged={(page) => {
            handlePageChange(page - 1);
          }}
          onError={(error) => {
            console.error('PDF Error:', error);
            setError('Failed to display PDF');
          }}
          enablePaging={true}
          horizontal={true}
        />
      </Animated.View>

      <PageSelector
        totalPages={totalPages}
        currentPage={currentPage}
        onPageSelect={handlePageChange}
      />

      <Animated.View
        style={styles.footer}
        entering={FadeInUp.delay(200).springify()}
      >
        <Text style={styles.footerTitle} accessibilityRole="header">
          What would you like to add?
        </Text>
        <View style={styles.buttonRow}>
          <ActionButton
            title="Signature"
            onPress={handleAddSignature}
            style={styles.signButton}
            accessibilityLabel="Add signature"
            accessibilityHint="Navigate to signature creation screen"
          />
          <ActionButton
            title="Initials"
            onPress={handleAddInitials}
            variant="outline"
            style={styles.signButton}
            accessibilityLabel="Add initials"
            accessibilityHint="Navigate to initials creation screen"
          />
        </View>
      </Animated.View>
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
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.lg,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.md,
  },
  errorIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.error,
    color: COLORS.background,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 56,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
  },
  pdf: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
  },
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.lg,
  },
  footerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  signButton: {
    flex: 1,
  },
});
