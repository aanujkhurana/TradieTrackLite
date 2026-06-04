import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { exportJobsBackup } from '../data/backups';
import { listJobs } from '../data/jobs';
import { useMonetization } from '../monetization/MonetizationContext';
import { DATA_SAFETY_MESSAGES } from '../privacy/dataSafety';
import {
  InfoRow,
  LocalStorageNotice,
  PrimaryButton,
  ScreenHeader,
  SecondaryButton,
  SectionCard,
  StatusChip,
} from '../components/ui';
import { colors, radii, spacing, typography } from '../theme';
import packageInfo from '../../package.json';

export default function Settings({ navigation }) {
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupError, setBackupError] = useState('');
  const { isAdFree } = useMonetization();

  const handleExportBackup = async () => {
    setBackupLoading(true);
    setBackupError('');
    try {
      const jobs = await listJobs();
      await exportJobsBackup(jobs);
    } catch (err) {
      const message = 'Backup could not be created or shared from this device. Your jobs are still saved locally.';
      setBackupError(message);
      Alert.alert('Backup Error', message);
    } finally {
      setBackupLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <ScreenHeader
        eyebrow="Local-first settings"
        title="Settings"
        subtitle="Simple controls for storage, backup, ads, and app safety."
        right={<StatusChip label={isAdFree ? 'Ad-Free' : 'Free'} color={isAdFree ? colors.accent : colors.amber} />}
      />

      <LocalStorageNotice title="Data ownership">
        {`${DATA_SAFETY_MESSAGES.localStorageNote} ${DATA_SAFETY_MESSAGES.backendNotice}`}
      </LocalStorageNotice>

      <SectionCard
        eyebrow="Backup"
        title="Export your records"
        subtitle="Create a local JSON backup you can save to Files, Drive, email, or another safe place."
      >
        <View style={styles.backupPanel}>
          <Text style={styles.backupTitle}>Keep a copy outside the app</Text>
          <Text style={styles.backupBody}>
            {DATA_SAFETY_MESSAGES.backupReminder}
          </Text>
        </View>
        <PrimaryButton
          title={backupLoading ? 'Exporting Backup...' : 'Export Backup'}
          onPress={handleExportBackup}
          disabled={backupLoading}
          style={styles.sectionAction}
        />
        {backupError ? <Text style={styles.errorText}>{backupError}</Text> : null}
      </SectionCard>

      <SectionCard
        eyebrow="Ads"
        title="Ad-free upgrade"
        subtitle="A one-time purchase removes ads. No subscription, account, or team plan."
      >
        <InfoRow
          label="Current plan"
          value={isAdFree ? 'Ad-free active on this device' : 'Free with banner ads'}
          action="Manage"
          onPress={() => navigation.navigate('AdFree')}
        />
        <SecondaryButton
          title={isAdFree ? 'View Ad-Free Status' : 'Remove Ads Once'}
          onPress={() => navigation.navigate('AdFree')}
          style={styles.sectionAction}
        />
      </SectionCard>

      <SectionCard
        eyebrow="Privacy"
        title="Data safety"
        subtitle="TradieTrack Lite is designed to work without normal backend storage."
      >
        <View style={styles.infoList}>
          <Text style={styles.infoItem}>{DATA_SAFETY_MESSAGES.localStorageNote}</Text>
          <Text style={styles.infoItem}>{DATA_SAFETY_MESSAGES.deleteWarning}</Text>
          <Text style={styles.infoItem}>{DATA_SAFETY_MESSAGES.analyticsNotice}</Text>
        </View>
      </SectionCard>

      <SectionCard
        eyebrow="About"
        title="TradieTrack Lite"
        subtitle="A pocket job notebook for local-first work tracking."
      >
        <View style={styles.versionRow}>
          <Text style={styles.versionLabel}>Version</Text>
          <Text style={styles.versionValue}>{packageInfo.version}</Text>
        </View>
      </SectionCard>
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
    paddingBottom: 42,
  },
  backupPanel: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.lg,
  },
  backupTitle: {
    ...typography.sectionTitle,
    color: colors.ink,
  },
  backupBody: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  sectionAction: {
    marginTop: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  infoList: {
    gap: spacing.sm,
  },
  infoItem: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.borderSoft,
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  versionRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.borderSoft,
    borderRadius: radii.sm,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  versionLabel: {
    ...typography.label,
    color: colors.subtle,
  },
  versionValue: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
});
