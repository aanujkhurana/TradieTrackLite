import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  FlatList,
  ScrollView,
  Alert,
  Linking,
  StyleSheet,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { updateJob } from '../data/jobs';
import {
  appendPhotoUri,
  deleteStoredJobPhoto,
  removePhotoUriAtIndex,
  storeJobPhoto,
} from '../data/photos';
import { STATUS_OPTIONS, getReminderState } from '../utils/jobWorkflow';
import { shareJobReport } from '../data/reports';
import { formatLoggedDuration } from '../utils/time';
import {
  ChipButton,
  FormInput,
  InfoRow,
  LocalStorageNotice,
  PrimaryButton,
  ScreenHeader,
  SecondaryButton,
  SectionCard,
} from '../components/ui';
import { buttons, colors, radii, shadows, spacing, typography } from '../theme';
import { hasNativeModule, isExpoGo } from '../runtime';

const PHOTO_SIZE = Math.floor((Dimensions.get('window').width - 32 - 8) / 3);
const formatDateLabel = (value, fallback = 'Not set') => {
  if (!value) return fallback;
  return value.toLocaleString();
};

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

  const [name, setName] = useState(job.name || '');
  const [customerName, setCustomerName] = useState(job.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(job.customerPhone || '');
  const [customerEmail, setCustomerEmail] = useState(job.customerEmail || '');
  const [customerNotes, setCustomerNotes] = useState(job.customerNotes || '');
  const [address, setAddress] = useState(job.address || '');
  const [notes, setNotes] = useState(job.notes || '');
  const [status, setStatus] = useState(job.status || 'pending');
  const [photos, setPhotos] = useState(job.photos || []);
  const [startDate, setStartDate] = useState(
    job.startDate ? new Date(job.startDate) : job.createdAt ? new Date(job.createdAt) : new Date()
  );
  const [endDate, setEndDate] = useState(job.endDate ? new Date(job.endDate) : null);

  const [reminder, setReminder] = useState(
    job.reminder ? new Date(job.reminder) : null
  );
  const [reminderNotificationId, setReminderNotificationId] = useState(
    job.reminderNotificationId || null
  );
  const [activePicker, setActivePicker] = useState(null); // startDate | endDate | reminder
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [saving, setSaving] = useState(false);
  const totalLoggedTime = useMemo(
    () => formatLoggedDuration(startDate, endDate),
    [startDate, endDate]
  );
  const reminderState = useMemo(
    () => getReminderState({ status, reminder }),
    [reminder, status]
  );
  const statusMeta = STATUS_OPTIONS.find((opt) => opt.key === status) || STATUS_OPTIONS[0];


  const handleStorageError = (err) => {
    if (err.code === 'NOT_FOUND') {
      Alert.alert('Not Found', 'Job not found', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else if (err.code === 'VALIDATION_ERROR') {
      Alert.alert('Validation Error', err.message);
    } else {
      Alert.alert(
        'Local Storage Error',
        'Job changes could not be saved on this device. No internet is required, so try again from this local job screen.'
      );
    }
  };
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
      Alert.alert('No Phone Number', 'Add a customer phone number before calling.');
      return;
    }

    await openCustomerLink(
      `tel:${dialablePhone}`,
      'Call Unavailable',
      'This device could not start a phone call. The job details are still saved locally.'
    );
  };
  const messageCustomer = async () => {
    const dialablePhone = customerPhone.replace(/[^\d+]/g, '');
    if (!dialablePhone) {
      Alert.alert('No Phone Number', 'Add a customer phone number before messaging.');
      return;
    }

    await openCustomerLink(
      `sms:${dialablePhone}`,
      'Message Unavailable',
      'This device could not start a text message. The job details are still saved locally.'
    );
  };
  const emailCustomer = async () => {
    const email = customerEmail.trim();
    if (!email) {
      Alert.alert('No Email Address', 'Add a customer email address before emailing.');
      return;
    }

    await openCustomerLink(
      `mailto:${email}`,
      'Email Unavailable',
      'This device could not start an email. The job details are still saved locally.'
    );
  };
  const save = async () => {
    if (saving) return;

    if (!name.trim() || !address.trim()) {
      Alert.alert('Validation Error', 'Job name and address are required.');
      return;
    }

    let resolvedEndDate = endDate;
    if (status === 'completed' && !resolvedEndDate) {
      resolvedEndDate = new Date();
    }

    if (startDate && resolvedEndDate && resolvedEndDate.getTime() < startDate.getTime()) {
      Alert.alert('Invalid Time Range', 'Job end date must be after the start date.');
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
        customerNotes,
        address: address.trim(),
        notes,
        status,
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
  // ── Photo capture (9.3) ───────────────────────────────────────────────────

  const addPhoto = async () => {
    try {
      const { status: permStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (permStatus !== 'granted') {
        Alert.alert(
          'Camera Access Needed',
          'Job photos stay on this device. Enable camera access in Settings to add photos while on site.',
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Open Settings', onPress: openDeviceSettings },
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
          const nextPhotos = appendPhotoUri(photos, localUri);
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
        'Photo Storage Error',
        'Photo could not be saved in app storage on this device. Try again after checking local storage space and camera access.'
      );
    }
  };

  const deletePhoto = (uri, index) => {
    Alert.alert(
      'Delete Photo',
      'Remove this photo from the job?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const nextPhotos = removePhotoUriAtIndex(photos, index);
              await updateJob(job._id, { photos: nextPhotos });
              await deleteStoredJobPhoto(uri);
              setPhotos(nextPhotos);
            } catch (err) {
              Alert.alert(
                'Photo Storage Error',
                'Photo file could not be removed from local app storage on this device.'
              );
            }
          },
        },
      ]
    );
  };

  // ── Reminder / notifications (9.4) ───────────────────────────────────────

  const cancelReminderNotification = async (notificationId) => {
    if (!notificationId) return;

    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch {
      // A missing or already-fired notification should not block saving the job.
    }
  };

  const scheduleReminder = async (date) => {
    if (!date || date.getTime() <= Date.now()) {
      return null;
    }

    const { status: permStatus } = await Notifications.requestPermissionsAsync();
    if (permStatus !== 'granted') {
      Alert.alert(
        'Notifications Disabled',
        'Reminder saved locally, but notifications are disabled. Enable them in Settings to receive alerts.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Open Settings', onPress: openDeviceSettings },
        ]
      );
      return null;
    }

    try {
      return await Notifications.scheduleNotificationAsync({
        content: {
          title: 'TradieTrack Reminder',
          body: `Follow up on job: ${name.trim() || 'Untitled job'}`,
        },
        trigger: date,
      });
    } catch {
      Alert.alert(
        'Reminder Saved',
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

  const getReportJob = () => ({
    ...job,
    name: name.trim() || 'Untitled job',
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    customerEmail: customerEmail.trim(),
    customerNotes,
    address: address.trim(),
    notes,
    status,
    photos,
    startDate: startDate ? startDate.toISOString() : null,
    endDate: endDate ? endDate.toISOString() : null,
  });

  const shareCurrentJobReport = async () => {
    setReportLoading(true);
    setReportError('');
    try {
      await shareJobReport(getReportJob());
    } catch (err) {
      const message = 'Job report could not be generated or shared on this device.';
      setReportError(message);
      Alert.alert('Report Error', message);
    } finally {
      setReportLoading(false);
    }
  };


  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader
        eyebrow="Job record"
        title={name || 'Untitled job'}
        subtitle={address || 'No address recorded'}
        right={<View style={[styles.headerStatusMark, { backgroundColor: statusMeta.color }]} />}
      />

      <LocalStorageNotice>
        Photos, reminders, notes, and reports for this job stay on this device unless you share or export them.
      </LocalStorageNotice>

      <SectionCard
        eyebrow="Snapshot"
        title="At a glance"
        subtitle="The essentials before you edit the full record."
      >
        <View style={styles.snapshotGrid}>
          <View style={styles.snapshotTile}>
            <Text style={styles.snapshotLabel}>Workflow</Text>
            <Text style={styles.snapshotValue}>Current: {statusMeta.label}</Text>
          </View>
          <View style={styles.snapshotTile}>
            <Text style={styles.snapshotLabel}>Photo count</Text>
            <Text style={styles.snapshotValue}>
              {photos.length === 1 ? '1 saved' : `${photos.length} saved`}
            </Text>
          </View>
          <View style={[
            styles.snapshotTile,
            reminderState.key === 'overdue' && styles.snapshotTileWarning,
          ]}>
            <Text style={[
              styles.snapshotLabel,
              reminderState.key === 'overdue' && styles.snapshotLabelWarning,
            ]}>
              Reminder
            </Text>
            <Text style={[
              styles.snapshotValue,
              reminderState.key === 'overdue' && styles.snapshotValueWarning,
            ]}>
              {reminderState.key === 'overdue'
                ? 'Needs follow-up'
                : reminderState.key === 'scheduled'
                  ? 'Local alert set'
                  : 'No local alert'}
            </Text>
          </View>
          <View style={styles.snapshotTile}>
            <Text style={styles.snapshotLabel}>Logged</Text>
            <Text style={styles.snapshotValue}>{totalLoggedTime}</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard
        eyebrow="Summary"
        title="Job Details"
        subtitle="A clear work record for the customer, location, notes, and follow-up actions."
      >
        <FormInput
          label="Job Name"
          value={name}
          onChangeText={setName}
          placeholder="Job name"
        />

        <FormInput
          label="Customer Name"
          value={customerName}
          onChangeText={setCustomerName}
          placeholder="Customer name"
        />

        <FormInput
          label="Customer Phone"
          value={customerPhone}
          onChangeText={setCustomerPhone}
          placeholder="Customer phone"
          keyboardType="phone-pad"
        />

        {customerPhone.trim() ? (
          <View style={styles.inlineActions}>
            <SecondaryButton title="Call Customer" onPress={callCustomer} style={styles.inlineActionBtn} />
            <SecondaryButton title="Message" onPress={messageCustomer} style={styles.inlineActionBtn} />
          </View>
        ) : null}

        <FormInput
          label="Customer Email"
          value={customerEmail}
          onChangeText={setCustomerEmail}
          placeholder="Customer email"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {customerEmail.trim() ? (
          <SecondaryButton title="Email Customer" onPress={emailCustomer} style={styles.actionBtn} />
        ) : null}

        <FormInput
          label="Customer Notes"
          value={customerNotes}
          onChangeText={setCustomerNotes}
          placeholder="Customer notes..."
          multiline
          numberOfLines={3}
        />

        <FormInput
          label="Address"
          value={address}
          onChangeText={setAddress}
          placeholder="Job address"
        />

        <FormInput
          label="Job Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Notes..."
          multiline
          numberOfLines={4}
        />
      </SectionCard>

      <SectionCard
        eyebrow="Workflow"
        title="Status"
        subtitle="Keep the job state obvious at a glance."
      >
        <View style={styles.statusRow}>
          {STATUS_OPTIONS.map((opt) => {
            const active = status === opt.key;
            return (
              <ChipButton
                key={opt.key}
                title={opt.label}
                active={active}
                onPress={() => setStatus(opt.key)}
                style={styles.statusBtn}
              />
            );
          })}
        </View>
      </SectionCard>

      <SectionCard
        eyebrow="Time"
        title="Time Logged"
        subtitle="Completed jobs keep their end time so reports can show the total."
      >

        <InfoRow
          label="Job Start"
          value={formatDateLabel(startDate)}
          action="Edit"
          onPress={() => openDatePicker('startDate')}
        />

        <InfoRow
          label="Job End"
          value={formatDateLabel(endDate)}
          action="Edit"
          onPress={() => openDatePicker('endDate')}
        />

        {endDate && (
          <SecondaryButton
            title="Clear End Time"
            onPress={() => setEndDate(null)}
            style={styles.compactBtn}
          />
        )}

        <View style={styles.totalTimeBox}>
          <Text style={styles.totalTimeLabel}>Total Logged</Text>
          <Text style={styles.totalTimeValue}>{totalLoggedTime}</Text>
        </View>
      </SectionCard>

      {activePicker && DateTimePicker && (
        <DateTimePicker
          value={pickerValue}
          mode="datetime"
          display="default"
          onChange={onPickerChange}
          minimumDate={pickerMinimumDate}
        />
      )}

      <SectionCard
        eyebrow="Camera"
        title="Photos"
        subtitle={photos.length ? `${photos.length} saved in app storage.` : 'Camera-first attachments, stored locally.'}
      >
        <SecondaryButton title="Add Photo" onPress={addPhoto} style={styles.actionBtn} />

        {photos.length > 0 ? (
          <FlatList
            data={photos}
            keyExtractor={(item, index) => `${item}-${index}`}
            numColumns={3}
            scrollEnabled={false}
            style={styles.photoGrid}
            renderItem={({ item, index }) => (
              <View style={styles.photoTile}>
                <Image source={{ uri: item }} style={styles.photo} />
                <Pressable
                  style={styles.photoDeleteBtn}
                  onPress={() => deletePhoto(item, index)}
                  accessibilityLabel="Delete photo"
                >
                  <Text style={styles.photoDeleteText}>x</Text>
                </Pressable>
              </View>
            )}
          />
        ) : (
          <View style={styles.photoEmptyPanel}>
            <View style={styles.photoEmptyIcon}>
              <Text style={styles.photoEmptyIconText}>+</Text>
            </View>
            <Text style={styles.photoEmptyTitle}>No photos attached</Text>
            <Text style={styles.photoEmptyText}>
              Capture job progress, parts, damage, or completed work. Photos are copied into local app storage.
            </Text>
          </View>
        )}
      </SectionCard>

      <SectionCard
        eyebrow="Follow-up"
        title="Reminder"
        subtitle="Local notifications help you keep moving without any cloud account."
      >
        <View style={[
          styles.reminderStateBox,
          reminderState.key === 'overdue' && styles.reminderStateBoxOverdue,
          reminderState.key === 'scheduled' && styles.reminderStateBoxScheduled,
        ]}>
          <Text style={[
            styles.reminderStateTitle,
            reminderState.key === 'overdue' && styles.reminderStateTitleOverdue,
          ]}>
            {reminderState.detail}
          </Text>
          <Text style={styles.reminderStateText}>{reminderState.label}</Text>
        </View>
        <SecondaryButton
          title={reminder ? 'Change Reminder' : 'Set Reminder'}
          onPress={() => openDatePicker('reminder')}
          style={styles.actionBtn}
        />

        {reminder && (
          <SecondaryButton
            title="Clear Reminder"
            onPress={() => setReminder(null)}
            style={styles.compactBtn}
          />
        )}
      </SectionCard>

      <SectionCard
        eyebrow="Report"
        title="Share a job report"
        subtitle="Build a local PDF summary with customer details, notes, time, and photos."
      >
        <View style={styles.reportPreview}>
          <View style={styles.reportPreviewHeader}>
            <Text style={styles.reportPreviewTitle}>Report includes</Text>
            <Text style={styles.reportPreviewBadge}>PDF</Text>
          </View>
          <View style={styles.reportPreviewGrid}>
            <Text style={styles.reportPreviewItem}>Job details</Text>
            <Text style={styles.reportPreviewItem}>Customer info</Text>
            <Text style={styles.reportPreviewItem}>Time logged</Text>
            <Text style={styles.reportPreviewItem}>
              {photos.length === 1 ? '1 photo' : `${photos.length} photos`}
            </Text>
          </View>
        </View>
        <SecondaryButton
          title={reportLoading ? 'Building Report...' : 'Share Job Report'}
          onPress={shareCurrentJobReport}
          disabled={reportLoading || saving}
          style={styles.actionBtn}
        />
      </SectionCard>
      {reportError ? <Text style={styles.reportError}>{reportError}</Text> : null}

      <PrimaryButton
        title={saving ? 'Saving...' : 'Save'}
        onPress={save}
        disabled={saving}
        style={styles.saveBtn}
      />
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
    paddingBottom: 44,
  },
  headerStatusMark: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  snapshotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  snapshotTile: {
    flexGrow: 1,
    flexBasis: 132,
    minHeight: 74,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.borderSoft,
    borderRadius: radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  snapshotTileWarning: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  snapshotLabel: {
    ...typography.label,
    color: colors.subtle,
    marginBottom: spacing.xs,
  },
  snapshotLabelWarning: {
    color: colors.danger,
  },
  snapshotValue: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
  snapshotValueWarning: {
    color: colors.danger,
  },
  pageHeader: {
    paddingBottom: spacing.xl,
  },
  pageEyebrow: {
    ...typography.eyebrow,
    color: colors.subtle,
    marginBottom: spacing.sm,
  },
  pageTitle: {
    ...typography.screenTitle,
    color: colors.ink,
  },
  pageSubtitle: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  sectionCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.muted,
    marginTop: spacing.md,
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
  notesInput: {
    minHeight: 112,
    textAlignVertical: 'top',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statusBtn: {
    flexGrow: 1,
    flexBasis: 120,
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  statusBtnActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  statusBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.muted,
    textAlign: 'center',
  },
  statusBtnTextActive: {
    color: colors.white,
  },
  infoRowBtn: {
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
  infoRowText: {
    flex: 1,
  },
  infoRowLabel: {
    ...typography.label,
    color: colors.subtle,
    marginBottom: spacing.xs,
  },
  infoRowValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '700',
    flexShrink: 1,
  },
  infoRowAction: {
    color: colors.accentInk,
    fontWeight: '900',
    fontSize: 13,
    flexShrink: 0,
  },
  clearBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  clearBtnText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  compactBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingVertical: spacing.sm,
  },
  totalTimeBox: {
    marginTop: spacing.md,
    backgroundColor: colors.ink,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  totalTimeLabel: {
    ...typography.label,
    color: colors.subtle,
  },
  totalTimeValue: {
    fontSize: 18,
    lineHeight: 24,
    color: colors.white,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  reminderStateBox: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  reminderStateBoxScheduled: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentBorder,
  },
  reminderStateBoxOverdue: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  reminderStateTitle: {
    color: colors.subtle,
    ...typography.label,
    marginBottom: 3,
  },
  reminderStateTitleOverdue: {
    color: colors.danger,
  },
  reminderStateText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  photoGrid: {
    marginTop: spacing.md,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: radii.sm,
  },
  photoTile: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    margin: 2,
  },
  photoEmptyPanel: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: spacing.md,
    minHeight: 168,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  photoEmptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentBorder,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 48,
  },
  photoEmptyIconText: {
    color: colors.accentInk,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
  },
  photoEmptyTitle: {
    ...typography.sectionTitle,
    color: colors.ink,
    textAlign: 'center',
  },
  photoEmptyText: {
    ...typography.small,
    color: colors.muted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  photoDeleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoDeleteText: {
    color: colors.white,
    fontSize: 17,
    lineHeight: 18,
    fontWeight: '900',
  },
  actionBtn: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    paddingVertical: 13,
    paddingHorizontal: spacing.lg,
    minHeight: buttons.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  actionBtnText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  inlineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  inlineActionBtn: {
    flexGrow: 1,
    flexBasis: 140,
    minHeight: buttons.minHeight,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfBtn: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: buttons.radius,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    minHeight: buttons.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  pdfBtnText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  disabledBtn: {
    opacity: 0.65,
  },
  reportError: {
    color: colors.danger,
    fontSize: 13,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  reportPreview: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.lg,
  },
  reportPreviewHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  reportPreviewTitle: {
    ...typography.sectionTitle,
    color: colors.ink,
  },
  reportPreviewBadge: {
    backgroundColor: colors.ink,
    borderRadius: radii.sm,
    color: colors.white,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  reportPreviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  reportPreviewItem: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.text,
    flexGrow: 1,
    flexBasis: 130,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: buttons.radius,
    borderWidth: 1,
    borderColor: colors.accentInk,
    paddingVertical: 15,
    paddingHorizontal: spacing.lg,
    minHeight: buttons.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    ...shadows.lift,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
});
