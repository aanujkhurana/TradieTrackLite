import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  AD_FREE_PRODUCT_ID,
  ADS_PROVIDER,
  PURCHASE_PROVIDER,
} from '../monetization/config';
import { useMonetization } from '../monetization/MonetizationContext';
import {
  AppShell,
  InfoRow,
  LocalStorageNotice,
  PrimaryButton,
  ScreenHeader,
  SecondaryButton,
  Section,
  UpgradeCard,
} from '../components/ui';
import { Icon } from '../components/Icon';
import { useTheme } from '../theme';

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
  const { colors } = useTheme();
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
      Alert.alert('Ad-free active', 'Ads have been removed from this device.');
    } catch (err) {
      const message = getPurchaseErrorMessage(err);
      if (message) {
        Alert.alert('Purchase unavailable', message);
      }
    }
  };

  const handleRestore = async () => {
    try {
      await restorePurchase();
      Alert.alert('Purchase restored', 'Ads have been removed from this device.');
    } catch (err) {
      const message = getPurchaseErrorMessage(err);
      if (message) {
        Alert.alert('Restore unavailable', message);
      }
    }
  };

  return (
    <AppShell scroll testID="ad-free-screen">
      <ScreenHeader
        eyebrow="Ad-free upgrade"
        title={isAdFree ? 'You are ad-free' : 'Remove ads once'}
        subtitle={
          isAdFree
            ? 'This device has a validated ad-free entitlement.'
            : 'One purchase. No subscription. No account.'
        }
      />

      <LocalStorageNotice
        title="Simple and local"
        body="The upgrade only controls ads. It does not add accounts, subscriptions, cloud sync, or required backend storage."
      />

      <UpgradeCard
        unlocked={isAdFree}
        onPress={isAdFree ? undefined : handlePurchase}
        productLabel="Ad-free"
        priceLabel={isAdFree ? 'Owned on this device' : 'One-time purchase'}
      />

      <Section
        eyebrow="What you get"
        title="The workspace, uncluttered"
        subtitle="Ads stay out of job creation, editing, report sharing, and other critical job-site actions."
      >
        <InfoRow
          icon="info"
          label="Ads placement"
          value="Off everywhere"
          tone="success"
        />
        <InfoRow
          icon="sparkle"
          label="Subscription"
          value="None"
        />
        <InfoRow
          icon="shield"
          label="Account required"
          value="No"
        />
        <InfoRow
          icon="doc"
          label="Cloud sync"
          value="Not added"
        />
      </Section>

      <Section
        eyebrow="Details"
        title="Product information"
      >
        <InfoRow icon="info" label="Ads provider" value={ADS_PROVIDER} />
        <InfoRow icon="sparkle" label="Purchase provider" value={PURCHASE_PROVIDER} />
        <InfoRow icon="doc" label="Product ID" value={AD_FREE_PRODUCT_ID} />
        {entitlement.purchasedAt ? (
          <InfoRow
            icon="checkCircle"
            label="Unlocked"
            value={entitlement.purchasedAt}
            tone="success"
          />
        ) : null}
      </Section>

      <View style={styles.actions}>
        {!isAdFree ? (
          <PrimaryButton
            title={isBusy ? 'Checking store…' : 'Buy ad-free'}
            onPress={handlePurchase}
            loading={isBusy}
            disabled={isBusy}
            fullWidth
            icon="sparkle"
          />
        ) : null}
        <SecondaryButton
          title="Restore purchase"
          onPress={handleRestore}
          disabled={isBusy}
          fullWidth
          icon="refresh"
        />
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  actions: {
    marginTop: 8,
    marginBottom: 20,
    gap: 10,
  },
});
