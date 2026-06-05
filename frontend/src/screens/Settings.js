import React, { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { exportJobsBackup } from '../data/backups';
import { listJobs } from '../data/jobs';
import { useMonetization } from '../monetization/MonetizationContext';
import { DATA_SAFETY_MESSAGES } from '../privacy/dataSafety';
import {
  AppShell,
  InfoRow,
  LocalStorageNotice,
  PrimaryButton,
  RowAction,
  ScreenHeader,
  Section,
  StatusChip,
  ThemeToggle,
  UpgradeCard,
} from '../components/ui';
import { Icon } from '../components/Icon';
import { useTheme, THEME_MODES } from '../theme';
import {
  getBatteryOptimisationMessage,
  isAndroid,
  openAppSettings,
} from '../privacy/battery';
import { resetOnboardingState } from '../onboarding/storage';
import packageInfo from '../../package.json';

export default function Settings({ navigation }) {
  const { colors, preference, setMode, resolvedMode } = useTheme();
  const { isAdFree } = useMonetization();
  const [backupLoading, setBackupLoading] = useState(false);

  const handleExportBackup = async () => {
    setBackupLoading(true);
    try {
      const jobs = await listJobs();
      await exportJobsBackup(jobs);
    } catch (err) {
      Alert.alert(
        'Backup error',
        'Backup could not be created or shared from this device. Your jobs are still saved locally.'
      );
    } finally {
      setBackupLoading(false);
    }
  };

  const modeCopy = {
    system: 'Match system',
    light: 'Light',
    dark: 'Dark',
  };

  return (
    <AppShell scroll testID="settings-screen">
      <ScreenHeader
        eyebrow="Local-first settings"
        title="Settings"
        subtitle="Theme, backup, ads, and app safety."
        right={
          <StatusChip
            status={isAdFree ? 'completed' : 'pending'}
            label={isAdFree ? 'Ad-free' : 'Free'}
            size="sm"
          />
        }
      />

      <LocalStorageNotice
        title="Data ownership"
        body="Job records, reminders, and photos are stored on this device. No account or backend is required for normal app use."
      />

      <Section
        eyebrow="Appearance"
        title="Theme"
        subtitle="Light and dark are tuned independently. System follow is on by default."
      >
        <ThemeToggle />
        <View style={styles.modeRow}>
          {THEME_MODES.map((mode) => {
            const active = preference === mode;
            return (
              <Pressable
                key={mode}
                onPress={() => setMode(mode)}
                style={({ pressed }) => [
                  styles.modeChip,
                  {
                    backgroundColor: active ? colors.ink : colors.surfaceInset,
                    borderColor: active ? colors.ink : colors.borderSoft,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Icon
                  name={mode === 'system' ? 'sparkle' : mode === 'dark' ? 'moon' : 'sun'}
                  size={14}
                  color={active ? colors.onInk : colors.muted}
                />
                <Text
                  style={[
                    styles.modeChipText,
                    { color: active ? colors.onInk : colors.muted },
                  ]}
                >
                  {modeCopy[mode]}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.modeHelp, { color: colors.muted }]}>
          Resolved: {modeCopy[resolvedMode]}
        </Text>
      </Section>

      <Section
        eyebrow="Backup"
        title="Export your records"
        subtitle="Create a local JSON backup you can save to Files, Drive, email, or another safe place."
      >
        <RowAction
          icon="download"
          label={backupLoading ? 'Exporting backup…' : 'Export local backup'}
          onPress={handleExportBackup}
        />
        <Text style={[styles.helper, { color: colors.muted }]}>
          {DATA_SAFETY_MESSAGES.backupReminder}
        </Text>
      </Section>

      <UpgradeCard
        unlocked={isAdFree}
        onPress={() => navigation.navigate('AdFree')}
        style={styles.upgradeCard}
      />

      <Section
        eyebrow="Privacy"
        title="Data safety"
        subtitle="Designed to work without normal backend storage."
      >
        <InfoRow
          icon="shield"
          label="Storage"
          value="On this device"
          tone="success"
        />
        <InfoRow
          icon="warning"
          label="App deletion"
          value="May remove jobs and photos"
          tone="warning"
        />
        <InfoRow
          icon="info"
          label="Analytics"
          value="Disabled"
        />
        <InfoRow
          icon="doc"
          label="Backend"
          value="Not used for job workflows"
        />
      </Section>

      <Section eyebrow="About" title="TradieTrack Lite">
        <InfoRow icon="sparkle" label="Version" value={packageInfo.version} />
        <InfoRow
          icon="link"
          label="Privacy policy"
          value="Open the app store listing"
          onPress={() => Linking.openURL('https://tradietrack.app/privacy').catch(() => {})}
        />
        <InfoRow
          icon="link"
          label="Terms of service"
          value="Open the app store listing"
          onPress={() => Linking.openURL('https://tradietrack.app/terms').catch(() => {})}
        />
        <InfoRow
          icon="link"
          label="Refund policy"
          value="How refunds work"
          onPress={() => Linking.openURL('https://tradietrack.app/refunds').catch(() => {})}
        />
      </Section>

      {isAndroid() ? (
        <Section
          eyebrow="Reminders"
          title="Keep notifications on time"
          subtitle={getBatteryOptimisationMessage().body}
        >
          <RowAction
            icon="bell"
            label={getBatteryOptimisationMessage().cta}
            onPress={openAppSettings}
          />
        </Section>
      ) : null}

      <Section
        eyebrow="Help"
        title="Take the tour again"
        subtitle="Replay the first-run introduction."
      >
        <RowAction
          icon="refresh"
          label="Replay onboarding"
          onPress={async () => {
            await resetOnboardingState();
            Alert.alert(
              'Tour reset',
              'The onboarding tour will appear on the next launch.'
            );
          }}
        />
      </Section>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  modeChipText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  modeHelp: {
    fontSize: 12,
    marginTop: 10,
  },
  helper: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  upgradeCard: {
    marginTop: 0,
  },
});
