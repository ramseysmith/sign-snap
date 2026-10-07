import { PdfDimensions, ViewDimensions } from '../types';

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatFileName(name: string): string {
  const maxLength = 25;
  if (name.length <= maxLength) return name;
  const extension = name.split('.').pop() || '';
  const baseName = name.substring(0, name.length - extension.length - 1);
  const truncatedBase = baseName.substring(0, maxLength - extension.length - 4);
  return `${truncatedBase}...${extension}`;
}

export function getFileExtension(uri: string): string {
  const parts = uri.split('.');
  return parts[parts.length - 1].toLowerCase();
}

export function isPdf(uri: string): boolean {
  return getFileExtension(uri) === 'pdf';
}

export function isImage(uri: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'];
  return imageExtensions.includes(getFileExtension(uri));
}

/**
 * Convert UI coordinates (top-left origin) to PDF coordinates (bottom-left origin)
 */
export function uiToPdfCoordinates(
  uiX: number,
  uiY: number,
  uiWidth: number,
  uiHeight: number,
  viewDimensions: ViewDimensions,
  pdfDimensions: PdfDimensions
): { x: number; y: number; width: number; height: number } {
  const scaleX = pdfDimensions.width / viewDimensions.width;
  const scaleY = pdfDimensions.height / viewDimensions.height;

  const pdfX = uiX * scaleX;
  const pdfWidth = uiWidth * scaleX;
  const pdfHeight = uiHeight * scaleY;

  // Flip Y axis: PDF origin is bottom-left, UI origin is top-left
  const pdfY = pdfDimensions.height - (uiY * scaleY) - pdfHeight;

  return {
    x: pdfX,
    y: pdfY,
    width: pdfWidth,
    height: pdfHeight,
  };
}

export function clamp(value: number, min: number, max: number): number {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// Today's date for date stamps. Uses the device locale's numeric format when it
// is plain ASCII (the PDF standard font cannot encode other scripts), else ISO.
export function formatSignDate(date: Date = new Date()): string {
  try {
    const localized = date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    if (/^[\x20-\x7E]+$/.test(localized)) {
      return localized;
    }
  } catch {
    // Fall through to ISO
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
