import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { getAdMobBannerUnitId } from '../monetization/config';
import { useMonetization } from '../monetization/MonetizationContext';
import { hasNativeModule } from '../runtime';
import { useTheme } from '../theme';
import { AdContainer } from './ui';

function getGoogleMobileAdsModule() {
  if (!hasNativeModule(['RNGoogleMobileAdsModule'])) {
    return null;
  }

  try {
    return require('react-native-google-mobile-ads');
  } catch {
    return null;
  }
}

export default function AdBanner({ placement = 'default', style }) {
  const { isAdFree, isLoading } = useMonetization();
  const { colors } = useTheme();
  const googleMobileAds = getGoogleMobileAdsModule();
  const unitId = getAdMobBannerUnitId(Platform.OS, __DEV__, googleMobileAds?.TestIds || {});

  if (isLoading || isAdFree || !unitId || !googleMobileAds) {
    return null;
  }

  const { BannerAd, BannerAdSize } = googleMobileAds;

  return (
    <AdContainer style={style}>
      <View style={styles.body}>
        <BannerAd
          unitId={unitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        />
      </View>
    </AdContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    width: '100%',
    alignItems: 'center',
  },
});
