import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
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
  ChipButton,
  EmptyState,
  IconButton,
  LocalStorageNotice,
  PrimaryButton,
  ScreenHeader,
  SecondaryButton,
  StatusChip,
  Surface,
} from '../components/ui';
import {
  STATUS_FILTERS,
  STATUS_META,
  filterJobsByWorkflow,
  isReminderOverdue,
} from '../utils/jobWorkflow';
import { formatLoggedDuration, parseDateValue } from '../utils/time';
import { buttons, colors, motion, radii, shadows, spacing, typography } from '../theme';

function photosLabel(photos = []) {
  if (!photos.length) return 'No photos';
  if (photos.length === 1) return '1 photo';
  return `${photos.length} photos`;
}

function formatJobActivity(job) {
  const updated = parseDateValue(job.updatedAt);
  const created = parseDateValue(job.createdAt);
  const date = updated || created;
  if (!date) return 'Stored locally';

  const label = updated ? 'Updated' : 'Created';
  return `${label} ${date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })}`;
}

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
    <Surface style={styles.summaryPanel}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionEyebrow}>Overview</Text>
        <Text style={styles.summaryTitle}>Jobs Overview</Text>
      </View>
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
    </Surface>
  );

  const renderFilters = () => (
    <View style={styles.filtersPanel}>
      <View style={styles.filterHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>Find</Text>
          <Text style={styles.filterTitle}>Search and filter</Text>
        </View>
        <Text style={styles.filterCount}>
          {visibleJobs.length} shown
        </Text>
      </View>
      <View style={styles.searchShell}>
        <Text style={styles.searchIcon}>Search</Text>
        <TextInput
          style={styles.searchInput}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search title, customer, address, or notes"
          placeholderTextColor={colors.subtle}
          returnKeyType="search"
        />
        {searchTerm ? (
          <Pressable
            style={({ pressed }) => [styles.clearSearchBtn, pressed && styles.controlPressed]}
            onPress={() => setSearchTerm('')}
          >
            <Text style={styles.clearSearchText}>Clear</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((filter) => {
          const active = statusFilter === filter.key;
          return (
            <ChipButton
              key={filter.key}
              title={filter.label}
              active={active}
              onPress={() => setStatusFilter(filter.key)}
              style={styles.filterBtn}
            />
          );
        })}
      </View>
    </View>
  );

  const renderDataSafetyNote = () => (
    <LocalStorageNotice title="Device Storage">
      {`${DATA_SAFETY_MESSAGES.localStorageNote} ${DATA_SAFETY_MESSAGES.deleteWarning} ${DATA_SAFETY_MESSAGES.backupReminder}`}
    </LocalStorageNotice>
  );

  const renderEmptyState = () => {
    if (initializing) {
      return (
        <EmptyState
          title="Opening your local job list"
          body="Setting up the on-device database. This works without internet."
          loading
        />
      );
    }

    if (loadError) {
      return (
        <EmptyState
          title="Could not open jobs"
          body={loadError}
          actionTitle="Try Again"
          onAction={() => fetchJobs({ showLoader: true })}
        />
      );
    }

    if (jobs.length === 0) {
      return (
        <EmptyState
          title="No jobs yet"
          body="Add your first job with the customer, address, notes, photos, and reminders kept on this device."
          actionTitle="Add First Job"
          onAction={() => navigation.navigate('CreateJob')}
        />
      );
    }

    return (
      <EmptyState
        title="No matching jobs"
        body="Try another status filter or search term."
      />
    );
  };

  const renderItem = ({ item }) => {
    const statusMeta = STATUS_META[item.status] || STATUS_META.pending;
    const isCompleted = item.status === 'completed';
    const loggedTime = formatLoggedDuration(item.startDate || item.createdAt, item.endDate);
    const reminderOverdue = isReminderOverdue(item);

    return (
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() => navigation.navigate('JobDetail', { job: item })}
      >
        <View style={[styles.statusRail, { backgroundColor: statusMeta.color }]} />
        <View style={styles.rowContent}>
          <View style={styles.rowMain}>
            <View style={styles.rowTitleLine}>
              <Text style={styles.jobName} numberOfLines={1}>{item.name}</Text>
              <StatusChip label={statusMeta.label} color={statusMeta.color} />
            </View>
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
            <Text style={styles.jobActivity} numberOfLines={1}>
              {formatJobActivity(item)}
            </Text>
          </View>
          {reminderOverdue ? (
            <View style={styles.overdueBadge}>
              <Text style={styles.overdueBadgeText}>Reminder Overdue</Text>
            </View>
          ) : null}
          <View style={styles.rowMetaLine}>
            <Text style={styles.rowMetaText}>{photosLabel(item.photos)}</Text>
            <Text style={styles.rowMetaDot}>|</Text>
            <Text style={styles.rowMetaText}>
              {item.reminder ? 'Reminder set' : 'No reminder'}
            </Text>
          </View>
        </View>
        {isCompleted ? (
          <View style={styles.timeLoggedBox}>
            <Text style={styles.timeLoggedLabel}>Logged</Text>
            <Text style={styles.timeLoggedValue}>{loggedTime}</Text>
          </View>
        ) : (
          <IconButton
            label="x"
            onPress={() => handleDelete(item)}
            danger
            style={styles.deleteBtn}
          />
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        eyebrow="Local-first tracker"
        title="Jobs"
        subtitle={`${stats.inProgress} active, ${stats.completed} completed, ${stats.overdue} overdue`}
        right={
          <View style={styles.headerActions}>
            <Pressable
              style={({ pressed }) => [
                styles.headerPill,
                isAdFree && styles.headerPillActive,
                pressed && styles.controlPressed,
              ]}
              onPress={() => navigation.navigate('AdFree')}
            >
              <Text style={[styles.headerPillText, isAdFree && styles.headerPillTextActive]}>
                {isAdFree ? 'Ad-Free' : 'Remove Ads'}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.headerPill, pressed && styles.controlPressed]}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.headerPillText}>Settings</Text>
            </Pressable>
          </View>
        }
      />
      <View style={styles.topActions}>
        <PrimaryButton
          title="+ Add New Job"
          onPress={() => navigation.navigate('CreateJob')}
          disabled={initializing}
          style={styles.addBtn}
        />
        <SecondaryButton
          title={backupLoading ? 'Exporting...' : 'Export Backup'}
          onPress={handleExportBackup}
          disabled={backupLoading || initializing}
          style={styles.backupBtn}
        />
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
    paddingTop: spacing.lg,
  },
  listContent: {
    paddingBottom: 34,
  },
  pageHeader: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
  },
  pageEyebrow: {
    ...typography.eyebrow,
    color: colors.subtle,
    marginBottom: spacing.sm,
  },
  pageTitleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  pageTitleCopy: {
    flex: 1,
  },
  pageTitle: {
    ...typography.screenTitle,
    color: colors.ink,
  },
  pageSubtitle: {
    ...typography.small,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  topActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.gap,
    marginBottom: spacing.md,
  },
  addBtn: {
    flexGrow: 1.25,
    flexBasis: 170,
    minHeight: buttons.minHeight,
    backgroundColor: colors.accent,
    borderRadius: buttons.radius,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accentInk,
    ...shadows.lift,
  },
  addBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  backupBtn: {
    flexGrow: 1,
    flexBasis: 150,
    minHeight: buttons.minHeight,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: buttons.radius,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backupBtnText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  primaryPressed: {
    opacity: motion.pressedOpacity,
    transform: [{ scale: 0.99 }],
  },
  controlPressed: {
    opacity: motion.pressedOpacity,
  },
  disabledBtn: {
    opacity: 0.65,
  },
  backupError: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  headerActions: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  headerPill: {
    alignSelf: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 38,
    justifyContent: 'center',
  },
  headerPillActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentBorder,
  },
  headerPillText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  headerPillTextActive: {
    color: colors.accentInk,
  },
  dataSafetyStrip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    flexDirection: 'row',
    gap: spacing.md,
  },
  dataSafetyRule: {
    width: 2,
    borderRadius: 1,
    backgroundColor: colors.accent,
  },
  dataSafetyCopy: {
    flex: 1,
  },
  dataSafetyTitle: {
    ...typography.sectionTitle,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  dataSafetyText: {
    color: colors.muted,
    ...typography.small,
    marginBottom: spacing.xs,
  },
  dataSafetyReminder: {
    color: colors.accentInk,
    ...typography.small,
    fontWeight: '800',
  },
  summaryPanel: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadows.card,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionEyebrow: {
    ...typography.eyebrow,
    color: colors.subtle,
    marginBottom: spacing.xs,
  },
  summaryTitle: {
    ...typography.sectionTitle,
    color: colors.ink,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  summaryChip: {
    flexGrow: 1,
    flexBasis: 116,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'flex-start',
  },
  summaryChipLabel: {
    fontSize: 11,
    color: colors.subtle,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    fontWeight: '800',
  },
  summaryChipValue: {
    fontSize: 24,
    lineHeight: 28,
    color: colors.ink,
    fontWeight: '900',
  },
  summaryChipWarning: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentBorder,
  },
  summaryChipWarningLabel: {
    color: colors.accentInk,
  },
  summaryChipWarningValue: {
    color: colors.accentInk,
  },
  filtersPanel: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadows.card,
  },
  filterHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  filterTitle: {
    ...typography.sectionTitle,
    color: colors.ink,
  },
  filterCount: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.borderSoft,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    minHeight: 32,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  searchShell: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    color: colors.accentInk,
    fontSize: 12,
    fontWeight: '900',
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: 0,
    paddingVertical: 13,
  },
  clearSearchBtn: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: spacing.sm,
  },
  clearSearchText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  filterBtn: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  filterBtnActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  filterBtnText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  filterBtnTextActive: {
    color: colors.white,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    minHeight: 92,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: 'hidden',
  },
  rowPressed: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
  },
  statusRail: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    top: 0,
    width: 3,
  },
  rowContent: {
    flex: 1,
    marginRight: spacing.sm,
    gap: spacing.sm,
  },
  rowMetaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  rowMetaText: {
    color: colors.subtle,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  rowMetaDot: {
    color: colors.borderStrong,
    fontSize: 12,
    lineHeight: 17,
  },
  rowMain: {
    gap: spacing.xs,
  },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  jobName: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
    color: colors.ink,
  },
  customerName: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  customerPhone: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  customerEmail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  jobAddress: {
    color: colors.subtle,
    fontSize: 13,
    lineHeight: 18,
  },
  jobActivity: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
  badge: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    backgroundColor: colors.surfaceRaised,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  overdueBadge: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  overdueBadgeText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '800',
  },
  deleteBtn: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  deleteBtnPressed: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  deleteBtnText: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '900',
  },
  timeLoggedBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'flex-end',
    minWidth: 96,
    maxWidth: 124,
  },
  timeLoggedLabel: {
    fontSize: 11,
    color: colors.subtle,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  timeLoggedValue: {
    fontSize: 13,
    color: colors.ink,
    fontWeight: '800',
    marginTop: 2,
  },
  stateCard: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    padding: spacing.xxl,
    marginTop: spacing.xl,
    alignItems: 'center',
    ...shadows.card,
  },
  stateTitle: {
    color: colors.ink,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '900',
    marginTop: spacing.sm,
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
    marginTop: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: buttons.radius,
    borderWidth: 1,
    borderColor: colors.accentInk,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateActionText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
});
