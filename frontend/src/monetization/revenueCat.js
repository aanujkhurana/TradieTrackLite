import { Platform } from 'react-native';
import {
  AD_FREE_ENTITLEMENT_ID,
  AD_FREE_PRODUCT_ID,
  PURCHASE_PROVIDER,
  getRevenueCatApiKey,
} from './config';
import { hasNativeModule, isExpoGo } from '../runtime';

let configuredApiKey = null;

function getPurchasesModule() {
  if (!isExpoGo() && !hasNativeModule(['RNPurchases'])) {
    return null;
  }

  if (isExpoGo()) {
    return null;
  }

  try {
    const purchasesModule = require('react-native-purchases');
    return {
      Purchases: purchasesModule.default || purchasesModule,
      LOG_LEVEL: purchasesModule.LOG_LEVEL || {},
    };
  } catch {
    return null;
  }
}

export function hasActiveAdFreeEntitlement(
  customerInfo,
  entitlementId = AD_FREE_ENTITLEMENT_ID
) {
  return Boolean(customerInfo?.entitlements?.active?.[entitlementId]);
}

export function entitlementStateFromCustomerInfo(
  customerInfo,
  entitlementId = AD_FREE_ENTITLEMENT_ID,
  now = new Date().toISOString()
) {
  if (!hasActiveAdFreeEntitlement(customerInfo, entitlementId)) {
    return null;
  }

  const entitlement = customerInfo.entitlements.active[entitlementId];
  return {
    isAdFree: true,
    source: 'purchase',
    provider: PURCHASE_PROVIDER,
    purchasedAt: entitlement.latestPurchaseDate || entitlement.originalPurchaseDate || now,
    updatedAt: now,
  };
}

export function findAdFreePackage(offerings, productId = AD_FREE_PRODUCT_ID) {
  const packages = offerings?.current?.availablePackages || [];
  return packages.find((purchasePackage) => {
    const productIdentifier = purchasePackage?.product?.identifier;
    return productIdentifier === productId || purchasePackage?.identifier === productId;
  });
}

export async function configurePurchases(platform = Platform.OS) {
  const purchasesModule = getPurchasesModule();
  if (!purchasesModule) {
    const err = new Error(
      'Ad-free purchase testing requires a development or release build.'
    );
    err.code = 'PURCHASES_NATIVE_MODULE_UNAVAILABLE';
    throw err;
  }

  const apiKey = getRevenueCatApiKey(platform);
  if (!apiKey) {
    const err = new Error('RevenueCat is not configured for this build.');
    err.code = 'PURCHASES_NOT_CONFIGURED';
    throw err;
  }

  if (configuredApiKey === apiKey) {
    return;
  }

  const { Purchases, LOG_LEVEL } = purchasesModule;
  if (__DEV__ && Purchases.setLogLevel && LOG_LEVEL?.DEBUG) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }
  Purchases.configure({ apiKey });
  configuredApiKey = apiKey;
}

export async function purchaseAdFree(options = {}) {
  const {
    entitlementId = AD_FREE_ENTITLEMENT_ID,
    productId = AD_FREE_PRODUCT_ID,
    platform = Platform.OS,
  } = options;

  await configurePurchases(platform);

  const { Purchases } = getPurchasesModule();
  const offerings = await Purchases.getOfferings();
  const adFreePackage = findAdFreePackage(offerings, productId);
  if (!adFreePackage) {
    const err = new Error('The ad-free one-time purchase is not available.');
    err.code = 'AD_FREE_PACKAGE_NOT_FOUND';
    throw err;
  }

  const result = await Purchases.purchasePackage(adFreePackage);
  const nextState = entitlementStateFromCustomerInfo(result.customerInfo, entitlementId);
  if (!nextState) {
    const err = new Error('Purchase finished but ad-free access was not validated.');
    err.code = 'AD_FREE_ENTITLEMENT_MISSING';
    throw err;
  }

  return nextState;
}

export async function restoreAdFreePurchase(options = {}) {
  const {
    entitlementId = AD_FREE_ENTITLEMENT_ID,
    platform = Platform.OS,
  } = options;

  await configurePurchases(platform);

  const { Purchases } = getPurchasesModule();
  const customerInfo = await Purchases.restorePurchases();
  const nextState = entitlementStateFromCustomerInfo(customerInfo, entitlementId);
  if (!nextState) {
    const err = new Error('No ad-free purchase was found for this store account.');
    err.code = 'AD_FREE_PURCHASE_NOT_FOUND';
    throw err;
  }

  return nextState;
}

export function resetPurchasesConfigurationForTests() {
  configuredApiKey = null;
}
