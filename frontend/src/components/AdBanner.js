import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { getAdMobBannerUnitId } from '../monetization/config';
import { useMonetization } from '../monetization/MonetizationContext';
import { hasNativeModule } from '../runtime';
import { colors, radii, spacing } from '../theme';

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
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    minHeight: 50,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
  },
});
