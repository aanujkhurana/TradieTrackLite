import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { createJob } from '../data/jobs';
import {
  FormInput,
  LocalStorageNotice,
  PrimaryButton,
  ScreenHeader,
  SectionCard,
} from '../components/ui';
import { colors, spacing } from '../theme';

export default function CreateJob({ navigation }) {
  const [name, setName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [nameError, setNameError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (saving) return;

    let valid = true;
    if (!name.trim()) {
      setNameError('Job name is required');
      valid = false;
    } else {
      setNameError('');
    }
    if (!address.trim()) {
      setAddressError('Address is required');
      valid = false;
    } else {
      setAddressError('');
    }
    if (!valid) return;

    try {
      setSaving(true);
      await createJob({
        name: name.trim(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        customerNotes,
        address: address.trim(),
        notes,
      });
      navigation.goBack();
    } catch (err) {
      if (err.code === 'VALIDATION_ERROR') {
        Alert.alert('Validation Error', err.message);
      } else {
        Alert.alert(
          'Local Storage Error',
          'Job could not be saved on this device. No internet is required, so try again from the local job form.'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader
        eyebrow="Job intake"
        title="New Job"
        subtitle="Capture the essentials quickly while on-site."
      />

      <LocalStorageNotice>
        No account required. This job is saved on this device unless you export it.
      </LocalStorageNotice>

      <SectionCard
        eyebrow="Work"
        title="Job docket"
        subtitle="Keep the required fields short, then add detail only where it helps."
      >
        <FormInput
          label="Job Name *"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Fix kitchen tap"
          returnKeyType="next"
          error={nameError}
        />

        <FormInput
          label="Address *"
          value={address}
          onChangeText={setAddress}
          placeholder="e.g. 12 Main St, Sydney"
          returnKeyType="next"
          error={addressError}
        />

        <FormInput
          label="Job Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes..."
          multiline
          numberOfLines={4}
        />
      </SectionCard>

      <SectionCard
        eyebrow="Customer"
        title="Contact details"
        subtitle="Separate customer info from the job title so reports stay tidy."
      >
        <FormInput
          label="Customer Name"
          value={customerName}
          onChangeText={setCustomerName}
          placeholder="e.g. Sarah Williams"
          returnKeyType="next"
        />

        <FormInput
          label="Customer Phone"
          value={customerPhone}
          onChangeText={setCustomerPhone}
          placeholder="e.g. 0400 123 456"
          keyboardType="phone-pad"
          returnKeyType="next"
        />

        <FormInput
          label="Customer Email"
          value={customerEmail}
          onChangeText={setCustomerEmail}
          placeholder="e.g. sarah@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
        />

        <FormInput
          label="Customer Notes"
          value={customerNotes}
          onChangeText={setCustomerNotes}
          placeholder="Optional customer-specific notes..."
          multiline
          numberOfLines={3}
        />
      </SectionCard>

      <PrimaryButton
        title={saving ? 'Saving Job...' : 'Save Job'}
        onPress={handleSubmit}
        disabled={saving}
        style={styles.saveBtn}
      />
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
  saveBtn: {
    marginTop: spacing.sm,
  },
});
