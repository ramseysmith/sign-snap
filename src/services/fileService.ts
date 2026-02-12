import {
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  copyAsync,
  deleteAsync,
  readDirectoryAsync,
} from 'expo-file-system/legacy';
import { DOCUMENT_DIRECTORY } from '../utils/constants';
import { SavedDocument } from '../types';
import { generateId, sanitizeFileName } from '../utils/helpers';

const getDocumentsDirectory = () => {
  return `${documentDirectory}${DOCUMENT_DIRECTORY}/`;
};

export async function ensureDocumentsDirectory(): Promise<void> {
  const dirUri = getDocumentsDirectory();
  const dirInfo = await getInfoAsync(dirUri);
  if (!dirInfo.exists) {
    await makeDirectoryAsync(dirUri, { intermediates: true });
  }
}

export async function saveDocument(
  sourceUri: string,
  name: string
): Promise<SavedDocument> {
  await ensureDocumentsDirectory();

  const id = generateId();
  const safeName = sanitizeFileName(name);
  const fileName = `${id}_${safeName}`;
  const destinationUri = `${getDocumentsDirectory()}${fileName}`;

  await copyAsync({
    from: sourceUri,
    to: destinationUri,
  });

  return {
    id,
    name,
    uri: destinationUri,
    createdAt: Date.now(),
  };
}

export async function deleteDocument(uri: string): Promise<void> {
  const fileInfo = await getInfoAsync(uri);
  if (fileInfo.exists) {
    await deleteAsync(uri);
  }
}

export async function listDocuments(): Promise<SavedDocument[]> {
  await ensureDocumentsDirectory();
  const dirUri = getDocumentsDirectory();

  try {
    const files = await readDirectoryAsync(dirUri);
    const documents: SavedDocument[] = [];

    for (const file of files) {
      if (file.endsWith('.pdf')) {
        const fileUri = `${dirUri}${file}`;

        // Parse id and name from filename
        const parts = file.split('_');
        const id = parts[0];
        const name = parts.slice(1).join('_');

        documents.push({
          id,
          name: name || file,
          uri: fileUri,
          createdAt: Date.now(),
        });
      }
    }

    // Sort by id (which contains timestamp), newest first
    return documents.sort((a, b) => b.id.localeCompare(a.id));
  } catch (error) {
    console.error('Error listing documents:', error);
    return [];
  }
}

export async function getFileSize(uri: string): Promise<number> {
  try {
    const fileInfo = await getInfoAsync(uri);
    if (fileInfo.exists && 'size' in fileInfo) {
      return (fileInfo as any).size || 0;
    }
    return 0;
  } catch {
    return 0;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
