import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { useTheme } from '../theme';

const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

export function AppShell({
  children,
  scroll = false,
  scrollProps = {},
  backgroundColor,
  edges = ['top', 'left', 'right', 'bottom'],
  contentStyle,
  refreshControl,
  keyboardShouldPersistTaps = 'handled',
  testID,
}) {
  const { colors } = useTheme();
  const bg = backgroundColor || colors.background;

  if (scroll) {
    return (
      <SafeAreaView
        edges={edges}
        style={[styles.shell, { backgroundColor: bg }]}
        testID={testID}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          {...scrollProps}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.shell, { backgroundColor: bg }]}
      testID={testID}
    >
      <View style={[styles.fill, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  right,
  align = 'left',
  size = 'title',
  style,
}) {
  const { colors, typography } = useTheme();
  const titleStyle = size === 'display' ? typography.display : typography.title;
  return (
    <View style={[styles.screenHeader, style]}>
      {eyebrow ? (
        <Text style={[styles.eyebrow, { color: colors.subtle }]}>{eyebrow}</Text>
      ) : null}
      <View
        style={[
          styles.headerRow,
          align === 'center' && styles.headerRowCenter,
        ]}
      >
        <View style={styles.headerCopy}>
          <Text
            style={[
              titleStyle,
              { color: colors.ink, textAlign: align === 'center' ? 'center' : 'left' },
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                styles.subtitle,
                { color: colors.muted, textAlign: align === 'center' ? 'center' : 'left' },
              ]}
              numberOfLines={3}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View style={styles.headerRight}>{right}</View> : null}
      </View>
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon,
  iconRight,
  tone = 'accent',
  style,
  fullWidth = false,
  testID,
}) {
  const { colors, shadows, motion } = useTheme();
  const palette = (() => {
    if (tone === 'ink') {
      return {
        bg: colors.ink,
        fg: colors.onInk,
        border: colors.ink,
        shadow: shadows.lift,
      };
    }
    if (tone === 'danger') {
      return {
        bg: colors.danger,
        fg: '#FFF8F4',
        border: colors.danger,
        shadow: shadows.lift,
      };
    }
    return {
      bg: colors.accent,
      fg: colors.onAccent,
      border: colors.accentInk,
      shadow: shadows.lift,
    };
  })();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        styles.primary,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: disabled ? motion.disabled : pressed ? motion.pressed : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        palette.shadow,
        style,
      ]}
      hitSlop={hitSlop}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.buttonContent}>
          {icon ? (
            <Icon name={icon} size={18} color={palette.fg} style={styles.buttonIconLeft} />
          ) : null}
          <Text style={[styles.buttonText, { color: palette.fg }]}>{title}</Text>
          {iconRight ? (
            <Icon name={iconRight} size={18} color={palette.fg} style={styles.buttonIconRight} />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

export function SecondaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon,
  iconRight,
  tone = 'default',
  style,
  fullWidth = false,
  size = 'md',
  testID,
}) {
  const { colors, motion } = useTheme();
  const isDanger = tone === 'danger';
  const isAccent = tone === 'accent';

  const palette = isDanger
    ? { bg: colors.dangerSoft, fg: colors.danger, border: colors.dangerBorder }
    : isAccent
      ? { bg: colors.accentSoft, fg: colors.accentInk, border: colors.accentBorder }
      : { bg: colors.surfaceRaised, fg: colors.text, border: colors.border };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        size === 'sm' ? styles.buttonSm : null,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: disabled ? motion.disabled : pressed ? motion.pressed : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
      hitSlop={hitSlop}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.buttonContent}>
          {icon ? (
            <Icon name={icon} size={size === 'sm' ? 15 : 17} color={palette.fg} style={styles.buttonIconLeft} />
          ) : null}
          <Text
            style={[
              styles.buttonText,
              size === 'sm' && styles.buttonTextSm,
              { color: palette.fg },
            ]}
          >
            {title}
          </Text>
          {iconRight ? (
            <Icon name={iconRight} size={size === 'sm' ? 15 : 17} color={palette.fg} style={styles.buttonIconRight} />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

export function IconButton({
  name,
  onPress,
  disabled = false,
  tone = 'default',
  size = 42,
  style,
  accessibilityLabel,
  testID,
}) {
  const { colors, motion } = useTheme();
  const isDanger = tone === 'danger';
  const isAccent = tone === 'accent';
  const palette = isDanger
    ? { bg: colors.dangerSoft, fg: colors.danger, border: colors.dangerBorder }
    : isAccent
      ? { bg: colors.accentSoft, fg: colors.accentInk, border: colors.accentBorder }
      : { bg: colors.surface, fg: colors.ink, border: colors.border };
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.iconButton,
        {
          width: size,
          height: size,
          borderRadius: size * 0.32,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: disabled ? motion.disabled : pressed ? motion.pressed : 1,
        },
        style,
      ]}
      hitSlop={hitSlop}
      accessibilityLabel={accessibilityLabel || name}
      testID={testID}
    >
      <Icon name={name} size={Math.round(size * 0.46)} color={palette.fg} />
    </Pressable>
  );
}

