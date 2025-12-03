import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, buildApiUrl, getCurrentApiConfig } from '../config/api';

import {
  SplashScreen,
  OnboardingScreen,
  SignUpScreen,
  SignInScreen,
  ForgotPasswordScreen,
  EnterOTPScreen,
  ResetPasswordScreen,
  WorkspaceSelectionScreen,
  CreateWorkspaceScreen,
  TaskListScreen,
  WorkspaceDashboardScreen,
  ProjectListScreen,
  ProjectDetailScreen,
  CreateTaskScreen,
  CreateEventScreen,
  ProjectSettingsScreen,
  ProfileScreen
} from '../screens';
import TaskTrackingScreen from '../screens/TaskTrackingScreen';
import AcceptInvitationScreen from '../screens/AcceptInvitationScreen';
import PersonalSettingsScreen from '../screens/PersonalSettingsScreen';
import MainNavigator from './MainNavigator';
import HomeTabNavigator from './HomeTabNavigator';
import { navigationRef } from '../services/NavigationService';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  SignUp: undefined;
  SignIn: undefined;
  ForgotPassword: undefined;
  EnterOTP: { phoneNumber: string };
  ResetPassword: { phoneNumber: string; otp: string };
  HomeTabs: undefined;
  WorkspaceSelection: undefined;
  CreateWorkspace: undefined;
  Main: { workspace?: any };
  WorkspaceDashboard: { workspace: any };
  TaskList: { workspace?: any };
  ProjectList: { workspace?: any };
  ProjectDetail: { project: any };
  CreateTask: { projectMembers?: any[]; projectId?: string };
  CreateEvent: { projectMembers?: any[]; projectId?: string };
  ProjectSettings: { project: any };
  AcceptInvitation: { token: string };
  TaskTracking: { task: any };
  PersonalSettings: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();


const DEMO_ALWAYS_START_ONBOARDING = true;

const AppNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lastUsedWorkspace, setLastUsedWorkspace] = useState<any>(null);
  const [shouldNavigateToWorkspace, setShouldNavigateToWorkspace] = useState(false);
  const [navigationKey, setNavigationKey] = useState(0);

  // Load app state from AsyncStorage on mount
  useEffect(() => {
    const loadAppState = async () => {
      try {
        // Demo mode: always start from onboarding and clear persisted session
        if (DEMO_ALWAYS_START_ONBOARDING) {
          await AsyncStorage.multiRemove(['hasSeenOnboarding', 'authToken', 'user', 'lastUsedWorkspaceId']);
          setShowOnboarding(true);
          setIsAuthenticated(false);
          setIsLoading(false);
          return; // skip normal boot flow
        }
        // Load onboarding state
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        if (hasSeenOnboarding === 'true') {
          setShowOnboarding(false);
        }

        // Load authentication state
        const authToken = await AsyncStorage.getItem('authToken');
        const userData = await AsyncStorage.getItem('user');

        // Helper: validate token with backend (redirect to login if invalid/expired)
        const validateToken = async (token: string) => {
          try {
            const url = buildApiUrl(getCurrentApiConfig().ENDPOINTS.USER.PROFILE);
            const res = await fetch(url, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            });
            if (res.status === 401) {
              throw new Error('Unauthorized');
            }
            if (!res.ok) {
              // On other errors, treat as unauthenticated if clearly auth-related
              throw new Error(`HTTP ${res.status}`);
            }
            return true;
          } catch (e) {
            // Clear invalid creds
            await AsyncStorage.multiRemove(['authToken', 'user', 'lastUsedWorkspaceId']);
            return false;
          }
        };

        if (authToken && userData) {
          const isValid = API_CONFIG.USE_MOCK_API ? true : await validateToken(authToken);
          setIsAuthenticated(isValid);
          
          // Note: We now always navigate to PersonalDashboard first
          // Users can navigate to specific workspaces from there
        }
      } catch (error) {
        console.error('Error loading app state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAppState();
  }, []);

  const handleSplashFinish = () => {
    setIsLoading(false);
  };

  const handleOnboardingFinish = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error saving onboarding state:', error);
      setShowOnboarding(false);
    }
  };

  const handleBackToOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('hasSeenOnboarding');
      setShowOnboarding(true);
    } catch (error) {
      console.error('Error resetting onboarding state:', error);
      setShowOnboarding(true);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleSwitchWorkspace = async () => {
    try {
      // Clear last used workspace from AsyncStorage
      await AsyncStorage.removeItem('lastUsedWorkspaceId');
      
      // Reset state
      setShouldNavigateToWorkspace(false);
      setLastUsedWorkspace(null);
      
      // Force navigation re-render
      setNavigationKey(prev => prev + 1);
    } catch (error) {
      console.error('Error clearing last used workspace:', error);
      // Still reset state even if AsyncStorage fails
      setShouldNavigateToWorkspace(false);
      setLastUsedWorkspace(null);
      setNavigationKey(prev => prev + 1);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear all stored data
      await AsyncStorage.multiRemove(['authToken', 'user', 'lastUsedWorkspaceId', 'hasSeenOnboarding', 'activeTimer']);
      
      // Reset state
      setIsAuthenticated(false);
      setShowOnboarding(true);
      setLastUsedWorkspace(null);
      setShouldNavigateToWorkspace(false);
      setNavigationKey(prev => prev + 1);
    } catch (error) {
      console.error('Error during logout:', error);
      setIsAuthenticated(false);
      setShowOnboarding(true);
      setLastUsedWorkspace(null);
      setShouldNavigateToWorkspace(false);
      setNavigationKey(prev => prev + 1);
    }
  };

  return (
    <NavigationContainer key={navigationKey} ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}
        initialRouteName={isLoading ? "Splash" : showOnboarding ? "Onboarding" : isAuthenticated ? "HomeTabs" : "SignIn"}
      >
        {isLoading ? (
          <Stack.Screen name="Splash">
            {props => (
              <SplashScreen {...props} onFinish={handleSplashFinish} />
            )}
          </Stack.Screen>
        ) : showOnboarding ? (
          <Stack.Screen name="Onboarding">
            {props => (
              <OnboardingScreen {...props} onFinish={handleOnboardingFinish} />
            )}
          </Stack.Screen>
        ) : !isAuthenticated ? (
          <>
            <Stack.Screen name="SignIn">
              {props => (
                <SignInScreen 
                  {...props} 
                  onBackToOnboarding={handleBackToOnboarding}
                  onLoginSuccess={handleLoginSuccess}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="SignUp"
              component={SignUpScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="EnterOTP"
              component={EnterOTPScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="WorkspaceSelection"
              component={WorkspaceSelectionScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="CreateWorkspace"
              component={CreateWorkspaceScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="WorkspaceDashboard"
              component={WorkspaceDashboardScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="TaskList"
              component={TaskListScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="ProjectList"
              component={ProjectListScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="ProjectDetail"
              component={ProjectDetailScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="CreateTask"
              component={CreateTaskScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="CreateEvent"
              component={CreateEventScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="ProjectSettings"
              component={ProjectSettingsScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="AcceptInvitation"
              component={AcceptInvitationScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="TaskTracking"
              options={{
                headerShown: false,
              }}
            >
              {(props) => <TaskTrackingScreen {...props} />}
            </Stack.Screen>
            <Stack.Screen
              name="PersonalSettings"
              component={PersonalSettingsScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Profile"
              options={{
                headerShown: false,
              }}
            >
              {(props) => (
                <ProfileScreen
                  {...props}
                  onLogout={handleLogout}
            />
              )}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen
              name="HomeTabs"
              options={{
                headerShown: false,
              }}
            >
              {(props) => <HomeTabNavigator {...props} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen
              name="Main"
              options={{
                headerShown: false,
              }}
            >
              {(props) => <MainNavigator {...props} workspace={props.route?.params?.workspace || lastUsedWorkspace} onSwitchWorkspace={handleSwitchWorkspace} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen
              name="WorkspaceSelection"
              component={WorkspaceSelectionScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="CreateWorkspace"
              component={CreateWorkspaceScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="TaskList"
              component={TaskListScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="ProjectList"
              component={ProjectListScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="ProjectDetail"
              component={ProjectDetailScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="CreateTask"
              component={CreateTaskScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="CreateEvent"
              component={CreateEventScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="ProjectSettings"
              component={ProjectSettingsScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="AcceptInvitation"
              component={AcceptInvitationScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="TaskTracking"
              options={{
                headerShown: false,
              }}
            >
              {(props) => <TaskTrackingScreen {...props} />}
            </Stack.Screen>
            <Stack.Screen
              name="PersonalSettings"
              component={PersonalSettingsScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Profile"
              options={{
                headerShown: false,
              }}
            >
              {(props) => (
                <ProfileScreen
                  {...props}
                  onLogout={handleLogout}
            />
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
