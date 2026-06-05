// First-run onboarding state.
//
// Stored on the device using expo-file-system so it survives a relaunch
// and a kill. Skipped in tests so the test renderer is deterministic.

import * as FileSystem from 'expo-file-system';

const FILE_URI = `${FileSystem.documentDirectory || ''}tradietrack-onboarding.json`;

const DEFAULT_STATE = {
  hasSeenOnboarding: false,
  hasSeenBatteryGuidance: false,
};

function emptyState() {
  return { ...DEFAULT_STATE };
}

export async function loadOnboardingState() {
  if (process.env.NODE_ENV === 'test') {
    return emptyState();
  }
  try {
    const info = await FileSystem.getInfoAsync(FILE_URI);
    if (!info.exists) return emptyState();
    const raw = await FileSystem.readAsStringAsync(FILE_URI);
    const parsed = JSON.parse(raw);
    return { ...emptyState(), ...parsed };
  } catch (e) {
    return emptyState();
  }
}

export async function saveOnboardingState(patch) {
  if (process.env.NODE_ENV === 'test') {
    return { ...emptyState(), ...patch };
  }
  const current = await loadOnboardingState();
  const next = { ...current, ...patch };
  try {
    await FileSystem.writeAsStringAsync(FILE_URI, JSON.stringify(next));
  } catch (e) {
    // ignore; the worst case is the onboarding reappears next launch
  }
  return next;
}

export async function resetOnboardingState() {
  return saveOnboardingState({
    hasSeenOnboarding: false,
    hasSeenBatteryGuidance: false,
  });
}

export function defaultOnboardingState() {
  return emptyState();
}

export const ONBOARDING_FILE_URI = FILE_URI;
