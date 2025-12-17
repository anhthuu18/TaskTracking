import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import BottomTabNavigator from './BottomTabNavigator';
import PersonalDashboardScreen from '../screens/PersonalDashboardScreen';
import WorkspaceSelectionScreen from '../screens/WorkspaceSelectionScreen';
import ProfileScreen from '../screens/ProfileScreen';

type HomeTabParamList = {
  PersonalDashboard: undefined;
  WorkspaceSelection: undefined;
  CreateEvent: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<HomeTabParamList>();

// Placeholder screen for Create action - navigates directly to CreateEvent
const CreatePlaceholderScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  React.useEffect(() => {
    // Navigate directly to CreateEvent screen
    navigation.navigate('CreateEvent');
  }, [navigation]);

  return null;
};

interface HomeTabNavigatorProps {
  onLogout?: () => void;
}

const HomeTabNavigator: React.FC<HomeTabNavigatorProps> = ({ onLogout }) => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
      tabBar={props => <BottomTabNavigator {...props} />}
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
        name="CreateEvent"
        component={CreatePlaceholderScreen}
        options={{
          tabBarLabel: 'Create',
        }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault();
            // Navigate directly to CreateEvent screen
            navigation.getParent()?.navigate('CreateEvent');
          },
        })}
      />
      <Tab.Screen
        name="Profile"
        options={{
          tabBarLabel: 'Profile',
        }}
      >
        {props => <ProfileScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default HomeTabNavigator;