export function StatusChip({
  status = 'pending',
  label,
  size = 'md',
  style,
}) {
  const { theme } = useTheme();
  const meta = theme.status[status] || theme.status.neutral;
  const toneSize = size === 'sm' ? styles.chipSm : styles.chipMd;
  return (
    <View
      style={[
        styles.chip,
        toneSize,
        { backgroundColor: meta.bg, borderColor: meta.border },
        style,
      ]}
    >
      <View
        style={[
          styles.chipDot,
          { backgroundColor: meta.fg },
        ]}
      />
      <Text
        style={[
          styles.chipText,
          size === 'sm' && styles.chipTextSm,
          { color: meta.fg },
        ]}
      >
        {label || meta.label}
      </Text>
    </View>
  );
}

export function ChipButton({
  title,
  active = false,
  onPress,
  icon,
  tone = 'default',
  style,
  testID,
}) {
  const { colors, motion } = useTheme();
  const isAccent = active || tone === 'accent';
  const palette = isAccent
    ? { bg: colors.ink, fg: colors.onInk, border: colors.ink }
    : { bg: colors.surface, fg: colors.muted, border: colors.borderSoft };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chipButton,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: pressed ? motion.pressed : 1,
        },
        style,
      ]}
      hitSlop={hitSlop}
      testID={testID}
    >
      {icon ? (
        <Icon name={icon} size={15} color={palette.fg} style={styles.chipButtonIcon} />
      ) : null}
      <Text style={[styles.chipButtonText, { color: palette.fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Section({
  children,
  eyebrow,
  title,
  subtitle,
  action,
  style,
  contentStyle,
  tone = 'default',
}) {
  const { colors, shadows } = useTheme();
  const isInset = tone === 'inset';
  const bg = isInset ? colors.surfaceInset : colors.surface;
  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: bg,
          borderColor: isInset ? colors.borderSoft : colors.border,
        },
        isInset ? null : shadows.card,
        style,
      ]}
    >
      {(eyebrow || title || action) && (
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderCopy}>
            {eyebrow ? (
              <Text style={[styles.sectionEyebrow, { color: colors.subtle }]}>{eyebrow}</Text>
            ) : null}
            {title ? (
              <Text style={[styles.sectionTitle, { color: colors.ink }]}>{title}</Text>
            ) : null}
            {subtitle ? (
              <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {action ? <View style={styles.sectionAction}>{action}</View> : null}
        </View>
      )}
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

export function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  helper,
  error,
  multiline = false,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  returnKeyType,
  onSubmitEditing,
  editable = true,
  leftIcon,
  rightAdornment,
  style,
  inputStyle,
  testID,
  maxLength,
  secureTextEntry,
}) {
  const { colors, typography } = useTheme();
  const textAlignVertical = multiline ? 'top' : 'auto';
  const hasError = Boolean(error);
  return (
    <View style={[styles.field, style]}>
      {label ? (
        <Text style={[styles.label, { color: colors.subtle }]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.inputShell,
          multiline && styles.inputShellMultiline,
          {
            backgroundColor: colors.surfaceInset,
            borderColor: hasError ? colors.danger : colors.borderSoft,
          },
        ]}
      >
        {leftIcon ? (
          <Icon
            name={leftIcon}
            size={18}
            color={colors.muted}
            style={styles.inputLeftIcon}
          />
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          editable={editable}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
          textAlignVertical={textAlignVertical}
          style={[
            typography.body,
            multiline && styles.textAreaInput,
            {
              color: colors.text,
              minHeight: multiline ? 124 : 52,
              paddingLeft: leftIcon ? 0 : 16,
              paddingRight: rightAdornment ? 4 : 16,
            },
            inputStyle,
          ]}
          testID={testID}
        />
        {rightAdornment ? (
          <View style={styles.rightAdornment}>{rightAdornment}</View>
        ) : null}
      </View>
      {error ? (
        <View style={styles.helperRow}>
          <Icon name="warning" size={13} color={colors.danger} style={styles.helperIcon} />
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        </View>
      ) : helper ? (
        <Text style={[styles.helperText, { color: colors.muted }]}>{helper}</Text>
      ) : null}
    </View>
  );
}

export function TextArea(props) {
  return <FormInput multiline {...props} />;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search',
  onClear,
  style,
  testID,
}) {
  const { colors, motion } = useTheme();
  return (
    <View
      style={[
        styles.searchShell,
        {
          backgroundColor: colors.surfaceInset,
          borderColor: colors.borderSoft,
        },
        style,
      ]}
    >
      <Icon name="search" size={18} color={colors.muted} style={styles.inputLeftIcon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        returnKeyType="search"
        style={[styles.searchInput, { color: colors.text }]}
        testID={testID}
      />
      {value && onClear ? (
        <Pressable
          onPress={onClear}
          hitSlop={hitSlop}
          style={({ pressed }) => [
            styles.searchClear,
            { opacity: pressed ? motion.pressed : 1 },
          ]}
          accessibilityLabel="Clear search"
        >
          <Icon name="close" size={14} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon,
  illustration,
  title,
  body,
  actionTitle,
  onAction,
  actionIcon = 'add',
  secondaryTitle,
  onSecondary,
  loading = false,
  style,
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.emptyState,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
    >
      <View
        style={[
          styles.emptyIcon,
          { backgroundColor: colors.accentSoft, borderColor: colors.accentBorder },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : illustration ? (
          illustration
        ) : (
          <Icon name={icon || 'doc'} size={26} color={colors.accentInk} />
        )}
      </View>
      {title ? (
        <Text style={[styles.emptyTitle, { color: colors.ink }]}>{title}</Text>
      ) : null}
      {body ? (
        <Text style={[styles.emptyBody, { color: colors.muted }]}>{body}</Text>
      ) : null}
      {actionTitle ? (
        <PrimaryButton
          title={actionTitle}
          onPress={onAction}
          icon={actionIcon}
          style={styles.emptyAction}
        />
      ) : null}
      {secondaryTitle ? (
        <SecondaryButton
          title={secondaryTitle}
          onPress={onSecondary}
          style={styles.emptySecondary}
          size="sm"
        />
      ) : null}
    </View>
  );
}

export function LocalStorageNotice({
  title = 'On this device',
  body,
  variant = 'info',
  style,
  icon,
}) {
  const { colors } = useTheme();
  const variants = {
    info: { icon: 'shield', fg: colors.accentInk, bg: colors.accentSoft, border: colors.accentBorder },
    warning: { icon: 'warning', fg: colors.amber, bg: colors.amberSoft, border: colors.amberBorder },
    danger: { icon: 'warning', fg: colors.danger, bg: colors.dangerSoft, border: colors.dangerBorder },
  };
  const v = variants[variant] || variants.info;
  return (
    <View
      style={[
        styles.notice,
        { backgroundColor: v.bg, borderColor: v.border },
        style,
      ]}
    >
      <View style={styles.noticeIcon}>
        <Icon name={icon || v.icon} size={16} color={v.fg} />
      </View>
      <View style={styles.noticeCopy}>
        <Text style={[styles.noticeTitle, { color: colors.ink }]}>{title}</Text>
        {typeof body === 'string' ? (
          <Text style={[styles.noticeBody, { color: colors.muted }]}>{body}</Text>
        ) : (
          body
        )}
      </View>
    </View>
  );
}

export function InfoRow({
  label,
  value,
  action,
  onPress,
  icon,
  tone = 'default',
  style,
}) {
  const { colors, motion } = useTheme();
  const palette = (() => {
    if (tone === 'warning') {
      return { fg: colors.amber, bg: colors.amberSoft, border: colors.amberBorder };
    }
    if (tone === 'danger') {
      return { fg: colors.danger, bg: colors.dangerSoft, border: colors.dangerBorder };
    }
    if (tone === 'success') {
      return { fg: colors.success, bg: colors.successSoft, border: colors.accentBorder };
    }
    return { fg: colors.muted, bg: colors.surfaceInset, border: colors.borderSoft };
  })();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.infoRow,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: pressed && onPress ? motion.pressed : 1,
        },
        style,
      ]}
      hitSlop={onPress ? hitSlop : undefined}
    >
      {icon ? (
        <View style={styles.infoRowIcon}>
          <Icon name={icon} size={16} color={palette.fg} />
        </View>
      ) : null}
      <View style={styles.infoRowCopy}>
        <Text style={[styles.infoRowLabel, { color: colors.subtle }]}>{label}</Text>
        <Text style={[styles.infoRowValue, { color: colors.ink }]} numberOfLines={2}>
          {value || 'Not set'}
        </Text>
      </View>
      {action && onPress ? (
        <Text style={[styles.infoRowAction, { color: colors.accentInk }]}>{action}</Text>
      ) : null}
    </Pressable>
  );
}

export function StatTile({ label, value, tone = 'default', icon, style }) {
  const { colors } = useTheme();
  const palette = (() => {
    if (tone === 'warning') {
      return { fg: colors.amber, bg: colors.amberSoft, border: colors.amberBorder };
    }
    if (tone === 'success') {
      return { fg: colors.accentInk, bg: colors.accentSoft, border: colors.accentBorder };
    }
    if (tone === 'danger') {
      return { fg: colors.danger, bg: colors.dangerSoft, border: colors.dangerBorder };
    }
    if (tone === 'ink') {
      return { fg: colors.onInk, bg: colors.ink, border: colors.ink };
    }
    return { fg: colors.ink, bg: colors.surface, border: colors.border };
  })();
  return (
    <View
      style={[
        styles.statTile,
        { backgroundColor: palette.bg, borderColor: palette.border },
        style,
      ]}
    >
      <View style={styles.statTileHeader}>
        {icon ? <Icon name={icon} size={14} color={palette.fg} /> : null}
        <Text style={[styles.statTileLabel, { color: palette.fg, opacity: tone === 'ink' ? 0.7 : 1 }]}>
          {label}
        </Text>
      </View>
      <Text style={[styles.statTileValue, { color: palette.fg }]}>{value}</Text>
    </View>
  );
}

export function JobCard({
  job,
  statusMeta,
  onPress,
  onLongPress,
  reminderOverdue = false,
  photoCount = 0,
  hasReminder = false,
  loggedLabel,
  trailing,
  style,
  testID,
}) {
  const { colors, shadows, motion, typography } = useTheme();
  const railColor = statusMeta?.fg || colors.muted;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      testID={testID}
      style={({ pressed }) => [
        styles.jobCard,
        shadows.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? motion.pressed : 1,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.jobCardRail,
          { backgroundColor: railColor },
        ]}
      />
      <View style={styles.jobCardContent}>
        <View style={styles.jobCardTopRow}>
          <Text
            style={[styles.jobCardTitle, { color: colors.ink }]}
            numberOfLines={1}
          >
            {job.name}
          </Text>
          <StatusChip
            status={job.status}
            label={statusMeta?.label}
            size="sm"
          />
        </View>
        {job.customerName ? (
          <Text style={[styles.jobCardCustomer, { color: colors.text }]} numberOfLines={1}>
            {job.customerName}
          </Text>
        ) : null}
        {job.address ? (
          <View style={styles.jobCardAddressRow}>
            <Icon name="location" size={13} color={colors.subtle} style={styles.jobCardAddressIcon} />
            <Text style={[styles.jobCardAddress, { color: colors.muted }]} numberOfLines={1}>
              {job.address}
            </Text>
          </View>
        ) : null}
        <View style={styles.jobCardFooter}>
          <View style={styles.jobCardFooterLeft}>
            {photoCount > 0 ? (
              <View style={styles.jobCardFooterItem}>
                <Icon name="image" size={13} color={colors.subtle} />
                <Text style={[styles.jobCardFooterText, { color: colors.muted }]}>
                  {photoCount}
                </Text>
              </View>
            ) : null}
            <View style={styles.jobCardFooterItem}>
              <Icon
                name={hasReminder ? 'bell' : 'bellOff'}
                size={13}
                color={reminderOverdue ? colors.danger : hasReminder ? colors.accentInk : colors.subtle}
              />
              <Text
                style={[
                  styles.jobCardFooterText,
                  {
                    color: reminderOverdue
                      ? colors.danger
                      : hasReminder
                        ? colors.accentInk
                        : colors.muted,
                  },
                ]}
              >
                {reminderOverdue
                  ? 'Overdue'
                  : hasReminder
                    ? 'Reminder'
                    : 'No reminder'}
              </Text>
            </View>
            {loggedLabel ? (
              <View style={styles.jobCardFooterItem}>
                <Icon name="clock" size={13} color={colors.subtle} />
                <Text style={[styles.jobCardFooterText, { color: colors.muted }]}>
                  {loggedLabel}
                </Text>
              </View>
            ) : null}
          </View>
          {trailing}
        </View>
      </View>
    </Pressable>
  );
}

export function PhotoTile({ uri, onPress, onDelete, size = 110, style, testID }) {
  const { colors, motion } = useTheme();
  return (
    <View style={[{ width: size, height: size }, style]} testID={testID}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.photoTileImage,
          {
            backgroundColor: colors.surfaceInset,
            opacity: pressed && onPress ? motion.pressed : 1,
          },
        ]}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.photoTileSource} />
        ) : (
          <View style={styles.photoTilePlaceholder}>
            <Icon name="image" size={20} color={colors.muted} />
          </View>
        )}
      </Pressable>
      {onDelete ? (
        <Pressable
          onPress={onDelete}
          hitSlop={hitSlop}
          style={({ pressed }) => [
            styles.photoTileDelete,
            {
              backgroundColor: colors.overlay,
              opacity: pressed ? motion.pressed : 1,
            },
          ]}
          accessibilityLabel="Remove photo"
        >
          <Icon name="close" size={12} color={colors.onInk} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function PhotoGrid({ photos, onAdd, onDelete, onPreview, size }) {
  const { colors } = useTheme();
  return (
    <View style={styles.photoGrid}>
      {photos.map((uri, index) => (
        <PhotoTile
          key={`${uri}-${index}`}
          uri={uri}
          size={size}
          onPress={onPreview ? () => onPreview(uri, index) : undefined}
          onDelete={onDelete ? () => onDelete(uri, index) : undefined}
          style={styles.photoGridItem}
        />
      ))}
      {onAdd ? (
        <Pressable
          onPress={onAdd}
          style={({ pressed }) => [
            styles.photoAdd,
            {
              width: size,
              height: size,
              backgroundColor: colors.surfaceInset,
              borderColor: colors.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          accessibilityLabel="Add photo"
        >
          <Icon name="camera" size={22} color={colors.accentInk} />
          <Text style={[styles.photoAddLabel, { color: colors.accentInk }]}>Add</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ReportActionCard({
  onShare,
  loading = false,
  job,
  style,
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.reportCard,
        { backgroundColor: colors.ink, borderColor: colors.ink },
        style,
      ]}
    >
      <View style={styles.reportCardHeader}>
        <View
          style={[
            styles.reportCardBadge,
            { backgroundColor: colors.accent },
          ]}
        >
          <Text style={[styles.reportCardBadgeText, { color: colors.onAccent }]}>PDF</Text>
        </View>
        <Text style={[styles.reportCardLabel, { color: colors.subtle }]}>
          Share with customer
        </Text>
      </View>
      <Text style={[styles.reportCardTitle, { color: colors.onInk }]}>
        Job report
      </Text>
      <Text style={[styles.reportCardBody, { color: colors.subtle }]}>
        Includes job details, customer info, time logged, and photos. Generated on this device.
      </Text>
      <View style={styles.reportCardMeta}>
        <View style={styles.reportCardMetaItem}>
          <Icon name="doc" size={14} color={colors.subtle} />
          <Text style={[styles.reportCardMetaText, { color: colors.subtle }]}>Local</Text>
        </View>
        <View style={styles.reportCardMetaItem}>
          <Icon name="shield" size={14} color={colors.subtle} />
          <Text style={[styles.reportCardMetaText, { color: colors.subtle }]}>Private</Text>
        </View>
        <View style={styles.reportCardMetaItem}>
          <Icon name="share" size={14} color={colors.subtle} />
          <Text style={[styles.reportCardMetaText, { color: colors.subtle }]}>Share sheet</Text>
        </View>
      </View>
      <PrimaryButton
        title={loading ? 'Building…' : 'Share report'}
        onPress={onShare}
        loading={loading}
        icon="share"
        tone="ink"
        style={styles.reportCardButton}
      />
    </View>
  );
}

export function UpgradeCard({
  unlocked = false,
  onPress,
  productLabel = 'Ad-free',
  priceLabel = 'One-time',
  description,
  style,
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.upgradeCard,
        {
          backgroundColor: unlocked ? colors.accentSoft : colors.ink,
          borderColor: unlocked ? colors.accentBorder : colors.ink,
          opacity: pressed ? 0.92 : 1,
        },
        style,
      ]}
    >
      <View style={styles.upgradeCardHeader}>
        <View
          style={[
            styles.upgradeCardBadge,
            {
              backgroundColor: unlocked ? colors.accent : colors.surface,
            },
          ]}
        >
          <Text
            style={[
              styles.upgradeCardBadgeText,
              { color: unlocked ? colors.onAccent : colors.ink },
            ]}
          >
            {unlocked ? 'Active' : 'One-time'}
          </Text>
        </View>
        <Icon
          name={unlocked ? 'checkCircle' : 'sparkle'}
          size={18}
          color={unlocked ? colors.accentInk : colors.onInk}
        />
      </View>
      <Text
        style={[
          styles.upgradeCardTitle,
          { color: unlocked ? colors.accentInk : colors.onInk },
        ]}
      >
        {unlocked ? `${productLabel} enabled` : `Remove ads. Once.`}
      </Text>
      <Text
        style={[
          styles.upgradeCardBody,
          { color: unlocked ? colors.accentInk : colors.subtle },
        ]}
      >
        {description ||
          (unlocked
            ? 'Banner ads are turned off on this device.'
            : 'A single purchase hides banner ads. No subscription, no account, no team plan.')}
      </Text>
      <View style={styles.upgradeCardFooter}>
        <Text
          style={[
            styles.upgradeCardPrice,
            { color: unlocked ? colors.accentInk : colors.onInk },
          ]}
        >
          {priceLabel}
        </Text>
        <Icon
          name="forward"
          size={18}
          color={unlocked ? colors.accentInk : colors.onInk}
        />
      </View>
    </Pressable>
  );
}

export function AdContainer({ children, style }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.adContainer,
        { backgroundColor: colors.surfaceInset, borderColor: colors.borderSoft },
        style,
      ]}
    >
      <Text style={[styles.adContainerLabel, { color: colors.subtle }]}>Sponsored</Text>
      <View style={styles.adContainerBody}>{children}</View>
    </View>
  );
}

export function DateTimePickerRow({ label, value, onPress, actionLabel = 'Change', style }) {
  const { colors, typography } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pickerRow,
        {
          backgroundColor: colors.surfaceInset,
          borderColor: colors.borderSoft,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <View style={styles.pickerRowIcon}>
        <Icon name="calendar" size={18} color={colors.accentInk} />
      </View>
      <View style={styles.pickerRowCopy}>
        <Text style={[styles.pickerRowLabel, { color: colors.subtle }]}>{label}</Text>
        <Text style={[styles.pickerRowValue, typography.body, { color: colors.ink }]}>
          {value || 'Not set'}
        </Text>
      </View>
      <Text style={[styles.pickerRowAction, { color: colors.accentInk }]}>{actionLabel}</Text>
    </Pressable>
  );
}

export function ThemeToggle({ style }) {
  const { resolvedMode, toggleMode, colors } = useTheme();
  const isDark = resolvedMode === 'dark';
  return (
    <View
      style={[
        styles.themeToggle,
        { backgroundColor: colors.surfaceInset, borderColor: colors.borderSoft },
        style,
      ]}
    >
      <View style={styles.themeToggleCopy}>
        <Text style={[styles.themeToggleLabel, { color: colors.ink }]}>
          {isDark ? 'Dark mode' : 'Light mode'}
        </Text>
        <Text style={[styles.themeToggleHelp, { color: colors.muted }]}>
          Switches with the system. Override any time.
        </Text>
      </View>
      <View style={styles.themeToggleActions}>
        <Pressable
          onPress={() => toggleMode()}
          accessibilityLabel="Toggle theme"
          style={({ pressed }) => [
            styles.themeToggleButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Icon
            name={isDark ? 'sun' : 'moon'}
            size={16}
            color={colors.ink}
          />
        </Pressable>
      </View>
    </View>
  );
}

export function Divider({ style }) {
  const { colors } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.borderSoft }, style]} />;
}

export function RowAction({ icon, label, onPress, tone = 'default', style }) {
  const { colors, motion } = useTheme();
  const palette = (() => {
    if (tone === 'danger') return { fg: colors.danger, bg: colors.dangerSoft, border: colors.dangerBorder };
    return { fg: colors.ink, bg: colors.surfaceInset, border: colors.borderSoft };
  })();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.rowAction,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: pressed ? motion.pressed : 1,
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={16} color={palette.fg} /> : null}
      <Text style={[styles.rowActionLabel, { color: palette.fg }]}>{label}</Text>
      <Icon name="forward" size={14} color={palette.fg} />
    </Pressable>
  );
}

