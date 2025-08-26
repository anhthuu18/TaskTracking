import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import SignUpScreen from '../screens/SignUpScreen';
import SignInScreen from '../screens/SignInScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import EnterOTPScreen from '../screens/EnterOTPScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import TaskListScreen from '../screens/TaskListScreen';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  SignUp: undefined;
  SignIn: undefined;
  ForgotPassword: undefined;
  EnterOTP: { phoneNumber: string };
  ResetPassword: { phoneNumber: string; otp: string };
  TaskList: undefined;
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
    console.log('🏁 Onboarding finished, navigating to auth...');
    setShowOnboarding(false);
  };

  const handleBackToOnboarding = () => {
    console.log('🔙 Back to onboarding from SignIn...');
    setShowOnboarding(true);
  };

  const handleLoginSuccess = () => {
    console.log('✅ Login successful, setting authenticated...');
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
              name="TaskList"
              component={TaskListScreen}
              options={{
                headerShown: false,
              }}
            />
          </>
        ) : (
          <Stack.Screen
            name="TaskList"
            component={TaskListScreen}
            options={{
              headerShown: false,
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
