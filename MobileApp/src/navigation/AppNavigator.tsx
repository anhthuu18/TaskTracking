import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { workspaceService } from '../services/workspaceService';
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
  TaskTrackingScreen
} from '../screens';
import AcceptInvitationScreen from '../screens/AcceptInvitationScreen';
import MainNavigator from './MainNavigator';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  SignUp: undefined;
  SignIn: undefined;
  ForgotPassword: undefined;
  EnterOTP: { phoneNumber: string };
  ResetPassword: { phoneNumber: string; otp: string };
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
};

const Stack = createStackNavigator<RootStackParamList>();

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
          
          // Load last used workspace if authenticated and valid
          if (isValid) {
            const lastUsedWorkspaceId = await AsyncStorage.getItem('lastUsedWorkspaceId');
            if (lastUsedWorkspaceId) {
              try {
                // Fetch workspace details from API
                const response = await workspaceService.getAllWorkspaces();
                if (response.success) {
                  const workspace = response.data.find(w => w.id.toString() === lastUsedWorkspaceId);
                  if (workspace) {
                    setLastUsedWorkspace({
                      id: workspace.id,
                      name: workspace.workspaceName,
                      memberCount: workspace.memberCount || 1,
                      type: workspace.workspaceType === 'GROUP' ? 'group' : 'personal'
                    });
                    setShouldNavigateToWorkspace(true);
                  }
                }
              } catch (error: any) {
                // Only log error if it's not an authentication issue
                // "Unauthorized" errors are expected when user is not logged in or token expired
                const errorMessage = error?.message || '';
                if (!errorMessage.includes('Unauthorized') && !errorMessage.includes('401')) {
                  console.error('Error loading last used workspace:', error);
                }
              }
            }
          }
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
      await AsyncStorage.multiRemove(['authToken', 'user', 'lastUsedWorkspaceId', 'hasSeenOnboarding']);
      
      // Reset state
      setIsAuthenticated(false);
      setShowOnboarding(true);
      setLastUsedWorkspace(null);
      setShouldNavigateToWorkspace(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <NavigationContainer key={navigationKey}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}
        initialRouteName={isLoading ? "Splash" : showOnboarding ? "Onboarding" : isAuthenticated ? (shouldNavigateToWorkspace && lastUsedWorkspace ? "Main" : "WorkspaceSelection") : "SignIn"}
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
              component={TaskTrackingScreen}
              options={{
                headerShown: false,
              }}
            />
          </>
        ) : shouldNavigateToWorkspace && lastUsedWorkspace ? (
          <>
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
              component={TaskTrackingScreen}
              options={{
                headerShown: false,
              }}
            />
          </>
        ) : (
          <>
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
              name="Main"
              options={{
                headerShown: false,
              }}
            >
              {(props) => <MainNavigator {...props} workspace={props.route?.params?.workspace} onSwitchWorkspace={handleSwitchWorkspace} onLogout={handleLogout} />}
            </Stack.Screen>
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
              component={TaskTrackingScreen}
              options={{
                headerShown: false,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