export function useSharedStyles() {
  const { theme, colors, shadows, motion, typography, spacing, radii } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        screenContent: {
          paddingHorizontal: spacing.screen,
          paddingTop: spacing.lg,
          paddingBottom: spacing['4xl'],
        },
      }),
    [spacing]
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  screenHeader: {
    paddingTop: 4,
    paddingBottom: 24,
  },
  eyebrow: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    justifyContent: 'space-between',
  },
  headerRowCenter: {
    alignItems: 'center',
  },
  headerCopy: {
    flex: 1,
  },
  headerRight: {
    alignSelf: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    marginTop: 6,
  },
  button: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSm: {
    borderRadius: 12,
    minHeight: 40,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  primary: {
    minHeight: 56,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  buttonTextSm: {
    fontSize: 14,
  },
  buttonIconLeft: {
    marginRight: 8,
  },
  buttonIconRight: {
    marginLeft: 8,
  },
  iconButton: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  chipSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipMd: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  chipTextSm: {
    fontSize: 10,
  },
  chipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipButtonText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  chipButtonIcon: {
    marginRight: 6,
  },
  section: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  sectionHeaderCopy: {
    flex: 1,
  },
  sectionAction: {
    alignSelf: 'flex-start',
  },
  sectionEyebrow: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
    marginTop: 4,
  },
  field: {
    marginTop: 14,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  inputShellMultiline: {
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 124,
    alignItems: 'flex-start',
  },
  textAreaInput: {
    paddingTop: 0,
  },
  inputLeftIcon: {
    marginRight: 10,
  },
  rightAdornment: {
    paddingLeft: 4,
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  helperIcon: {
    marginRight: 4,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6,
  },
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  searchClear: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 28,
    paddingVertical: 36,
    alignItems: 'center',
    marginTop: 16,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyAction: {
    alignSelf: 'stretch',
    marginTop: 22,
  },
  emptySecondary: {
    alignSelf: 'stretch',
    marginTop: 10,
  },
  notice: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  noticeIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  noticeCopy: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  noticeBody: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 64,
    marginTop: 8,
  },
  infoRowIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  infoRowCopy: {
    flex: 1,
  },
  infoRowLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoRowValue: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  infoRowAction: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  statTile: {
    flexGrow: 1,
    flexBasis: 110,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 78,
    justifyContent: 'space-between',
  },
  statTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statTileLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  statTileValue: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  jobCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 10,
  },
  jobCardRail: {
    width: 3,
  },
  jobCardContent: {
    flex: 1,
    padding: 16,
  },
  jobCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  jobCardTitle: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  jobCardCustomer: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    marginTop: 4,
  },
  jobCardAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  jobCardAddressIcon: {
    marginRight: 4,
  },
  jobCardAddress: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  jobCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  jobCardFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  jobCardFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobCardFooterText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  photoGridItem: {
    marginBottom: 0,
  },
  photoTileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  photoTileSource: {
    width: '100%',
    height: '100%',
  },
  photoTilePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoTileDelete: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAdd: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoAddLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  reportCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
  },
  reportCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reportCardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reportCardBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  reportCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  reportCardTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 18,
  },
  reportCardBody: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginTop: 6,
  },
  reportCardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 18,
  },
  reportCardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reportCardMetaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reportCardButton: {
    marginTop: 22,
  },
  upgradeCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
  },
  upgradeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upgradeCardBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  upgradeCardBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  upgradeCardTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 18,
  },
  upgradeCardBody: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginTop: 6,
  },
  upgradeCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
  },
  upgradeCardPrice: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  adContainer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    minHeight: 60,
    marginBottom: 12,
  },
  adContainerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
    textAlign: 'right',
  },
  adContainerBody: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 64,
    marginTop: 8,
  },
  pickerRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  pickerRowCopy: {
    flex: 1,
  },
  pickerRowLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  pickerRowValue: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  pickerRowAction: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    minHeight: 64,
  },
  themeToggleCopy: {
    flex: 1,
  },
  themeToggleLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  themeToggleHelp: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  themeToggleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  themeToggleButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  rowAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  rowActionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
});
