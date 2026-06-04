import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  AD_FREE_PRODUCT_ID,
  ADS_PROVIDER,
  PURCHASE_PROVIDER,
} from '../monetization/config';
import { useMonetization } from '../monetization/MonetizationContext';
import {
  LocalStorageNotice,
  PrimaryButton,
  ScreenHeader,
  SecondaryButton,
  SectionCard,
} from '../components/ui';
import { colors, radii, spacing, typography } from '../theme';

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <ScreenHeader
        eyebrow="Ad-free upgrade"
        title={isAdFree ? 'Ad-Free Active' : 'Remove Ads'}
        subtitle={
          isAdFree
            ? 'This device has a validated ad-free entitlement.'
            : 'TradieTrack Lite stays free with controlled banner ads. One purchase removes them.'
        }
      />

      <LocalStorageNotice title="Simple and local">
        The upgrade only controls ads. It does not add accounts, subscriptions, cloud sync, or required backend storage.
      </LocalStorageNotice>

      <SectionCard
        eyebrow="One-time"
        title={isAdFree ? 'Thanks for supporting TradieTrack Lite' : 'Keep the workspace clean'}
        subtitle="Ads stay out of job creation, editing, report sharing, and other critical job-site actions."
      >
        <View style={styles.metaGrid}>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Ads</Text>
            <Text style={styles.metaValue}>{ADS_PROVIDER}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Purchase</Text>
            <Text style={styles.metaValue}>{PURCHASE_PROVIDER}</Text>
          </View>
          <View style={styles.metaBoxWide}>
            <Text style={styles.metaLabel}>Product</Text>
            <Text style={styles.metaValue}>{AD_FREE_PRODUCT_ID}</Text>
          </View>
          {entitlement.purchasedAt ? (
            <View style={styles.metaBoxWide}>
              <Text style={styles.metaLabel}>Unlocked</Text>
              <Text style={styles.metaValue}>{entitlement.purchasedAt}</Text>
            </View>
          ) : null}
        </View>

        {!isAdFree ? (
          <PrimaryButton
            title={isBusy ? 'Checking Store...' : 'Buy Ad-Free'}
            onPress={handlePurchase}
            disabled={isBusy}
            style={styles.primaryBtn}
          />
        ) : null}

        <SecondaryButton
          title="Restore Purchase"
          onPress={handleRestore}
          disabled={isBusy}
          style={styles.secondaryBtn}
        />
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.screen,
    paddingBottom: 42,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaBox: {
    flexGrow: 1,
    flexBasis: 130,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
  },
  metaBoxWide: {
    flexBasis: '100%',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
  },
  metaLabel: {
    color: colors.subtle,
    ...typography.label,
  },
  metaValue: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  primaryBtn: {
    marginTop: spacing.lg,
  },
  secondaryBtn: {
    marginTop: spacing.md,
  },
});
