import {
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  writeAsStringAsync,
  deleteAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const SIGNATURES_DIRECTORY = 'signatures/';

/**
 * Process an image to optimize it for use as a signature
 * Resizes and converts to PNG with transparency-friendly format
 */
export async function processSignatureImage(imageUri: string): Promise<string> {
  try {
    const result = await manipulateAsync(
      imageUri,
      [{ resize: { width: 600 } }],
      { format: SaveFormat.PNG, base64: true }
    );

    return `data:image/png;base64,${result.base64}`;
  } catch (error) {
    console.error('Error processing signature image:', error);
    throw new Error('Failed to process signature image');
  }
}

/**
 * Ensure the signatures directory exists
 */
async function ensureSignaturesDirectory(): Promise<string> {
  const directory = `${documentDirectory}${SIGNATURES_DIRECTORY}`;

  const dirInfo = await getInfoAsync(directory);
  if (!dirInfo.exists) {
    await makeDirectoryAsync(directory, { intermediates: true });
  }

  return directory;
}

/**
 * Save a signature image file to persistent storage
 */
export async function saveSignatureFile(
  id: string,
  base64Data: string
): Promise<string> {
  const directory = await ensureSignaturesDirectory();
  const filePath = `${directory}${id}.png`;

  // Remove data URI prefix if present
  const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');

  await writeAsStringAsync(filePath, base64Content, {
    encoding: EncodingType.Base64,
  });

  return filePath;
}

/**
 * Delete a signature file from storage
 */
export async function deleteSignatureFile(id: string): Promise<void> {
  const filePath = `${documentDirectory}${SIGNATURES_DIRECTORY}${id}.png`;

  try {
    const fileInfo = await getInfoAsync(filePath);
    if (fileInfo.exists) {
      await deleteAsync(filePath);
    }
  } catch (error) {
    console.error('Error deleting signature file:', error);
  }
}

/**
 * Generate a unique signature ID
 */
export function generateSignatureId(): string {
  return `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
