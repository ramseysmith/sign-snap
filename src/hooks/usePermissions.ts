import { useState, useEffect, useCallback } from 'react';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

interface PermissionsState {
  cameraPermission: boolean | null;
  mediaLibraryPermission: boolean | null;
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionsState>({
    cameraPermission: null,
    mediaLibraryPermission: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const checkPermissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cameraStatus, mediaStatus] = await Promise.all([
        Camera.getCameraPermissionsAsync(),
        ImagePicker.getMediaLibraryPermissionsAsync(),
      ]);

      setPermissions({
        cameraPermission: cameraStatus.granted,
        mediaLibraryPermission: mediaStatus.granted,
      });
    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    const { status, canAskAgain } = await Camera.requestCameraPermissionsAsync();

    if (status === 'granted') {
      setPermissions((prev) => ({ ...prev, cameraPermission: true }));
      return true;
    }

    if (!canAskAgain) {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera access in your device settings to scan documents.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }

    return false;
  }, []);

  const requestMediaLibraryPermission = useCallback(async (): Promise<boolean> => {
    const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status === 'granted') {
      setPermissions((prev) => ({ ...prev, mediaLibraryPermission: true }));
      return true;
    }

    if (!canAskAgain) {
      Alert.alert(
        'Media Library Permission Required',
        'Please enable photo library access in your device settings to import documents.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }

    return false;
  }, []);

  return {
    ...permissions,
    isLoading,
    requestCameraPermission,
    requestMediaLibraryPermission,
    refreshPermissions: checkPermissions,
  };
}
