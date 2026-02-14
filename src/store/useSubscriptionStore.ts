import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PurchasesPackage } from 'react-native-purchases';

interface SubscriptionState {
  // Subscription status
  isPremium: boolean;
  isLoading: boolean;

  // Available packages from RevenueCat
  availablePackages: PurchasesPackage[];

  // Purchase state
  isPurchasing: boolean;
  purchaseError: string | null;

  // Restore state
  isRestoring: boolean;

  // Actions
  setIsPremium: (isPremium: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setAvailablePackages: (packages: PurchasesPackage[]) => void;
  setIsPurchasing: (isPurchasing: boolean) => void;
  setPurchaseError: (error: string | null) => void;
  setIsRestoring: (isRestoring: boolean) => void;
  reset: () => void;
}

const initialState = {
  isPremium: false,
  isLoading: true,
  availablePackages: [],
  isPurchasing: false,
  purchaseError: null,
  isRestoring: false,
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      ...initialState,

      setIsPremium: (isPremium) => set({ isPremium }),

      setIsLoading: (isLoading) => set({ isLoading }),

      setAvailablePackages: (availablePackages) => set({ availablePackages }),

      setIsPurchasing: (isPurchasing) => set({ isPurchasing }),

      setPurchaseError: (purchaseError) => set({ purchaseError }),

      setIsRestoring: (isRestoring) => set({ isRestoring }),

      reset: () => set(initialState),
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist isPremium for offline access
      partialize: (state) => ({
        isPremium: state.isPremium,
      }),
    }
  )
);

// Selector hooks for convenience
export const useIsPremium = () => useSubscriptionStore((state) => state.isPremium);
export const useIsSubscriptionLoading = () => useSubscriptionStore((state) => state.isLoading);
