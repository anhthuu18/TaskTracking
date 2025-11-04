import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Text, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../hooks/useTheme';
import { Colors } from '../constants/Colors';
import CustomFooter from '../components/CustomFooter';
import { CreateProjectModal } from '../components';
import { projectService, workspaceService } from '../services';
import { CreateProjectRequest } from '../types/Project';
import { WorkspaceMember } from '../types/Workspace';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToastContext } from '../context/ToastContext';
import WorkspaceDashboardModern from '../screens/WorkspaceDashboardModern';
import CalendarScreen from '../screens/CalendarScreen';

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

  const createOptions = [
    { 
      id: 'voice', 
      title: 'Voice', 
      icon: 'mic', 
      description: 'Create with voice',
      color: '#8B5CF6', // Purple
    },
    { 
      id: 'workspace', 
      title: 'New Workspace', 
      icon: 'business', 
      description: 'Create a workspace',
      color: '#6B7280', // Gray
    },
    { 
      id: 'project', 
      title: 'New Project', 
      icon: 'folder', 
      description: 'Start a new project',
      color: '#FCD34D', // Yellow
    },
    { 
      id: 'task', 
      title: 'New Task', 
      icon: 'check-circle', 
      description: 'Create a new task',
      color: '#8B5CF6', // Purple
    },
  ];

  const handleCreateOption = (optionId: string) => {
    setShowCreateModal(false);
    
    switch (optionId) {
      case 'task':
        // Navigate to create task screen
        (navigation as any).navigate('CreateTask');
        break;
      case 'project':
        // Open inline Create Project modal (consistent with other screens)
        setShowCreateProjectModal(true);
        break;
      case 'workspace':
        // Navigate to create workspace screen
        (navigation as any).navigate('CreateWorkspace');
        break;
      case 'voice':
        // Navigate to voice create screen or open voice recorder
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
            route={{ params: { workspace, onViewAllTasks: handleViewAllTasks } }}
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

  const renderCreateOption = (option: typeof createOptions[0]) => (
    <TouchableOpacity
      key={option.id}
      style={[styles.createOption, { backgroundColor: colors.surface }]}
      onPress={() => handleCreateOption(option.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.createIconContainer, { backgroundColor: option.color + '20' }]}>
        <MaterialIcons 
          name={option.icon as any} 
          size={20} 
          color={option.color} 
        />
      </View>
      <View style={styles.createTextContainer}>
        <Text style={[styles.createTitle, { color: colors.text }]}>
          {option.title}
        </Text>
        <Text style={[styles.createDescription, { color: colors.textSecondary }]}>
          {option.description}
        </Text>
      </View>
      <MaterialIcons 
        name="chevron-right" 
        size={20} 
        color={Colors.neutral.light} 
      />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.screenContainer}>
        {renderActiveScreen()}
      </View>
      <CustomFooter activeTab={activeTab} onTabPress={handleTabPress} />
      
      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCreateModal(false)}
        >
          <View 
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Create
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                What would you like to create?
              </Text>
            </View>
            
            <ScrollView 
              style={styles.modalOptions}
              showsVerticalScrollIndicator={false}
            >
              {createOptions.map(renderCreateOption)}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCreateModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Create Project Modal */}
      <CreateProjectModal
        visible={showCreateProjectModal}
        onClose={() => setShowCreateProjectModal(false)}
        workspaceId={currentWorkspaceId?.toString() || ''}
        workspaceMembers={workspaceMembers}
        onCreateProject={async (projectData: CreateProjectRequest, memberUserIds: number[] = []) => {
          try {
            const response = await projectService.createProject(projectData);
            if (response.success) {
              showSuccess('Project created successfully');
              
              // Add members to the project if any selected
              if (memberUserIds.length > 0 && response.data?.id) {
                try {
                  const createdProjectId = Number(response.data.id);
                  for (const userId of memberUserIds) {
                    await projectService.addMemberToProject(createdProjectId, userId);
                  }
                } catch (memberError) {
                  console.error('Error adding members:', memberError);
                }
              }
            } else {
              showError(response.message || 'Failed to create project');
            }
          } catch (error: any) {
            console.error('Error creating project:', error);
            showError(error?.message || 'Failed to create project');
          } finally {
            setShowCreateProjectModal(false);
          }
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 12,
    padding: 16,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
  },
  modalOptions: {
    maxHeight: 300,
    marginBottom: 12,
  },
  createOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.light + '40',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  createIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  createTextContainer: {
    flex: 1,
  },
  createTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  createDescription: {
    fontSize: 12,
  },
  closeButton: {
    padding: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.neutral.light + '30',
  },
  closeButtonText: {
    color: Colors.neutral.dark,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MainNavigator;
