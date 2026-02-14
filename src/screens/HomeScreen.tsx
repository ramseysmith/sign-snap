import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { HomeScreenProps } from '../types';
import { useDocumentStore } from '../store/useDocumentStore';
import { usePermissions } from '../hooks/usePermissions';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../utils/constants';

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { setCurrentDocument } = useDocumentStore();
  const { requestCameraPermission } = usePermissions();

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>SignSnap</Text>
          <Text style={styles.subtitle}>Sign documents in seconds</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleScanDocument}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>📷</Text>
            </View>
            <Text style={styles.cardTitle}>Scan Document</Text>
            <Text style={styles.cardDescription}>
              Use your camera to scan a physical document
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleUploadPdf}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>📄</Text>
            </View>
            <Text style={styles.cardTitle}>Upload PDF</Text>
            <Text style={styles.cardDescription}>
              Choose a PDF file from your device
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.linksContainer}>
          <TouchableOpacity
            style={styles.documentsLink}
            onPress={handleViewDocuments}
          >
            <Text style={styles.documentsLinkText}>My Documents</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.documentsLink}
            onPress={handleManageSignatures}
          >
            <Text style={styles.documentsLinkText}>My Signatures</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  actions: {
    gap: SPACING.md,
  },
  actionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  iconText: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  cardDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  linksContainer: {
    marginTop: 'auto',
    gap: SPACING.xs,
  },
  documentsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  documentsLinkText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    marginRight: SPACING.xs,
  },
  arrow: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
  },
});
