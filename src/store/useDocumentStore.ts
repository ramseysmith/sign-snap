import { create } from 'zustand';
import { SavedDocument, SignaturePlacement, PdfDimensions, ViewDimensions } from '../types';

interface DocumentState {
  // Current document being processed
  currentDocumentUri: string | null;
  currentDocumentName: string | null;
  totalPages: number;
  currentPage: number;

  // Signature
  signatureBase64: string | null;
  signaturePlacement: SignaturePlacement | null;

  // PDF dimensions for coordinate mapping
  pdfDimensions: PdfDimensions | null;
  viewDimensions: ViewDimensions | null;

  // Saved documents
  savedDocuments: SavedDocument[];

  // Actions
  setCurrentDocument: (uri: string, name: string) => void;
  setTotalPages: (count: number) => void;
  setCurrentPage: (page: number) => void;
  setSignature: (base64: string) => void;
  setSignaturePlacement: (placement: SignaturePlacement | null) => void;
  setPdfDimensions: (dimensions: PdfDimensions) => void;
  setViewDimensions: (dimensions: ViewDimensions) => void;
  addSavedDocument: (doc: SavedDocument) => void;
  removeSavedDocument: (id: string) => void;
  resetWorkflow: () => void;
}

const initialState = {
  currentDocumentUri: null,
  currentDocumentName: null,
  totalPages: 0,
  currentPage: 0,
  signatureBase64: null,
  signaturePlacement: null,
  pdfDimensions: null,
  viewDimensions: null,
  savedDocuments: [],
};

export const useDocumentStore = create<DocumentState>((set) => ({
  ...initialState,

  setCurrentDocument: (uri: string, name: string) =>
    set({ currentDocumentUri: uri, currentDocumentName: name }),

  setTotalPages: (count: number) => set({ totalPages: count }),

  setCurrentPage: (page: number) => set({ currentPage: page }),

  setSignature: (base64: string) => set({ signatureBase64: base64 }),

  setSignaturePlacement: (placement: SignaturePlacement | null) =>
    set({ signaturePlacement: placement }),

  setPdfDimensions: (dimensions: PdfDimensions) =>
    set({ pdfDimensions: dimensions }),

  setViewDimensions: (dimensions: ViewDimensions) =>
    set({ viewDimensions: dimensions }),

  addSavedDocument: (doc: SavedDocument) =>
    set((state) => ({
      savedDocuments: [doc, ...state.savedDocuments],
    })),

  removeSavedDocument: (id: string) =>
    set((state) => ({
      savedDocuments: state.savedDocuments.filter((d) => d.id !== id),
    })),

  resetWorkflow: () =>
    set({
      currentDocumentUri: null,
      currentDocumentName: null,
      totalPages: 0,
      currentPage: 0,
      signatureBase64: null,
      signaturePlacement: null,
      pdfDimensions: null,
      viewDimensions: null,
    }),
}));
