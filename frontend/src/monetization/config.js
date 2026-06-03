import { Platform } from 'react-native';

export const ADS_PROVIDER = 'Google AdMob';
export const PURCHASE_PROVIDER = 'RevenueCat';
export const AD_FREE_ENTITLEMENT_ID =
  process.env.EXPO_PUBLIC_AD_FREE_ENTITLEMENT_ID || 'ad_free';
export const AD_FREE_PRODUCT_ID =
  process.env.EXPO_PUBLIC_AD_FREE_PRODUCT_ID || 'tradietrack_lite_ad_free';

const TEST_BANNER_IDS = {
  android: 'ca-app-pub-3940256099942544/6300978111',
  ios: 'ca-app-pub-3940256099942544/2934735716',
};

export function getAdMobBannerUnitId(platform = Platform.OS, isDev = __DEV__, testIds = {}) {
  const platformKey = platform === 'ios' ? 'IOS' : 'ANDROID';
  const platformUnitId = process.env[`EXPO_PUBLIC_ADMOB_${platformKey}_BANNER_AD_UNIT_ID`];
  const sharedUnitId = process.env.EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID;

  if (platformUnitId) return platformUnitId;
  if (sharedUnitId) return sharedUnitId;

  if (isDev) {
    return testIds.BANNER || TEST_BANNER_IDS[platform] || TEST_BANNER_IDS.android;
  }

  return null;
}

export function getRevenueCatApiKey(platform = Platform.OS) {
  if (platform === 'ios') {
    return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || '';
  }

  return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || '';
}
