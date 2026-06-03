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
    backgroundColor: '#eef2f6',
    padding: 16,
  },
  panel: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e9f0',
    padding: 16,
  },
  title: {
    color: '#1f2937',
    fontSize: 22,
    fontWeight: '800',
  },
  body: {
    color: '#4b5563',
    fontSize: 15,
    lineHeight: 21,
    marginTop: 8,
  },
  metaBox: {
    backgroundColor: '#f6f8fb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d9e0e8',
    marginTop: 16,
    padding: 12,
  },
  metaLabel: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  metaValue: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  primaryBtn: {
    backgroundColor: '#1565C0',
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 16,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryBtn: {
    backgroundColor: '#f3f8ff',
    borderColor: '#2196F3',
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 14,
  },
  secondaryBtnText: {
    color: '#1565C0',
    fontSize: 15,
    fontWeight: '800',
  },
  disabledBtn: {
    opacity: 0.65,
  },
});
