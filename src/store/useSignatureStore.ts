import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedSignature, SignatureType } from '../types';

interface SignatureState {
  // Saved signatures (persisted)
  savedSignatures: SavedSignature[];

  // Currently selected signature for signing workflow
  activeSignature: SavedSignature | null;

  // Actions
  addSignature: (signature: SavedSignature) => void;
  removeSignature: (id: string) => void;
  updateSignature: (id: string, updates: Partial<SavedSignature>) => void;
  setActiveSignature: (signature: SavedSignature | null) => void;
  clearActiveSignature: () => void;

  // Queries (implemented as selectors in components, but helper here)
  getSignaturesByType: (type: SignatureType) => SavedSignature[];
  getSignatureById: (id: string) => SavedSignature | undefined;
}

export const useSignatureStore = create<SignatureState>()(
  persist(
    (set, get) => ({
      savedSignatures: [],
      activeSignature: null,

      addSignature: (signature) =>
        set((state) => ({
          savedSignatures: [signature, ...state.savedSignatures],
        })),

      removeSignature: (id) =>
        set((state) => ({
          savedSignatures: state.savedSignatures.filter((s) => s.id !== id),
          activeSignature:
            state.activeSignature?.id === id ? null : state.activeSignature,
        })),

      updateSignature: (id, updates) =>
        set((state) => ({
          savedSignatures: state.savedSignatures.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),

      setActiveSignature: (signature) => set({ activeSignature: signature }),

      clearActiveSignature: () => set({ activeSignature: null }),

      getSignaturesByType: (type) =>
        get().savedSignatures.filter((s) => s.type === type),

      getSignatureById: (id) =>
        get().savedSignatures.find((s) => s.id === id),
    }),
    {
      name: 'signature-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        savedSignatures: state.savedSignatures,
      }),
    }
  )
);

// Helper to generate unique signature ID
export function generateSignatureId(): string {
  return `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
