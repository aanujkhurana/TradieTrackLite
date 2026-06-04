import React from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AD_FREE_PRODUCT_ID,
  ADS_PROVIDER,
  PURCHASE_PROVIDER,
} from '../monetization/config';
import { useMonetization } from '../monetization/MonetizationContext';
import { buttons, colors, radii, shadows, spacing, typography } from '../theme';

function getPurchaseErrorMessage(err) {
  if (err?.code === 'PURCHASES_NOT_CONFIGURED') {
    return 'Ad-free purchase is not configured for this build yet.';
  }
  if (err?.code === 'AD_FREE_PACKAGE_NOT_FOUND') {
    return 'The one-time ad-free product is not available in the store yet.';
  }
  if (err?.code === 'AD_FREE_PURCHASE_NOT_FOUND') {
    return 'No ad-free purchase was found for this store account.';
  }
  if (err?.userCancelled) {
    return null;
  }
  return 'Ad-free purchase could not be completed right now.';
}

export default function AdFree() {
  const {
    entitlement,
    isAdFree,
    isBusy,
    purchaseAdFree,
    restorePurchase,
  } = useMonetization();

  const handlePurchase = async () => {
    try {
      await purchaseAdFree();
      Alert.alert('Ad-Free Active', 'Ads have been removed from this device.');
    } catch (err) {
      const message = getPurchaseErrorMessage(err);
      if (message) {
        Alert.alert('Purchase Unavailable', message);
      }
    }
  };

  const handleRestore = async () => {
    try {
      await restorePurchase();
      Alert.alert('Purchase Restored', 'Ads have been removed from this device.');
    } catch (err) {
      const message = getPurchaseErrorMessage(err);
      if (message) {
        Alert.alert('Restore Unavailable', message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.panel}>
        <Text style={styles.title}>{isAdFree ? 'Ad-Free Active' : 'Remove Ads'}</Text>
        <Text style={styles.body}>
          {isAdFree
            ? 'This device has a validated ad-free entitlement.'
            : 'TradieTrack Lite stays free with small banner ads. A one-time purchase removes ads.'}
        </Text>

        <View style={styles.metaBox}>
          <Text style={styles.metaLabel}>Ads</Text>
          <Text style={styles.metaValue}>{ADS_PROVIDER}</Text>
          <Text style={styles.metaLabel}>Purchase</Text>
          <Text style={styles.metaValue}>{PURCHASE_PROVIDER}</Text>
          <Text style={styles.metaLabel}>Product</Text>
          <Text style={styles.metaValue}>{AD_FREE_PRODUCT_ID}</Text>
          {entitlement.purchasedAt ? (
            <>
              <Text style={styles.metaLabel}>Unlocked</Text>
              <Text style={styles.metaValue}>{entitlement.purchasedAt}</Text>
            </>
          ) : null}
        </View>

        {!isAdFree ? (
          <TouchableOpacity
            style={[styles.primaryBtn, isBusy && styles.disabledBtn]}
            onPress={handlePurchase}
            activeOpacity={0.8}
            disabled={isBusy}
          >
            <Text style={styles.primaryBtnText}>
              {isBusy ? 'Checking Store...' : 'Buy Ad-Free'}
            </Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.secondaryBtn, isBusy && styles.disabledBtn]}
          onPress={handleRestore}
          activeOpacity={0.8}
          disabled={isBusy}
        >
          <Text style={styles.secondaryBtnText}>Restore Purchase</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.screen,
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.card,
    ...shadows.card,
  },
  title: {
    color: colors.ink,
    ...typography.title,
  },
  body: {
    color: colors.muted,
    ...typography.body,
    marginTop: 8,
  },
  metaBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 16,
    padding: 12,
  },
  metaLabel: {
    color: colors.subtle,
    ...typography.label,
    marginTop: 8,
  },
  metaValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: buttons.radius,
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 16,
    minHeight: buttons.minHeight,
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryBtn: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: buttons.radius,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 14,
    minHeight: buttons.minHeight,
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  disabledBtn: {
    opacity: 0.65,
  },
});
