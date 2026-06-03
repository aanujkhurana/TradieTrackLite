import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
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
import AdBanner from '../components/AdBanner';
import { useMonetization } from '../monetization/MonetizationContext';
import { DATA_SAFETY_MESSAGES } from '../privacy/dataSafety';
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
  const [initializing, setInitializing] = useState(true);
  const [loadError, setLoadError] = useState('');
  const hasLoadedJobs = useRef(false);
  const { isAdFree } = useMonetization();

  const fetchJobs = useCallback(async ({ showLoader = false } = {}) => {
    if (showLoader || !hasLoadedJobs.current) {
      setInitializing(true);
    }
    setLoadError('');
    try {
      setJobs(await listJobs());
      hasLoadedJobs.current = true;
    } catch (err) {
      setLoadError('Jobs could not be loaded from this device. No internet is required, so try reopening the local job list.');
    } finally {
      setInitializing(false);
    }
  }, []);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  }, [fetchJobs]);

  useFocusEffect(
    useCallback(() => {
      fetchJobs({ showLoader: !hasLoadedJobs.current });
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
              Alert.alert(
                'Local Storage Error',
                'Job could not be deleted from this device. Your job list is stored locally, so try again when the app is ready.'
              );
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
      const message = 'Backup could not be created or shared from this device. Your jobs are still saved locally.';
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

  const renderDataSafetyNote = () => (
    <View style={styles.dataSafetyCard}>
      <Text style={styles.dataSafetyTitle}>Device Storage</Text>
      <Text style={styles.dataSafetyText}>
        {DATA_SAFETY_MESSAGES.localStorageNote}
      </Text>
      <Text style={styles.dataSafetyText}>
        {DATA_SAFETY_MESSAGES.deleteWarning}
      </Text>
      <Text style={styles.dataSafetyReminder}>
        {DATA_SAFETY_MESSAGES.backupReminder}
      </Text>
    </View>
  );

  const renderEmptyState = () => {
    if (initializing) {
      return (
        <View style={styles.stateCard}>
          <ActivityIndicator color="#1565C0" />
          <Text style={styles.stateTitle}>Opening your local job list</Text>
          <Text style={styles.stateText}>
            Setting up the on-device database. This works without internet.
          </Text>
        </View>
      );
    }

    if (loadError) {
      return (
        <View style={styles.stateCard}>
          <Text style={styles.stateTitle}>Could not open jobs</Text>
          <Text style={styles.stateText}>{loadError}</Text>
          <TouchableOpacity
            style={styles.stateActionBtn}
            onPress={() => fetchJobs({ showLoader: true })}
            activeOpacity={0.8}
          >
            <Text style={styles.stateActionText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (jobs.length === 0) {
      return (
        <View style={styles.stateCard}>
          <Text style={styles.stateTitle}>No jobs yet</Text>
          <Text style={styles.stateText}>
            Add your first job with the customer, address, notes, photos, and reminders kept on this device.
          </Text>
          <TouchableOpacity
            style={styles.stateActionBtn}
            onPress={() => navigation.navigate('CreateJob')}
            activeOpacity={0.8}
          >
            <Text style={styles.stateActionText}>Add First Job</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.stateCard}>
        <Text style={styles.stateTitle}>No matching jobs</Text>
        <Text style={styles.stateText}>
          Try another status filter or search term.
        </Text>
      </View>
    );
  };

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
          style={[styles.addBtn, initializing && styles.disabledBtn]}
          onPress={() => navigation.navigate('CreateJob')}
          activeOpacity={0.8}
          disabled={initializing}
        >
          <Text style={styles.addBtnText}>+ Add New Job</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.backupBtn, (backupLoading || initializing) && styles.disabledBtn]}
          onPress={handleExportBackup}
          activeOpacity={0.8}
          disabled={backupLoading || initializing}
        >
          <Text style={styles.backupBtnText}>
            {backupLoading ? 'Exporting...' : 'Export Backup'}
          </Text>
        </TouchableOpacity>
      </View>
      {backupError ? <Text style={styles.backupError}>{backupError}</Text> : null}
      <TouchableOpacity
        style={styles.adFreeBtn}
        onPress={() => navigation.navigate('AdFree')}
        activeOpacity={0.8}
      >
        <Text style={styles.adFreeBtnText}>
          {isAdFree ? 'Ad-Free Active' : 'Remove Ads'}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={visibleJobs}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={
          <>
            {renderDataSafetyNote()}
            {renderSummary()}
            {renderFilters()}
            <AdBanner placement="jobs-list" />
          </>
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
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
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  addBtn: {
    flexGrow: 1.25,
    flexBasis: 170,
    minHeight: 50,
    backgroundColor: '#1565C0',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
    textAlign: 'center',
  },
  backupBtn: {
    flexGrow: 1,
    flexBasis: 150,
    minHeight: 50,
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
    textAlign: 'center',
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
  adFreeBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d9e0e8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  adFreeBtnText: {
    color: '#1565C0',
    fontSize: 13,
    fontWeight: '800',
  },
  dataSafetyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#cddceb',
  },
  dataSafetyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 6,
  },
  dataSafetyText: {
    color: '#4b5563',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  dataSafetyReminder: {
    color: '#1565C0',
    fontSize: 13,
    lineHeight: 18,
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
    flexWrap: 'wrap',
  },
  summaryChip: {
    flexGrow: 1,
    flexBasis: 118,
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
    minHeight: 48,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  filterBtn: {
    minHeight: 48,
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
    minHeight: 72,
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
    textAlign: 'center',
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
    width: 48,
    height: 48,
    borderRadius: 24,
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
    maxWidth: 124,
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
  stateCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d9e0e8',
    borderRadius: 12,
    padding: 18,
    marginTop: 24,
    alignItems: 'center',
  },
  stateTitle: {
    color: '#1f2937',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 10,
    textAlign: 'center',
  },
  stateText: {
    color: '#4b5563',
    fontSize: 15,
    lineHeight: 21,
    marginTop: 8,
    textAlign: 'center',
  },
  stateActionBtn: {
    minHeight: 50,
    marginTop: 16,
    backgroundColor: '#1565C0',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
});
