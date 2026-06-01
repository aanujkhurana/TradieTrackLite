import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../AuthContext';
import { getApiErrorMessage } from '../utils/apiError';

export default function AuthScreen() {
  const { setSession } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const isRegistering = mode === 'register';

  const submit = async () => {
    if (!email.trim() || password.length < 8) {
      Alert.alert('Check Details', 'Enter an email and a password of at least 8 characters.');
      return;
    }

    setSaving(true);
    try {
      const path = isRegistering ? 'register' : 'login';
      const res = await axios.post(`${API_URL}/auth/${path}`, {
        email: email.trim(),
        password,
      });
      setSession({ token: res.data.token, user: res.data.user });
    } catch (err) {
      Alert.alert('Sign In Failed', getApiErrorMessage(err, 'Unable to sign in. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.formCard}>
        <Text style={styles.title}>TradieTrack Lite</Text>
        <Text style={styles.subtitle}>{isRegistering ? 'Create your account' : 'Sign in to your jobs'}</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          secureTextEntry
        />

        <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={saving} activeOpacity={0.8}>
          <Text style={styles.submitBtnText}>
            {saving ? 'Please wait...' : isRegistering ? 'Create Account' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchBtn}
          onPress={() => setMode(isRegistering ? 'login' : 'register')}
          activeOpacity={0.8}
        >
          <Text style={styles.switchBtnText}>
            {isRegistering ? 'I already have an account' : 'Create a new account'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2f6',
    justifyContent: 'center',
    padding: 16,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e9f0',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1f2937',
  },
  subtitle: {
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
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
  submitBtn: {
    backgroundColor: '#1565C0',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  switchBtn: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 8,
  },
  switchBtnText: {
    color: '#1565C0',
    fontSize: 14,
    fontWeight: '700',
  },
});
