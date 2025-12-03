/**
 * AI Task Tracking Mobile App
 * React Native application for task management
 *
 * @format
 */

import React, { JSX, useEffect } from 'react';
import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-gesture-handler';

import AppNavigator from './src/navigation/AppNavigator';
import { ToastProvider } from './src/context/ToastContext';
import { appStateService } from './src/services/appStateService';
import { localNotification } from './src/services/localNotification';

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

  useEffect(() => {
    // Initialize app services on startup
    const initializeServices = async () => {
      try {
        console.log('[App] Initializing services');

        // Initialize local notification service
        await localNotification.initialize();

        // Initialize app state service (includes background timer and notification handler)
        await appStateService.initialize();

        console.log('[App] Services initialized');
      } catch (error) {
        console.error('[App] Service initialization error:', error);
      }
    };

    initializeServices();

    // Cleanup on app unmount
    return () => {
      appStateService.destroy();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={isDarkMode ? darkTheme : lightTheme}>
        <ToastProvider>
          <StatusBar
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            backgroundColor={isDarkMode ? darkTheme.colors.surface : lightTheme.colors.surface}
          />
          <AppNavigator />
        </ToastProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default App;
