import React, { useEffect, useMemo, useState } from 'react';
import { LogBox, StatusBar, View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Jobs from './src/screens/Jobs';
import CreateJob from './src/screens/CreateJob';
import JobDetail from './src/screens/JobDetail';
import AdFree from './src/screens/AdFree';
import Settings from './src/screens/Settings';
import { MonetizationProvider } from './src/monetization/MonetizationContext';
import { ThemeProvider, useTheme } from './src/theme';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import Onboarding from './src/onboarding/Onboarding';
import { loadOnboardingState } from './src/onboarding/storage';

LogBox.ignoreLogs([
  'Constants.platform.ios.model has been deprecated',
]);

const Stack = createStackNavigator();

function AppNavigator() {
  const { resolvedMode, colors } = useTheme();
  const navigationTheme = useMemo(() => {
    const base = resolvedMode === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: colors.background,
        card: colors.surface,
        text: colors.ink,
        border: colors.borderSoft,
        primary: colors.accent,
        notification: colors.accent,
      },
    };
  }, [resolvedMode, colors]);

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName="Jobs"
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
            borderBottomColor: colors.borderSoft,
            borderBottomWidth: 1,
            shadowColor: 'transparent',
          },
          headerTintColor: colors.ink,
          headerTitleStyle: {
            color: colors.ink,
            fontSize: 17,
            fontWeight: '700',
            letterSpacing: -0.1,
          },
          headerBackTitleVisible: false,
          cardStyle: {
            backgroundColor: colors.background,
          },
          cardStyleInterpolator: ({ current, layouts }) => ({
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          }),
          transitionSpec: {
            open: { animation: 'timing', config: { duration: 220 } },
            close: { animation: 'timing', config: { duration: 180 } },
          },
        }}
      >
        <Stack.Screen
          name="Jobs"
          component={Jobs}
          options={{ title: 'Jobs' }}
        />
        <Stack.Screen
          name="CreateJob"
          component={CreateJob}
          options={{ title: 'New job' }}
        />
        <Stack.Screen
          name="JobDetail"
          component={JobDetail}
          options={{ title: 'Job' }}
        />
        <Stack.Screen
          name="AdFree"
          component={AdFree}
          options={{ title: 'Ad-free' }}
        />
        <Stack.Screen
          name="Settings"
          component={Settings}
          options={{ title: 'Settings' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function ThemedRoot() {
  const { colors, resolvedMode } = useTheme();
  const [onboardingState, setOnboardingState] = useState({
    hasSeenOnboarding: undefined,
  });

  useEffect(() => {
    let active = true;
    loadOnboardingState().then((state) => {
      if (active) setOnboardingState(state);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleOnboardingDone = () => {
    setOnboardingState({ hasSeenOnboarding: true });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={resolvedMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <MonetizationProvider>
        {onboardingState.hasSeenOnboarding === false ? (
          <Onboarding onDone={handleOnboardingDone} />
        ) : (
          <AppNavigator />
        )}
      </MonetizationProvider>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <ThemedRoot />
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
