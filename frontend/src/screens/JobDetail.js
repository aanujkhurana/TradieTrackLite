import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
  Alert,
  Linking,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Constants from 'expo-constants';
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
import { buttons, colors, radii, shadows, spacing, typography } from '../theme';

const PHOTO_SIZE = Math.floor((Dimensions.get('window').width - 32 - 8) / 3);
const formatDateLabel = (value, fallback = 'Not set') => {
  if (!value) return fallback;
  return value.toLocaleString();
};

function getDateTimePicker() {
  if (Constants.appOwnership === 'expo') {
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
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Job Details</Text>
        <Text style={styles.label}>Job Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Job name"
        />

        <Text style={styles.label}>Customer Name</Text>
        <TextInput
          style={styles.input}
          value={customerName}
          onChangeText={setCustomerName}
          placeholder="Customer name"
        />

        <Text style={styles.label}>Customer Phone</Text>
        <TextInput
          style={styles.input}
          value={customerPhone}
          onChangeText={setCustomerPhone}
          placeholder="Customer phone"
          keyboardType="phone-pad"
        />

        {customerPhone.trim() ? (
          <View style={styles.inlineActions}>
            <TouchableOpacity style={styles.inlineActionBtn} onPress={callCustomer} activeOpacity={0.8}>
              <Text style={styles.actionBtnText}>Call Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.inlineActionBtn} onPress={messageCustomer} activeOpacity={0.8}>
              <Text style={styles.actionBtnText}>Message</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Text style={styles.label}>Customer Email</Text>
        <TextInput
          style={styles.input}
          value={customerEmail}
          onChangeText={setCustomerEmail}
          placeholder="Customer email"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {customerEmail.trim() ? (
          <TouchableOpacity style={styles.actionBtn} onPress={emailCustomer} activeOpacity={0.8}>
            <Text style={styles.actionBtnText}>Email Customer</Text>
          </TouchableOpacity>
        ) : null}

        <Text style={styles.label}>Customer Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={customerNotes}
          onChangeText={setCustomerNotes}
          placeholder="Customer notes..."
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Address</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Job address"
        />

        <Text style={styles.label}>Job Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Notes..."
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.statusRow}>
          {STATUS_OPTIONS.map((opt) => {
            const active = status === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.statusBtn,
                  active && styles.statusBtnActive,
                ]}
                onPress={() => setStatus(opt.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.statusBtnText, active && styles.statusBtnTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Time Logged</Text>

        <TouchableOpacity
          style={styles.infoRowBtn}
          onPress={() => openDatePicker('startDate')}
          activeOpacity={0.8}
        >
          <View style={styles.infoRowText}>
            <Text style={styles.infoRowLabel}>Job Start</Text>
            <Text style={styles.infoRowValue}>{formatDateLabel(startDate)}</Text>
          </View>
          <Text style={styles.infoRowAction}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.infoRowBtn}
          onPress={() => openDatePicker('endDate')}
          activeOpacity={0.8}
        >
          <View style={styles.infoRowText}>
            <Text style={styles.infoRowLabel}>Job End</Text>
            <Text style={styles.infoRowValue}>{formatDateLabel(endDate)}</Text>
          </View>
          <Text style={styles.infoRowAction}>Edit</Text>
        </TouchableOpacity>

        {endDate && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => setEndDate(null)}
            activeOpacity={0.8}
          >
            <Text style={styles.clearBtnText}>Clear End Time</Text>
          </TouchableOpacity>
        )}

        <View style={styles.totalTimeBox}>
          <Text style={styles.totalTimeLabel}>Total Logged</Text>
          <Text style={styles.totalTimeValue}>{totalLoggedTime}</Text>
        </View>
      </View>

      {activePicker && DateTimePicker && (
        <DateTimePicker
          value={pickerValue}
          mode="datetime"
          display="default"
          onChange={onPickerChange}
          minimumDate={pickerMinimumDate}
        />
      )}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Photos</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={addPhoto} activeOpacity={0.8}>
          <Text style={styles.actionBtnText}>Add Photo</Text>
        </TouchableOpacity>

        {photos.length > 0 && (
          <FlatList
            data={photos}
            keyExtractor={(item, index) => `${item}-${index}`}
            numColumns={3}
            scrollEnabled={false}
            style={styles.photoGrid}
            renderItem={({ item, index }) => (
              <View style={styles.photoTile}>
                <Image source={{ uri: item }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.photoDeleteBtn}
                  onPress={() => deletePhoto(item, index)}
                  activeOpacity={0.8}
                  accessibilityLabel="Delete photo"
                >
                  <Text style={styles.photoDeleteText}>x</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Reminder</Text>
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
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => openDatePicker('reminder')}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnText}>
            {reminder ? 'Change Reminder' : 'Set Reminder'}
          </Text>
        </TouchableOpacity>

        {reminder && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => setReminder(null)}
            activeOpacity={0.8}
          >
            <Text style={styles.clearBtnText}>Clear Reminder</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.pdfBtn, (reportLoading || saving) && styles.disabledBtn]}
        onPress={shareCurrentJobReport}
        activeOpacity={0.8}
        disabled={reportLoading || saving}
      >
        <Text style={styles.pdfBtnText}>
          {reportLoading ? 'Building Report...' : 'Share Job Report'}
        </Text>
      </TouchableOpacity>
      {reportError ? <Text style={styles.reportError}>{reportError}</Text> : null}

      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.disabledBtn]}
        onPress={save}
        activeOpacity={0.8}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
      </TouchableOpacity>
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
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.card,
    marginBottom: spacing.gap,
    ...shadows.card,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.ink,
    marginBottom: 8,
  },
  label: {
    ...typography.label,
    color: colors.text,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surfaceInset,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 50,
    color: colors.text,
  },
  notesInput: {
    minHeight: 104,
    textAlignVertical: 'top',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.gap,
    marginTop: 4,
  },
  statusBtn: {
    flexGrow: 1,
    flexBasis: 120,
    minHeight: buttons.minHeight,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  statusBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  statusBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  statusBtnTextActive: {
    color: colors.white,
  },
  infoRowBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 10,
  },
  infoRowText: {
    flex: 1,
  },
  infoRowLabel: {
    ...typography.label,
    color: colors.subtle,
    marginBottom: 3,
  },
  infoRowValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    flexShrink: 1,
  },
  infoRowAction: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 13,
    flexShrink: 0,
  },
  clearBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  clearBtnText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  totalTimeBox: {
    marginTop: 12,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  totalTimeLabel: {
    ...typography.label,
    color: colors.subtle,
  },
  totalTimeValue: {
    fontSize: 17,
    color: colors.ink,
    fontWeight: '800',
    marginTop: 2,
  },
  reminderStateBox: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  reminderStateBoxScheduled: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  reminderStateBoxOverdue: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  reminderStateTitle: {
    color: colors.subtle,
    ...typography.label,
    marginBottom: 3,
  },
  reminderStateTitleOverdue: {
    color: colors.accent,
  },
  reminderStateText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  photoGrid: {
    marginTop: 8,
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
    fontWeight: '700',
  },
  actionBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 14,
    minHeight: buttons.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  actionBtnText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  inlineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.gap,
    marginTop: 8,
  },
  inlineActionBtn: {
    flexGrow: 1,
    flexBasis: 140,
    minHeight: buttons.minHeight,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: buttons.radius,
    paddingVertical: 14,
    paddingHorizontal: 14,
    minHeight: buttons.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  pdfBtnText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  disabledBtn: {
    opacity: 0.65,
  },
  reportError: {
    color: colors.ink,
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: buttons.radius,
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: buttons.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    ...shadows.card,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
});
