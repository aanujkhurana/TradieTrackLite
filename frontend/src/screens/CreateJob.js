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
import axios from 'axios';
import { API_URL } from '../config';

export default function CreateJob({ navigation }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [nameError, setNameError] = useState('');
  const [addressError, setAddressError] = useState('');

  const handleSubmit = async () => {
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
      await axios.post(`${API_URL}/jobs`, { name: name.trim(), address: address.trim(), notes });
      navigation.goBack();
    } catch (err) {
      if (err.response?.status === 400) {
        Alert.alert('Validation Error', err.response.data.error || 'Invalid input');
      } else {
        Alert.alert('No connection', 'No connection — changes not saved');
      }
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

        <Text style={styles.label}>Address *</Text>
        <TextInput
          style={[styles.input, addressError ? styles.inputError : null]}
          value={address}
          onChangeText={setAddress}
          placeholder="e.g. 12 Main St, Sydney"
          returnKeyType="next"
        />
        {addressError ? <Text style={styles.error}>{addressError}</Text> : null}

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes..."
          multiline
          numberOfLines={4}
        />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} activeOpacity={0.8}>
        <Text style={styles.saveBtnText}>Save Job</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2f6',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 36,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e9f0',
    padding: 14,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  formSubtitle: {
    marginTop: 4,
    marginBottom: 4,
    color: '#6b7280',
    fontSize: 13,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fbfcff',
    borderWidth: 1,
    borderColor: '#d9e0e8',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#e53935',
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  error: {
    color: '#e53935',
    fontSize: 13,
    marginTop: 4,
  },
  saveBtn: {
    backgroundColor: '#1565C0',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
