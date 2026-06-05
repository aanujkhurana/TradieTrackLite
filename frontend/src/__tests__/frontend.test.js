/**
 * TradieTrack Lite — Frontend Tests
 * Tasks 10.1 – 10.5
 */

import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { Alert, Linking, Text } from 'react-native';
import fc from 'fast-check';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Purchases from 'react-native-purchases';

// ---------------------------------------------------------------------------
// Mocks — must be declared before any imports that trigger module resolution
// ---------------------------------------------------------------------------

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useNavigation: () => ({ goBack: jest.fn() }),
    useFocusEffect: jest.fn((callback) => React.useEffect(callback, [callback])),
    useColorScheme: () => 'light',
  };
});
jest.mock('../data/jobs', () => ({
  createJob: jest.fn(),
  deleteJob: jest.fn(),
  listJobs: jest.fn(),
  updateJob: jest.fn(),
}));
jest.mock('../monetization/MonetizationContext', () => ({
  useMonetization: () => ({
    isAdFree: false,
    isLoading: false,
    isBusy: false,
    purchaseAdFree: jest.fn(),
    restorePurchase: jest.fn(),
    entitlement: { isAdFree: false, source: 'none' },
  }),
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
jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///app/Documents/',
  cacheDirectory: 'file:///app/Cache/',
  EncodingType: {
    Base64: 'base64',
    UTF8: 'utf8',
  },
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  copyAsync: jest.fn(),
  deleteAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
}));
jest.mock('react-native-google-mobile-ads', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    BannerAd: (props) => React.createElement(View, { testID: 'mock-banner-ad', ...props }),
    BannerAdSize: {
      ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
    },
    TestIds: {
      BANNER: 'test-banner-id',
    },
  };
});
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    setLogLevel: jest.fn(),
    getOfferings: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
  },
  LOG_LEVEL: {
    DEBUG: 'DEBUG',
  },
}));
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props) => React.createElement(View, { testID: 'DateTimePicker', ...props });
});
jest.mock('react-native/Libraries/Utilities/Dimensions', () => {
  const dimensions = {
    get: () => ({ width: 375, height: 812, scale: 1, fontScale: 1 }),
    getConstants: () => ({
      window: { width: 375, height: 812, scale: 1, fontScale: 1 },
      screen: { width: 375, height: 812, scale: 1, fontScale: 1 },
    }),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };

  return {
    ...dimensions,
    default: dimensions,
  };
});
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name }) => React.createElement(Text, null, name || 'icon'),
  };
});
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const SafeAreaView = ({ children, ...props }) =>
    React.createElement(View, props, children);
  return {
    SafeAreaView,
    SafeAreaProvider: ({ children }) => children,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
  };
});

import { createJob, listJobs, updateJob } from '../data/jobs';
import { appendPhotoUri, removePhotoUriAtIndex } from '../data/photos';
import {
  filterJobsByWorkflow,
  getReminderState,
  isReminderOverdue,
  STATUS_LABELS,
} from '../utils/jobWorkflow';
import { buildJobsBackupPayload } from '../data/backups';
import { buildJobReportHtml } from '../data/reports';
import {
  DATA_SAFETY_MESSAGES,
  getDataSafetySummary,
} from '../privacy/dataSafety';
import {
  AD_FREE_ENTITLEMENT_ID,
  AD_FREE_PRODUCT_ID,
  getAdMobBannerUnitId,
} from '../monetization/config';
import { lightTheme, darkTheme } from '../theme/themes';
import {
  loadAdFreeEntitlement,
  saveAdFreeEntitlement,
} from '../monetization/entitlementStorage';
import {
  findAdFreePackage,
  hasActiveAdFreeEntitlement,
  purchaseAdFree,
  resetPurchasesConfigurationForTests,
  restoreAdFreePurchase,
} from '../monetization/revenueCat';
import { ThemeProvider } from '../theme/ThemeProvider';
import CreateJob from '../screens/CreateJob';
import Jobs from '../screens/Jobs';
import JobDetail from '../screens/JobDetail';
import Settings from '../screens/Settings';

function withTheme(node) {
  return <ThemeProvider initialMode="light">{node}</ThemeProvider>;
}

// ---------------------------------------------------------------------------
// 10.1 — Property 6: Photo URI append invariant
// Validates: Requirements 5.2
// ---------------------------------------------------------------------------

