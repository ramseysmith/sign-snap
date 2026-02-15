import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PurchasesPackage } from 'react-native-purchases';

interface SubscriptionState {
  // Subscription status
  isPremium: boolean;
  isLoading: boolean;

  // Document signing tracking (for free tier limits)
  documentsSignedCount: number;
  additionalDocumentCredits: number; // Earned by watching rewarded ads
  rewardedAdsWatched: number; // Counter towards next credit (resets at 5)

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
  incrementDocumentsSigned: () => void;
  addRewardedAdWatch: () => void;
  useDocumentCredit: () => boolean;
  reset: () => void;
}

const initialState = {
  isPremium: false,
  isLoading: true,
  documentsSignedCount: 0,
  additionalDocumentCredits: 0,
  rewardedAdsWatched: 0,
  availablePackages: [],
  isPurchasing: false,
  purchaseError: null,
  isRestoring: false,
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setIsPremium: (isPremium) => set({ isPremium }),

      setIsLoading: (isLoading) => set({ isLoading }),

      setAvailablePackages: (availablePackages) => set({ availablePackages }),

      setIsPurchasing: (isPurchasing) => set({ isPurchasing }),

      setPurchaseError: (purchaseError) => set({ purchaseError }),

      setIsRestoring: (isRestoring) => set({ isRestoring }),

      incrementDocumentsSigned: () =>
        set((state) => ({
          documentsSignedCount: state.documentsSignedCount + 1,
        })),

      addRewardedAdWatch: () =>
        set((state) => {
          const newCount = state.rewardedAdsWatched + 1;
          // Every 5 rewarded ads earns 1 document credit
          if (newCount >= 5) {
            return {
              rewardedAdsWatched: 0,
              additionalDocumentCredits: state.additionalDocumentCredits + 1,
            };
          }
          return { rewardedAdsWatched: newCount };
        }),

      useDocumentCredit: () => {
        const state = get();
        if (state.additionalDocumentCredits > 0) {
          set({ additionalDocumentCredits: state.additionalDocumentCredits - 1 });
          return true;
        }
        return false;
      },

      reset: () => set(initialState),
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist premium status and document tracking for offline access
      partialize: (state) => ({
        isPremium: state.isPremium,
        documentsSignedCount: state.documentsSignedCount,
        additionalDocumentCredits: state.additionalDocumentCredits,
        rewardedAdsWatched: state.rewardedAdsWatched,
      }),
    }
  )
);

// Selector hooks for convenience
export const useIsPremium = () => useSubscriptionStore((state) => state.isPremium);
export const useIsSubscriptionLoading = () => useSubscriptionStore((state) => state.isLoading);
