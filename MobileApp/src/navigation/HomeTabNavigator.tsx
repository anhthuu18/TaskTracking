import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BottomTabNavigator from './BottomTabNavigator';
import PersonalDashboardScreen from '../screens/PersonalDashboardScreen';
import WorkspaceSelectionScreen from '../screens/WorkspaceSelectionScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PersonalSettingsScreen from '../screens/PersonalSettingsScreen';

type HomeTabParamList = {
  PersonalDashboard: undefined;
  WorkspaceSelection: undefined;
  PersonalSettings: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<HomeTabParamList>();

interface HomeTabNavigatorProps {
  onLogout?: () => void;
}

const HomeTabNavigator: React.FC<HomeTabNavigatorProps> = ({ onLogout }) => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <BottomTabNavigator {...props} />}
    >
      <Tab.Screen
        name="PersonalDashboard"
        component={PersonalDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="WorkspaceSelection"
        component={WorkspaceSelectionScreen}
        options={{
          tabBarLabel: 'Workspace',
        }}
      />
      <Tab.Screen
        name="PersonalSettings"
        component={PersonalSettingsScreen}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
      <Tab.Screen
        name="Profile"
        options={{
          tabBarLabel: 'Profile',
        }}
      >
        {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default HomeTabNavigator;