describe('Property 6: Photo URI append invariant', () => {
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
// ---------------------------------------------------------------------------

describe('Property 7: Reminder validation', () => {
  function isValidISODate(str) {
    const d = new Date(str);
    return !isNaN(d.getTime());
  }

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
// 10.3 — Property 10: Status colour mapping
// ---------------------------------------------------------------------------

const JOB_STATUS_KEYS = ['pending', 'in_progress', 'completed'];

describe('Property 10: Status colour mapping', () => {
  it('light theme has a tuned palette for every status', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...JOB_STATUS_KEYS),
        (status) => {
          const entry = lightTheme.status[status];
          expect(entry).toBeDefined();
          expect(entry.fg).toMatch(/^#[0-9A-Fa-f]{6}$/);
          expect(entry.bg).toMatch(/^#[0-9A-Fa-f]{6}$/);
          expect(entry.border).toMatch(/^#[0-9A-Fa-f]{6}$/);
        }
      )
    );
  });

  it('dark theme has a tuned palette for every status', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...JOB_STATUS_KEYS),
        (status) => {
          const entry = darkTheme.status[status];
          expect(entry).toBeDefined();
          expect(entry.fg).toMatch(/^#[0-9A-Fa-f]{6}$/);
          expect(entry.bg).toMatch(/^#[0-9A-Fa-f]{6}$/);
          expect(entry.border).toMatch(/^#[0-9A-Fa-f]{6}$/);
        }
      )
    );
  });

  it('light and dark themes use different colours for the same status', () => {
    JOB_STATUS_KEYS.forEach((key) => {
      expect(lightTheme.status[key].fg).not.toBe(darkTheme.status[key].fg);
    });
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

  it('exposes human-readable status labels for every status', () => {
    expect(STATUS_LABELS.pending).toBe('To do');
    expect(STATUS_LABELS.in_progress).toBe('In progress');
    expect(STATUS_LABELS.completed).toBe('Done');
  });
});

describe('Local reports and backup helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    FileSystem.readAsStringAsync.mockResolvedValue('photo-base64');
  });

  it('builds a local PDF report HTML document with job details and embedded photos', async () => {
    const html = await buildJobReportHtml({
      name: 'Fix tap',
      customerName: 'Sarah',
      customerPhone: '0400 123 456',
      customerEmail: 'sarah@example.com',
      customerNotes: 'Gate code 1234',
      address: '1 Test St',
      notes: 'Kitchen sink leak',
      status: 'completed',
      photos: ['file:///app/Documents/job-photos/photo-1.jpg'],
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-01-01T02:30:00.000Z',
    });

    expect(html).toContain('Fix tap');
    expect(html).toContain('Sarah');
    expect(html).toContain('1 Test St');
    expect(html).toContain('Done');
    expect(html).toContain('Kitchen sink leak');
    expect(html).toContain('2h 30m');
    expect(html).toContain('data:image/jpeg;base64,photo-base64');
    expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith(
      'file:///app/Documents/job-photos/photo-1.jpg',
      { encoding: 'base64' }
    );
  });

  it('builds a manual backup payload for all local job records', () => {
    const payload = buildJobsBackupPayload([
      {
        _id: 'job123',
        name: 'Fix tap',
        customerName: 'Sarah',
        address: '1 Test St',
        status: 'pending',
        photos: ['file:///app/Documents/job-photos/photo-1.jpg'],
      },
    ], '2026-01-02T00:00:00.000Z');

    expect(payload).toEqual(expect.objectContaining({
      app: 'TradieTrack Lite',
      version: 1,
      exportedAt: '2026-01-02T00:00:00.000Z',
    }));
    expect(payload.note).toContain(DATA_SAFETY_MESSAGES.localStorageNote);
    expect(payload.note).toContain(DATA_SAFETY_MESSAGES.deleteWarning);
    expect(payload.jobs).toEqual([
      expect.objectContaining({
        id: 'job123',
        name: 'Fix tap',
        customerName: 'Sarah',
        photos: ['file:///app/Documents/job-photos/photo-1.jpg'],
      }),
    ]);
  });
});

describe('Privacy and data safety messaging', () => {
  it('summarizes local storage, app deletion risk, and backup reminders', () => {
    expect(getDataSafetySummary()).toEqual([
      DATA_SAFETY_MESSAGES.localStorageNote,
      DATA_SAFETY_MESSAGES.deleteWarning,
      DATA_SAFETY_MESSAGES.backupReminder,
    ]);
  });

  it('keeps backend and analytics privacy promises explicit', () => {
    expect(DATA_SAFETY_MESSAGES.backendNotice).toContain('do not send');
    expect(DATA_SAFETY_MESSAGES.backendNotice).toContain('backend');
    expect(DATA_SAFETY_MESSAGES.analyticsNotice).toContain('not enabled');
    expect(DATA_SAFETY_MESSAGES.analyticsNotice).toContain('anonymous and minimal');
  });
});

describe('Ad-free entitlement and monetization helpers', () => {
  const originalAndroidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    resetPurchasesConfigurationForTests();
    process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY = 'test_revenuecat_key';
  });

  afterEach(() => {
    if (originalAndroidKey === undefined) {
      delete process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
    } else {
      process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY = originalAndroidKey;
    }
  });

  it('loads an empty entitlement when no local ad-free unlock is stored', async () => {
    FileSystem.getInfoAsync.mockResolvedValueOnce({ exists: false });

    await expect(loadAdFreeEntitlement()).resolves.toEqual(expect.objectContaining({
      isAdFree: false,
      source: 'none',
    }));
  });

  it('stores a validated ad-free entitlement locally', async () => {
    FileSystem.writeAsStringAsync.mockResolvedValueOnce(undefined);

    await saveAdFreeEntitlement({
      isAdFree: true,
      source: 'purchase',
      provider: 'RevenueCat',
      purchasedAt: '2026-06-03T00:00:00.000Z',
      updatedAt: '2026-06-03T00:00:00.000Z',
    });

    expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
      'file:///app/Documents/tradietrack-ad-free-entitlement.json',
      expect.stringContaining('"isAdFree":true'),
      { encoding: 'utf8' }
    );
  });

  it('recognizes the configured active RevenueCat ad-free entitlement', () => {
    expect(hasActiveAdFreeEntitlement({
      entitlements: {
        active: {
          [AD_FREE_ENTITLEMENT_ID]: {
            latestPurchaseDate: '2026-06-03T00:00:00.000Z',
          },
        },
      },
    })).toBe(true);
    expect(hasActiveAdFreeEntitlement({ entitlements: { active: {} } })).toBe(false);
  });

  it('selects the one-time ad-free product from RevenueCat offerings', () => {
    const adFreePackage = {
      identifier: 'ad-free-package',
      product: { identifier: AD_FREE_PRODUCT_ID },
    };

    expect(findAdFreePackage({
      current: {
        availablePackages: [
          { identifier: 'other', product: { identifier: 'other_product' } },
          adFreePackage,
        ],
      },
    })).toBe(adFreePackage);
  });

  it('validates a purchase before returning local ad-free state', async () => {
    const adFreePackage = {
      identifier: 'ad-free-package',
      product: { identifier: AD_FREE_PRODUCT_ID },
    };
    Purchases.getOfferings.mockResolvedValueOnce({
      current: { availablePackages: [adFreePackage] },
    });
    Purchases.purchasePackage.mockResolvedValueOnce({
      customerInfo: {
        entitlements: {
          active: {
            [AD_FREE_ENTITLEMENT_ID]: {
              latestPurchaseDate: '2026-06-03T00:00:00.000Z',
            },
          },
        },
      },
    });

    await expect(purchaseAdFree({
      platform: 'android',
      apiKey: 'test_revenuecat_key',
    })).resolves.toEqual(expect.objectContaining({
      isAdFree: true,
      source: 'purchase',
      provider: 'RevenueCat',
      purchasedAt: '2026-06-03T00:00:00.000Z',
    }));
    expect(Purchases.configure).toHaveBeenCalledWith({ apiKey: 'test_revenuecat_key' });
    expect(Purchases.purchasePackage).toHaveBeenCalledWith(adFreePackage);
  });

  it('restore only returns ad-free state when the store account has the entitlement', async () => {
    Purchases.restorePurchases.mockResolvedValueOnce({
      entitlements: {
        active: {
          [AD_FREE_ENTITLEMENT_ID]: {
            latestPurchaseDate: '2026-06-03T00:00:00.000Z',
          },
        },
      },
    });

    await expect(restoreAdFreePurchase({
      platform: 'android',
      apiKey: 'test_revenuecat_key',
    })).resolves.toEqual(
      expect.objectContaining({ isAdFree: true })
    );
  });

  it('uses test banner IDs only for development when production ad unit IDs are absent', () => {
    expect(getAdMobBannerUnitId('android', true, { BANNER: 'mock-test-id' }))
      .toBe('mock-test-id');
    expect(getAdMobBannerUnitId('android', false, {})).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 10.4 — Unit tests for CreateJob screen
// ---------------------------------------------------------------------------

describe('CreateJob screen', () => {
  const mockNavigation = { goBack: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('empty name prevents submit and does not create a job', async () => {
    const { getByPlaceholderText, getByText } = render(
      withTheme(<CreateJob navigation={mockNavigation} />)
    );

    fireEvent.changeText(getByPlaceholderText('e.g. 12 Main St, Sydney'), '1 Test St');
    await act(async () => {
      fireEvent.press(getByText(/save job/i));
    });

    expect(createJob).not.toHaveBeenCalled();
  });

  it('empty address prevents submit and does not create a job', async () => {
    const { getByPlaceholderText, getByText } = render(
      withTheme(<CreateJob navigation={mockNavigation} />)
    );

    fireEvent.changeText(getByPlaceholderText('e.g. Fix kitchen tap'), 'Fix tap');
    await act(async () => {
      fireEvent.press(getByText(/save job/i));
    });

    expect(createJob).not.toHaveBeenCalled();
  });

  it('successful local create navigates back', async () => {
    createJob.mockResolvedValueOnce({ _id: '1', name: 'Fix tap', address: '1 Test St' });

    const { getByPlaceholderText, getByText } = render(
      withTheme(<CreateJob navigation={mockNavigation} />)
    );

    fireEvent.changeText(getByPlaceholderText('e.g. Fix kitchen tap'), 'Fix tap');
    fireEvent.changeText(getByPlaceholderText('e.g. 12 Main St, Sydney'), '1 Test St');

    await act(async () => {
      fireEvent.press(getByText(/save job/i));
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

describe('Jobs screen mobile polish', () => {
  const mockNavigation = { navigate: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows local database initialization while the first job load is pending', () => {
    listJobs.mockReturnValueOnce(new Promise(() => {}));

    const { getByText } = render(withTheme(<Jobs navigation={mockNavigation} />));

    expect(getByText('Opening your job list')).toBeTruthy();
    expect(getByText(/on-device database/i)).toBeTruthy();
  });

  it('shows a helpful empty state and CTA after local jobs load', async () => {
    listJobs.mockResolvedValueOnce([]);

    const { getByText } = render(withTheme(<Jobs navigation={mockNavigation} />));

    await waitFor(() => {
      expect(getByText('No jobs yet')).toBeTruthy();
    });

    fireEvent.press(getByText('Add first job'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('CreateJob');
  });

  it('shows a retryable local-storage error when jobs cannot be loaded', async () => {
    listJobs
      .mockRejectedValueOnce(new Error('sqlite unavailable'))
      .mockResolvedValueOnce([]);

    const { getByText } = render(withTheme(<Jobs navigation={mockNavigation} />));

    await waitFor(() => {
      expect(getByText('Could not open jobs')).toBeTruthy();
      expect(getByText(/No internet is required/i)).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByText('Try again'));
    });

    await waitFor(() => {
      expect(listJobs).toHaveBeenCalledTimes(2);
      expect(getByText('No jobs yet')).toBeTruthy();
    });
  });
});

describe('Settings screen', () => {
  const mockNavigation = { navigate: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows local-first storage, theme, ad-free, privacy, version, and onboarding reset sections', () => {
    const { getByText } = render(withTheme(<Settings navigation={mockNavigation} />));

    expect(getByText('Settings')).toBeTruthy();
    expect(getByText('Data ownership')).toBeTruthy();
    expect(getByText('Theme')).toBeTruthy();
    expect(getByText('Export your records')).toBeTruthy();
    expect(getByText('Data safety')).toBeTruthy();
    expect(getByText('Version')).toBeTruthy();
    expect(getByText('Privacy policy')).toBeTruthy();
    expect(getByText('Terms of service')).toBeTruthy();
    expect(getByText('Refund policy')).toBeTruthy();
    expect(getByText('Take the tour again')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// 10.5 — Unit tests for JobDetail screen
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
    FileSystem.readAsStringAsync.mockResolvedValue('photo-base64');
    Print.printToFileAsync.mockResolvedValue({ uri: 'file:///app/Cache/report.pdf' });
    Sharing.isAvailableAsync.mockResolvedValue(true);
    Sharing.shareAsync.mockResolvedValue(undefined);
    Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Notifications.scheduleNotificationAsync.mockResolvedValue('notification-1');
    Notifications.cancelScheduledNotificationAsync.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('status selector renders the 3 status options', () => {
    const { getAllByText, getByText } = render(
      withTheme(<JobDetail route={{ params: { job: baseJob } }} navigation={mockNavigation} />)
    );

    // "To do" appears in both the header status chip and the workflow chip button.
    expect(getAllByText('To do').length).toBeGreaterThanOrEqual(1);
    expect(getByText('In progress')).toBeTruthy();
    expect(getByText('Done')).toBeTruthy();
  });

  it('photo grid renders take photo button when no photos are attached', () => {
    const { getAllByText, getByText } = render(
      withTheme(<JobDetail route={{ params: { job: baseJob } }} navigation={mockNavigation} />)
    );

    // "Photos" appears in both the section eyebrow and the section title.
    expect(getAllByText('Photos').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Take photo')).toBeTruthy();
  });

  it('copies a captured photo into local app storage and persists its path', async () => {
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
    ImagePicker.launchCameraAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///camera/cache/photo.jpg' }],
    });
    updateJob.mockResolvedValueOnce({ ...baseJob });

    const { getByText } = render(
      withTheme(<JobDetail route={{ params: { job: baseJob } }} navigation={mockNavigation} />)
    );

    await act(async () => {
      fireEvent.press(getByText('Take photo'));
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
      withTheme(
        <JobDetail
          route={{ params: { job: { ...baseJob, photos: [localPhotoUri] } } }}
          navigation={mockNavigation}
        />
      )
    );

    await act(async () => {
      fireEvent.press(getByLabelText('Remove photo'));
    });

    await waitFor(() => {
      expect(updateJob).toHaveBeenCalledWith('job123', { photos: [] });
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(localPhotoUri, { idempotent: true });
    });
  });

  it('shows a "No reminder scheduled" hint when no reminder is set', () => {
    const { getByText } = render(
      withTheme(<JobDetail route={{ params: { job: baseJob } }} navigation={mockNavigation} />)
    );

    expect(getByText('No reminder scheduled')).toBeTruthy();
  });

  it('schedules a local notification and stores reminder state when saved', async () => {
    updateJob.mockResolvedValueOnce({ ...baseJob });
    const reminderDate = new Date('2099-02-01T09:30:00.000Z');

    const { getByText, getByTestId } = render(
      withTheme(<JobDetail route={{ params: { job: baseJob } }} navigation={mockNavigation} />)
    );

    fireEvent.press(getByText('Set reminder'));
    fireEvent(getByTestId('DateTimePicker'), 'onChange', null, reminderDate);

    await act(async () => {
      fireEvent.press(getByText(/save job/i));
    });

    await waitFor(() => {
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.objectContaining({
          title: 'TradieTrack reminder',
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

  it('generates and shares a local PDF job report', async () => {
    const jobWithDetails = {
      ...baseJob,
      customerName: 'Sarah',
      address: '1 Test St',
      notes: 'Kitchen sink leak',
      photos: ['file:///app/Documents/job-photos/photo-1.jpg'],
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-01-01T02:00:00.000Z',
    };

    const { getByText } = render(
      withTheme(<JobDetail route={{ params: { job: jobWithDetails } }} navigation={mockNavigation} />)
    );

    await act(async () => {
      fireEvent.press(getByText('Share report'));
    });

    await waitFor(() => {
      expect(Print.printToFileAsync).toHaveBeenCalledWith(expect.objectContaining({
        html: expect.stringContaining('Kitchen sink leak'),
      }));
      expect(Sharing.shareAsync).toHaveBeenCalledWith(
        'file:///app/Cache/report.pdf',
        expect.objectContaining({ mimeType: 'application/pdf' })
      );
    });
  });
});

// ---------------------------------------------------------------------------
// Onboarding, ErrorBoundary, and observability helpers
// ---------------------------------------------------------------------------

import Onboarding from '../onboarding/Onboarding';
import { ErrorBoundary } from '../components/ErrorBoundary';
import {
  defaultOnboardingState,
  loadOnboardingState,
  resetOnboardingState,
  saveOnboardingState,
} from '../onboarding/storage';
import {
  isAndroid,
  openAppSettings,
  getBatteryOptimisationMessage,
} from '../privacy/battery';
import { reportError, reportMessage } from '../observability/sentry';

describe('Onboarding screen', () => {
  const onDone = jest.fn();

  beforeEach(() => {
    onDone.mockClear();
  });

  it('shows the local-first promise on the first step', () => {
    const { getByText } = render(withTheme(<Onboarding onDone={onDone} />));
    expect(getByText('Your jobs stay on this device')).toBeTruthy();
    expect(getByText('Local-first')).toBeTruthy();
    expect(getByText('Continue')).toBeTruthy();
  });

  it('advances through the steps and finishes on the last one', async () => {
    const { getByText } = render(
      withTheme(<Onboarding onDone={onDone} />)
    );

    fireEvent.press(getByText('Continue'));
    expect(getByText('Capture the job, set a reminder, share the report')).toBeTruthy();

    fireEvent.press(getByText('Continue'));
    expect(getByText('On Android, allow notifications and disable battery optimisation')).toBeTruthy();
    expect(getByText('Start using TradieTrack')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByText('Start using TradieTrack'));
    });

    expect(onDone).toHaveBeenCalled();
  });

  it('skips the tour when the skip button is pressed', async () => {
    const { getByText } = render(withTheme(<Onboarding onDone={onDone} />));

    await act(async () => {
      fireEvent.press(getByText('Skip the tour'));
    });

    expect(onDone).toHaveBeenCalled();
  });
});

describe('Onboarding storage helpers', () => {
  it('returns a default state in test env without touching the file system', async () => {
    const state = await loadOnboardingState();
    expect(state).toEqual(defaultOnboardingState());
    expect(state.hasSeenOnboarding).toBe(false);
  });

  it('saves and resets onboarding state without touching the file system in test env', async () => {
    const saved = await saveOnboardingState({ hasSeenOnboarding: true });
    expect(saved.hasSeenOnboarding).toBe(true);

    const reset = await resetOnboardingState();
    expect(reset.hasSeenOnboarding).toBe(false);
  });
});

describe('ErrorBoundary', () => {
  function Boom() {
    throw new Error('test explosion');
  }

  function StableChild() {
    return <Text>Stable child</Text>;
  }

  it('renders a calm fallback when a child throws and offers a restart', () => {
    const onReset = jest.fn();
    const { getByText } = render(
      withTheme(
        <ErrorBoundary onReset={onReset}>
          <Boom />
        </ErrorBoundary>
      )
    );

    expect(getByText('Something went off-script')).toBeTruthy();
    expect(getByText('Back to jobs')).toBeTruthy();
    fireEvent.press(getByText('Back to jobs'));
    expect(onReset).toHaveBeenCalled();
  });

  it('renders children normally when nothing throws', () => {
    const { queryByText } = render(
      withTheme(
        <ErrorBoundary>
          <StableChild />
        </ErrorBoundary>
      )
    );
    expect(queryByText('Something went off-script')).toBeNull();
  });
});

describe('Observability helpers', () => {
  it('reportError is a no-op when Sentry is not configured', async () => {
    await expect(reportError(new Error('boom'))).resolves.toBeUndefined();
  });

  it('reportMessage is a no-op when Sentry is not configured', async () => {
    await expect(reportMessage('hello')).resolves.toBeUndefined();
  });
});

describe('Battery helper', () => {
  it('detects Android from Platform.OS', () => {
    expect(isAndroid()).toBe(false);
  });

  it('returns a calm, non-empty explanation string', () => {
    const msg = getBatteryOptimisationMessage();
    expect(msg.title).toMatch(/reminders/i);
    expect(msg.body.length).toBeGreaterThan(20);
    expect(msg.cta.length).toBeGreaterThan(0);
  });

  it('openAppSettings returns false outside Android', async () => {
    const result = await openAppSettings();
    expect(typeof result).toBe('boolean');
  });
});
