import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Jobs from './src/screens/Jobs';
import CreateJob from './src/screens/CreateJob';
import JobDetail from './src/screens/JobDetail';

const Stack = createStackNavigator();

export default function App() {
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
