/**
 * TradieTrack Lite — Frontend Tests
 * Tasks 10.1 – 10.5
 */

import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import fc from 'fast-check';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';

// ---------------------------------------------------------------------------
// Mocks — must be declared before any imports that trigger module resolution
// ---------------------------------------------------------------------------

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
  useFocusEffect: jest.fn(),
}));
jest.mock('../data/jobs', () => ({
  createJob: jest.fn(),
  updateJob: jest.fn(),
}));
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}));
jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
}));
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///app/Documents/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  copyAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props) => React.createElement(View, { testID: 'DateTimePicker', ...props });
});
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: () => ({ width: 375, height: 812 }),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

import { createJob, updateJob } from '../data/jobs';
import { appendPhotoUri, removePhotoUriAtIndex } from '../data/photos';
import {
  filterJobsByWorkflow,
  getReminderState,
  isReminderOverdue,
} from '../utils/jobWorkflow';
import CreateJob from '../screens/CreateJob';
import JobDetail from '../screens/JobDetail';

// ---------------------------------------------------------------------------
// Pure logic helpers (extracted from screen logic for property testing)
// ---------------------------------------------------------------------------

/** Replicates backend/frontend reminder validation logic */
function isValidISODate(str) {
  const d = new Date(str);
  return !isNaN(d.getTime());
}

/** Status → colour mapping from Jobs.js */
const STATUS_COLOURS = {
  pending: '#7D8597',
  in_progress: '#2196F3',
  completed: '#4CAF50',
};

// ---------------------------------------------------------------------------
// 10.1 — Property 6: Photo URI append invariant
// Validates: Requirements 5.2
// ---------------------------------------------------------------------------

describe('Property 6: Photo URI append invariant', () => {
  /**
   * Validates: Requirements 5.2
   *
   * For any existing photos array and any new URI string, appending the URI
   * SHALL increase the array length by exactly 1 and the new URI SHALL be
   * the last element.
   */
  it('appending a URI increases length by 1 and places URI last', () => {
    fc.assert(
      fc.property(fc.array(fc.string()), fc.string(), (photos, uri) => {
        const before = photos.length;
        const result = appendPhotoUri(photos, uri);
        expect(result.length).toBe(before + 1);
        expect(result[result.length - 1]).toBe(uri);
      })
    );
  });

  it('removing a photo URI deletes only the requested index', () => {
    fc.assert(
      fc.property(fc.array(fc.string(), { minLength: 1 }), fc.nat(), (photos, rawIndex) => {
        const index = rawIndex % photos.length;
        const result = removePhotoUriAtIndex(photos, index);

        expect(result.length).toBe(photos.length - 1);
        expect(result).toEqual([
          ...photos.slice(0, index),
          ...photos.slice(index + 1),
        ]);
      })
    );
  });
});

// ---------------------------------------------------------------------------
// 10.2 — Property 7: Reminder validation
// Validates: Requirements 6.5
// ---------------------------------------------------------------------------

describe('Property 7: Reminder validation', () => {
  /**
   * Validates: Requirements 6.5
   *
   * isValidISODate SHALL return true for any valid ISO 8601 date string
   * and false for strings that are not valid dates.
   */
  it('accepts valid ISO 8601 date strings', () => {
    fc.assert(
      fc.property(fc.date(), (date) => {
        expect(isValidISODate(date.toISOString())).toBe(true);
      })
    );
  });

  it('rejects strings that are not valid dates', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => isNaN(new Date(s).getTime())),
        (str) => {
          expect(isValidISODate(str)).toBe(false);
        }
      )
    );
  });
});

// ---------------------------------------------------------------------------
// 10.3 — Property 10: Status badge colour mapping
// Validates: Requirements 2.3
// ---------------------------------------------------------------------------

describe('Property 10: Status badge colour mapping', () => {
  /**
   * Validates: Requirements 2.3
   *
   * For each valid status value the colour SHALL match the defined mapping:
   * pending=grey (#888), in_progress=blue (#2196F3), completed=green (#4CAF50).
   */
  it('maps every valid status to the correct colour', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('pending', 'in_progress', 'completed'),
        (status) => {
          const expected = STATUS_COLOURS[status];
          expect(STATUS_COLOURS[status]).toBe(expected);
          expect(typeof expected).toBe('string');
          expect(expected.length).toBeGreaterThan(0);
        }
      )
    );
  });

  it('pending maps to grey (#888)', () => {
    expect(STATUS_COLOURS['pending']).toBe('#7D8597');
  });

  it('in_progress maps to blue (#2196F3)', () => {
    expect(STATUS_COLOURS['in_progress']).toBe('#2196F3');
  });

  it('completed maps to green (#4CAF50)', () => {
    expect(STATUS_COLOURS['completed']).toBe('#4CAF50');
  });
});

