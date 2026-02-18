import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { DocumentsScreenProps, SavedDocument } from '../types';
import { useDocumentStore } from '../store/useDocumentStore';
import { listDocuments, deleteDocument } from '../services/fileService';
import { shareDocument } from '../services/shareService';
import { useInterstitialAd } from '../hooks/useInterstitialAd';
import DocumentThumbnail from '../components/DocumentThumbnail';
import ActionButton from '../components/ActionButton';
import { COLORS, SPACING, FONT_SIZES } from '../utils/constants';

export default function DocumentsScreen({ navigation }: DocumentsScreenProps) {
  const { removeSavedDocument, setCurrentDocument } = useDocumentStore();
  const { showAd } = useInterstitialAd();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [documents, setDocuments] = useState<SavedDocument[]>([]);

  const loadDocuments = useCallback(async () => {
    try {
      const docs = await listDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDocuments();
    }, [loadDocuments])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDocuments();
  };

  const handleDocumentPress = (document: SavedDocument) => {
    Alert.alert(document.name, 'What would you like to do?', [
      {
        text: 'View',
        onPress: () => {
          setCurrentDocument(document.uri, document.name);
          navigation.navigate('DocumentPreview', {
            documentUri: document.uri,
            documentName: document.name,
            viewOnly: true,
          });
        },
      },
      {
        text: 'Share',
        onPress: () => {
          // Show interstitial ad before sharing (for free users)
          showAd(() => {
            shareDocument(document.uri);
          });
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const handleDeleteDocument = (document: SavedDocument) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${document.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDocument(document.uri);
              removeSavedDocument(document.id);
              setDocuments((prev) => prev.filter((d) => d.id !== document.id));
            } catch (error) {
              console.error('Error deleting document:', error);
              Alert.alert('Error', 'Failed to delete document.');
            }
          },
        },
      ]
    );
  };

  const renderDocument = ({ item }: { item: SavedDocument }) => (
    <DocumentThumbnail
      document={item}
      onPress={() => handleDocumentPress(item)}
      onDelete={() => handleDeleteDocument(item)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📁</Text>
      <Text style={styles.emptyTitle}>No Documents Yet</Text>
      <Text style={styles.emptyText}>
        Your signed documents will appear here
      </Text>
      <ActionButton
        title="Sign a Document"
        onPress={() => navigation.goBack()}
        style={{ marginTop: SPACING.lg }}
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        renderItem={renderDocument}
        contentContainerStyle={[
          styles.listContent,
          documents.length === 0 && styles.emptyList,
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />
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
  },
  listContent: {
    padding: SPACING.md,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
