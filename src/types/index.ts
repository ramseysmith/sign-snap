import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  DocumentPreview: {
    documentUri: string;
    documentName: string;
    isFromCamera?: boolean;
  };
  Signature: undefined;
  PlaceSignature: {
    pageIndex: number;
  };
  FinalPreview: {
    signedPdfUri: string;
    documentName: string;
  };
  Documents: undefined;
};

export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type CameraScreenProps = NativeStackScreenProps<RootStackParamList, 'Camera'>;
export type DocumentPreviewScreenProps = NativeStackScreenProps<RootStackParamList, 'DocumentPreview'>;
export type SignatureScreenProps = NativeStackScreenProps<RootStackParamList, 'Signature'>;
export type PlaceSignatureScreenProps = NativeStackScreenProps<RootStackParamList, 'PlaceSignature'>;
export type FinalPreviewScreenProps = NativeStackScreenProps<RootStackParamList, 'FinalPreview'>;
export type DocumentsScreenProps = NativeStackScreenProps<RootStackParamList, 'Documents'>;

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
