import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { createJob } from '../data/jobs';
import { buttons, colors, radii, shadows, spacing, typography } from '../theme';

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
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>New Job</Text>
        <Text style={styles.formSubtitle}>Capture the essentials quickly while on-site.</Text>

        <Text style={styles.label}>Job Name *</Text>
        <TextInput
          style={[styles.input, nameError ? styles.inputError : null]}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Fix kitchen tap"
          returnKeyType="next"
        />
        {nameError ? <Text style={styles.error}>{nameError}</Text> : null}

        <Text style={styles.label}>Customer Name</Text>
        <TextInput
          style={styles.input}
          value={customerName}
          onChangeText={setCustomerName}
          placeholder="e.g. Sarah Williams"
          returnKeyType="next"
        />

        <Text style={styles.label}>Customer Phone</Text>
        <TextInput
          style={styles.input}
          value={customerPhone}
          onChangeText={setCustomerPhone}
          placeholder="e.g. 0400 123 456"
          keyboardType="phone-pad"
          returnKeyType="next"
        />

        <Text style={styles.label}>Customer Email</Text>
        <TextInput
          style={styles.input}
          value={customerEmail}
          onChangeText={setCustomerEmail}
          placeholder="e.g. sarah@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
        />

        <Text style={styles.label}>Customer Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={customerNotes}
          onChangeText={setCustomerNotes}
          placeholder="Optional customer-specific notes..."
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Address *</Text>
        <TextInput
          style={[styles.input, addressError ? styles.inputError : null]}
          value={address}
          onChangeText={setAddress}
          placeholder="e.g. 12 Main St, Sydney"
          returnKeyType="next"
        />
        {addressError ? <Text style={styles.error}>{addressError}</Text> : null}

        <Text style={styles.label}>Job Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes..."
          multiline
          numberOfLines={4}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.disabledBtn]}
        onPress={handleSubmit}
        activeOpacity={0.8}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>{saving ? 'Saving Job...' : 'Save Job'}</Text>
      </TouchableOpacity>
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
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.card,
    width: '100%',
    ...shadows.card,
  },
  formTitle: {
    ...typography.title,
    color: colors.ink,
  },
  formSubtitle: {
    marginTop: 6,
    marginBottom: 6,
    color: colors.muted,
    ...typography.small,
  },
  label: {
    ...typography.label,
    color: colors.text,
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surfaceInset,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 50,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.ink,
  },
  notesInput: {
    minHeight: 104,
    textAlignVertical: 'top',
  },
  error: {
    color: colors.ink,
    fontSize: 13,
    marginTop: 4,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: buttons.radius,
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: buttons.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.gap,
    ...shadows.card,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  disabledBtn: {
    opacity: 0.65,
  },
});
