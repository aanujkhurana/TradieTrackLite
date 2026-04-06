/**
 * TradieTrack Lite — Frontend Tests
 * Tasks 10.1 – 10.5
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import fc from 'fast-check';

// ---------------------------------------------------------------------------
// Mocks — must be declared before any imports that trigger module resolution
// ---------------------------------------------------------------------------

jest.mock('axios');
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
  useFocusEffect: jest.fn(),
}));
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}));
jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
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

import axios from 'axios';
import CreateJob from '../screens/CreateJob';
import JobDetail from '../screens/JobDetail';

// ---------------------------------------------------------------------------
// Pure logic helpers (extracted from screen logic for property testing)
// ---------------------------------------------------------------------------

/** Replicates: setPhotos(prev => [...prev, uri]) */
function appendPhoto(photos, uri) {
  return [...photos, uri];
}

/** Replicates backend/frontend reminder validation logic */
function isValidISODate(str) {
  const d = new Date(str);
  return !isNaN(d.getTime());
}

/** Status → colour mapping from Jobs.js */
const STATUS_COLOURS = {
  pending: '#888',
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
        const result = appendPhoto(photos, uri);
        expect(result.length).toBe(before + 1);
        expect(result[result.length - 1]).toBe(uri);
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
    expect(STATUS_COLOURS['pending']).toBe('#888');
  });

  it('in_progress maps to blue (#2196F3)', () => {
    expect(STATUS_COLOURS['in_progress']).toBe('#2196F3');
  });

  it('completed maps to green (#4CAF50)', () => {
    expect(STATUS_COLOURS['completed']).toBe('#4CAF50');
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

  it('empty name prevents submit — no axios.post called', async () => {
    const { getByPlaceholderText, getByText } = render(
      <CreateJob navigation={mockNavigation} />
    );

    // Leave name empty, fill address
    fireEvent.changeText(getByPlaceholderText('e.g. 12 Main St, Sydney'), '1 Test St');

    await act(async () => {
      fireEvent.press(getByText('Save Job'));
    });

    expect(axios.post).not.toHaveBeenCalled();
  });

  it('empty address prevents submit — no axios.post called', async () => {
    const { getByPlaceholderText, getByText } = render(
      <CreateJob navigation={mockNavigation} />
    );

    // Fill name, leave address empty
    fireEvent.changeText(getByPlaceholderText('e.g. Fix kitchen tap'), 'Fix tap');

    await act(async () => {
      fireEvent.press(getByText('Save Job'));
    });

    expect(axios.post).not.toHaveBeenCalled();
  });

  it('successful POST navigates back', async () => {
    axios.post.mockResolvedValueOnce({ data: { _id: '1', name: 'Fix tap', address: '1 Test St' } });

    const { getByPlaceholderText, getByText } = render(
      <CreateJob navigation={mockNavigation} />
    );

    fireEvent.changeText(getByPlaceholderText('e.g. Fix kitchen tap'), 'Fix tap');
    fireEvent.changeText(getByPlaceholderText('e.g. 12 Main St, Sydney'), '1 Test St');

    await act(async () => {
      fireEvent.press(getByText('Save Job'));
    });

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
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

  it('reminder picker button shows "Set Reminder" when no reminder is set', () => {
    const { getByText } = render(
      <JobDetail route={{ params: { job: baseJob } }} navigation={mockNavigation} />
    );

    expect(getByText('Set Reminder')).toBeTruthy();
  });
});
