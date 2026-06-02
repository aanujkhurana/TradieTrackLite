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
  Share,
  Linking,
  StyleSheet,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import { updateJob } from '../data/jobs';
import { formatLoggedDuration } from '../utils/time';

const STATUS_OPTIONS = [
  { key: 'pending', label: 'Pending', color: '#888' },
  { key: 'in_progress', label: 'In Progress', color: '#2196F3' },
  { key: 'completed', label: 'Completed', color: '#4CAF50' },
];

const PHOTO_SIZE = Math.floor((Dimensions.get('window').width - 32 - 8) / 3);
const formatDateLabel = (value, fallback = 'Not set') => {
  if (!value) return fallback;
  return value.toLocaleString();
};

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
  const [activePicker, setActivePicker] = useState(null); // startDate | endDate | reminder
  const totalLoggedTime = useMemo(
    () => formatLoggedDuration(startDate, endDate),
    [startDate, endDate]
  );


  const handleStorageError = (err) => {
    if (err.code === 'NOT_FOUND') {
      Alert.alert('Not Found', 'Job not found', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else if (err.code === 'VALIDATION_ERROR') {
      Alert.alert('Validation Error', err.message);
    } else {
      Alert.alert('Local Storage Error', 'Job changes could not be saved on this device.');
    }
  };
  const callCustomer = async () => {
    const dialablePhone = customerPhone.replace(/[^\d+]/g, '');
    if (!dialablePhone) {
      Alert.alert('No Phone Number', 'Add a customer phone number before calling.');
      return;
    }

    await Linking.openURL(`tel:${dialablePhone}`);
  };
  const messageCustomer = async () => {
    const dialablePhone = customerPhone.replace(/[^\d+]/g, '');
    if (!dialablePhone) {
      Alert.alert('No Phone Number', 'Add a customer phone number before messaging.');
      return;
    }

    await Linking.openURL(`sms:${dialablePhone}`);
  };
  const emailCustomer = async () => {
    const email = customerEmail.trim();
    if (!email) {
      Alert.alert('No Email Address', 'Add a customer email address before emailing.');
      return;
    }

    await Linking.openURL(`mailto:${email}`);
  };
  const save = async () => {
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
        reminder: reminder ? reminder.toISOString() : null,
      });

      if (resolvedEndDate && !endDate) {
        setEndDate(resolvedEndDate);
      }

      if (reminder) {
        await scheduleReminder(reminder);
      }

      navigation.goBack();
    } catch (err) {
      handleStorageError(err);
    }
  };
  // ── Photo capture (9.3) ───────────────────────────────────────────────────

  const addPhoto = async () => {
    const { status: permStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (permStatus !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera access in your device Settings to add photos.',
        [{ text: 'OK' }]
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
        setPhotos((prev) => [...prev, uri]);
      }
    }
  };

  // ── Reminder / notifications (9.4) ───────────────────────────────────────

  const scheduleReminder = async (date) => {
    const { status: permStatus } = await Notifications.requestPermissionsAsync();
    if (permStatus !== 'granted') {
      Alert.alert(
        'Notifications Disabled',
        'Reminder saved, but notifications are disabled. Enable them in Settings to receive alerts.',
        [{ text: 'OK' }]
      );
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'TradieTrack Reminder',
        body: `Follow up on job: ${name}`,
      },
      trigger: date,
    });
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

  const shareJobSummary = async () => {
    const summary = [
      name.trim(),
      customerName.trim() ? `Customer: ${customerName.trim()}` : null,
      customerPhone.trim() ? `Phone: ${customerPhone.trim()}` : null,
      customerEmail.trim() ? `Email: ${customerEmail.trim()}` : null,
      address.trim() ? `Address: ${address.trim()}` : null,
      `Status: ${status}`,
      startDate ? `Started: ${startDate.toLocaleString()}` : null,
      endDate ? `Ended: ${endDate.toLocaleString()}` : null,
      `Logged: ${totalLoggedTime}`,
      reminder ? `Reminder: ${reminder.toLocaleString()}` : null,
      notes ? `Notes: ${notes}` : null,
    ].filter(Boolean).join('\n');

    try {
      await Share.share({ message: summary });
    } catch (err) {
      Alert.alert('Share Error', 'Job summary could not be shared.');
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
                  { borderColor: opt.color },
                  active && { backgroundColor: opt.color },
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
          onPress={() => setActivePicker('startDate')}
          activeOpacity={0.8}
        >
          <View>
            <Text style={styles.infoRowLabel}>Job Start</Text>
            <Text style={styles.infoRowValue}>{formatDateLabel(startDate)}</Text>
          </View>
          <Text style={styles.infoRowAction}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.infoRowBtn}
          onPress={() => setActivePicker('endDate')}
          activeOpacity={0.8}
        >
          <View>
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

      {activePicker && (
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
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.photo} />
            )}
          />
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Reminder</Text>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setActivePicker('reminder')}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnText}>
            {reminder ? reminder.toLocaleString() : 'Set Reminder'}
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

      <TouchableOpacity style={styles.pdfBtn} onPress={shareJobSummary} activeOpacity={0.8}>
        <Text style={styles.pdfBtnText}>Share Job Summary</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveBtn} onPress={save} activeOpacity={0.8}>
        <Text style={styles.saveBtnText}>Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2f6',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e9f0',
    padding: 14,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fbfcff',
    borderWidth: 1,
    borderColor: '#d9e0e8',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  statusBtn: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statusBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  statusBtnTextActive: {
    color: '#fff',
  },
  infoRowBtn: {
    borderWidth: 1,
    borderColor: '#d6dde7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  infoRowLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 3,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  infoRowValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  infoRowAction: {
    color: '#1565C0',
    fontWeight: '700',
    fontSize: 13,
  },
  clearBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#fff3f2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearBtnText: {
    color: '#c62828',
    fontSize: 12,
    fontWeight: '700',
  },
  totalTimeBox: {
    marginTop: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  totalTimeLabel: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '600',
  },
  totalTimeValue: {
    fontSize: 17,
    color: '#1b5e20',
    fontWeight: '700',
    marginTop: 2,
  },
  photoGrid: {
    marginTop: 8,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    margin: 2,
    borderRadius: 4,
  },
  actionBtn: {
    backgroundColor: '#f3f8ff',
    borderWidth: 1,
    borderColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  actionBtnText: {
    color: '#1565C0',
    fontSize: 15,
    fontWeight: '600',
  },
  inlineActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  inlineActionBtn: {
    flex: 1,
    backgroundColor: '#f3f8ff',
    borderWidth: 1,
    borderColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pdfBtn: {
    backgroundColor: '#f7f0fb',
    borderWidth: 1,
    borderColor: '#9C27B0',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  pdfBtnText: {
    color: '#6a1b9a',
    fontSize: 16,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#1565C0',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
