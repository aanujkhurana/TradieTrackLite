import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { getAdMobBannerUnitId } from '../monetization/config';
import { useMonetization } from '../monetization/MonetizationContext';

export default function AdBanner({ placement = 'default' }) {
  const { isAdFree, isLoading } = useMonetization();
  const unitId = getAdMobBannerUnitId(Platform.OS, __DEV__, TestIds);

  if (isLoading || isAdFree || !unitId) {
    return null;
  }

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
