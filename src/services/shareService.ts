import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { cacheDirectory, copyAsync, deleteAsync, getInfoAsync } from 'expo-file-system/legacy';
import { sanitizeFileName } from '../utils/helpers';

/**
 * Copy the file to a cleanly-named temp file so the share sheet / recipient
 * sees a friendly filename (e.g. "Lease_Agreement.pdf") instead of the
 * internal storage name (e.g. "1717263847123-ab12cd_Lease_Agreement.pdf").
 * Returns the original uri if anything goes wrong.
 */
async function buildShareableUri(uri: string, displayName?: string): Promise<string> {
  if (!displayName || !cacheDirectory) return uri;

  try {
    let cleanName = sanitizeFileName(displayName);
    if (!cleanName.toLowerCase().endsWith('.pdf')) {
      cleanName += '.pdf';
    }

    const tempUri = `${cacheDirectory}${cleanName}`;
    if (tempUri === uri) return uri;

    const existing = await getInfoAsync(tempUri);
    if (existing.exists) {
      await deleteAsync(tempUri, { idempotent: true });
    }

    await copyAsync({ from: uri, to: tempUri });
    return tempUri;
  } catch {
    return uri;
  }
}

export async function shareDocument(uri: string, displayName?: string): Promise<boolean> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();

    if (!isAvailable) {
      Alert.alert(
        'Sharing Not Available',
        'Sharing is not available on this device.'
      );
      return false;
    }

    const shareUri = await buildShareableUri(uri, displayName);

    await Sharing.shareAsync(shareUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share Signed Document',
      UTI: 'com.adobe.pdf', // iOS specific
    });

    return true;
  } catch (error) {
    console.error('Error sharing document:', error);
    Alert.alert('Error', 'Failed to share document. Please try again.');
    return false;
  }
}

export async function canShare(): Promise<boolean> {
  try {
    return await Sharing.isAvailableAsync();
  } catch {
    return false;
  }
}
