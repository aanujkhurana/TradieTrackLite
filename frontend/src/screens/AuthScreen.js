import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { DATA_SAFETY_MESSAGES } from '../privacy/dataSafety';

export default function AuthScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.noticeCard}>
        <Text style={styles.title}>TradieTrack Lite</Text>
        <Text style={styles.subtitle}>No sign-in is required for the local-first MVP.</Text>
        <Text style={styles.body}>{DATA_SAFETY_MESSAGES.localStorageNote}</Text>
        <Text style={styles.body}>{DATA_SAFETY_MESSAGES.backendNotice}</Text>
        <Text style={styles.body}>{DATA_SAFETY_MESSAGES.analyticsNotice}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2f6',
    justifyContent: 'center',
    padding: 16,
  },
  noticeCard: {
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
  body: {
    color: '#374151',
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 8,
  },
});
