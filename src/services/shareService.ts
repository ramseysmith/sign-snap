import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

export async function shareDocument(uri: string): Promise<boolean> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();

    if (!isAvailable) {
      Alert.alert(
        'Sharing Not Available',
        'Sharing is not available on this device.'
      );
      return false;
    }

    await Sharing.shareAsync(uri, {
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
