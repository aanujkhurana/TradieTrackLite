import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  View,
} from 'react-native';
import { createJob } from '../data/jobs';
import {
  AppShell,
  FormInput,
  LocalStorageNotice,
  PrimaryButton,
  ScreenHeader,
  SecondaryButton,
  Section,
} from '../components/ui';
import { useTheme } from '../theme';

export default function CreateJob({ navigation }) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [nameError, setNameError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (saving) return;
    let valid = true;
    if (!name.trim()) {
      setNameError('A job name helps you find this record later.');
      valid = false;
    } else {
      setNameError('');
    }
    if (!address.trim()) {
      setAddressError('An address keeps the job tied to a location.');
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
        address: address.trim(),
        notes,
      });
      navigation.goBack();
    } catch (err) {
      if (err.code === 'VALIDATION_ERROR') {
        Alert.alert('Validation error', err.message);
      } else {
        Alert.alert(
          'Local storage error',
          'Job could not be saved on this device. No internet is required, so try again from the local job form.'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell scroll testID="create-job-screen">
      <ScreenHeader
        eyebrow="New job"
        title="Quick docket"
        subtitle="Just the essentials. Add photos, reminders, and time tracking from the job record."
      />

      <LocalStorageNotice
        title="On this device"
        body="This job is saved locally on this phone. No account, no cloud, no sync."
      />

      <Section
        eyebrow="Work"
        title="What needs doing?"
        subtitle="Keep this short and specific. You can edit anything later."
      >
        <FormInput
          label="Job name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Fix kitchen tap"
          error={nameError}
          returnKeyType="next"
          autoCapitalize="sentences"
        />
        <FormInput
          label="Address"
          value={address}
          onChangeText={setAddress}
          placeholder="e.g. 12 Main St, Sydney"
          error={addressError}
          returnKeyType="next"
          leftIcon="location"
        />
        <FormInput
          label="Job notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything to remember about the work"
          helper="Optional. Add the details that help on-site."
          multiline
        />
      </Section>

      <Section
        eyebrow="Customer"
        title="Who is it for?"
        subtitle="Keeps customer info separate from the job title. Add later if you do not have it now."
      >
        <FormInput
          label="Customer name"
          value={customerName}
          onChangeText={setCustomerName}
          placeholder="e.g. Sarah Williams"
          returnKeyType="next"
          leftIcon="info"
        />
        <FormInput
          label="Phone"
          value={customerPhone}
          onChangeText={setCustomerPhone}
          placeholder="0400 000 000"
          keyboardType="phone-pad"
          returnKeyType="next"
          leftIcon="phone"
        />
        <FormInput
          label="Email"
          value={customerEmail}
          onChangeText={setCustomerEmail}
          placeholder="name@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon="email"
        />
      </Section>

      <View style={styles.actionBar}>
        <PrimaryButton
          title={saving ? 'Saving…' : 'Save job'}
          icon="check"
          onPress={handleSubmit}
          disabled={saving}
          loading={saving}
          fullWidth
        />
        <SecondaryButton
          title="Cancel"
          onPress={() => navigation.goBack()}
          fullWidth
        />
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  actionBar: {
    marginTop: 8,
    marginBottom: 16,
    gap: 10,
  },
});
