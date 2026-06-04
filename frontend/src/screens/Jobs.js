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
import { buttons, colors, radii, shadows, spacing, typography } from '../theme';

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
          return (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterBtn,
                active && styles.filterBtnActive,
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
          <ActivityIndicator color={colors.accent} />
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
    backgroundColor: colors.background,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.screen,
  },
  listContent: {
    paddingBottom: 28,
  },
  topActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.gap,
    marginBottom: spacing.gap,
  },
  addBtn: {
    flexGrow: 1.25,
    flexBasis: 170,
    minHeight: buttons.minHeight,
    backgroundColor: colors.accent,
    borderRadius: buttons.radius,
    paddingVertical: 15,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  addBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  backupBtn: {
    flexGrow: 1,
    flexBasis: 150,
    minHeight: buttons.minHeight,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: buttons.radius,
    paddingVertical: 15,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backupBtnText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  disabledBtn: {
    opacity: 0.65,
  },
  backupError: {
    color: colors.ink,
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  adFreeBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: spacing.gap,
    minHeight: 46,
    justifyContent: 'center',
  },
  adFreeBtnText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  dataSafetyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.card,
    marginBottom: spacing.gap,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  dataSafetyTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    marginBottom: 6,
  },
  dataSafetyText: {
    color: colors.muted,
    ...typography.small,
    marginBottom: 4,
  },
  dataSafetyReminder: {
    color: colors.accent,
    ...typography.small,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.card,
    marginBottom: spacing.gap,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  summaryTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    marginBottom: spacing.gap,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.gap,
    flexWrap: 'wrap',
  },
  summaryChip: {
    flexGrow: 1,
    flexBasis: 118,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  summaryChipLabel: {
    fontSize: 11,
    color: colors.subtle,
    marginBottom: 3,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  summaryChipValue: {
    fontSize: 20,
    color: colors.ink,
    fontWeight: '800',
  },
  summaryChipWarning: {
    backgroundColor: colors.accentSoft,
  },
  summaryChipWarningLabel: {
    color: colors.accent,
  },
  summaryChipWarningValue: {
    color: colors.accent,
  },
  filtersCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.card,
    marginBottom: spacing.gap,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  searchInput: {
    backgroundColor: colors.surfaceInset,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    minHeight: 50,
    color: colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.gap,
    marginTop: spacing.gap,
  },
  filterBtn: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  filterBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterBtnText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  filterBtnTextActive: {
    color: colors.white,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    marginBottom: spacing.gap,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 72,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
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
    fontWeight: '800',
    color: colors.ink,
  },
  customerName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  customerPhone: {
    color: colors.muted,
    fontSize: 13,
  },
  customerEmail: {
    color: colors.muted,
    fontSize: 13,
  },
  jobAddress: {
    color: colors.subtle,
    fontSize: 13,
  },
  badge: {
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  overdueBadge: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  overdueBadgeText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  deleteBtnText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  timeLoggedBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'flex-end',
    minWidth: 96,
    maxWidth: 124,
  },
  timeLoggedLabel: {
    fontSize: 11,
    color: colors.subtle,
    fontWeight: '600',
  },
  timeLoggedValue: {
    fontSize: 13,
    color: colors.ink,
    fontWeight: '700',
    marginTop: 2,
  },
  stateCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 22,
    marginTop: 24,
    alignItems: 'center',
    ...shadows.card,
  },
  stateTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 10,
    textAlign: 'center',
  },
  stateText: {
    color: colors.muted,
    ...typography.body,
    marginTop: 8,
    textAlign: 'center',
  },
  stateActionBtn: {
    minHeight: buttons.minHeight,
    marginTop: 16,
    backgroundColor: colors.accent,
    borderRadius: buttons.radius,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateActionText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
});
