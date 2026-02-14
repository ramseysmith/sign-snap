import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
  PurchasesError,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';
import { REVENUECAT_CONFIG, PRODUCT_IDS } from '../config/monetization';
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

    // Configure RevenueCat
    await Purchases.configure({
      apiKey: REVENUECAT_CONFIG.apiKey,
    });

    isInitialized = true;
    console.log('RevenueCat SDK initialized successfully');

    // Set up customer info listener for real-time updates
    Purchases.addCustomerInfoUpdateListener(handleCustomerInfoUpdate);

    // Initial check of subscription status
    await checkSubscriptionStatus();

    // Pre-fetch offerings for faster paywall display
    await fetchAvailablePackages();
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
    useSubscriptionStore.getState().setIsLoading(false);
  }
}

/**
 * Handle customer info updates from RevenueCat
 * Called whenever subscription status changes
 */
function handleCustomerInfoUpdate(customerInfo: CustomerInfo): void {
  const isPremium = checkEntitlement(customerInfo);
  const store = useSubscriptionStore.getState();
  store.setIsPremium(isPremium);

  if (__DEV__) {
    console.log('Customer info updated:', {
      isPremium,
      activeSubscriptions: customerInfo.activeSubscriptions,
      entitlements: Object.keys(customerInfo.entitlements.active),
    });
  }
}

/**
 * Check if customer has the SignSnap Premium entitlement
 */
function checkEntitlement(customerInfo: CustomerInfo): boolean {
  const entitlement = customerInfo.entitlements.active[REVENUECAT_CONFIG.entitlementId];
  return entitlement !== undefined && entitlement.isActive;
}

/**
 * Get current customer info
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error('Failed to get customer info:', error);
    return null;
  }
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
 * Fetch available subscription packages from RevenueCat
 */
export async function fetchAvailablePackages(): Promise<PurchasesPackage[]> {
  const store = useSubscriptionStore.getState();

  try {
    const offerings = await Purchases.getOfferings();

    if (__DEV__) {
      console.log('Offerings fetched:', offerings);
    }

    // Get the default offering or a specific one
    const currentOffering = offerings.current || offerings.all[REVENUECAT_CONFIG.offeringId];

    if (currentOffering && currentOffering.availablePackages.length > 0) {
      store.setAvailablePackages(currentOffering.availablePackages);
      return currentOffering.availablePackages;
    }

    console.warn('No offerings available');
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
): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> {
  const store = useSubscriptionStore.getState();
  store.setIsPurchasing(true);
  store.setPurchaseError(null);

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPremium = checkEntitlement(customerInfo);
    store.setIsPremium(isPremium);

    return { success: isPremium, customerInfo };
  } catch (error) {
    const purchaseError = error as PurchasesError;

    // Handle specific error codes
    if (purchaseError.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      // User cancelled - not an error
      return { success: false };
    }

    if (purchaseError.code === PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR) {
      // Already purchased - restore instead
      const restoreResult = await restorePurchases();
      return {
        success: restoreResult.isPremium,
        error: restoreResult.isPremium ? undefined : 'Already purchased. Please restore purchases.'
      };
    }

    const errorMessage = getErrorMessage(purchaseError);
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
  customerInfo?: CustomerInfo;
  error?: string;
}> {
  const store = useSubscriptionStore.getState();
  store.setIsRestoring(true);

  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPremium = checkEntitlement(customerInfo);
    store.setIsPremium(isPremium);

    return { success: true, isPremium, customerInfo };
  } catch (error) {
    const restoreError = error as PurchasesError;
    const errorMessage = getErrorMessage(restoreError);
    console.error('Restore failed:', error);

    return { success: false, isPremium: false, error: errorMessage };
  } finally {
    store.setIsRestoring(false);
  }
}

/**
 * Get user-friendly error message from PurchasesError
 */
function getErrorMessage(error: PurchasesError): string {
  switch (error.code) {
    case PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR:
      return 'Purchase was cancelled.';
    case PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR:
      return 'Purchases are not allowed on this device.';
    case PURCHASES_ERROR_CODE.PURCHASE_INVALID_ERROR:
      return 'Invalid purchase. Please try again.';
    case PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR:
      return 'This product is not available for purchase.';
    case PURCHASES_ERROR_CODE.NETWORK_ERROR:
      return 'Network error. Please check your connection.';
    case PURCHASES_ERROR_CODE.RECEIPT_ALREADY_IN_USE_ERROR:
      return 'This receipt is already in use by another account.';
    case PURCHASES_ERROR_CODE.INVALID_CREDENTIALS_ERROR:
      return 'Invalid credentials. Please try again.';
    case PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR:
      return 'There was a problem with the App Store. Please try again later.';
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
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
  const product = pkg.product;

  // Fallback to package type for period description
  switch (pkg.packageType) {
    case 'WEEKLY':
      return `${product.priceString}/week`;
    case 'MONTHLY':
      return `${product.priceString}/month`;
    case 'ANNUAL':
      return `${product.priceString}/year`;
    case 'TWO_MONTH':
      return `${product.priceString}/2 months`;
    case 'THREE_MONTH':
      return `${product.priceString}/3 months`;
    case 'SIX_MONTH':
      return `${product.priceString}/6 months`;
    case 'LIFETIME':
      return `${product.priceString} (lifetime)`;
    default:
      return product.priceString;
  }
}

/**
 * Identify user for RevenueCat (optional - for user accounts)
 */
export async function identifyUser(userId: string): Promise<CustomerInfo | null> {
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    const isPremium = checkEntitlement(customerInfo);
    useSubscriptionStore.getState().setIsPremium(isPremium);
    return customerInfo;
  } catch (error) {
    console.error('Failed to identify user:', error);
    return null;
  }
}

/**
 * Log out current user (for user accounts)
 */
export async function logOutUser(): Promise<CustomerInfo | null> {
  try {
    const customerInfo = await Purchases.logOut();
    const isPremium = checkEntitlement(customerInfo);
    useSubscriptionStore.getState().setIsPremium(isPremium);
    return customerInfo;
  } catch (error) {
    console.error('Failed to log out user:', error);
    return null;
  }
}

/**
 * Check if RevenueCat is initialized
 */
export function isPurchasesInitialized(): boolean {
  return isInitialized;
}
