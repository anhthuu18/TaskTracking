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
  SafeAreaView,
  StatusBar,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { useWorkspaceData, WorkspaceData } from '../hooks/useWorkspaceData';
import WorkspaceStatsCard from '../components/WorkspaceStatsCard';
import ProjectCardModern from '../components/ProjectCardModern';
import TaskCardModern from '../components/TaskCardModern';
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
  onLogout,
}) => {
  const workspace = route?.params?.workspace;
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [availableWorkspaces, setAvailableWorkspaces] = useState<any[]>([]);

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
    } else {
      navigation.navigate('WorkspaceSelection');
    }
  };

  const handleWorkspaceSelect = (workspaceId: string) => {
    setShowWorkspaceDropdown(false);
    // Handle workspace selection
    console.log('Selected workspace:', workspaceId);
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
  }, []);

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

  const handleTaskPress = (taskId: string) => {
    // Navigate to task detail
    console.log('Navigate to task:', taskId);
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
        {/* Stats Card */}
        <WorkspaceStatsCard 
          stats={workspaceData.stats}
        />

        {/* Recent Projects */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Projects</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {workspaceData.projects.slice(0, 2).map((project) => (
            <ProjectCardModern
              key={project.id}
              project={project}
              onPress={() => handleProjectPress(project.id)}
            />
          ))}
        </View>

        {/* Recent Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Tasks</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {workspaceData.recentTasks.slice(0, 2).map((task) => (
            <TaskCardModern
              key={task.id}
              task={task}
              onPress={() => handleTaskPress(task.id)}
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
                  <Text style={styles.workspaceName}>{workspaceData?.workspace.name || workspace?.workspaceName || 'Workspace'}</Text>
                  <Text style={styles.workspaceType}>
                    {workspaceData?.workspace.type === 'group' || workspace?.workspaceType === 'GROUP' ? 'Team Workspace' : 'Personal Workspace'}
                  </Text>
                </View>
                <MaterialIcons 
                  name={showWorkspaceDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                  size={20} 
                  color={Colors.neutral.medium} 
                />
              </TouchableOpacity>

              {/* Workspace Dropdown */}
              {showWorkspaceDropdown && (
                <>
                  <TouchableOpacity 
                    style={styles.dropdownOverlay}
                    onPress={() => setShowWorkspaceDropdown(false)}
                    activeOpacity={1}
                  />
                  <View style={styles.workspaceDropdown}>
                    <ScrollView 
                      style={styles.dropdownScrollView}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                    >
                      {availableWorkspaces.map((ws) => (
                        <TouchableOpacity 
                          key={ws.id}
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
                      ))}
                      <TouchableOpacity 
                        style={[styles.dropdownItem, styles.createWorkspaceItem]}
                        onPress={() => {
                          setShowWorkspaceDropdown(false);
                          navigation.navigate('CreateWorkspace');
                        }}
                      >
                        <MaterialIcons name="add" size={20} color={Colors.primary} />
                        <Text style={[styles.dropdownItemText, styles.createWorkspaceText]}>Create New</Text>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {renderOverview()}
        </View>
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
    paddingTop: 60,
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
    overflow: 'scroll',
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
    maxHeight: '100%',
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
    paddingTop: 20,
    paddingHorizontal: 20,
    zIndex: 1,
    backgroundColor: Colors.background,
  },
  section: {
    paddingVertical: 12,
    marginBottom: 8,
    paddingHorizontal: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
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
});

export default WorkspaceDashboardModern;
