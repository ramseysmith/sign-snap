import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
  PurchasesError,
} from 'react-native-purchases';
import { REVENUECAT_CONFIG } from '../config/monetization';
import { useSubscriptionStore } from '../store/useSubscriptionStore';

let isInitialized = false;

/**
 * Initialize RevenueCat SDK
 * Should be called once on app startup
 */
export async function initializePurchases(): Promise<void> {
  if (isInitialized) {
    return;
  }

  try {
    // Enable debug logs in development
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    await Purchases.configure({
      apiKey: REVENUECAT_CONFIG.apiKey,
    });

    isInitialized = true;

    // Set up customer info listener
    Purchases.addCustomerInfoUpdateListener(handleCustomerInfoUpdate);

    // Initial check of subscription status
    await checkSubscriptionStatus();
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
    useSubscriptionStore.getState().setIsLoading(false);
  }
}

/**
 * Handle customer info updates from RevenueCat
 */
function handleCustomerInfoUpdate(customerInfo: CustomerInfo): void {
  const isPremium = checkEntitlement(customerInfo);
  useSubscriptionStore.getState().setIsPremium(isPremium);
}

/**
 * Check if customer has premium entitlement
 */
function checkEntitlement(customerInfo: CustomerInfo): boolean {
  return (
    customerInfo.entitlements.active[REVENUECAT_CONFIG.entitlementId] !==
    undefined
  );
}

/**
 * Check current subscription status
 */
export async function checkSubscriptionStatus(): Promise<boolean> {
  const store = useSubscriptionStore.getState();
  store.setIsLoading(true);

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const isPremium = checkEntitlement(customerInfo);
    store.setIsPremium(isPremium);
    return isPremium;
  } catch (error) {
    console.error('Failed to check subscription status:', error);
    return store.isPremium; // Return cached value on error
  } finally {
    store.setIsLoading(false);
  }
}

/**
 * Fetch available subscription packages
 */
export async function fetchAvailablePackages(): Promise<PurchasesPackage[]> {
  const store = useSubscriptionStore.getState();

  try {
    const offerings = await Purchases.getOfferings();
    const currentOffering = offerings.current;

    if (currentOffering && currentOffering.availablePackages.length > 0) {
      store.setAvailablePackages(currentOffering.availablePackages);
      return currentOffering.availablePackages;
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch offerings:', error);
    return [];
  }
}

/**
 * Purchase a subscription package
 */
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<{ success: boolean; error?: string }> {
  const store = useSubscriptionStore.getState();
  store.setIsPurchasing(true);
  store.setPurchaseError(null);

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPremium = checkEntitlement(customerInfo);
    store.setIsPremium(isPremium);

    return { success: isPremium };
  } catch (error) {
    const purchaseError = error as PurchasesError;

    // User cancelled - not an error
    if (purchaseError.userCancelled) {
      return { success: false };
    }

    const errorMessage = purchaseError.message || 'Purchase failed';
    store.setPurchaseError(errorMessage);
    console.error('Purchase failed:', error);

    return { success: false, error: errorMessage };
  } finally {
    store.setIsPurchasing(false);
  }
}

/**
 * Restore previous purchases
 */
export async function restorePurchases(): Promise<{
  success: boolean;
  isPremium: boolean;
  error?: string;
}> {
  const store = useSubscriptionStore.getState();
  store.setIsRestoring(true);

  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPremium = checkEntitlement(customerInfo);
    store.setIsPremium(isPremium);

    return { success: true, isPremium };
  } catch (error) {
    const restoreError = error as PurchasesError;
    const errorMessage = restoreError.message || 'Restore failed';
    console.error('Restore failed:', error);

    return { success: false, isPremium: false, error: errorMessage };
  } finally {
    store.setIsRestoring(false);
  }
}

/**
 * Get formatted price string for a package
 */
export function getPackagePrice(pkg: PurchasesPackage): string {
  return pkg.product.priceString;
}

/**
 * Get price per period description
 */
export function getPackagePricePerPeriod(pkg: PurchasesPackage): string {
  const identifier = pkg.packageType;

  switch (identifier) {
    case 'WEEKLY':
      return `${pkg.product.priceString}/week`;
    case 'MONTHLY':
      return `${pkg.product.priceString}/month`;
    case 'ANNUAL':
      return `${pkg.product.priceString}/year`;
    default:
      return pkg.product.priceString;
  }
}
