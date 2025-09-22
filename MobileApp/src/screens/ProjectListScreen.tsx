import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { CreateProjectModal, CreateActionDropdown, CreateTaskModal, CreateEventModal } from '../components';
import { CreateProjectRequest, Project, ProjectStatus } from '../types/Project';
import { WorkspaceMember } from '../types/Workspace';
import { projectService, workspaceService } from '../services';

interface ProjectListScreenProps {
  navigation: any;
  route?: {
    params?: {
      workspace?: {
        id: number;
        name: string;
      };
    };
  };
}

const ProjectListScreen: React.FC<ProjectListScreenProps> = ({ navigation, route }) => {
  const [selectedTab, setSelectedTab] = useState<'projects' | 'completed'>('projects');
  const [longPressedProject, setLongPressedProject] = useState<number | null>(null);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get workspace from navigation params
  const selectedWorkspace = route?.params?.workspace;

  // Load data on component mount
  useEffect(() => {
    if (selectedWorkspace?.id) {
      loadProjects();
      loadWorkspaceMembers();
    }
  }, [selectedWorkspace?.id]);

  const loadProjects = async () => {
    if (!selectedWorkspace?.id) return;
    
    try {
      setLoading(true);
      const response = await projectService.getProjectsByWorkspace(Number(selectedWorkspace.id));
      
      if (response.success) {
        setProjects(response.data);
      } else {
        Alert.alert('Error', response.message || 'Failed to load projects');
      }
    } catch (error: any) {
      console.error('Error loading projects:', error);
      Alert.alert('Error', error.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkspaceMembers = async () => {
    if (!selectedWorkspace?.id) return;
    
    try {
      const response = await workspaceService.getWorkspaceMembers(Number(selectedWorkspace.id));
      
      if (response.success) {
        setWorkspaceMembers(response.data);
      } else {
        console.error('Failed to load workspace members:', response.message);
      }
    } catch (error: any) {
      console.error('Error loading workspace members:', error);
    }
  };

  const refreshProjects = async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  };

  const handleCreateProject = async (projectData: CreateProjectRequest) => {
    try {
      const response = await projectService.createProject(projectData);
      
      if (response.success) {
        Alert.alert('Success', 'Project created successfully!');
        await loadProjects(); // Refresh project list
      } else {
        Alert.alert('Error', response.message || 'Failed to create project');
      }
    } catch (error: any) {
      console.error('Error creating project:', error);
      Alert.alert('Error', error.message || 'Failed to create project. Please try again.');
    }
  };



  // Filter projects based on search query and tab
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by tab selection
    if (selectedTab === 'completed') {
      return matchesSearch && project.status === ProjectStatus.COMPLETED;
    } else {
      // Show active projects (not completed)
      return matchesSearch && project.status !== ProjectStatus.COMPLETED;
    }
  });

  const handleDeleteProject = async (projectId: number) => {
    try {
      const response = await projectService.deleteProject(projectId);
      
      if (response.success) {
        Alert.alert('Success', 'Project deleted successfully');
        await loadProjects(); // Refresh project list
      } else {
        Alert.alert('Error', response.message || 'Failed to delete project');
      }
    } catch (error: any) {
      console.error('Error deleting project:', error);
      Alert.alert('Error', error.message || 'Failed to delete project');
    }
    setLongPressedProject(null);
  };

  const renderProjectCard = (project: Project) => (
    <TouchableOpacity 
      key={project.id} 
      style={[
        styles.projectCard,
        longPressedProject === project.id && styles.projectCardPressed
      ]}
      onLongPress={() => {
        setLongPressedProject(Number(project.id));
      }}
      onPress={() => {
        if (longPressedProject === Number(project.id)) {
          setLongPressedProject(null);
        } else {
          // Navigate to project detail screen with correct data structure
          navigation.navigate('ProjectDetail', { 
            project: project
          });
        }
      }}
      delayLongPress={500}
    >
      {/* Delete Overlay */}
      {longPressedProject === Number(project.id) && (
        <View style={styles.deleteOverlay}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setLongPressedProject(null)}
          >
            <MaterialIcons name="close" size={20} color={Colors.surface} />
          </TouchableOpacity>
          <View style={styles.deleteContent}>
            <MaterialIcons name="delete" size={24} color={Colors.surface} />
            <Text style={styles.deleteText}>Delete</Text>
          </View>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteProject(Number(project.id))}
          >
            <MaterialIcons name="delete" size={20} color={Colors.surface} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.projectCardHeader}>
        <Text style={styles.projectTitle}>{project.projectName}</Text>
        <View style={styles.teamSection}>
          <View style={styles.teamAvatars}>
            <View style={[styles.avatar, { backgroundColor: Colors.primary }]}>
              <Text style={styles.avatarText}>
                {project.user?.username?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            {project.memberCount && project.memberCount > 1 && (
              <View style={[styles.avatar, styles.additionalAvatar, { marginLeft: -8 }]}>
                <Text style={styles.additionalText}>+{project.memberCount - 1}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.projectDates}>
        <View style={styles.dateItem}>
          <MaterialIcons name="schedule" size={16} color={Colors.neutral.medium} />
          <Text style={styles.dateText}>
            {new Date(project.dateCreated).toLocaleDateString('en-US', { 
              month: '2-digit', 
              day: '2-digit', 
              year: 'numeric' 
            })}
          </Text>
        </View>
        <View style={styles.dateSeparator}>
          <View style={styles.separatorLine} />
          <MaterialIcons name="arrow-forward" size={16} color={Colors.neutral.medium} />
        </View>
        <View style={styles.dateItem}>
          <MaterialIcons name="event" size={16} color={Colors.primary} />
          <Text style={styles.dateText}>
            {new Date(project.dateModified).toLocaleDateString('en-US', { 
              month: '2-digit', 
              day: '2-digit', 
              year: 'numeric' 
            })}
          </Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <Text style={styles.progressText}>{project.userRole || 'Member'}</Text>
        <View style={styles.progressBar}>
          <Text style={styles.taskCount}>
            {project.memberCount || 1} member{(project.memberCount || 1) > 1 ? 's' : ''}
          </Text>
        </View>
        {project.description && (
          <Text style={styles.projectDescription} numberOfLines={1}>
            {project.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="chevron-left" size={24} color={Colors.neutral.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedWorkspace ? selectedWorkspace.name : 'Project'}
        </Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowDropdown(true)}
        >
          <MaterialIcons name="add" size={24} color={Colors.surface} />
        </TouchableOpacity>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={Colors.neutral.medium} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={Colors.neutral.medium}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabSection}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'projects' && styles.activeTabButton]}
          onPress={() => setSelectedTab('projects')}
        >
          <Text style={[styles.tabButtonText, selectedTab === 'projects' && styles.activeTabButtonText]}>
            Projects
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'completed' && styles.activeTabButton]}
          onPress={() => setSelectedTab('completed')}
        >
          <Text style={[styles.tabButtonText, selectedTab === 'completed' && styles.activeTabButtonText]}>
            Completed
          </Text>
        </TouchableOpacity>

      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshProjects}
            colors={[Colors.primary]}
          />
        }
      >
        <View style={styles.projectList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading projects...</Text>
            </View>
          ) : filteredProjects.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="folder-open" size={48} color={Colors.neutral.medium} />
              <Text style={styles.emptyTitle}>No projects found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Try adjusting your search' : 'Create your first project to get started'}
              </Text>
            </View>
          ) : (
            filteredProjects.map(renderProjectCard)
          )}
        </View>
      </ScrollView>



      {/* Create Action Dropdown */}
      <CreateActionDropdown
        visible={showDropdown}
        onClose={() => setShowDropdown(false)}
        onCreateProject={() => setShowCreateProjectModal(true)}
        onCreateTask={() => setShowCreateTaskModal(true)}
        onCreateEvent={() => setShowCreateEventModal(true)}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        visible={showCreateProjectModal}
        onClose={() => setShowCreateProjectModal(false)}
        onProjectCreated={handleCreateProject}
        workspaceId={String(selectedWorkspace?.id) || '0'}
        workspaceMembers={workspaceMembers}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        visible={showCreateTaskModal}
        onClose={() => setShowCreateTaskModal(false)}
        onCreateTask={(taskData: any) => {
          setShowCreateTaskModal(false);
          console.log('Task created:', taskData);
        }}
        isPersonalWorkspace={false}
        projectMembers={workspaceMembers}
      />

      {/* Create Event Modal */}
      <CreateEventModal
        visible={showCreateEventModal}
        onClose={() => setShowCreateEventModal(false)}
        onCreateEvent={(eventData: any) => {
          setShowCreateEventModal(false);
          console.log('Event created:', eventData);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60, // Account for status bar
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  addButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.light,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.neutral.dark,
  },
  tabSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    gap: 16,
  },
  tabButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: Colors.neutral.light,
  },
  activeTabButton: {
    backgroundColor: Colors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.medium,
  },
  activeTabButtonText: {
    color: Colors.surface,
  },
  scrollContent: {
    flex: 1,
  },
  projectList: {
    padding: 20,
    gap: 20,
  },
  projectCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  projectCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.dark,
    flex: 1,
  },
  teamSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  avatarText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  additionalAvatar: {
    backgroundColor: Colors.warning,
  },
  additionalText: {
    color: Colors.surface,
    fontSize: 10,
    fontWeight: '600',
  },
  projectDates: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    color: Colors.neutral.medium,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.neutral.light,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    minWidth: 40,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.neutral.light,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  taskCount: {
    fontSize: 14,
    color: Colors.neutral.medium,
    minWidth: 80,
    textAlign: 'right',
  },
  projectCardPressed: {
    opacity: 0.8,
  },
  deleteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(108, 99, 255, 0.9)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  deleteText: {
    color: Colors.surface,
    fontSize: 18,
    fontWeight: '600',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.neutral.medium,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.neutral.medium,
    textAlign: 'center',
  },
  projectDescription: {
    fontSize: 12,
    color: Colors.neutral.medium,
    fontStyle: 'italic',
  },
});

export default ProjectListScreen;
