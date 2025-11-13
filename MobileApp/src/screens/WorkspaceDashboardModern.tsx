import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { useWorkspaceData, TaskSummary } from '../hooks/useWorkspaceData';
import ProjectCardModern from '../components/ProjectCardModern';
import TaskCardModern from '../components/TaskCardModern';
import TaskDetailModal from '../components/TaskDetailModal';
import { workspaceService } from '../services';

interface WorkspaceDashboardModernProps {
  navigation: any;
  route?: any;
  onSwitchWorkspace?: () => void;
  onLogout?: () => void;
}

const WorkspaceDashboardModern: React.FC<WorkspaceDashboardModernProps> = ({
  navigation,
  route,
  onSwitchWorkspace,
}) => {
  const workspace = route?.params?.workspace;
  const externalReloadKey: number | undefined = route?.params?.reloadKey;
  const onViewAllTasks = route?.params?.onViewAllTasks;
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [availableWorkspaces, setAvailableWorkspaces] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskSummary | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);

  const {
    data: workspaceData,
    loading,
    error,
    refreshing,
    refresh,
  } = useWorkspaceData(workspace?.id?.toString() || '1');

  const handleSwitchWorkspace = () => {
    if (onSwitchWorkspace) {
      onSwitchWorkspace();
    } else if (navigation) {
      navigation.navigate('WorkspaceSelection');
    } else {
      console.error('Navigation is not available');
    }
  };

  const handleWorkspaceSelect = async (workspaceId: string) => {
    setShowWorkspaceDropdown(false);
    
    try {
      // Check if navigation is available
      if (!navigation) {
        console.error('Navigation is not available');
        return;
      }

      // Find the selected workspace
      const selectedWorkspace = availableWorkspaces.find(ws => ws.id.toString() === workspaceId);
      if (!selectedWorkspace) {
        console.error('Workspace not found');
        return;
      }
      
      // Update the workspace in route params
      const updatedWorkspace = {
        id: parseInt(workspaceId),
        workspaceName: selectedWorkspace.workspaceName,
        memberCount: selectedWorkspace.memberCount || 1,
        workspaceType: selectedWorkspace.workspaceType,
        description: selectedWorkspace.description || '',
        dateCreated: selectedWorkspace.dateCreated || new Date(),
        dateModified: new Date(),
        userId: 1, // Mock user ID
        userRole: 'OWNER' as any,
      };
      
      // Navigate to the same screen with new workspace data
      navigation.navigate('Main', { 
        workspace: updatedWorkspace 
      });
    } catch (error) {
      console.error('Error selecting workspace:', error);
    }
  };

  // Load available workspaces
  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const response = await workspaceService.getAllWorkspaces();
        if (response.success) {
          setAvailableWorkspaces(response.data);
        }
      } catch (error) {
        console.error('Error loading workspaces:', error);
      }
    };
    loadWorkspaces();


  }, [workspace?.id]);

  // Reload data when workspace changes
  useEffect(() => {
    if (workspace?.id || externalReloadKey) {
      // Trigger refresh when workspace or reload key changes
      refresh();
    }
  }, [workspace?.id, externalReloadKey, refresh]);

  const getWorkspaceTypeColor = (type: string) => {
    return type === 'GROUP' ? Colors.semantic.success : Colors.semantic.info;
  };

  const getWorkspaceTypeChipStyle = (type: string) => {
    const color = getWorkspaceTypeColor(type);
    return {
      backgroundColor: color + '15',
      borderColor: color + '30',
      borderWidth: 1,
    };
  };

  const handleProjectPress = (projectId: string) => {
    const project = workspaceData?.projects.find(p => p.id === projectId);
    if (project) {
      navigation.navigate('ProjectDetail', { 
        project: {
          id: projectId,
          name: project.name,
          description: project.description,
        }
      });
    }
  };

  const handleTaskPress = (task: TaskSummary) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const handleTrackTime = (task: TaskSummary) => {
    // TODO: Implement time tracking functionality
    console.log('Track time for task:', task.id);
  };

  const handleDeleteTask = (taskId: string) => {
    // TODO: Implement actual deletion logic (API call, state update)
    console.log('Deleting task:', taskId);
    // For now, just refresh the data to simulate removal if the backend deletes it
    refresh();
  };

  // Function to determine the most important task
  const getMostImportantTask = (): TaskSummary | null => {
    if (!workspaceData || workspaceData.recentTasks.length === 0) {
      return null;
    }

    const incompleteTasks = workspaceData.recentTasks.filter(
      task => task.status !== 'completed'
    );

    if (incompleteTasks.length === 0) {
      return null;
    }

    // Priority weights
    const priorityWeight = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    // Calculate importance score for each task
    const tasksWithScore = incompleteTasks.map(task => {
      let score = priorityWeight[task.priority] || 0;

      // Add weight based on due date
      if (task.dueDate) {
        const now = new Date();
        const diffTime = task.dueDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          // Overdue tasks get highest priority
          score += 10;
        } else if (diffDays === 0) {
          // Due today
          score += 8;
        } else if (diffDays === 1) {
          // Due tomorrow
          score += 6;
        } else if (diffDays <= 3) {
          // Due within 3 days
          score += 4;
        } else if (diffDays <= 7) {
          // Due within a week
          score += 2;
        }
      }

      return { task, score };
    });

    // Sort by score (descending) and return the task with highest score
    tasksWithScore.sort((a, b) => b.score - a.score);
    return tasksWithScore[0].task;
  };

  const renderOverview = () => {
    if (!workspaceData) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading workspace data...</Text>
        </View>
      );
    }

    const mostImportantTask = getMostImportantTask();

    // Mock data for upcoming tasks if empty
    let upcomingTasks = workspaceData.upcomingDeadlines;
    if (upcomingTasks.length === 0) {
      const today = new Date();
      upcomingTasks = [
        {
          id: 'mock-1',
          title: 'Review UI/UX Mockups',
          projectName: 'Design System',
          priority: 'high',
          status: 'in_progress',
          dueDate: new Date(today.setDate(today.getDate() + 1)), // Due tomorrow
          assigneeName: 'Nguyen Van A',
        } as TaskSummary,
        {
          id: 'mock-2',
          title: 'Implement New Login Flow',
          projectName: 'Mobile App',
          priority: 'medium',
          status: 'todo',
          dueDate: new Date(today.setDate(today.getDate() + 2)), // Due in 3 days
          assigneeName: 'Tran Thi B',
        } as TaskSummary,
        {
          id: 'mock-3',
          title: 'Setup Staging Environment',
          projectName: 'DevOps',
          priority: 'low',
          status: 'todo',
          dueDate: new Date(today.setDate(today.getDate() + 4)), // Due in 7 days
          assigneeName: 'Le Van C',
        } as TaskSummary,
      ];
    }

    return (
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Most Important Task */}
        {mostImportantTask && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Most Important Task</Text>
              </View>
            </View>
            <TaskCardModern
              task={mostImportantTask}
              onPress={() => handleTaskPress(mostImportantTask)}
              onTrackTime={() => handleTrackTime(mostImportantTask)}
              onDelete={() => handleDeleteTask(mostImportantTask.id)}
            />
          </View>
        )}

        {/* Recent Projects */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {workspaceData.projects.length > 0 && (
              <TouchableOpacity onPress={() => {
                if (navigation) {
                  navigation.navigate('ProjectList', { workspace });
                }
              }}>
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>
          {workspaceData.projects.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <MaterialIcons name="folder-open" size={48} color={Colors.neutral.medium} />
              <Text style={styles.emptyStateText}>No projects</Text>
            </View>
          ) : (
            workspaceData.projects.slice(0, 2).map((project) => (
              <ProjectCardModern
                key={project.id}
                project={project}
                onPress={() => handleProjectPress(project.id)}
              />
            ))
          )}
        </View>

        {/* Upcoming Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
            <TouchableOpacity onPress={() => {
              if (onViewAllTasks) {
                onViewAllTasks();
              }
            }}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {upcomingTasks.slice(0, 3).map((task) => (
            <TaskCardModern
              key={task.id}
              task={task}
              onPress={() => handleTaskPress(task)}
              onTrackTime={() => handleTrackTime(task)}
              onDelete={() => handleDeleteTask(task.id)}
            />
          ))}
        </View>
      </ScrollView>
    );
  };


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading workspace...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={Colors.semantic.error} />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={() => setShowWorkspaceDropdown(false)}>
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleSwitchWorkspace}
            >
              <MaterialIcons name="arrow-back" size={24} color={Colors.neutral.dark} />
            </TouchableOpacity>
            
            <View style={styles.workspaceSection}>
              <TouchableOpacity 
                style={styles.workspaceSelector}
                onPress={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
              >
                <View style={styles.workspaceInfo}>
                  <Text style={styles.workspaceName}>
                    {workspace?.workspaceName || workspaceData?.workspace.name || 'Workspace'}
                  </Text>
                  <Text style={styles.workspaceType}>
                    {workspace?.workspaceType === 'GROUP' || workspaceData?.workspace.type === 'group' ? 'Team Workspace' : 'Personal Workspace'}
                  </Text>
                </View>
                <MaterialIcons 
                  name={showWorkspaceDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                  size={20} 
                  color={Colors.neutral.medium} 
                />
              </TouchableOpacity>

              {/* Workspace Dropdown Modal */}
              <Modal
                visible={showWorkspaceDropdown}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowWorkspaceDropdown(false)}
              >
                <TouchableOpacity 
                  style={styles.modalOverlay}
                  onPress={() => setShowWorkspaceDropdown(false)}
                  activeOpacity={1}
                >
                  <View style={styles.modalDropdown}>
                    <FlatList
                      data={availableWorkspaces}
                      style={styles.modalScrollView}
                      showsVerticalScrollIndicator={true}
                      bounces={false}
                      scrollEventThrottle={16}
                      keyboardShouldPersistTaps="handled"
                      keyExtractor={(item) => item.id.toString()}
                      renderItem={({ item: ws }) => (
                        <TouchableOpacity 
                          style={styles.dropdownItem}
                          onPress={() => handleWorkspaceSelect(ws.id.toString())}
                        >
                          <View style={styles.dropdownItemContent}>
                            <Text style={styles.dropdownItemText}>{ws.workspaceName}</Text>
                            <View style={[
                              styles.workspaceTypeChip,
                              getWorkspaceTypeChipStyle(ws.workspaceType)
                            ]}>
                              <Text style={[
                                styles.workspaceTypeChipText,
                                { color: getWorkspaceTypeColor(ws.workspaceType) }
                              ]}>
                                {ws.workspaceType === 'GROUP' ? 'Team' : 'Personal'}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      )}
                      ListFooterComponent={() => (
                        <TouchableOpacity 
                          style={[styles.dropdownItem, styles.createWorkspaceItem]}
                          onPress={() => {
                            setShowWorkspaceDropdown(false);
                            if (navigation) {
                              navigation.navigate('CreateWorkspace');
                            } else {
                              console.error('Navigation is not available');
                            }
                          }}
                        >
                          <MaterialIcons name="add" size={20} color={Colors.primary} />
                          <Text style={[styles.dropdownItemText, styles.createWorkspaceText]}>Create New</Text>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {renderOverview()}
        </View>

        <TaskDetailModal
          visible={showTaskDetail}
          task={selectedTask as any}
          onClose={() => setShowTaskDetail(false)}
          onUpdateTask={(updated) => {
            setSelectedTask(updated as any);
            try { refresh(); } catch {}
          }}
          onDeleteTask={(taskId) => {
            handleDeleteTask(String(taskId));
            setShowTaskDetail(false);
          }}
        />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.neutral.white,
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 1000,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    padding: 4,
  },
  workspaceSection: {
    flex: 1,
    position: 'relative',
    zIndex: 1001,
  },
  workspaceSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.neutral.light + '30',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
  },
  workspaceInfo: {
    flex: 1,
  },
  workspaceName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.neutral.dark,
    marginBottom: 2,
  },
  workspaceType: {
    fontSize: 13,
    color: Colors.neutral.medium,
  },
  workspaceDropdown: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    maxHeight: 300,
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
    paddingVertical: 8,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 9998,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light + '50',
  },
  dropdownItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
    flex: 1,
  },
  dropdownItemSubtext: {
    fontSize: 12,
    color: Colors.neutral.medium,
    marginLeft: 8,
  },
  workspaceTypeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  workspaceTypeChipText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownScrollView: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 100,
  },
  modalDropdown: {
    backgroundColor: Colors.neutral.white,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: 400,
  },
  modalScrollView: {
    maxHeight: 350,
  },
  createWorkspaceItem: {
    borderBottomWidth: 0,
    backgroundColor: Colors.primary + '10',
  },
  createWorkspaceText: {
    color: Colors.primary,
  },
  content: {
    flex: 1,
    paddingTop: 4, // Reduced from 8
    paddingHorizontal: 16,
    zIndex: 1,
    backgroundColor: Colors.background,
  },
  section: {
    paddingVertical: 8, // Reduced from 10
    marginBottom: 8,
    paddingHorizontal: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6, // Reduced from 8
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1243',
    textAlign: 'left',
  },
  seeAllText: {
    fontSize: 14,
    color: '#643FDB',
    fontWeight: '600',
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.neutral.medium,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.neutral.medium,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    color: Colors.neutral.white,
    fontWeight: '600',
  },
  placeholderContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.neutral.medium,
    marginTop: 16,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: Colors.neutral.light + '30',
    borderRadius: 12,
    marginTop: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.neutral.medium,
    marginTop: 12,
    fontWeight: '500',
  },
});

export default WorkspaceDashboardModern;
