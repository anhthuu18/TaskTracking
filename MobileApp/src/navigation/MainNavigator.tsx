import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import CustomFooter from '../components/CustomFooter';
import WorkspaceDashboardModern from '../screens/WorkspaceDashboardModern';
import CalendarScreen from '../screens/CalendarScreen';
import CreateScreen from '../screens/CreateScreen';
import TaskListScreen from '../screens/TaskListScreen';
import SettingsScreen from '../screens/SettingsScreen';

interface MainNavigatorProps {
  workspace?: any;
  onSwitchWorkspace?: () => void;
  onLogout?: () => void;
}

const MainNavigator: React.FC<MainNavigatorProps> = ({
  workspace,
  onSwitchWorkspace,
  onLogout,
}) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('home');

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <WorkspaceDashboardModern
            route={{ params: { workspace } }}
            onSwitchWorkspace={onSwitchWorkspace}
            onLogout={onLogout}
          />
        );
      case 'calendar':
        return <CalendarScreen />;
      case 'create':
        return <CreateScreen />;
      case 'tasks':
        return <TaskListScreen route={{ params: { workspace } }} />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return (
          <WorkspaceDashboardModern
            route={{ params: { workspace } }}
            onSwitchWorkspace={onSwitchWorkspace}
            onLogout={onLogout}
          />
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.screenContainer}>
        {renderActiveScreen()}
      </View>
      <CustomFooter activeTab={activeTab} onTabPress={handleTabPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    paddingBottom: 85, // Space for footer
  },
});

export default MainNavigator;
