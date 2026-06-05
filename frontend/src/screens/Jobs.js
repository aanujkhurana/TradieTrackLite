import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { deleteJob, listJobs } from '../data/jobs';
import { cleanupStoredJobPhotos } from '../data/photos';
import { exportJobsBackup } from '../data/backups';
import AdBanner from '../components/AdBanner';
import { useMonetization } from '../monetization/MonetizationContext';
import { DATA_SAFETY_MESSAGES } from '../privacy/dataSafety';
import {
  AppShell,
  ChipButton,
  EmptyState,
  IconButton,
  JobCard,
  LocalStorageNotice,
  PrimaryButton,
  ScreenHeader,
  SearchBar,
  SecondaryButton,
  StatTile,
} from '../components/ui';
import { Icon } from '../components/Icon';
import { BrandMark } from '../components/Brand';
import { useTheme } from '../theme';
import {
  STATUS_FILTERS,
  filterJobsByWorkflow,
  isReminderOverdue,
} from '../utils/jobWorkflow';
import { formatLoggedDuration, parseDateValue } from '../utils/time';

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
  const { colors, status, typography, spacing } = useTheme();
  const { isAdFree } = useMonetization();

  const [jobs, setJobs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [backupLoading, setBackupLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [loadError, setLoadError] = useState('');
  const hasLoadedJobs = useRef(false);

  const fetchJobs = useCallback(async ({ showLoader = false } = {}) => {
    if (showLoader || !hasLoadedJobs.current) {
      setInitializing(true);
    }
    setLoadError('');
    try {
      const next = await listJobs();
      setJobs(next);
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
      'Delete job',
      `Delete "${job.name}"? This removes it from this device.`,
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
                'Local storage error',
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
    try {
      const latestJobs = await listJobs();
      await exportJobsBackup(latestJobs);
      setJobs(latestJobs);
    } catch (err) {
      Alert.alert(
        'Backup error',
        'Backup could not be created or shared from this device. Your jobs are still saved locally.'
      );
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

  const subtitle =
    jobs.length === 0
      ? 'Local-first. No login.'
      : `${stats.inProgress} active · ${stats.completed} done · ${stats.overdue} overdue`;

  const headerRight = (
    <View style={styles.headerActions}>
      <Pressable
        onPress={() => navigation.navigate('AdFree')}
        style={({ pressed }) => [
          styles.headerPill,
          {
            backgroundColor: isAdFree ? colors.accentSoft : colors.surface,
            borderColor: isAdFree ? colors.accentBorder : colors.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        accessibilityLabel={isAdFree ? 'Ad-free active' : 'Remove ads'}
      >
        <Icon
          name={isAdFree ? 'checkCircle' : 'sparkle'}
          size={14}
          color={isAdFree ? colors.accentInk : colors.amber}
        />
        <Text
          style={[
            styles.headerPillText,
            { color: isAdFree ? colors.accentInk : colors.amber },
          ]}
        >
          {isAdFree ? 'Ad-free' : 'Ads'}
        </Text>
      </Pressable>
      <IconButton
        name="settings"
        onPress={() => navigation.navigate('Settings')}
        accessibilityLabel="Settings"
      />
    </View>
  );

  const renderHeader = () => (
    <View>
      <LocalStorageNotice
        title="Stored on this device"
        body={`${DATA_SAFETY_MESSAGES.localStorageNote} ${DATA_SAFETY_MESSAGES.deleteWarning}`}
      />

      {jobs.length > 0 ? (
        <View style={styles.statsRow}>
          <StatTile label="Active" value={stats.inProgress} tone="success" icon="play" style={styles.statTile} />
          <StatTile label="Done" value={stats.completed} tone="ink" icon="check" style={styles.statTile} />
          <StatTile
            label="Overdue"
            value={stats.overdue}
            tone={stats.overdue > 0 ? 'warning' : 'default'}
            icon="bell"
            style={styles.statTile}
          />
        </View>
      ) : null}

      <View style={styles.searchBlock}>
        <SearchBar
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search title, customer, address, notes"
          onClear={() => setSearchTerm('')}
        />
        <View style={styles.filterRow}>
          {STATUS_FILTERS.map((filter) => (
            <ChipButton
              key={filter.key}
              title={filter.label}
              active={statusFilter === filter.key}
              onPress={() => setStatusFilter(filter.key)}
            />
          ))}
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={[styles.listHeaderTitle, { color: colors.ink }]}>
          {visibleJobs.length === 0
            ? 'No matches'
            : visibleJobs.length === 1
              ? '1 job'
              : `${visibleJobs.length} jobs`}
        </Text>
        {jobs.length > 0 ? (
          <Pressable
            onPress={handleExportBackup}
            disabled={backupLoading}
            style={({ pressed }) => [
              styles.exportLink,
              { opacity: pressed || backupLoading ? 0.7 : 1 },
            ]}
            accessibilityLabel="Export backup"
          >
            <Icon
              name={backupLoading ? 'refresh' : 'download'}
              size={14}
              color={colors.accentInk}
            />
            <Text style={[styles.exportLinkText, { color: colors.accentInk }]}>
              {backupLoading ? 'Exporting…' : 'Export'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <AdBanner placement="jobs-list" />
    </View>
  );

  const renderEmpty = () => {
    if (initializing) {
      return (
        <EmptyState
          title="Opening your job list"
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
          actionTitle="Try again"
          onAction={() => fetchJobs({ showLoader: true })}
        />
      );
    }
    if (jobs.length === 0) {
      return (
        <EmptyState
          title="No jobs yet"
          body="Track work for your first customer. Everything stays on this device, no account required."
          actionTitle="Add first job"
          onAction={() => navigation.navigate('CreateJob')}
          actionIcon="add"
          illustration={<BrandMark size={56} />}
        />
      );
    }
    return (
      <EmptyState
        title="No matching jobs"
        body="Try a different status filter or search term."
        actionTitle="Reset filters"
        onAction={() => {
          setSearchTerm('');
          setStatusFilter('all');
        }}
      />
    );
  };

  const renderItem = ({ item }) => {
    const statusTone = status[item.status] || status.pending;
    const reminderOverdue = isReminderOverdue(item);
    const isCompleted = item.status === 'completed';
    const loggedTime = isCompleted
      ? formatLoggedDuration(item.startDate || item.createdAt, item.endDate)
      : null;
    return (
      <JobCard
        job={item}
        statusMeta={{ ...statusTone, label: statusTone.label }}
        onPress={() => navigation.navigate('JobDetail', { job: item })}
        onLongPress={() => handleDelete(item)}
        reminderOverdue={reminderOverdue}
        photoCount={(item.photos || []).length}
        hasReminder={Boolean(item.reminder)}
        loggedLabel={loggedTime}
        trailing={
          <View style={styles.cardTrailing}>
            <Text style={[styles.cardUpdated, { color: colors.subtle }]} numberOfLines={1}>
              {formatJobActivity(item)}
            </Text>
          </View>
        }
      />
    );
  };

  const localFirstNote = (
    <View style={[styles.localFirstFooter, { borderColor: colors.borderSoft }]}>
      <Icon name="shield" size={14} color={colors.subtle} />
      <Text style={[styles.localFirstFooterText, { color: colors.muted }]}>
        {DATA_SAFETY_MESSAGES.backupReminder}
      </Text>
    </View>
  );

  return (
    <AppShell testID="jobs-screen">
      <ScreenHeader
        eyebrow="Local-first"
        title="Jobs"
        subtitle={subtitle}
        right={headerRight}
      />
      <View style={styles.topActions}>
        <PrimaryButton
          title="Add job"
          icon="add"
          onPress={() => navigation.navigate('CreateJob')}
          disabled={initializing}
          fullWidth
        />
        {jobs.length > 0 ? (
          <SecondaryButton
            title={backupLoading ? 'Exporting…' : 'Export backup'}
            icon="download"
            onPress={handleExportBackup}
            disabled={backupLoading || initializing}
            style={styles.backupBtn}
            size="sm"
          />
        ) : null}
      </View>
      <FlatList
        data={visibleJobs}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={localFirstNote}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.subtle}
          />
        }
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 32,
  },
  headerPillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  backupBtn: {
    flexGrow: 0,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statTile: {
    flexGrow: 1,
    flexBasis: 0,
  },
  searchBlock: {
    gap: 12,
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 12,
  },
  listHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  exportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exportLinkText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  cardTrailing: {
    alignItems: 'flex-end',
  },
  cardUpdated: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  localFirstFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    marginTop: 12,
    borderTopWidth: 1,
  },
  localFirstFooterText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
