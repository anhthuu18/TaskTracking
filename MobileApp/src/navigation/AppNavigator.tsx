import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

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
  ProjectDetailScreen
} from '../screens';

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
  WorkspaceDashboard: { workspace: any };
  TaskList: { workspace?: any };
  ProjectList: { workspace?: any };
  ProjectDetail: { project: any };
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleSplashFinish = () => {
    setIsLoading(false);
  };

  const handleOnboardingFinish = () => {
    setShowOnboarding(false);
  };

  const handleBackToOnboarding = () => {
    setShowOnboarding(true);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}
        initialRouteName={isLoading ? "Splash" : showOnboarding ? "Onboarding" : "SignIn"}
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
