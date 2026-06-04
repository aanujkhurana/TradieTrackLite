import React from 'react';
import { LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Jobs from './src/screens/Jobs';
import CreateJob from './src/screens/CreateJob';
import JobDetail from './src/screens/JobDetail';
import AdFree from './src/screens/AdFree';
import { MonetizationProvider } from './src/monetization/MonetizationContext';
import { colors, typography } from './src/theme';

const Stack = createStackNavigator();

LogBox.ignoreLogs([
  'Constants.platform.ios.model has been deprecated',
]);

function AppNavigator() {
  return (
    <NavigationContainer>
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
            fontSize: 15,
            fontWeight: '900',
            letterSpacing: typography.sectionTitle.letterSpacing,
          },
          headerBackTitleVisible: false,
          cardStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen
          name="Jobs"
          component={Jobs}
          options={{ title: 'My Jobs' }}
        />
        <Stack.Screen
          name="CreateJob"
          component={CreateJob}
          options={{ title: 'New Job' }}
        />
        <Stack.Screen
          name="JobDetail"
          component={JobDetail}
          options={{ title: 'Job Detail' }}
        />
        <Stack.Screen
          name="AdFree"
          component={AdFree}
          options={{ title: 'Ad-Free' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <MonetizationProvider>
      <AppNavigator />
    </MonetizationProvider>
  );
}
