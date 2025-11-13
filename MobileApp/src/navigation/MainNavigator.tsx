import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import CustomFooter from '../components/CustomFooter';
import { CreateProjectModal, CreateOptionsModal } from '../components';
import { projectService, workspaceService } from '../services';
import { CreateProjectRequest } from '../types/Project';
import { WorkspaceMember } from '../types/Workspace';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToastContext } from '../context/ToastContext';
import WorkspaceDashboardModern from '../screens/WorkspaceDashboardModern';
import CalendarScreen from '../screens/CalendarScreen';
import type { CreateOption } from '../components/CreateOptionsModal';

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
  const navigation = useNavigation();
  const { showSuccess, showError } = useToastContext();
  const [activeTab, setActiveTab] = useState('home');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<number | null>(null);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  // Load current workspace and members
  useEffect(() => {
    const loadWorkspaceData = async () => {
      try {
        // Get workspace from props or AsyncStorage
        let workspaceId = workspace?.id;
        if (!workspaceId) {
          const storedWorkspace = await AsyncStorage.getItem('currentWorkspace');
          if (storedWorkspace) {
            const ws = JSON.parse(storedWorkspace);
            workspaceId = ws?.id;
          }
        }
        
        if (workspaceId) {
          setCurrentWorkspaceId(Number(workspaceId));
          
          // Load workspace members
          const membersResponse = await workspaceService.getWorkspaceMembers(Number(workspaceId));
          if (membersResponse.success && membersResponse.data) {
            setWorkspaceMembers(membersResponse.data);
          }
        }
      } catch (error) {
        console.error('Error loading workspace data:', error);
      }
    };
    
    loadWorkspaceData();
  }, [workspace]);

  const handleTabPress = (tabId: string) => {
    if (tabId === 'create') {
      setShowCreateModal(true);
    } else {
      // If clicking directly on tasks tab (not from View All), reset showAllTasks
      // This ensures filter will reset to 'all' when user clicks directly on task tab
      if (tabId === 'tasks') {
        if (activeTab !== 'tasks') {
          // Switching to tasks tab - reset showAllTasks to false
          setShowAllTasks(false);
        }
        // If already on tasks tab and clicking it again, also reset
        // This handles the case where user clicks task tab again after View All
        if (activeTab === 'tasks' && showAllTasks) {
          setShowAllTasks(false);
        }
      }
      setActiveTab(tabId);
    }
  };

  const handleViewAllTasks = React.useCallback(() => {
    setShowAllTasks(true);
    setActiveTab('tasks');
  }, []);

  const handleCreateOptionSelect = (optionId: CreateOption) => {
    setShowCreateModal(false);

    switch (optionId) {
      case 'task':
        (navigation as any).navigate('CreateTask');
        break;
      case 'project':
        setShowCreateProjectModal(true);
        break;
      case 'workspace':
        (navigation as any).navigate('CreateWorkspace');
        break;
      case 'voice':
        showError('Voice feature coming soon!');
        break;
      default:
        console.log(`Creating ${optionId}`);
    }
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <WorkspaceDashboardModern
            navigation={navigation}
            route={{ params: { workspace, onViewAllTasks: handleViewAllTasks, reloadKey } }}
            onSwitchWorkspace={onSwitchWorkspace}
            onLogout={onLogout}
          />
        );
      case 'calendar':
        return <CalendarScreen navigation={navigation} />;
      case 'tasks':
        return (
          <TaskListScreen 
            key="tasks" 
            route={{ params: { workspace, showAllTasks } }} 
            onViewAllTasksComplete={() => setShowAllTasks(false)}
          />
        );
      case 'settings':
        return <SettingsScreen workspace={workspace} />;
      default:
        return (
          <WorkspaceDashboardModern
            navigation={navigation}
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

      {/* Create Options Modal */}
      <CreateOptionsModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onOptionSelect={handleCreateOptionSelect}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        visible={showCreateProjectModal}
        onClose={() => setShowCreateProjectModal(false)}
        workspaceId={Number(currentWorkspaceId || 0)}
        onProjectCreated={() => {
          setShowCreateProjectModal(false);
          setReloadKey((k) => k + 1);
          setActiveTab('home');
        }}
      />
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
