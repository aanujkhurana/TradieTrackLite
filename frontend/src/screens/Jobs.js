import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { API_URL } from '../config';
import { formatLoggedDuration } from '../utils/time';

const STATUS_META = {
  pending: { label: 'Pending', color: '#7D8597' },
  in_progress: { label: 'In Progress', color: '#2196F3' },
  completed: { label: 'Completed', color: '#4CAF50' },
};

export default function Jobs({ navigation }) {
  const [jobs, setJobs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/jobs`);
      const rows = Array.isArray(res.data) ? res.data : [];
      const sorted = [...rows].sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });
      setJobs(sorted);
    } catch (err) {
      Alert.alert('No connection', 'No connection — changes not saved');
    }
  }, []);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  }, [fetchJobs]);

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, [fetchJobs])
  );

  // Task 7.3 — delete with confirm + network error handling
  const handleDelete = (job) => {
    Alert.alert(
      'Delete Job',
      `Delete "${job.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/jobs/${job._id}`);
              // Remove from local state on success (req 4.3)
              setJobs((prev) => prev.filter((j) => j._id !== job._id));
            } catch (err) {
              Alert.alert('No connection', 'No connection — changes not saved');
            }
          },
        },
      ]
    );
  };
  const stats = useMemo(() => {
    return jobs.reduce(
      (acc, job) => {
        acc.total += 1;
        if (job.status === 'completed') acc.completed += 1;
        if (job.status === 'in_progress') acc.inProgress += 1;
        return acc;
      },
      { total: 0, completed: 0, inProgress: 0 }
    );
  }, [jobs]);

  const renderSummary = () => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Jobs Overview</Text>
      <View style={styles.summaryRow}>
        <View style={styles.summaryChip}>
          <Text style={styles.summaryChipLabel}>Total</Text>
          <Text style={styles.summaryChipValue}>{stats.total}</Text>
        </View>
        <View style={styles.summaryChip}>
          <Text style={styles.summaryChipLabel}>In Progress</Text>
          <Text style={styles.summaryChipValue}>{stats.inProgress}</Text>
        </View>
        <View style={styles.summaryChip}>
          <Text style={styles.summaryChipLabel}>Completed</Text>
          <Text style={styles.summaryChipValue}>{stats.completed}</Text>
        </View>
      </View>
    </View>
  );

  const renderItem = ({ item }) => {
    const statusMeta = STATUS_META[item.status] || STATUS_META.pending;
    const isCompleted = item.status === 'completed';
    const loggedTime = formatLoggedDuration(item.startDate || item.createdAt, item.endDate);

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('JobDetail', { job: item })}
        activeOpacity={0.7}
      >
        <View style={styles.rowContent}>
          <View style={styles.rowMain}>
            <Text style={styles.jobName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.jobAddress} numberOfLines={1}>
              {item.address || 'No address'}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusMeta.color }]}>
            <Text style={styles.badgeText}>{statusMeta.label}</Text>
          </View>
        </View>
        {isCompleted ? (
          <View style={styles.timeLoggedBox}>
            <Text style={styles.timeLoggedLabel}>Logged</Text>
            <Text style={styles.timeLoggedValue}>{loggedTime}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.deleteBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => navigation.navigate('CreateJob')}
        activeOpacity={0.8}
      >
        <Text style={styles.addBtnText}>+ Add New Job</Text>
      </TouchableOpacity>

      <FlatList
        data={jobs}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={renderSummary}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.empty}>No jobs yet. Tap "+ Add New Job" to get started.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2f6',
    padding: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  addBtn: {
    backgroundColor: '#1565C0',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e4e9f0',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#223',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryChip: {
    flex: 1,
    backgroundColor: '#f6f8fb',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  summaryChipLabel: {
    fontSize: 11,
    color: '#6f7b8b',
    marginBottom: 3,
  },
  summaryChipValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e4e9f0',
  },
  rowContent: {
    flex: 1,
    marginRight: 8,
    gap: 8,
  },
  rowMain: {
    gap: 2,
  },
  jobName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  jobAddress: {
    color: '#718096',
    fontSize: 13,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffe9e7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  deleteBtnText: {
    color: '#c62828',
    fontSize: 16,
    fontWeight: '700',
  },
  timeLoggedBox: {
    backgroundColor: '#e8f5e9',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'flex-end',
    minWidth: 96,
  },
  timeLoggedLabel: {
    fontSize: 11,
    color: '#2e7d32',
    fontWeight: '600',
  },
  timeLoggedValue: {
    fontSize: 13,
    color: '#1b5e20',
    fontWeight: '700',
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    color: '#7b8794',
    marginTop: 52,
    fontSize: 15,
  },
});
