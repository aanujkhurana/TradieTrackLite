import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { deleteJob, listJobs } from '../data/jobs';
import { cleanupStoredJobPhotos } from '../data/photos';
import { exportJobsBackup } from '../data/backups';
import {
  STATUS_FILTERS,
  STATUS_META,
  filterJobsByWorkflow,
  isReminderOverdue,
} from '../utils/jobWorkflow';
import { formatLoggedDuration } from '../utils/time';

export default function Jobs({ navigation }) {
  const [jobs, setJobs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupError, setBackupError] = useState('');

  const fetchJobs = useCallback(async () => {
    try {
      setJobs(await listJobs());
    } catch (err) {
      Alert.alert('Local Storage Error', 'Jobs could not be loaded from this device.');
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
              await deleteJob(job._id);
              await cleanupStoredJobPhotos(job.photos);
              setJobs((prev) => prev.filter((j) => j._id !== job._id));
            } catch (err) {
              Alert.alert('Local Storage Error', 'Job could not be deleted from this device.');
            }
          },
        },
      ]
    );
  };

  const handleExportBackup = async () => {
    setBackupLoading(true);
    setBackupError('');
    try {
      const latestJobs = await listJobs();
      await exportJobsBackup(latestJobs);
      setJobs(latestJobs);
    } catch (err) {
      const message = 'Job backup could not be created or shared on this device.';
      setBackupError(message);
      Alert.alert('Backup Error', message);
    } finally {
      setBackupLoading(false);
    }
  };
  const stats = useMemo(() => {
    return jobs.reduce(
      (acc, job) => {
        acc.total += 1;
        if (job.status === 'completed') acc.completed += 1;
        if (job.status === 'in_progress') acc.inProgress += 1;
        if (isReminderOverdue(job)) acc.overdue += 1;
        return acc;
      },
      { total: 0, completed: 0, inProgress: 0, overdue: 0 }
    );
  }, [jobs]);

  const visibleJobs = useMemo(
    () => filterJobsByWorkflow(jobs, statusFilter, searchTerm),
    [jobs, searchTerm, statusFilter]
  );

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
        <View style={[styles.summaryChip, stats.overdue > 0 && styles.summaryChipWarning]}>
          <Text style={[styles.summaryChipLabel, stats.overdue > 0 && styles.summaryChipWarningLabel]}>
            Overdue
          </Text>
          <Text style={[styles.summaryChipValue, stats.overdue > 0 && styles.summaryChipWarningValue]}>
            {stats.overdue}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersCard}>
      <TextInput
        style={styles.searchInput}
        value={searchTerm}
        onChangeText={setSearchTerm}
        placeholder="Search title, customer, address, or notes"
        returnKeyType="search"
      />
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((filter) => {
          const active = statusFilter === filter.key;
          const color = STATUS_META[filter.key]?.color || '#1565C0';
          return (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterBtn,
                { borderColor: color },
                active && { backgroundColor: color },
              ]}
              onPress={() => setStatusFilter(filter.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterBtnText, active && styles.filterBtnTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderItem = ({ item }) => {
    const statusMeta = STATUS_META[item.status] || STATUS_META.pending;
    const isCompleted = item.status === 'completed';
    const loggedTime = formatLoggedDuration(item.startDate || item.createdAt, item.endDate);
    const reminderOverdue = isReminderOverdue(item);

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('JobDetail', { job: item })}
        activeOpacity={0.7}
      >
        <View style={styles.rowContent}>
          <View style={styles.rowMain}>
            <Text style={styles.jobName} numberOfLines={1}>{item.name}</Text>
            {item.customerName ? (
              <Text style={styles.customerName} numberOfLines={1}>
                {item.customerName}
              </Text>
            ) : null}
            {item.customerPhone ? (
              <Text style={styles.customerPhone} numberOfLines={1}>
                {item.customerPhone}
              </Text>
            ) : null}
            {item.customerEmail ? (
              <Text style={styles.customerEmail} numberOfLines={1}>
                {item.customerEmail}
              </Text>
            ) : null}
            <Text style={styles.jobAddress} numberOfLines={1}>
              {item.address || 'No address'}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusMeta.color }]}>
            <Text style={styles.badgeText}>{statusMeta.label}</Text>
          </View>
          {reminderOverdue ? (
            <View style={styles.overdueBadge}>
              <Text style={styles.overdueBadgeText}>Reminder Overdue</Text>
            </View>
          ) : null}
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
      <View style={styles.topActions}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('CreateJob')}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Add New Job</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.backupBtn, backupLoading && styles.disabledBtn]}
          onPress={handleExportBackup}
          activeOpacity={0.8}
          disabled={backupLoading}
        >
          <Text style={styles.backupBtnText}>
            {backupLoading ? 'Exporting...' : 'Export Backup'}
          </Text>
        </TouchableOpacity>
      </View>
      {backupError ? <Text style={styles.backupError}>{backupError}</Text> : null}

      <FlatList
        data={visibleJobs}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={
          <>
            {renderSummary()}
            {renderFilters()}
          </>
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {jobs.length === 0
              ? 'No jobs yet. Tap "+ Add New Job" to get started.'
              : 'No jobs match this filter.'}
          </Text>
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
  topActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  addBtn: {
    flex: 1.25,
    backgroundColor: '#1565C0',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
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
  backupBtn: {
    flex: 1,
    backgroundColor: '#f3f8ff',
    borderWidth: 1,
    borderColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backupBtnText: {
    color: '#1565C0',
    fontSize: 15,
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.65,
  },
  backupError: {
    color: '#c62828',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
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
    flexWrap: 'wrap',
  },
  summaryChip: {
    flexGrow: 1,
    flexBasis: '22%',
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
  summaryChipWarning: {
    backgroundColor: '#fff3e0',
  },
  summaryChipWarningLabel: {
    color: '#b45309',
  },
  summaryChipWarningValue: {
    color: '#92400e',
  },
  filtersCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e4e9f0',
  },
  searchInput: {
    backgroundColor: '#fbfcff',
    borderWidth: 1,
    borderColor: '#d9e0e8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  filterBtn: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  filterBtnTextActive: {
    color: '#fff',
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
  customerName: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
  customerPhone: {
    color: '#4b5563',
    fontSize: 13,
  },
  customerEmail: {
    color: '#4b5563',
    fontSize: 13,
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
  overdueBadge: {
    backgroundColor: '#fff3e0',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  overdueBadgeText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '700',
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
