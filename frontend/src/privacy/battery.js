// Battery optimisation helpers for Android local reminders.
//
// Android's Doze mode and aggressive battery optimisations can prevent
// scheduled notifications from firing on time. We expose a small helper
// that surfaces the system app settings screen so users can whitelist
// the app and turn off battery optimisation for TradieTrack Lite.
//
// We intentionally avoid pulling in a native module. Opening the
// system app settings screen is enough: from there, every Android
// skin (stock, Samsung, Xiaomi, Pixel) lets the user exclude the app
// from battery optimisations in two taps.

import { Linking, Platform } from 'react-native';

export function isAndroid() {
  return Platform.OS === 'android';
}

export async function openAppSettings() {
  if (Platform.OS !== 'android') return false;
  try {
    await Linking.openSettings();
    return true;
  } catch (e) {
    return false;
  }
}

export function getBatteryOptimisationMessage() {
  return {
    title: 'Keep reminders on time',
    body:
      'Android can delay notifications while the phone is in battery-saver or Doze mode. Open system settings and set TradieTrack Lite to "Unrestricted" so reminders for jobs always fire on time.',
    cta: 'Open Android settings',
  };
}
