import React, { useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { updateJob } from '../data/jobs';
import {
  deleteStoredJobPhoto,
  storeJobPhoto,
} from '../data/photos';
import { getReminderState, STATUS_LABELS, JOB_STATUS_KEYS } from '../utils/jobWorkflow';
import { shareJobReport } from '../data/reports';
import { formatLoggedDuration } from '../utils/time';
import {
  AppShell,
  ChipButton,
  DateTimePickerRow,
  FormInput,
  IconButton,
  LocalStorageNotice,
  PhotoGrid,
  PrimaryButton,
  ReportActionCard,
  ScreenHeader,
  SecondaryButton,
  Section,
  StatusChip,
  StatTile,
} from '../components/ui';
import { Icon } from '../components/Icon';
import { useTheme } from '../theme';
import { hasNativeModule, isExpoGo } from '../runtime';

const PHOTO_COLUMNS = 3;
const SCREEN_PADDING = 20;
const PHOTO_GAP = 8;
const PHOTO_SIZE = Math.floor(
  (Dimensions.get('window').width - SCREEN_PADDING * 2 - PHOTO_GAP * (PHOTO_COLUMNS - 1)) /
    PHOTO_COLUMNS
);

const STATUS_ORDER = [
  { key: 'pending', label: STATUS_LABELS.pending },
  { key: 'in_progress', label: STATUS_LABELS.in_progress },
  { key: 'completed', label: STATUS_LABELS.completed },
];

function getDateTimePicker() {
  if (isExpoGo() || !hasNativeModule(['RNDateTimePicker'])) {
    return null;
  }
  try {
    const dateTimePickerModule = require('@react-native-community/datetimepicker');
    return dateTimePickerModule.default || dateTimePickerModule;
  } catch {
    return null;
  }
}

export default function JobDetail({ route, navigation }) {
  const { job } = route.params;
  const { colors, status } = useTheme();

  const [name, setName] = useState(job.name || '');
  const [customerName, setCustomerName] = useState(job.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(job.customerPhone || '');
  const [customerEmail, setCustomerEmail] = useState(job.customerEmail || '');
  const [address, setAddress] = useState(job.address || '');
  const [notes, setNotes] = useState(job.notes || '');
  const [statusValue, setStatusValue] = useState(job.status || 'pending');
  const [photos, setPhotos] = useState(job.photos || []);
  const [startDate, setStartDate] = useState(
    job.startDate ? new Date(job.startDate) : job.createdAt ? new Date(job.createdAt) : new Date()
  );
  const [endDate, setEndDate] = useState(job.endDate ? new Date(job.endDate) : null);
  const [reminder, setReminder] = useState(job.reminder ? new Date(job.reminder) : null);
  const [reminderNotificationId, setReminderNotificationId] = useState(
    job.reminderNotificationId || null
  );
  const [activePicker, setActivePicker] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [saving, setSaving] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const totalLoggedTime = useMemo(
    () => formatLoggedDuration(startDate, endDate),
    [startDate, endDate]
  );
  const reminderState = useMemo(
    () => getReminderState({ status: statusValue, reminder }),
    [reminder, statusValue]
  );
  const statusTone = status[statusValue] || status.pending;
  const isCompleted = statusValue === 'completed';

  const openDeviceSettings = () => {
    if (Linking.openSettings) {
      Linking.openSettings();
    }
  };

  const openCustomerLink = async (url, fallbackTitle, fallbackMessage) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(fallbackTitle, fallbackMessage);
    }
  };

  const callCustomer = async () => {
    const dialablePhone = customerPhone.replace(/[^\d+]/g, '');
    if (!dialablePhone) {
      Alert.alert('No phone number', 'Add a customer phone number before calling.');
      return;
    }
    await openCustomerLink(
      `tel:${dialablePhone}`,
      'Call unavailable',
      'This device could not start a phone call. The job details are still saved locally.'
    );
  };

  const messageCustomer = async () => {
    const dialablePhone = customerPhone.replace(/[^\d+]/g, '');
    if (!dialablePhone) {
      Alert.alert('No phone number', 'Add a customer phone number before messaging.');
      return;
    }
    await openCustomerLink(
      `sms:${dialablePhone}`,
      'Message unavailable',
      'This device could not start a text message. The job details are still saved locally.'
    );
  };

  const emailCustomer = async () => {
    const email = customerEmail.trim();
    if (!email) {
      Alert.alert('No email address', 'Add a customer email address before emailing.');
      return;
    }
    await openCustomerLink(
      `mailto:${email}`,
      'Email unavailable',
      'This device could not start an email. The job details are still saved locally.'
    );
  };

  const handleStorageError = (err) => {
    if (err.code === 'NOT_FOUND') {
      Alert.alert('Not found', 'This job is no longer on this device.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else if (err.code === 'VALIDATION_ERROR') {
      Alert.alert('Validation error', err.message);
    } else {
      Alert.alert(
        'Local storage error',
        'Job changes could not be saved on this device. No internet is required, so try again from this local job screen.'
      );
    }
  };

  const save = async () => {
    if (saving) return;
    if (!name.trim() || !address.trim()) {
      Alert.alert('Validation error', 'Job name and address are required.');
      return;
    }
    let resolvedEndDate = endDate;
    if (statusValue === 'completed' && !resolvedEndDate) {
      resolvedEndDate = new Date();
    }
    if (
      startDate &&
      resolvedEndDate &&
      resolvedEndDate.getTime() < startDate.getTime()
    ) {
      Alert.alert('Invalid time range', 'Job end date must be after the start date.');
      return;
    }
    try {
      setSaving(true);
      const nextReminderIso = reminder ? reminder.toISOString() : null;
      const nextReminderNotificationId = await prepareReminderNotification(nextReminderIso);
      await updateJob(job._id, {
        name: name.trim(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        address: address.trim(),
        notes,
        status: statusValue,
        photos,
        startDate: startDate ? startDate.toISOString() : null,
        endDate: resolvedEndDate ? resolvedEndDate.toISOString() : null,
        reminder: nextReminderIso,
        reminderNotificationId: nextReminderNotificationId,
      });
      if (resolvedEndDate && !endDate) {
        setEndDate(resolvedEndDate);
      }
      setReminderNotificationId(nextReminderNotificationId);
      navigation.goBack();
    } catch (err) {
      handleStorageError(err);
    } finally {
      setSaving(false);
    }
  };

  const addPhoto = async () => {
    try {
      const { status: permStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (permStatus !== 'granted') {
        Alert.alert(
          'Camera access needed',
          'Job photos stay on this device. Enable camera access in Settings to add photos while on site.',
          [
            { text: 'Not now', style: 'cancel' },
            { text: 'Open settings', onPress: openDeviceSettings },
          ]
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled) {
        const uri = result.assets?.[0]?.uri ?? result.uri;
        if (uri) {
          const localUri = await storeJobPhoto(uri);
          const nextPhotos = [...photos, localUri];
          try {
            await updateJob(job._id, { photos: nextPhotos });
            setPhotos(nextPhotos);
          } catch (err) {
            await deleteStoredJobPhoto(localUri);
            throw err;
          }
        }
      }
    } catch (err) {
      Alert.alert(
        'Photo storage error',
        'Photo could not be saved in app storage on this device. Try again after checking local storage space and camera access.'
      );
    }
  };

  const deletePhoto = (uri, index) => {
    Alert.alert(
      'Delete photo',
      'Remove this photo from the job?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const nextPhotos = photos.filter((_, i) => i !== index);
              await updateJob(job._id, { photos: nextPhotos });
              await deleteStoredJobPhoto(uri);
              setPhotos(nextPhotos);
            } catch (err) {
              Alert.alert(
                'Photo storage error',
                'Photo file could not be removed from local app storage on this device.'
              );
            }
          },
        },
      ]
    );
  };

  const cancelReminderNotification = async (notificationId) => {
    if (!notificationId) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch {
      // ignore
    }
  };

  const scheduleReminder = async (date) => {
    if (!date || date.getTime() <= Date.now()) return null;
    const { status: permStatus } = await Notifications.requestPermissionsAsync();
    if (permStatus !== 'granted') {
      Alert.alert(
        'Notifications disabled',
        'Reminder saved locally, but notifications are disabled. Enable them in Settings to receive alerts.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open settings', onPress: openDeviceSettings },
        ]
      );
      return null;
    }
    try {
      return await Notifications.scheduleNotificationAsync({
        content: {
          title: 'TradieTrack reminder',
          body: `Follow up on job: ${name.trim() || 'Untitled job'}`,
        },
        trigger: date,
      });
    } catch {
      Alert.alert(
        'Reminder saved',
        'Reminder saved locally, but the notification could not be scheduled on this device.'
      );
      return null;
    }
  };

  const prepareReminderNotification = async (nextReminderIso) => {
    const previousReminderIso = job.reminder || null;
    const previousNotificationId = job.reminderNotificationId || reminderNotificationId;
    const reminderChanged = previousReminderIso !== nextReminderIso;
    if (!nextReminderIso) {
      await cancelReminderNotification(previousNotificationId);
      return null;
    }
    if (!reminderChanged && previousNotificationId) {
      return previousNotificationId;
    }
    await cancelReminderNotification(previousNotificationId);
    return scheduleReminder(new Date(nextReminderIso));
  };

  const applyPickedDate = (field, pickedDate) => {
    if (!pickedDate) return;
    if (field === 'startDate') {
      setStartDate(pickedDate);
      if (endDate && pickedDate.getTime() > endDate.getTime()) {
        setEndDate(pickedDate);
      }
      return;
    }
    if (field === 'endDate') {
      setEndDate(pickedDate);
      return;
    }
    if (field === 'reminder') {
      setReminder(pickedDate);
    }
  };

  const onPickerChange = (_event, selectedDate) => {
    const field = activePicker;
    setActivePicker(null);
    if (selectedDate && field) {
      applyPickedDate(field, selectedDate);
    }
  };

  const pickerValue =
    activePicker === 'startDate'
      ? startDate || new Date()
      : activePicker === 'endDate'
        ? endDate || startDate || new Date()
        : reminder || new Date();
  const pickerMinimumDate =
    activePicker === 'endDate'
      ? startDate || undefined
      : activePicker === 'reminder'
        ? new Date()
        : undefined;
  const DateTimePicker = activePicker ? getDateTimePicker() : null;

  const openDatePicker = (field) => {
    if (!getDateTimePicker()) {
      Alert.alert(
        'Date picker unavailable',
        'Date and reminder editing needs a development or release build on this simulator.'
      );
      return;
    }
    setActivePicker(field);
  };

  const shareCurrentJobReport = async () => {
    setReportLoading(true);
    setReportError('');
    try {
      await shareJobReport({
        ...job,
        name: name.trim() || 'Untitled job',
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        address: address.trim(),
        notes,
        status: statusValue,
        photos,
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
      });
    } catch (err) {
      const message = 'Job report could not be generated or shared on this device.';
      setReportError(message);
      Alert.alert('Report error', message);
    } finally {
      setReportLoading(false);
    }
  };

  const reminderTone =
    reminderState.key === 'overdue'
      ? 'warning'
      : reminderState.key === 'scheduled'
        ? 'success'
        : 'default';

  return (
    <AppShell scroll testID="job-detail-screen">
      <ScreenHeader
        eyebrow="Job record"
        title={name || 'Untitled job'}
        subtitle={address || 'No address recorded'}
        right={<StatusChip status={statusValue} size="sm" />}
      />

      <View style={styles.statRow}>
        <StatTile
          label="Photos"
          value={String(photos.length)}
          icon="image"
          style={styles.statTile}
        />
        <StatTile
          label="Reminder"
          value={reminderState.key === 'overdue' ? 'Overdue' : reminderState.key === 'scheduled' ? 'On' : 'Off'}
          icon={reminderState.key === 'overdue' ? 'bell' : 'bellOff'}
          tone={reminderTone}
          style={styles.statTile}
        />
        <StatTile
          label="Logged"
          value={isCompleted ? totalLoggedTime : '—'}
          icon="clock"
          tone={isCompleted ? 'ink' : 'default'}
          style={styles.statTile}
        />
      </View>

      <LocalStorageNotice
        title="On this device"
        body="Photos, reminders, notes, and reports for this job stay on this device unless you share or export them."
      />

      <Section
        eyebrow="Status"
        title="Workflow"
        subtitle="Keep the job state obvious at a glance."
      >
        <View style={styles.statusRow}>
          {STATUS_ORDER.map((opt) => (
            <ChipButton
              key={opt.key}
              title={opt.label}
              active={statusValue === opt.key}
              onPress={() => setStatusValue(opt.key)}
              icon={
                opt.key === 'pending'
                  ? 'list'
                  : opt.key === 'in_progress'
                    ? 'play'
                    : 'check'
              }
            />
          ))}
        </View>
      </Section>

      <Section
        eyebrow="Work"
        title="Job details"
        subtitle="Edit anything. Changes save with the button at the bottom."
      >
        <FormInput
          label="Job name"
          value={name}
          onChangeText={setName}
          placeholder="Job name"
        />
        <FormInput
          label="Address"
          value={address}
          onChangeText={setAddress}
          placeholder="Job address"
          leftIcon="location"
        />
        <FormInput
          label="Job notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Notes..."
          multiline
        />
      </Section>

      <Section
        eyebrow="Customer"
        title="Contact"
        subtitle="Tap a phone or email to call, message, or email."
      >
        <FormInput
          label="Customer name"
          value={customerName}
          onChangeText={setCustomerName}
          placeholder="Customer name"
          leftIcon="info"
        />
        <FormInput
          label="Phone"
          value={customerPhone}
          onChangeText={setCustomerPhone}
          placeholder="Customer phone"
          keyboardType="phone-pad"
          leftIcon="phone"
          rightAdornment={
            customerPhone.trim() ? (
              <View style={styles.adornmentRow}>
                <IconButton name="call" onPress={callCustomer} tone="accent" size={36} />
                <IconButton name="message" onPress={messageCustomer} tone="accent" size={36} />
              </View>
            ) : null
          }
        />
        <FormInput
          label="Email"
          value={customerEmail}
          onChangeText={setCustomerEmail}
          placeholder="Customer email"
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon="email"
          rightAdornment={
            customerEmail.trim() ? (
              <IconButton name="mail" onPress={emailCustomer} tone="accent" size={36} />
            ) : null
          }
        />
      </Section>

      <Section
        eyebrow="Time"
        title="Time logged"
        subtitle="Mark a start and end so reports can show total time on the job."
      >
        <DateTimePickerRow
          label="Job start"
          value={startDate ? startDate.toLocaleString() : null}
          onPress={() => openDatePicker('startDate')}
        />
        <DateTimePickerRow
          label="Job end"
          value={endDate ? endDate.toLocaleString() : null}
          onPress={() => openDatePicker('endDate')}
        />
        {endDate ? (
          <SecondaryButton
            title="Clear end time"
            onPress={() => setEndDate(null)}
            icon="close"
            size="sm"
            style={styles.smallBtn}
          />
        ) : null}
        <View style={[styles.totalTimeBox, { backgroundColor: colors.ink, borderColor: colors.ink }]}>
          <Text style={[styles.totalTimeLabel, { color: colors.subtle }]}>Total logged</Text>
          <Text style={[styles.totalTimeValue, { color: colors.onInk }]}>{totalLoggedTime}</Text>
        </View>
      </Section>

      {activePicker && DateTimePicker ? (
        <DateTimePicker
          value={pickerValue}
          mode="datetime"
          display="default"
          onChange={onPickerChange}
          minimumDate={pickerMinimumDate}
        />
      ) : null}

      <Section
        eyebrow="Camera"
        title="Photos"
        subtitle={
          photos.length
            ? `${photos.length} saved in local app storage.`
            : 'Camera-first attachments, stored locally on this device.'
        }
      >
        <SecondaryButton
          title="Take photo"
          icon="camera"
          onPress={addPhoto}
          fullWidth
        />
        {photos.length > 0 ? (
          <PhotoGrid
            photos={photos}
            size={PHOTO_SIZE}
            onAdd={addPhoto}
            onDelete={deletePhoto}
            onPreview={(uri) => setPreviewPhoto(uri)}
          />
        ) : (
          <View
            style={[
              styles.photoEmpty,
              { backgroundColor: colors.surfaceInset, borderColor: colors.borderSoft },
            ]}
          >
            <View
              style={[
                styles.photoEmptyIcon,
                { backgroundColor: colors.accentSoft, borderColor: colors.accentBorder },
              ]}
            >
              <Icon name="camera" size={22} color={colors.accentInk} />
            </View>
            <Text style={[styles.photoEmptyTitle, { color: colors.ink }]}>
              No photos attached
            </Text>
            <Text style={[styles.photoEmptyBody, { color: colors.muted }]}>
              Capture job progress, parts, damage, or completed work. Photos are copied into local app storage on this device.
            </Text>
          </View>
        )}
      </Section>

      <Section
        eyebrow="Follow-up"
        title="Reminder"
        subtitle="Local notifications help you keep moving without any cloud account."
      >
        <View
          style={[
            styles.reminderState,
            {
              backgroundColor:
                reminderState.key === 'overdue'
                  ? colors.dangerSoft
                  : reminderState.key === 'scheduled'
                    ? colors.accentSoft
                    : colors.surfaceInset,
              borderColor:
                reminderState.key === 'overdue'
                  ? colors.dangerBorder
                  : reminderState.key === 'scheduled'
                    ? colors.accentBorder
                    : colors.borderSoft,
            },
          ]}
        >
          <Icon
            name={reminderState.key === 'overdue' ? 'warning' : 'bell'}
            size={18}
            color={
              reminderState.key === 'overdue'
                ? colors.danger
                : reminderState.key === 'scheduled'
                  ? colors.accentInk
                  : colors.muted
            }
          />
          <View style={styles.reminderStateCopy}>
            <Text
              style={[
                styles.reminderStateTitle,
                {
                  color:
                    reminderState.key === 'overdue'
                      ? colors.danger
                      : reminderState.key === 'scheduled'
                        ? colors.accentInk
                        : colors.ink,
                },
              ]}
            >
              {reminderState.detail}
            </Text>
            <Text style={[styles.reminderStateBody, { color: colors.muted }]}>
              {reminderState.label}
            </Text>
          </View>
        </View>
        <DateTimePickerRow
          label={reminder ? 'Change reminder' : 'Set reminder'}
          value={reminder ? reminder.toLocaleString() : null}
          onPress={() => openDatePicker('reminder')}
        />
        {reminder ? (
          <SecondaryButton
            title="Clear reminder"
            icon="close"
            onPress={() => setReminder(null)}
            size="sm"
            style={styles.smallBtn}
          />
        ) : null}
      </Section>

      <Section
        eyebrow="Report"
        title="Share a job report"
        subtitle="Build a local PDF summary with customer details, notes, time, and photos."
      >
        <ReportActionCard
          onShare={shareCurrentJobReport}
          loading={reportLoading}
        />
        {reportError ? (
          <Text style={[styles.reportError, { color: colors.danger }]}>{reportError}</Text>
        ) : null}
      </Section>

      <View style={styles.actionBar}>
        <PrimaryButton
          title={saving ? 'Saving…' : 'Save job'}
          icon="check"
          onPress={save}
          loading={saving}
          disabled={saving}
          fullWidth
        />
        <SecondaryButton title="Cancel" onPress={() => navigation.goBack()} fullWidth />
      </View>

      <Modal
        visible={Boolean(previewPhoto)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewPhoto(null)}
      >
        <Pressable
          style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}
          onPress={() => setPreviewPhoto(null)}
        >
          <View style={styles.modalImageWrap}>
            {previewPhoto ? (
              <Image source={{ uri: previewPhoto }} style={styles.modalImage} resizeMode="contain" />
            ) : null}
            <Pressable
              onPress={() => setPreviewPhoto(null)}
              style={[styles.modalClose, { backgroundColor: colors.surface, borderColor: colors.border }]}
              accessibilityLabel="Close photo"
            >
              <Icon name="close" size={18} color={colors.ink} />
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statTile: {
    flexGrow: 1,
    flexBasis: 0,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  smallBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  totalTimeBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginTop: 12,
  },
  totalTimeLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  totalTimeValue: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 4,
  },
  photoEmpty: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 12,
  },
  photoEmptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  photoEmptyTitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  photoEmptyBody: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  reminderState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  reminderStateCopy: {
    flex: 1,
  },
  reminderStateTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  reminderStateBody: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  reportError: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  actionBar: {
    marginTop: 8,
    marginBottom: 20,
    gap: 10,
  },
  adornmentRow: {
    flexDirection: 'row',
    gap: 6,
  },
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImageWrap: {
    width: '92%',
    height: '78%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalClose: {
    position: 'absolute',
    top: -42,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