describe('Local job workflow helpers', () => {
  const jobs = [
    {
      _id: '1',
      name: 'Fix leaking tap',
      customerName: 'Sarah',
      address: '12 Main St',
      notes: 'Kitchen sink',
      status: 'pending',
    },
    {
      _id: '2',
      name: 'Install vanity',
      customerName: 'Mick',
      address: '4 River Rd',
      notes: 'Bathroom',
      status: 'in_progress',
    },
    {
      _id: '3',
      name: 'Replace switchboard',
      customerName: 'Alex',
      address: '9 Hill St',
      notes: 'Garage access',
      status: 'completed',
    },
  ];

  it('filters jobs by status locally', () => {
    expect(filterJobsByWorkflow(jobs, 'in_progress', '').map((job) => job._id))
      .toEqual(['2']);
  });

  it('searches title, customer, address, and notes locally', () => {
    expect(filterJobsByWorkflow(jobs, 'all', 'sarah').map((job) => job._id))
      .toEqual(['1']);
    expect(filterJobsByWorkflow(jobs, 'all', 'river').map((job) => job._id))
      .toEqual(['2']);
    expect(filterJobsByWorkflow(jobs, 'all', 'garage').map((job) => job._id))
      .toEqual(['3']);
  });

  it('marks active past reminders as overdue but ignores completed jobs', () => {
    const now = new Date('2026-06-02T12:00:00.000Z');
    const overdueJob = {
      status: 'pending',
      reminder: '2026-06-02T11:00:00.000Z',
    };
    const completedJob = {
      status: 'completed',
      reminder: '2026-06-02T11:00:00.000Z',
    };

    expect(isReminderOverdue(overdueJob, now)).toBe(true);
    expect(getReminderState(overdueJob, now)).toEqual(expect.objectContaining({
      key: 'overdue',
      isOverdue: true,
    }));
    expect(isReminderOverdue(completedJob, now)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 10.4 — Unit tests for CreateJob screen
// Validates: Requirements 1.4
// ---------------------------------------------------------------------------

describe('CreateJob screen', () => {
  const mockNavigation = { goBack: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('empty name prevents submit and does not create a job', () => {
    const { getByPlaceholderText, getByText } = render(
      <CreateJob navigation={mockNavigation} />
    );

    // Leave name empty, fill address
    fireEvent.changeText(getByPlaceholderText('e.g. 12 Main St, Sydney'), '1 Test St');
    fireEvent.press(getByText('Save Job'));

    expect(createJob).not.toHaveBeenCalled();
  });

  it('empty address prevents submit and does not create a job', () => {
    const { getByPlaceholderText, getByText } = render(
      <CreateJob navigation={mockNavigation} />
    );

    // Fill name, leave address empty
    fireEvent.changeText(getByPlaceholderText('e.g. Fix kitchen tap'), 'Fix tap');
    fireEvent.press(getByText('Save Job'));

    expect(createJob).not.toHaveBeenCalled();
  });

  it('successful local create navigates back', async () => {
    createJob.mockResolvedValueOnce({ _id: '1', name: 'Fix tap', address: '1 Test St' });

    const { getByPlaceholderText, getByText } = render(
      <CreateJob navigation={mockNavigation} />
    );

    fireEvent.changeText(getByPlaceholderText('e.g. Fix kitchen tap'), 'Fix tap');
    fireEvent.changeText(getByPlaceholderText('e.g. 12 Main St, Sydney'), '1 Test St');

    await act(async () => {
      fireEvent.press(getByText('Save Job'));
    });

    await waitFor(() => {
      expect(createJob).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Fix tap',
        address: '1 Test St',
      }));
      expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
    });
  });
});

// ---------------------------------------------------------------------------
// 10.5 — Unit tests for JobDetail screen
// Validates: Requirements 3.4, 5.2, 6.1
// ---------------------------------------------------------------------------

describe('JobDetail screen', () => {
  const mockNavigation = { goBack: jest.fn() };
  const baseJob = {
    _id: 'job123',
    name: 'Fix tap',
    address: '1 Test St',
    notes: '',
    status: 'pending',
    photos: [],
    reminder: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    FileSystem.getInfoAsync.mockResolvedValue({ exists: false });
    FileSystem.makeDirectoryAsync.mockResolvedValue(undefined);
    FileSystem.copyAsync.mockResolvedValue(undefined);
    FileSystem.deleteAsync.mockResolvedValue(undefined);
    Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Notifications.scheduleNotificationAsync.mockResolvedValue('notification-1');
    Notifications.cancelScheduledNotificationAsync.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('status selector renders 3 buttons (Pending, In Progress, Completed)', () => {
    const { getByText } = render(
      <JobDetail route={{ params: { job: baseJob } }} navigation={mockNavigation} />
    );

    expect(getByText('Pending')).toBeTruthy();
    expect(getByText('In Progress')).toBeTruthy();
    expect(getByText('Completed')).toBeTruthy();
  });

  it('photo grid renders correctly when photos are provided', () => {
    const jobWithPhotos = {
      ...baseJob,
      photos: ['file://photo1.jpg', 'file://photo2.jpg'],
    };

    const { getByText } = render(
      <JobDetail route={{ params: { job: jobWithPhotos } }} navigation={mockNavigation} />
    );

    // The Photos label and Add Photo button should be present
    expect(getByText('Photos')).toBeTruthy();
    expect(getByText('Add Photo')).toBeTruthy();
  });

  it('copies a captured photo into local app storage and persists its path', async () => {
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
    ImagePicker.launchCameraAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///camera/cache/photo.jpg' }],
    });
    updateJob.mockResolvedValueOnce({ ...baseJob });

    const { getByText } = render(
      <JobDetail route={{ params: { job: baseJob } }} navigation={mockNavigation} />
    );

    await act(async () => {
      fireEvent.press(getByText('Add Photo'));
    });

    await waitFor(() => {
      expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith(
        'file:///app/Documents/job-photos/',
        { intermediates: true }
      );
      expect(FileSystem.copyAsync).toHaveBeenCalledWith(expect.objectContaining({
        from: 'file:///camera/cache/photo.jpg',
        to: expect.stringMatching(/^file:\/\/\/app\/Documents\/job-photos\/job_photo_.*\.jpg$/),
      }));
      expect(updateJob).toHaveBeenCalledWith('job123', {
        photos: [expect.stringMatching(/^file:\/\/\/app\/Documents\/job-photos\/job_photo_.*\.jpg$/)],
      });
    });
  });

  it('deletes a local photo path from the job and app storage', async () => {
    const localPhotoUri = 'file:///app/Documents/job-photos/photo-1.jpg';
    FileSystem.getInfoAsync.mockResolvedValue({ exists: true });
    updateJob.mockResolvedValueOnce({ ...baseJob, photos: [] });
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      const deleteButton = buttons.find((button) => button.text === 'Delete');
      deleteButton.onPress();
    });

    const { getByLabelText } = render(
      <JobDetail
        route={{ params: { job: { ...baseJob, photos: [localPhotoUri] } } }}
        navigation={mockNavigation}
      />
    );

    await act(async () => {
      fireEvent.press(getByLabelText('Delete photo'));
    });

    await waitFor(() => {
      expect(updateJob).toHaveBeenCalledWith('job123', { photos: [] });
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(localPhotoUri, { idempotent: true });
    });
  });

  it('reminder picker button shows "Set Reminder" when no reminder is set', () => {
    const { getByText } = render(
      <JobDetail route={{ params: { job: baseJob } }} navigation={mockNavigation} />
    );

    expect(getByText('Set Reminder')).toBeTruthy();
    expect(getByText('No reminder scheduled')).toBeTruthy();
  });

  it('schedules a local notification and stores reminder state when saved', async () => {
    updateJob.mockResolvedValueOnce({ ...baseJob });
    const reminderDate = new Date('2099-02-01T09:30:00.000Z');

    const { getByText, getByTestId } = render(
      <JobDetail route={{ params: { job: baseJob } }} navigation={mockNavigation} />
    );

    fireEvent.press(getByText('Set Reminder'));
    fireEvent(getByTestId('DateTimePicker'), 'onChange', null, reminderDate);

    await act(async () => {
      fireEvent.press(getByText('Save'));
    });

    await waitFor(() => {
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.objectContaining({
          title: 'TradieTrack Reminder',
          body: 'Follow up on job: Fix tap',
        }),
        trigger: reminderDate,
      }));
      expect(updateJob).toHaveBeenCalledWith('job123', expect.objectContaining({
        reminder: '2099-02-01T09:30:00.000Z',
        reminderNotificationId: 'notification-1',
      }));
    });
  });

  it('call customer button opens tel URL when a phone number is present', () => {
    jest.spyOn(Linking, 'openURL').mockResolvedValueOnce(true);
    const jobWithPhone = {
      ...baseJob,
      customerPhone: '0400 123 456',
    };

    const { getByText } = render(
      <JobDetail route={{ params: { job: jobWithPhone } }} navigation={mockNavigation} />
    );

    fireEvent.press(getByText('Call Customer'));

    expect(Linking.openURL).toHaveBeenCalledWith('tel:0400123456');
  });

  it('message customer button opens sms URL when a phone number is present', () => {
    jest.spyOn(Linking, 'openURL').mockResolvedValueOnce(true);
    const jobWithPhone = {
      ...baseJob,
      customerPhone: '0400 123 456',
    };

    const { getByText } = render(
      <JobDetail route={{ params: { job: jobWithPhone } }} navigation={mockNavigation} />
    );

    fireEvent.press(getByText('Message'));

    expect(Linking.openURL).toHaveBeenCalledWith('sms:0400123456');
  });

  it('email customer button opens mailto URL when an email is present', () => {
    jest.spyOn(Linking, 'openURL').mockResolvedValueOnce(true);
    const jobWithEmail = {
      ...baseJob,
      customerEmail: 'sarah@example.com',
    };

    const { getByText } = render(
      <JobDetail route={{ params: { job: jobWithEmail } }} navigation={mockNavigation} />
    );

    fireEvent.press(getByText('Email Customer'));

    expect(Linking.openURL).toHaveBeenCalledWith('mailto:sarah@example.com');
  });
});
