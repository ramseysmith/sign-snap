import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Signature input method types
export type SignatureInputMethod = 'draw' | 'image' | 'typed';
export type SignatureType = 'signature' | 'initials';

// Font options for typed signatures
export type SignatureFont =
  | 'dancing-script'
  | 'great-vibes'
  | 'pacifico'
  | 'allura'
  | 'sacramento';

// Saved signature structure
export interface SavedSignature {
  id: string;
  name: string;
  type: SignatureType;
  inputMethod: SignatureInputMethod;
  base64: string;
  createdAt: number;
  metadata?: {
    fontFamily?: SignatureFont;
    text?: string;
  };
}

export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  Camera: undefined;
  ImageCrop: {
    imageUri: string;
  };
  DocumentPreview: {
    documentUri: string;
    documentName: string;
    isFromCamera?: boolean;
    viewOnly?: boolean;
  };
  Signature: {
    signatureType?: SignatureType;
  };
  SignatureCapture: {
    signatureType: SignatureType;
  };
  SignatureTyped: {
    signatureType: SignatureType;
  };
  SignatureManager: undefined;
  PlaceSignature: {
    pageIndex: number;
  };
  FinalPreview: {
    signedPdfUri: string;
    documentName: string;
  };
  Documents: undefined;
  Paywall: undefined;
  CustomerCenter: undefined;
};

export type OnboardingScreenProps = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type CameraScreenProps = NativeStackScreenProps<RootStackParamList, 'Camera'>;
export type ImageCropScreenProps = NativeStackScreenProps<RootStackParamList, 'ImageCrop'>;
export type DocumentPreviewScreenProps = NativeStackScreenProps<RootStackParamList, 'DocumentPreview'>;
export type SignatureScreenProps = NativeStackScreenProps<RootStackParamList, 'Signature'>;
export type SignatureCaptureScreenProps = NativeStackScreenProps<RootStackParamList, 'SignatureCapture'>;
export type SignatureTypedScreenProps = NativeStackScreenProps<RootStackParamList, 'SignatureTyped'>;
export type SignatureManagerScreenProps = NativeStackScreenProps<RootStackParamList, 'SignatureManager'>;
export type PlaceSignatureScreenProps = NativeStackScreenProps<RootStackParamList, 'PlaceSignature'>;
export type FinalPreviewScreenProps = NativeStackScreenProps<RootStackParamList, 'FinalPreview'>;
export type DocumentsScreenProps = NativeStackScreenProps<RootStackParamList, 'Documents'>;
export type PaywallScreenProps = NativeStackScreenProps<RootStackParamList, 'Paywall'>;
export type CustomerCenterScreenProps = NativeStackScreenProps<RootStackParamList, 'CustomerCenter'>;

export interface SignaturePlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
}

export interface SavedDocument {
  id: string;
  name: string;
  uri: string;
  createdAt: number;
  thumbnailUri?: string;
}

export interface PdfDimensions {
  width: number;
  height: number;
}

export interface ViewDimensions {
  width: number;
  height: number;
}
