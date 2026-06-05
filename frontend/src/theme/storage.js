import * as FileSystem from 'expo-file-system';
import { hasNativeModule, isExpoGo } from '../runtime';

const PREFERENCE_FILE = `${FileSystem.documentDirectory || ''}tradietrack-theme.json`;
const VALID_MODES = new Set(['system', 'light', 'dark']);

export const THEME_MODES = ['system', 'light', 'dark'];

export function normalizeThemeMode(value) {
  return VALID_MODES.has(value) ? value : 'system';
}

export async function loadStoredThemeMode() {
  if (!canUseFileStorage()) {
    return 'system';
  }
  try {
    const info = await FileSystem.getInfoAsync(PREFERENCE_FILE);
    if (!info.exists) {
      return 'system';
    }
    const contents = await FileSystem.readAsStringAsync(PREFERENCE_FILE);
    const parsed = JSON.parse(contents);
    return normalizeThemeMode(parsed?.mode);
  } catch {
    return 'system';
  }
}

export async function saveStoredThemeMode(mode) {
  if (!canUseFileStorage()) {
    return;
  }
  const safeMode = normalizeThemeMode(mode);
  try {
    await FileSystem.writeAsStringAsync(
      PREFERENCE_FILE,
      JSON.stringify({ mode: safeMode, savedAt: new Date().toISOString() })
    );
  } catch {
    // Persistence is best-effort. Falling back to system default is acceptable.
  }
}

function canUseFileStorage() {
  if (process.env.NODE_ENV === 'test') return false;
  if (isExpoGo() && !hasNativeModule(['ExpoFileSystem', 'FileSystem'])) {
    return false;
  }
  return Boolean(FileSystem.documentDirectory);
}
