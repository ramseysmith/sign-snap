# SignSnap

A document signing app built with Expo and React Native. Scan or upload documents, draw your signature, place it precisely, and export signed PDFs.

## Features

- **Scan Documents** - Use your camera to capture physical documents
- **Upload PDFs** - Import existing PDF files from your device
- **Draw Signature** - Full-screen signature pad with smooth drawing
- **Place & Resize** - Drag and pinch to position your signature perfectly
- **Multi-page Support** - Navigate and sign any page of multi-page PDFs
- **Share & Save** - Export via native share sheet or save to your library
- **Document History** - Access previously signed documents
- **Dark Theme** - Modern dark UI design

## Tech Stack

- **Framework**: Expo SDK 54 / React Native
- **Language**: TypeScript
- **Navigation**: React Navigation (Native Stack)
- **State Management**: Zustand
- **PDF Handling**: pdf-lib, react-native-pdf
- **Gestures**: React Native Gesture Handler + Reanimated
- **Signature**: react-native-signature-canvas

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator / Android Emulator or physical device
- EAS CLI (for dev builds)

### Installation

```bash
# Clone the repository
git clone https://github.com/ramseysmith/sign-snap.git
cd sign-snap

# Install dependencies
npm install
```

### Development

This app uses native modules that require a development build (won't work in Expo Go).

```bash
# Create a development build
npx eas build --profile development --platform ios
# or
npx eas build --profile development --platform android

# Start the dev server
npx expo start --dev-client
```

### Running on Simulator (iOS)

```bash
npx expo run:ios
```

### Running on Emulator (Android)

```bash
npx expo run:android
```

## Project Structure

```
src/
├── screens/
│   ├── HomeScreen.tsx          # Landing with scan/upload options
│   ├── CameraScreen.tsx        # Document scanner
│   ├── DocumentPreviewScreen.tsx # PDF viewer
│   ├── SignatureScreen.tsx     # Signature drawing
│   ├── PlaceSignatureScreen.tsx # Signature positioning
│   ├── FinalPreviewScreen.tsx  # Signed document preview
│   └── DocumentsScreen.tsx     # Document history
├── components/
│   ├── ActionButton.tsx        # Reusable button
│   ├── SignaturePad.tsx        # Signature canvas wrapper
│   ├── SignatureDraggable.tsx  # Draggable signature overlay
│   ├── PageSelector.tsx        # Page navigation
│   └── DocumentThumbnail.tsx   # Document list item
├── services/
│   ├── pdfService.ts           # PDF operations
│   ├── fileService.ts          # File system helpers
│   └── shareService.ts         # Share functionality
├── store/
│   └── useDocumentStore.ts     # Zustand store
├── navigation/
│   └── AppNavigator.tsx        # Navigation config
├── hooks/
│   └── usePermissions.ts       # Permission handling
├── types/
│   └── index.ts                # TypeScript interfaces
└── utils/
    ├── constants.ts            # Theme & config
    └── helpers.ts              # Utility functions
```

## App Flow

1. **Home** → Choose to scan or upload a document
2. **Camera/Upload** → Capture or select your document
3. **Preview** → View the PDF and tap "Add Signature"
4. **Signature** → Draw your signature on the canvas
5. **Place** → Position and resize the signature on the document
6. **Final** → Review, share, or save the signed PDF

## Key Implementation Details

### Coordinate Mapping

The app handles the coordinate system difference between UI (top-left origin) and PDF (bottom-left origin):

```typescript
// UI to PDF coordinate conversion
pdfY = pdfHeight - (uiY * scaleY) - signatureHeight
```

### Signature Transparency

Signatures are exported as transparent PNGs for clean overlay on documents.

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
