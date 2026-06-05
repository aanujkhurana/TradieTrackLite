import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  AppShell,
  PrimaryButton,
  SecondaryButton,
} from '../components/ui';
import { BrandMark } from '../components/Brand';
import { Icon } from '../components/Icon';
import { useTheme } from '../theme';
import { saveOnboardingState } from './storage';

const STEPS = [
  {
    id: 'local',
    eyebrow: 'Local-first',
    title: 'Your jobs stay on this device',
    body:
      'TradieTrack Lite does not sync to a cloud, does not require an account, and does not upload job records or photos to a backend by default. Removing the app may remove its data — export a backup from Settings to keep a copy.',
    icon: 'shield',
    accent: 'success',
  },
  {
    id: 'workflow',
    eyebrow: 'Daily workflow',
    title: 'Capture the job, set a reminder, share the report',
    body:
      'Create a job, add photos, log time, schedule a reminder, and share a PDF report with your customer in a few taps. Everything works offline.',
    icon: 'play',
    accent: 'accent',
  },
  {
    id: 'reminder',
    eyebrow: 'Reminders',
    title: 'On Android, allow notifications and disable battery optimisation',
    body:
      'If you are on Android, allow notifications when prompted. To make sure reminders fire on time, open system settings and set TradieTrack Lite to "Unrestricted" in battery options.',
    icon: 'bell',
    accent: 'warning',
  },
];

function accentColor(colors, tone) {
  if (tone === 'success') return colors.status?.pending?.fg || colors.accent;
  if (tone === 'warning') return colors.amber;
  return colors.accent;
}

export default function Onboarding({ onDone }) {
  const { colors, typography, spacing, radii } = useTheme();
  const [index, setIndex] = useState(0);
  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;
  const isFirst = index === 0;

  const cardStyle = useMemo(
    () => [
      styles.card,
      {
        backgroundColor: colors.surface,
        borderColor: colors.borderSoft,
        borderRadius: radii.lg,
        padding: spacing.xl,
      },
    ],
    [colors, radii, spacing]
  );

  const handleNext = async () => {
    if (isLast) {
      await saveOnboardingState({ hasSeenOnboarding: true });
      if (typeof onDone === 'function') onDone();
      return;
    }
    setIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const handleSkip = async () => {
    await saveOnboardingState({ hasSeenOnboarding: true });
    if (typeof onDone === 'function') onDone();
  };

  const handleBack = () => {
    setIndex((i) => Math.max(i - 1, 0));
  };

  return (
    <AppShell testID="onboarding-screen">
      <View
        style={[styles.brandRow, { paddingTop: spacing['2xl'] }]}
      >
        <BrandMark size={48} tone="accent" />
        <Pressable
          onPress={handleSkip}
          hitSlop={12}
          style={styles.skipBtn}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
        >
          <Text style={[styles.skipText, { color: colors.muted }]}>
            Skip
          </Text>
        </Pressable>
      </View>

      <View style={[styles.cardWrap, { paddingTop: spacing['2xl'] }]}>
        <View style={cardStyle}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: colors.surfaceInset,
                borderColor: colors.borderSoft,
              },
            ]}
          >
            <Icon
              name={step.icon}
              size={24}
              color={accentColor(colors, step.accent)}
            />
          </View>
          <Text
            style={[
              styles.eyebrow,
              typography.micro,
              { color: colors.subtle },
            ]}
          >
            {step.eyebrow}
          </Text>
          <Text
            style={[
              styles.title,
              typography.subtitle,
              { color: colors.ink },
            ]}
          >
            {step.title}
          </Text>
          <Text
            style={[
              styles.body,
              typography.body,
              { color: colors.muted },
            ]}
          >
            {step.body}
          </Text>
        </View>
      </View>

      <View style={[styles.dots, { paddingTop: spacing.xl }]}>
        {STEPS.map((s, i) => (
          <View
            key={s.id}
            style={[
              styles.dot,
              {
                backgroundColor:
                  i === index ? colors.accent : colors.surfaceInset,
                width: i === index ? 18 : 6,
              },
            ]}
          />
        ))}
      </View>

      <View
        style={[
          styles.actions,
          {
            paddingTop: spacing['2xl'],
            paddingBottom: spacing['2xl'],
            paddingHorizontal: spacing.screen,
            gap: spacing.sm,
          },
        ]}
      >
        <PrimaryButton
          label={isLast ? 'Start using TradieTrack' : 'Continue'}
          icon={isLast ? 'check' : 'forward'}
          onPress={handleNext}
        />
        {!isFirst && (
          <SecondaryButton label="Back" onPress={handleBack} />
        )}
        {!isLast && (
          <SecondaryButton
            label="Skip the tour"
            onPress={handleSkip}
          />
        )}
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardWrap: {
    paddingHorizontal: 24,
  },
  card: {
    borderWidth: 1,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 16,
  },
  eyebrow: {
    marginBottom: 8,
  },
  title: {
    marginBottom: 12,
  },
  body: {},
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 999,
  },
  actions: {
    marginTop: 'auto',
  },
});
