/**
 * AI Task Tracking Mobile App
 * React Native application for task management
 *
 * @format
 */

import React, { JSX } from 'react';
import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import TaskListScreen from './src/screens/TaskListScreen';

// Custom theme colors
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2196F3',
    primaryContainer: '#E3F2FD',
    secondary: '#FF9800',
    secondaryContainer: '#FFF3E0',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#64B5F6',
    primaryContainer: '#1976D2',
    secondary: '#FFB74D',
    secondaryContainer: '#F57C00',
  },
};

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <PaperProvider theme={isDarkMode ? darkTheme : lightTheme}>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={isDarkMode ? darkTheme.colors.surface : lightTheme.colors.surface}
        />
        <TaskListScreen />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default App;
