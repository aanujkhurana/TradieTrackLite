import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Jobs from './src/screens/Jobs';
import CreateJob from './src/screens/CreateJob';
import JobDetail from './src/screens/JobDetail';
import AuthScreen from './src/screens/AuthScreen';
import { AuthProvider, useAuth } from './src/AuthContext';

const Stack = createStackNavigator();

function AppNavigator() {
  const { token } = useAuth();

  if (!token) return <AuthScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Jobs">
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
