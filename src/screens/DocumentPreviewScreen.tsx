import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Pdf from 'react-native-pdf';
import { DocumentPreviewScreenProps } from '../types';
import { useDocumentStore } from '../store/useDocumentStore';
import { getPdfPageCount, getPdfPageDimensions } from '../services/pdfService';
import ActionButton from '../components/ActionButton';
import PageSelector from '../components/PageSelector';
import { COLORS, SPACING, FONT_SIZES } from '../utils/constants';

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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading document...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <ActionButton
          title="Go Back"
          onPress={() => navigation.goBack()}
          variant="outline"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.pdfContainer}>
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
      </View>

      <PageSelector
        totalPages={totalPages}
        currentPage={currentPage}
        onPageSelect={handlePageChange}
      />

      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          <ActionButton
            title="Add Signature"
            onPress={handleAddSignature}
            style={styles.signButton}
          />
          <ActionButton
            title="Add Initials"
            onPress={handleAddInitials}
            variant="outline"
            style={styles.signButton}
          />
        </View>
      </View>
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
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginBottom: SPACING.lg,
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
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  signButton: {
    flex: 1,
  },
});
