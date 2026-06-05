import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from './themes';
import {
  loadStoredThemeMode,
  normalizeThemeMode,
  saveStoredThemeMode,
} from './storage';
import { layout, motion, radii, spacing, typography } from './tokens';

const ThemeContext = createContext(null);

function resolveMode(preference, systemScheme) {
  if (preference === 'light' || preference === 'dark') return preference;
  return systemScheme === 'dark' ? 'dark' : 'light';
}

function pickTheme(mode) {
  return mode === 'dark' ? darkTheme : lightTheme;
}

export function ThemeProvider({ children, initialMode = 'system' }) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState(() => normalizeThemeMode(initialMode));
  const [hydrated, setHydrated] = useState(false);
  const hasHydrated = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'test') {
      // Skip the on-disk hydration step in tests to avoid background setState warnings.
      hasHydrated.current = true;
      setHydrated(true);
      return undefined;
    }
    let mounted = true;
    loadStoredThemeMode().then((stored) => {
      if (!mounted) return;
      if (stored && stored !== preference && !hasHydrated.current) {
        setPreference(stored);
      }
      hasHydrated.current = true;
      setHydrated(true);
    });
    return () => {
      mounted = false;
    };
    // We intentionally only run this on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolvedMode = resolveMode(preference, systemScheme);
  const theme = useMemo(() => pickTheme(resolvedMode), [resolvedMode]);

  const setMode = useCallback((nextMode) => {
    const safe = normalizeThemeMode(nextMode);
    setPreference(safe);
    saveStoredThemeMode(safe);
  }, []);

  const toggleMode = useCallback(() => {
    setMode(resolvedMode === 'dark' ? 'light' : 'dark');
  }, [resolvedMode, setMode]);

  const value = useMemo(
    () => ({
      theme,
      colors: theme.colors,
      shadows: theme.shadow,
      status: theme.status,
      gradient: theme.gradient,
      typography,
      spacing,
      radii,
      motion,
      layout,
      preference,
      resolvedMode,
      hydrated,
      setMode,
      toggleMode,
    }),
    [theme, preference, resolvedMode, hydrated, setMode, toggleMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    return {
      theme: lightTheme,
      colors: lightTheme.colors,
      shadows: lightTheme.shadow,
      status: lightTheme.status,
      gradient: lightTheme.gradient,
      typography,
      spacing,
      radii,
      motion,
      layout,
      preference: 'system',
      resolvedMode: 'light',
      hydrated: true,
      setMode: () => {},
      toggleMode: () => {},
    };
  }
  return value;
}

export function useThemedStyles(factory) {
  const { theme } = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}

export { lightTheme, darkTheme };
export { Appearance };
