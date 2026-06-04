import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { buttons, colors, motion, radii, shadows, spacing, typography } from '../theme';

export function ScreenHeader({ eyebrow, title, subtitle, right }) {
  return (
    <View style={styles.screenHeader}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.screenTitle} numberOfLines={2}>{title}</Text>
          {subtitle ? <Text style={styles.screenSubtitle} numberOfLines={3}>{subtitle}</Text> : null}
        </View>
        {right ? <View style={styles.headerRight}>{right}</View> : null}
      </View>
    </View>
  );
}

export function Surface({ children, style }) {
  return <View style={[styles.surface, style]}>{children}</View>;
}

export function SectionCard({ eyebrow, title, subtitle, children, style }) {
  return (
    <Surface style={style}>
      {eyebrow ? <Text style={styles.sectionEyebrow}>{eyebrow}</Text> : null}
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      {children}
    </Surface>
  );
}

export function PrimaryButton({ title, onPress, disabled, loading, style }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.primaryButton,
        disabled && styles.disabled,
        pressed && !disabled && styles.primaryPressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryButtonText}>{title}</Text>}
    </Pressable>
  );
}

export function SecondaryButton({ title, onPress, disabled, danger, style }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.secondaryButton,
        danger && styles.dangerButton,
        disabled && styles.disabled,
        pressed && !disabled && styles.controlPressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.secondaryButtonText, danger && styles.dangerButtonText]}>{title}</Text>
    </Pressable>
  );
}

export function ChipButton({ title, active, onPress, style }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.chipButton,
        active && styles.chipButtonActive,
        pressed && styles.controlPressed,
        style,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.chipButtonText, active && styles.chipButtonTextActive]}>{title}</Text>
    </Pressable>
  );
}

export function IconButton({ label, onPress, danger, disabled, style }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.iconButton,
        danger && styles.iconButtonDanger,
        disabled && styles.disabled,
        pressed && !disabled && styles.controlPressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={[styles.iconButtonText, danger && styles.iconButtonDangerText]}>{label}</Text>
    </Pressable>
  );
}

export function StatusChip({ label, color = colors.subtle, filled }) {
  return (
    <View
      style={[
        styles.statusChip,
        { borderColor: color },
        filled && { backgroundColor: color },
      ]}
    >
      <Text style={[styles.statusChipText, { color: filled ? colors.white : color }]}>{label}</Text>
    </View>
  );
}

export function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline,
  style,
  ...rest
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.textArea,
          error && styles.inputError,
          style,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtle}
        multiline={multiline}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function EmptyState({ title, body, actionTitle, onAction, loading }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        {loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <View style={styles.emptyMark}>
            <View style={styles.emptyMarkClip} />
            <View style={styles.emptyMarkLine} />
            <View style={styles.emptyMarkCheck}>
              <View style={styles.emptyMarkCheckShort} />
              <View style={styles.emptyMarkCheckLong} />
            </View>
          </View>
        )}
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {actionTitle ? (
        <PrimaryButton title={actionTitle} onPress={onAction} style={styles.emptyAction} />
      ) : null}
    </View>
  );
}

export function LocalStorageNotice({ title = 'Stored on this device', children }) {
  return (
    <View style={styles.notice}>
      <View style={styles.noticeMark} />
      <View style={styles.noticeCopy}>
        <Text style={styles.noticeTitle}>{title}</Text>
        <Text style={styles.noticeBody}>{children}</Text>
      </View>
    </View>
  );
}

export function InfoRow({ label, value, action, onPress }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.infoRow, pressed && styles.controlPressed]}
      onPress={onPress}
    >
      <View style={styles.infoRowCopy}>
        <Text style={styles.infoRowLabel}>{label}</Text>
        <Text style={styles.infoRowValue} numberOfLines={2}>{value}</Text>
      </View>
      {action ? <Text style={styles.infoRowAction}>{action}</Text> : null}
    </Pressable>
  );
}

export const sharedStyles = styles;

const styles = StyleSheet.create({
  screenHeader: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.subtle,
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
  },
  headerRight: {
    alignSelf: 'center',
  },
  screenTitle: {
    ...typography.screenTitle,
    color: colors.ink,
  },
  screenSubtitle: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  surface: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  sectionEyebrow: {
    ...typography.eyebrow,
    color: colors.subtle,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.small,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: buttons.radius,
    borderWidth: 1,
    borderColor: colors.accentInk,
    paddingVertical: 15,
    paddingHorizontal: spacing.lg,
    minHeight: buttons.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lift,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: buttons.radius,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    minHeight: buttons.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  dangerButton: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  dangerButtonText: {
    color: colors.danger,
  },
  chipButton: {
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
  chipButtonActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  chipButtonText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  chipButtonTextActive: {
    color: colors.white,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonDanger: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  iconButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  iconButtonDangerText: {
    color: colors.danger,
  },
  statusChip: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    backgroundColor: colors.surfaceRaised,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  field: {
    marginTop: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    fontSize: 16,
    lineHeight: 21,
    minHeight: 52,
    color: colors.text,
  },
  inputError: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  textArea: {
    minHeight: 112,
    textAlignVertical: 'top',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.xxl,
    marginTop: spacing.md,
    ...shadows.card,
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: radii.md,
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyMark: {
    width: 30,
    height: 34,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    alignItems: 'center',
    paddingTop: 7,
  },
  emptyMarkClip: {
    position: 'absolute',
    top: -4,
    width: 14,
    height: 7,
    borderRadius: 3,
    backgroundColor: colors.accentInk,
  },
  emptyMarkLine: {
    width: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.amber,
    marginTop: 8,
  },
  emptyMarkCheck: {
    position: 'absolute',
    bottom: 8,
    width: 19,
    height: 14,
  },
  emptyMarkCheckShort: {
    position: 'absolute',
    left: 2,
    bottom: 2,
    width: 9,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
    transform: [{ rotate: '42deg' }],
  },
  emptyMarkCheckLong: {
    position: 'absolute',
    right: 0,
    bottom: 4,
    width: 17,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
    transform: [{ rotate: '-48deg' }],
  },
  emptyTitle: {
    ...typography.title,
    color: colors.ink,
    textAlign: 'center',
  },
  emptyBody: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  emptyAction: {
    alignSelf: 'stretch',
    marginTop: spacing.lg,
  },
  notice: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    flexDirection: 'row',
    gap: spacing.md,
  },
  noticeMark: {
    width: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  noticeCopy: {
    flex: 1,
  },
  noticeTitle: {
    ...typography.sectionTitle,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  noticeBody: {
    color: colors.muted,
    ...typography.small,
  },
  infoRow: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    gap: spacing.md,
    backgroundColor: colors.surfaceAlt,
  },
  infoRowCopy: {
    flex: 1,
  },
  infoRowLabel: {
    ...typography.label,
    color: colors.subtle,
    marginBottom: spacing.xs,
  },
  infoRowValue: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    fontWeight: '700',
  },
  infoRowAction: {
    color: colors.accentInk,
    fontWeight: '900',
    fontSize: 13,
    flexShrink: 0,
  },
  primaryPressed: {
    opacity: motion.pressedOpacity,
    transform: [{ scale: 0.99 }],
  },
  controlPressed: {
    opacity: motion.pressedOpacity,
  },
  disabled: {
    opacity: 0.65,
  },
});
