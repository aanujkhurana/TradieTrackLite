import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { getAdMobBannerUnitId } from '../monetization/config';
import { useMonetization } from '../monetization/MonetizationContext';

function getGoogleMobileAdsModule() {
  if (Constants.appOwnership === 'expo') {
    return null;
  }

  try {
    return require('react-native-google-mobile-ads');
  } catch {
    return null;
  }
}

export default function AdBanner({ placement = 'default' }) {
  const { isAdFree, isLoading } = useMonetization();
  const googleMobileAds = getGoogleMobileAdsModule();
  const unitId = getAdMobBannerUnitId(Platform.OS, __DEV__, googleMobileAds?.TestIds || {});

  if (isLoading || isAdFree || !unitId || !googleMobileAds) {
    return null;
  }

  const { BannerAd, BannerAdSize } = googleMobileAds;

  return (
    <View style={styles.container} testID={`ad-banner-${placement}`}>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 50,
    justifyContent: 'center',
  },
});
