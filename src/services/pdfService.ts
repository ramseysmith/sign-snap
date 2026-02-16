import {
  readAsStringAsync,
  writeAsStringAsync,
  cacheDirectory,
  EncodingType,
} from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { PDFDocument } from 'pdf-lib';
import { decode as base64Decode, encode as base64Encode } from 'base-64';
import { PdfDimensions, ViewDimensions, SignaturePlacement } from '../types';
import { uiToPdfCoordinates } from '../utils/helpers';

// Polyfill for atob/btoa which pdf-lib needs
if (typeof global.atob === 'undefined') {
  global.atob = base64Decode;
}
if (typeof global.btoa === 'undefined') {
  global.btoa = base64Encode;
}

// Convert Uint8Array to base64 without stack overflow
function uint8ArrayToBase64(bytes: Uint8Array): string {
  const CHUNK_SIZE = 0x8000; // 32KB chunks to avoid call stack issues
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

export async function getPdfPageCount(pdfUri: string): Promise<number> {
  try {
    const pdfBase64 = await readAsStringAsync(pdfUri, {
      encoding: EncodingType.Base64,
    });
    const pdfBytes = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0));
    const pdfDoc = await PDFDocument.load(pdfBytes);
    return pdfDoc.getPageCount();
  } catch (error) {
    console.error('Error getting PDF page count:', error);
    throw new Error('Failed to read PDF file');
  }
}

export async function getPdfPageDimensions(
  pdfUri: string,
  pageIndex: number = 0
): Promise<PdfDimensions> {
  try {
    const pdfBase64 = await readAsStringAsync(pdfUri, {
      encoding: EncodingType.Base64,
    });
    const pdfBytes = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0));
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPage(pageIndex);
    const { width, height } = page.getSize();
    return { width, height };
  } catch (error) {
    console.error('Error getting PDF dimensions:', error);
    throw new Error('Failed to read PDF dimensions');
  }
}

export async function embedSignatureOnPdf(
  pdfUri: string,
  signatureBase64: string,
  placement: SignaturePlacement,
  viewDimensions: ViewDimensions
): Promise<string> {
  try {
    // Read the PDF
    const pdfBase64 = await readAsStringAsync(pdfUri, {
      encoding: EncodingType.Base64,
    });
    const pdfBytes = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0));
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Get the target page
    const page = pdfDoc.getPage(placement.pageIndex);
    const pdfDimensions = page.getSize();

    // Convert signature base64 to bytes (remove data URI prefix if present)
    const signatureData = signatureBase64.replace(/^data:image\/\w+;base64,/, '');
    const signatureBytes = Uint8Array.from(atob(signatureData), (c) => c.charCodeAt(0));

    // Embed the PNG image
    const signatureImage = await pdfDoc.embedPng(signatureBytes);

    // Convert UI coordinates to PDF coordinates for the bounding box
    const pdfCoords = uiToPdfCoordinates(
      placement.x,
      placement.y,
      placement.width,
      placement.height,
      viewDimensions,
      pdfDimensions
    );

    // Calculate aspect-ratio-preserving dimensions (like resizeMode="contain")
    // This matches how the signature appears in the preview
    const imageAspect = signatureImage.width / signatureImage.height;
    const boxAspect = pdfCoords.width / pdfCoords.height;

    let finalWidth: number;
    let finalHeight: number;
    let offsetX: number;
    let offsetY: number;

    if (imageAspect > boxAspect) {
      // Image is wider than box - fit to width
      finalWidth = pdfCoords.width;
      finalHeight = pdfCoords.width / imageAspect;
      offsetX = 0;
      offsetY = (pdfCoords.height - finalHeight) / 2;
    } else {
      // Image is taller than box - fit to height
      finalHeight = pdfCoords.height;
      finalWidth = pdfCoords.height * imageAspect;
      offsetX = (pdfCoords.width - finalWidth) / 2;
      offsetY = 0;
    }

    // Draw the signature on the page, centered within the bounding box
    page.drawImage(signatureImage, {
      x: pdfCoords.x + offsetX,
      y: pdfCoords.y + offsetY,
      width: finalWidth,
      height: finalHeight,
    });

    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    const modifiedPdfBase64 = uint8ArrayToBase64(modifiedPdfBytes);

    // Write to a new file
    const outputUri = `${cacheDirectory}signed_${Date.now()}.pdf`;
    await writeAsStringAsync(outputUri, modifiedPdfBase64, {
      encoding: EncodingType.Base64,
    });

    return outputUri;
  } catch (error) {
    console.error('Error embedding signature:', error);
    throw new Error('Failed to embed signature in PDF');
  }
}

export async function imagesToPdf(imageUris: string[]): Promise<string> {
  try {
    const pdfDoc = await PDFDocument.create();

    for (const imageUri of imageUris) {
      // Convert image to JPEG format to handle HEIC/HEIF and other formats
      // This ensures compatibility with pdf-lib which only supports PNG and JPEG
      const manipResult = await manipulateAsync(
        imageUri,
        [], // No transformations needed, just format conversion
        { format: SaveFormat.JPEG, compress: 0.9, base64: true }
      );

      if (!manipResult.base64) {
        throw new Error('Failed to convert image to JPEG');
      }

      const imageBytes = Uint8Array.from(atob(manipResult.base64), (c) => c.charCodeAt(0));

      // Embed as JPEG (all images are now converted to JPEG)
      const image = await pdfDoc.embedJpg(imageBytes);

      // Create a page with the image dimensions
      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });
    }

    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = uint8ArrayToBase64(pdfBytes);

    const outputUri = `${cacheDirectory}scanned_${Date.now()}.pdf`;
    await writeAsStringAsync(outputUri, pdfBase64, {
      encoding: EncodingType.Base64,
    });

    return outputUri;
  } catch (error) {
    console.error('Error creating PDF from images:', error);
    throw new Error('Failed to create PDF from images');
  }
}
