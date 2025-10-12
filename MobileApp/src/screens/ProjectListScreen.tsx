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
import { CreateProjectModal, ProjectCard } from '../components';
import { CreateProjectRequest, Project, ProjectStatus } from '../types/Project';
import { WorkspaceMember } from '../types/Workspace';
import { projectService, workspaceService } from '../services';
import { useToastContext } from '../context/ToastContext';
import { cardStyles } from '../styles/cardStyles';

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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { showSuccess, showError } = useToastContext();
  const [highlightProjectId, setHighlightProjectId] = useState<number | undefined>(undefined);
  
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

  const handleCreateProject = async (projectData: CreateProjectRequest, memberUserIds: number[] = []) => {
    try {
      const response = await projectService.createProject(projectData);
      
      if (response.success) {
        showSuccess('Project created successfully');
        setShowCreateProjectModal(false);
        // Add assigned members for visibility across accounts
        try {
          const createdProjectId = Number(response.data?.id);
          if (createdProjectId && Array.isArray(memberUserIds) && memberUserIds.length > 0) {
            let memberRoleId: number | undefined;
            try {
              const details = await projectService.getProjectDetails(createdProjectId);
              const roles = (details.data as any)?.projectRoles as any[] | undefined;
              memberRoleId = roles?.find(r => String(r.roleName).toLowerCase() === 'member')?.id
                || roles?.find(r => r.roleName && r.roleName !== 'Admin')?.id;
              if (!memberRoleId) {
                const createdRole = await projectService.createProjectRole(createdProjectId, 'Member', 'Default member role');
                memberRoleId = createdRole?.id;
              }
            } catch {}
            // Invite members by email based on workspaceMembers mapping
            const idToEmail: Record<number, string> = {};
            for (const m of workspaceMembers) {
              const uid = Number(m.user.id);
              if (!isNaN(uid)) idToEmail[uid] = m.user.email;
            }
            for (const uid of memberUserIds) {
              const email = idToEmail[Number(uid)];
              if (email) {
                // Directly add member to project (no accept needed)
                if (memberRoleId) {
                  await projectService.addMemberToProject(createdProjectId, Number(uid), memberRoleId);
                }
              }
            }
            // Trigger in-app notifications for added members
            const emails = memberUserIds.map(uid => idToEmail[Number(uid)]).filter(Boolean) as string[];
            if (emails.length > 0) {
              try {
                const { notificationService } = await import('../services/notificationService');
                await notificationService.createProjectInviteNotification({ projectId: createdProjectId, emails });
              } catch {}
            }
          }
        } catch {}
        setHighlightProjectId(response.data?.id);
        await loadProjects(); // Refresh project list
      } else {
        showError(response.message || 'Failed to create project');
      }
    } catch (error: any) {
      console.error('Error creating project:', error);
      showError(error.message || 'Failed to create project. Please try again.');
    }
  };



  // Filter + sort projects based on search query and tab
  const filteredProjects = [...projects]
    .sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime())
    .filter(project => {
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
    <View key={project.id} style={styles.projectCardWrapper}>
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

      <ProjectCard
        project={project}
        onPress={() => {
          if (longPressedProject === Number(project.id)) {
            setLongPressedProject(null);
          } else {
            navigation.navigate('ProjectDetail', { project: project });
          }
        }}
        showProgress={true}
        progressPercentage={50}
        completedTasks={24}
        totalTasks={48}
      />
    </View>
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
          onPress={() => setShowCreateProjectModal(true)}
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
        <TouchableOpacity style={styles.filterButton}>
          <MaterialIcons name="tune" size={20} color={Colors.neutral.medium} />
        </TouchableOpacity>
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
        showsVerticalScrollIndicator={true}
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




      {/* Create Project Modal */}
      <CreateProjectModal
        visible={showCreateProjectModal}
        onClose={() => setShowCreateProjectModal(false)}
        onCreateProject={handleCreateProject}
        workspaceId={String(selectedWorkspace?.id) || '0'}
        workspaceMembers={workspaceMembers}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.neutral.dark,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  activeTabButton: {
    backgroundColor: Colors.primary + '20',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.medium,
  },
  activeTabButtonText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  projectList: {
    padding: 20,
    gap: 6,
  },
  projectCardWrapper: {
    position: 'relative',
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
