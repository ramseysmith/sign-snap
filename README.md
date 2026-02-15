# SignSnap

A document signing app built with Expo and React Native. Scan or upload documents, create signatures (draw, type, or capture), place them precisely, and export signed PDFs.

## Features

### Document Handling
- **Scan Documents** - Use your camera to capture physical documents
- **Upload PDFs** - Import existing PDF files from your device
- **Multi-page Support** - Navigate and sign any page of multi-page PDFs
- **Document History** - Access previously signed documents

### Signature Creation
- **Draw Signature** - Full-screen signature pad with smooth drawing
- **Type Signature** - Choose from 5 elegant script fonts
- **Capture Signature** - Take a photo of your physical signature
- **Signature Library** - Save and reuse multiple signatures and initials

### Signing Experience
- **Place & Resize** - Drag and pinch to position your signature perfectly
- **Landscape Mode** - Rotate to landscape for easier drawing
- **Visual Guides** - X and signature line for proper placement
- **Share & Save** - Export via native share sheet or save to your library

### Premium Features
- **Free Tier**: Unlimited signatures, 2 document signings, ads shown
- **Premium Tier**: Unlimited document signings, ad-free experience
- **Rewarded Ads**: Watch 5 ads to earn 1 additional document signing

## Tech Stack

- **Framework**: Expo SDK 54 / React Native
- **Language**: TypeScript
- **Navigation**: React Navigation (Native Stack)
- **State Management**: Zustand (with AsyncStorage persistence)
- **PDF Handling**: pdf-lib, react-native-pdf
- **Gestures**: React Native Gesture Handler + Reanimated
- **Signature Drawing**: Custom SVG-based implementation
- **Monetization**: RevenueCat (subscriptions), Google AdMob (ads)
- **Fonts**: Google Fonts (Dancing Script, Great Vibes, Pacifico, Allura, Sacramento)

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
# Run on iOS device
npx expo run:ios --device

# Run on Android device
npx expo run:android --device

# Or create an EAS development build
npx eas build --profile development --platform ios
npx eas build --profile development --platform android

# Start the dev server
npx expo start --dev-client
```

## Project Structure

```
src/
├── screens/
│   ├── HomeScreen.tsx              # Landing with scan/upload options
│   ├── CameraScreen.tsx            # Document scanner
│   ├── DocumentPreviewScreen.tsx   # PDF viewer
│   ├── SignatureScreen.tsx         # Signature hub (select/create)
│   ├── SignatureCaptureScreen.tsx  # Camera capture signature
│   ├── SignatureTypedScreen.tsx    # Typed signature with fonts
│   ├── SignatureManagerScreen.tsx  # Manage saved signatures
│   ├── PlaceSignatureScreen.tsx    # Signature positioning
│   ├── FinalPreviewScreen.tsx      # Signed document preview
│   ├── DocumentsScreen.tsx         # Document history
│   └── PaywallScreen.tsx           # Premium subscription
├── components/
│   ├── ActionButton.tsx            # Reusable button
│   ├── SignaturePad.tsx            # SVG-based signature canvas
│   ├── SignatureDraggable.tsx      # Draggable signature overlay
│   ├── SignaturePreviewCard.tsx    # Signature list item
│   ├── SignatureTypeToggle.tsx     # Signature/Initials toggle
│   ├── SignatureMethodSelector.tsx # Draw/Type/Capture selector
│   ├── FontSelector.tsx            # Font picker for typed signatures
│   ├── TypedSignaturePreview.tsx   # Typed signature preview
│   ├── PageSelector.tsx            # Page navigation
│   ├── BannerAd.tsx                # AdMob banner component
│   ├── UpgradePrompt.tsx           # Premium upsell component
│   └── AnimatedSplash.tsx          # Animated splash screen
├── services/
│   ├── pdfService.ts               # PDF operations
│   ├── fileService.ts              # File system helpers
│   ├── shareService.ts             # Share functionality
│   ├── signatureService.ts         # Signature processing
│   ├── purchaseService.ts          # RevenueCat integration
│   └── adService.ts                # AdMob initialization
├── store/
│   ├── useDocumentStore.ts         # Document state
│   ├── useSignatureStore.ts        # Signature library state
│   └── useSubscriptionStore.ts     # Premium/ad state
├── hooks/
│   ├── useInterstitialAd.ts        # Interstitial ad hook
│   ├── useRewardedAd.ts            # Rewarded ad hook
│   └── useDocumentLimit.ts         # Document limit enforcement
├── config/
│   └── monetization.ts             # RevenueCat & AdMob config
├── navigation/
│   └── AppNavigator.tsx            # Navigation config
├── types/
│   └── index.ts                    # TypeScript interfaces
└── utils/
    └── constants.ts                # Theme & config
```

## App Flow

1. **Home** → Choose to scan or upload a document
2. **Camera/Upload** → Capture or select your document
3. **Preview** → View the PDF and tap "Add Signature"
4. **Signature** → Select existing or create new (draw/type/capture)
5. **Place** → Position and resize the signature on the document
6. **Final** → Review, share, or save the signed PDF

## Monetization Flow

### Free Users
- Create unlimited signatures and initials
- Sign up to 2 documents
- Interstitial ads shown after creating signatures and before sharing
- After limit: upgrade to premium OR watch 5 rewarded ads for 1 more document

### Premium Users
- Unlimited document signings
- No advertisements
- Priority support

## Configuration

### RevenueCat Setup
1. Create app in RevenueCat dashboard
2. Configure products: `signsnap_premium_weekly`, `signsnap_premium_monthly`, `signsnap_premium_yearly`
3. Update API keys in `src/config/monetization.ts`

### AdMob Setup
1. Ad unit IDs are configured in `src/config/monetization.ts`
2. App ID is set in `app.json` under the AdMob plugin config

## Key Implementation Details

### Coordinate Mapping

The app handles the coordinate system difference between UI (top-left origin) and PDF (bottom-left origin), accounting for letterboxing when the PDF aspect ratio differs from the container:

```typescript
// Calculate rendered PDF dimensions within container
const pdfAspect = pdfWidth / pdfHeight;
const containerAspect = containerWidth / containerHeight;

if (pdfAspect > containerAspect) {
  // PDF is wider - fit to width, letterbox top/bottom
  renderedWidth = containerWidth;
  renderedHeight = containerWidth / pdfAspect;
}
```

### Signature Drawing

Custom implementation using:
- `react-native-gesture-handler` for pan gestures
- `react-native-svg` for rendering strokes
- `react-native-view-shot` for capturing as PNG

### Signature Transparency

Signatures are exported as transparent PNGs for clean overlay on documents.

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
