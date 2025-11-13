import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { Project, ProjectMember, ProjectMemberRole } from '../types/Project';
import { MemberRole, WorkspaceMember } from '../types/Workspace';
import { Task } from '../types/Task';
import { CreateProjectModal, MemberSortDropdown, AddMemberModal, ProjectSettingModal, SwipeableMemberCard, TaskCardModern, CreateOptionsModal, TaskDetailModal } from '../components';
import type { CreateOption } from '../components/CreateOptionsModal';
import CalendarScreen from './CalendarScreen';
import ProjectNotificationModal from '../components/ProjectNotificationModal';
import { projectService, workspaceService } from '../services';
import { mockProject, mockTasks, mockProjectMembers, mockWorkspaceMembers } from '../services/sharedMockData';
import { getRoleColor } from '../styles/cardStyles';

interface ProjectDetailScreenProps {
  navigation: any;
  route: {
    params: {
      project: Project;
    };
  };
}

const ProjectDetailScreen: React.FC<ProjectDetailScreenProps> = ({ navigation, route }) => {
  const initialProject = route.params?.project;
  const [project, setProject] = useState<Project | null>(initialProject || mockProject);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showMemberSort, setShowMemberSort] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'members' | 'calendar' | 'settings'>('tasks');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTaskFilter, setActiveTaskFilter] = useState<'All' | 'Upcoming' | 'Overdue' | 'Completed'>('All');

  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  
  // Member management modals
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<ProjectMember | null>(null);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [selectedRole, setSelectedRole] = useState<ProjectMemberRole | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showProjectNotificationModal, setShowProjectNotificationModal] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showProjectSettingModal, setShowProjectSettingModal] = useState(false);

  // Task Detail Modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailVisible, setIsTaskDetailVisible] = useState(false);

  // Mock: Set current user as admin for testing
  const isCurrentUserAdmin = true;

  const handleCreateOptionSelect = (optionId: CreateOption) => {
    setShowCreateDropdown(false);

    switch (optionId) {
      case 'task':
        navigation.navigate('CreateTask', { projectMembers, projectId: String(project.id) });
        break;
      case 'project':
        setShowCreateProjectModal(true);
        break;
      case 'workspace':
        navigation.navigate('CreateWorkspace');
        break;
      case 'voice':
        // TODO: Implement voice feature
        console.log('Voice feature coming soon!');
        break;
      default:
        console.log(`Creating ${optionId}`);
    }
  };

  useEffect(() => {
    if (initialProject?.id) {
      const loadAll = async () => {
        try {
          setLoading(true);
          await Promise.all([
            loadProjectDetails(initialProject.id),
            loadNotificationCount(),
          ]);
          // Keep tasks as mock data for now
          setProjectTasks(mockTasks);
          // Load real project members
          try {
            const membersRes = await projectService.getProjectMembers(Number(initialProject.id));
            if (membersRes?.success && membersRes.data) {
              setProjectMembers(membersRes.data as any);
            }
          } catch (e) {
            console.error('Failed to load project members:', e);
          }
          // Load workspace members for AddMember modal mapping
          try {
            const wsId = Number((initialProject as any)?.workspaceId || (project as any)?.workspaceId);
            if (wsId && !isNaN(wsId)) {
              const wsMembersRes = await workspaceService.getWorkspaceMembers(wsId);
              if (wsMembersRes?.success && wsMembersRes.data) {
                setWorkspaceMembers(wsMembersRes.data as any);
              }
            }
          } catch (e) {
            console.error('Failed to load workspace members:', e);
          }
        } finally {
          setLoading(false);
        }
      };
      loadAll();
    }
  }, [initialProject?.id]);

  const loadNotificationCount = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await notificationService.getProjectNotificationCount(project.id);
      // setNotificationCount(response.data.count);
      
      // For now, use mock count (2 unread notifications)
      setNotificationCount(2);
    } catch (error) {
      console.error('Error loading notification count:', error);
      setNotificationCount(0);
    }
  };

  const loadProjectDetails = async (projectId: number | string) => {
    try {
      const response = await projectService.getProjectDetails(Number(projectId));
      if (response.success && response.data) {
        setProject(response.data);
        // API returns members inside project details
        if (response.data.members) {
          setProjectMembers(response.data.members);
        }
      } else {
        console.error('Failed to load project details:', response.message);
      }
    } catch (error: any) {
      console.error('Error loading project details:', error);
    }
  };




  // Member management functions
  const handleEditMemberRole = (newRole: ProjectMemberRole) => {
    if (!memberToEdit) return;
    
    setProjectMembers(prev => 
      prev.map(member => 
        member.id === memberToEdit.id 
          ? { ...member, role: newRole }
          : member
      )
    );
    
    setShowEditRoleModal(false);
    setMemberToEdit(null);
    setSelectedRole(null);
    
    // TODO: Call API to update member role
    console.log(`Updated ${memberToEdit.user.username} role to ${newRole}`);
  };

  const handleRoleSelect = (role: ProjectMemberRole) => {
    setSelectedRole(role);
    setShowRoleDropdown(false);
  };

  const handleSaveRole = () => {
    if (selectedRole && memberToEdit) {
      handleEditMemberRole(selectedRole);
    }
  };

  const handleAddMember = (memberId: number, role: ProjectMemberRole) => {
    // TODO: Call API to add member to project
    console.log(`Adding member ${memberId} with role ${role}`);
    
    // For now, just add to mock data
    const newMember: ProjectMember = {
      id: Date.now(), // Temporary ID
      projectId: project.id,
      userId: memberId,
      role: role,
      joinedAt: new Date(),
      user: {
        id: memberId,
        username: `user_${memberId}`, // Temporary username
        email: `user${memberId}@example.com`, // Temporary email
      }
    };
    
    setProjectMembers(prev => [...prev, newMember]);
  };

  const handleUpdateProject = (name: string, description: string) => {
    // TODO: Implement API call to update project
    // For now, just update local state
    setProject(prev => ({
      ...prev,
      projectName: name,
      description: description,
    }));
    setShowProjectSettingModal(false);
  };

  const handleDeleteMember = () => {
    if (!memberToEdit) return;
    
    setProjectMembers(prev => 
      prev.filter(member => member.id !== memberToEdit.id)
    );
    
    setShowDeleteConfirmModal(false);
    setMemberToEdit(null);
    
    // TODO: Call API to remove member from project
    console.log(`Removed ${memberToEdit.user.username} from project`);
  };

  const renderMemberCard = (member: ProjectMember) => {
    // Convert ProjectMember to WorkspaceMember format for MemberCard component
    const workspaceMember = {
      id: member.id,
      workspaceId: 1, // Default workspace ID
      userId: member.user.id,
      role: member.role as any, // Convert ProjectMemberRole to MemberRole
      joinedAt: member.joinedAt,
      user: {
        id: member.user.id,
        username: member.user.username,
        email: member.user.email,
        name: member.user.username, // Use username as name
      }
    };

    const currentUserRole = isCurrentUserAdmin ? MemberRole.OWNER : MemberRole.MEMBER;

    return (
      <SwipeableMemberCard
        key={member.id}
        member={workspaceMember}
        onPress={() => {
          // TODO: Navigate to member profile or show member details
          console.log('Member pressed:', member.id);
        }}
        showActions={isCurrentUserAdmin} // Only show actions for admin users
        currentUserRole={currentUserRole}
        onRemove={() => {
          setMemberToEdit(member);
          setShowDeleteConfirmModal(true);
        }}
        onEditRole={() => {
          setMemberToEdit(member);
          setSelectedRole(member.role);
          setShowEditRoleModal(true);
        }}
      />
    );
  };



  const renderTaskCard = (task: Task) => {
    // Convert Task to TaskSummary format for TaskCardModern
    const taskSummary = {
      id: task.id,
      title: task.title,
      description: task.description || '',
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      dueDate: task.dueDate,
      projectName: project.projectName,
      assigneeName: task.assignee || '',
      tags: task.tags || [],
      estimatedHours: (task as any).estimatedHours,
      actualHours: (task as any).actualHours,
    };
    
    return (
      <TaskCardModern
        key={task.id}
        task={taskSummary as any}
        onPress={() => {
          setSelectedTask(task);
          setIsTaskDetailVisible(true);
        }}
        onStatusPress={() => {
          // TODO: Handle status change
          console.log('Status pressed:', task.id);
        }}
        onAssigneePress={() => {
          // TODO: Handle assignee press
          console.log('Assignee pressed:', task.id);
        }}
      />
    );
  };

  if (loading || !project) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading project details...</Text>
      </View>
    );
  }

  const renderTabContent = () => {
    if (activeTab === 'tasks') {
      const filteredTasks = projectTasks.filter(task => {
        const matchesSearch = 
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesSearch) return false;

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        switch (activeTaskFilter) {
          case 'Upcoming':
            return task.status !== 'done' && task.dueDate && new Date(task.dueDate) >= now;
          case 'Overdue':
            return task.status !== 'done' && task.dueDate && new Date(task.dueDate) < now;
          case 'Completed':
            return task.status === 'done';
          case 'All':
          default:
            return true;
        }
      });

      return (
        <View style={styles.tabContent}>
          <View style={styles.taskHeader}>
            <View style={styles.taskSearchContainer}>
              <MaterialIcons name="search" size={22} color={Colors.neutral.medium} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search tasks..."
                placeholderTextColor={Colors.neutral.medium}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <View style={styles.taskFilterContainer}>
              {(['All', 'Upcoming', 'Overdue', 'Completed'] as const).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterChip,
                    activeTaskFilter === filter && styles.activeFilterChip,
                  ]}
                  onPress={() => setActiveTaskFilter(filter)}
                >
                  <Text style={[
                    styles.filterChipText,
                    activeTaskFilter === filter && styles.activeFilterChipText,
                  ]}>{filter}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {filteredTasks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="search-off" size={32} color={Colors.neutral.medium} />
              <Text style={styles.emptyTitle}>No tasks match</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search or filter</Text>
            </View>
          ) : (
            <View style={styles.tasksList}>
              {filteredTasks.map((task) => renderTaskCard(task))}
            </View>
          )}
        </View>
      );
    } else if (activeTab === 'calendar') {
      // Filter tasks to only this project
      const projectTasksForCalendar = projectTasks.filter(t => !t.project || t.project === project.projectName);
      return (
        <CalendarScreen
          navigation={navigation}
          route={{ params: { tasks: projectTasksForCalendar, timeTrackings: [] } }}
        />
      );
    } else {
      return (
        <View style={styles.tabContent}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading members...</Text>
            </View>
          ) : projectMembers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="group" size={32} color={Colors.neutral.medium} />
              <Text style={styles.emptyTitle}>No members found</Text>
              <Text style={styles.emptySubtitle}>Invite members to collaborate on this project</Text>
            </View>
          ) : (
            <View style={styles.membersSection}>
              <View style={styles.membersHeader}>
                <Text style={styles.membersTitle}>Members ({projectMembers.length})</Text>
                {true && ( // TODO: Check if current user is admin
                  <TouchableOpacity 
                    style={styles.addMemberButton}
                    onPress={() => {
                      setShowAddMemberModal(true);
                    }}
                  >
                    <MaterialIcons name="person-add" size={16} color={Colors.surface} />
                    <Text style={styles.addMemberButtonText}>Add Member</Text>
                  </TouchableOpacity>
                )}
              </View>
            <View style={styles.membersGrid}>
              {projectMembers.map(renderMemberCard)}
              </View>
            </View>
          )}
        </View>
      );
    }
  };



  return (
    <View style={styles.container}>
      {/* Header - only show on Tasks tab */}
      {activeTab === 'tasks' && (
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="keyboard-arrow-left" size={32} color={Colors.neutral.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{project?.projectName || 'Project Detail'}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => {
                setShowProjectNotificationModal(true);
              }}
            >
              <MaterialIcons name="notifications" size={28} color={Colors.neutral.dark} />
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

        {/* Tab Content */}
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={true}>
        {renderTabContent()}
      </ScrollView>

      {/* Footer Tab Navigator */}
      <View style={styles.footerTabSection}>
        <TouchableOpacity
          style={styles.footerTabButton}
          onPress={() => setActiveTab('tasks')}
        >
          <MaterialIcons name="assignment" size={24} color={activeTab === 'tasks' ? Colors.primary : Colors.neutral.medium} />
          <Text style={[styles.footerTabButtonText, activeTab === 'tasks' && styles.activeFooterTabButtonText]}>
            Tasks
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerTabButton}
          onPress={() => setActiveTab('calendar')}
        >
          <MaterialIcons name="event" size={24} color={activeTab === 'calendar' ? Colors.primary : Colors.neutral.medium} />
          <Text style={[styles.footerTabButtonText, activeTab === 'calendar' && styles.activeFooterTabButtonText]}>
            Calendar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerTabButton}
          onPress={() => setShowCreateDropdown(true)}
        >
          <MaterialIcons name="add" size={24} color={Colors.neutral.medium} />
          <Text style={styles.footerTabButtonText}>
            Create
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerTabButton}
          onPress={() => setActiveTab('members')}
        >
          <MaterialIcons name="group" size={24} color={activeTab === 'members' ? Colors.primary : Colors.neutral.medium} />
          <Text style={[styles.footerTabButtonText, activeTab === 'members' && styles.activeFooterTabButtonText]}>
            Members
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerTabButton}
          onPress={() => {
            navigation.navigate('ProjectSettings', { project });
          }}
        >
          <MaterialIcons name="settings" size={24} color={Colors.neutral.medium} />
          <Text style={styles.footerTabButtonText}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Create Options Modal */}
      <CreateOptionsModal
        visible={showCreateDropdown}
        onClose={() => setShowCreateDropdown(false)}
        onOptionSelect={handleCreateOptionSelect}
        allowedOptions={['voice','task']}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        visible={showCreateProjectModal}
        onClose={() => setShowCreateProjectModal(false)}
        workspaceId={Number(project?.workspaceId || route?.params?.project?.workspaceId || 0)}
        onProjectCreated={() => {
          setShowCreateProjectModal(false);
        }}
      />

      {/* Create Task and Event are now separate screens */}

      {/* Member Sort Dropdown */}
      <MemberSortDropdown
        visible={showMemberSort}
        onClose={() => setShowMemberSort(false)}
        onSelect={setSelectedMember}
        members={projectMembers.map(m => ({ 
          id: m.id.toString(), 
          name: m.user.username, 
          username: m.user.username 
        }))}
        selectedMember={selectedMember}
      />

      {/* Edit Member Role Modal */}
      <Modal
        visible={showEditRoleModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditRoleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.compactModalContainer}>
            <Text style={styles.compactModalTitle}>Edit Role</Text>
            
            <View style={styles.memberInfoCompact}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberInitial}>
                  {memberToEdit?.user.username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberInfoText}>
                <Text style={styles.memberNameCompact}>{memberToEdit?.user.username}</Text>
                <Text style={styles.memberEmailCompact}>{memberToEdit?.user.email}</Text>
              </View>
            </View>
            
            <View style={styles.roleSelection}>
              <Text style={styles.roleLabel}>Role</Text>
              <TouchableOpacity
                style={styles.roleDropdown}
                onPress={() => setShowRoleDropdown(!showRoleDropdown)}
              >
                <View style={styles.roleDropdownContent}>
                  <View style={[
                    styles.roleIndicator,
                    { backgroundColor: getRoleColor(selectedRole || memberToEdit?.role || ProjectMemberRole.MEMBER) }
                  ]} />
                  <Text style={styles.roleDropdownText}>
                    {selectedRole || memberToEdit?.role || 'MEMBER'}
                  </Text>
                </View>
                <MaterialIcons 
                  name={showRoleDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                  size={24} 
                  color={Colors.neutral.medium} 
                />
              </TouchableOpacity>
              
              {showRoleDropdown && (
                <View style={styles.roleDropdownMenu}>
                  <TouchableOpacity
                    style={styles.roleDropdownItem}
                    onPress={() => handleRoleSelect(ProjectMemberRole.ADMIN)}
                  >
                    <View style={[styles.roleIndicator, { backgroundColor: Colors.primary }]} />
                    <Text style={styles.roleDropdownItemText}>Admin</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.roleDropdownItem}
                    onPress={() => handleRoleSelect(ProjectMemberRole.MEMBER)}
                  >
                    <View style={[styles.roleIndicator, { backgroundColor: Colors.warning }]} />
                    <Text style={styles.roleDropdownItemText}>Member</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            <View style={styles.compactModalActions}>
              <TouchableOpacity
                style={styles.compactCancelButton}
                onPress={() => setShowEditRoleModal(false)}
              >
                <Text style={styles.compactCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.compactSaveButton}
                onPress={handleSaveRole}
              >
                <Text style={styles.compactSaveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Member Confirmation Modal */}
      <Modal
        visible={showDeleteConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.compactModalContainer}>
            <View style={styles.deleteIconContainer}>
              <MaterialIcons name="delete" size={32} color={Colors.error} />
            </View>
            
            <Text style={styles.compactModalTitle}>Remove Member</Text>
            <Text style={styles.compactModalSubtitle}>
              Remove {memberToEdit?.user.username} from this project?
            </Text>
            
            <View style={styles.compactModalActions}>
              <TouchableOpacity
                style={styles.compactCancelButton}
                onPress={() => setShowDeleteConfirmModal(false)}
              >
                <Text style={styles.compactCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.compactDeleteButton}
                onPress={handleDeleteMember}
              >
                <Text style={styles.compactDeleteButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Member Modal */}
      <AddMemberModal
        visible={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onAddMember={handleAddMember}
        workspaceMembers={workspaceMembers}
        projectMembers={projectMembers}
      />

      {/* Project Notification Modal */}
      <ProjectNotificationModal
        visible={showProjectNotificationModal}
        onClose={() => setShowProjectNotificationModal(false)}
        projectId={project.id}
        projectName={project.projectName}
      />

      {/* Project Setting Modal */}
      <ProjectSettingModal
        visible={showProjectSettingModal}
        onClose={() => setShowProjectSettingModal(false)}
        projectName={project.projectName}
        projectDescription={project.description || ''}
        onUpdateProject={handleUpdateProject}
        isAdmin={isCurrentUserAdmin}
      />

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask as any}
          visible={isTaskDetailVisible}
          onClose={() => setIsTaskDetailVisible(false)}
          onUpdateTask={(updatedTask) => {
            setProjectTasks(prevTasks => 
              prevTasks.map(t => t.id === updatedTask.id ? updatedTask as Task : t)
            );
          }}
          onDeleteTask={(taskId) => {
            setProjectTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
          }}
        />
      )}

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
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.neutral.dark,
    marginRight: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  content: {
    flex: 1,
  },
  moreActionsButton: {
    padding: 4,
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.neutral.light,
    borderRadius: 16,
    gap: 6,
    flex: 1,
  },
  sortLabel: {
    fontSize: 12,
    color: Colors.neutral.medium,
    fontWeight: '500',
    flex: 1,
  },
  datesSection: {
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.neutral.light,
  },
  descriptionSection: {
    marginBottom: 8,
  },
  projectDescription: {
    fontSize: 16,
    color: Colors.neutral.medium,
    lineHeight: 24,
  },
  infoCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: Colors.neutral.light + '40',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  infoCardLabel: {
    fontSize: 12,
    color: Colors.neutral.medium,
    fontWeight: '500',
  },
  infoCardValue: {
    fontSize: 14,
    color: Colors.neutral.dark,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.neutral.medium,
    marginLeft: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.neutral.medium,
    textAlign: 'center',
  },

  footerTabSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.light,
    paddingBottom: 20, // Safe area for home indicator
  },
  footerTabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  footerTabButtonText: {
    fontSize: 12,
    color: Colors.neutral.medium,
    marginTop: 4,
  },
  activeFooterTabButtonText: {
    color: Colors.primary,
    fontWeight: '600',
  },

  // Tasks tab header (search + filters)
  taskHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: Colors.background,
  },
  taskSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.neutral.dark,
    paddingVertical: 4,
  },
  taskFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeFilterChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  activeFilterChipText: {
    color: Colors.neutral.white,
  },

  tabContent: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tasksList: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
  },
  filterChipText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  filterClearIcon: {
    marginLeft: 4,
  },
  notificationButton: {
    padding: 4,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  notificationBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.surface,
  },
  membersSection: {
    paddingHorizontal: 16,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  membersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addMemberButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.surface,
  },
  membersGrid: {
    gap: 8,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: Colors.neutral.medium,
    marginBottom: 24,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 14,
    color: Colors.error,
    marginBottom: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  memberInfoSection: {
    marginBottom: 24,
  },
  infoField: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.medium,
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
    color: Colors.neutral.dark,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
  },
  roleDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
  },
  roleDropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roleIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  roleDropdownText: {
    fontSize: 16,
    color: Colors.neutral.dark,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.surface,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral.medium,
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.surface,
  },
  
  // Compact Modal Styles
  compactModalContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 380,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  compactModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.dark,
    textAlign: 'center',
    marginBottom: 20,
  },
  compactModalSubtitle: {
    fontSize: 13,
    color: Colors.neutral.medium,
    textAlign: 'center',
    marginBottom: 20,
  },
  memberInfoCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  memberAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  memberInitial: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.surface,
  },
  memberInfoText: {
    flex: 1,
  },
  memberNameCompact: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 1,
  },
  memberEmailCompact: {
    fontSize: 13,
    color: Colors.neutral.medium,
  },
  roleSelection: {
    marginBottom: 16,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.medium,
    marginBottom: 6,
  },
  roleDropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
  },
  roleDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  roleDropdownItemText: {
    fontSize: 16,
    color: Colors.neutral.dark,
    fontWeight: '500',
  },
  compactModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  compactCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    alignItems: 'center',
  },
  compactCancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.medium,
  },
  compactSaveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  compactSaveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.surface,
  },
  compactDeleteButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: 'center',
  },
  compactDeleteButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.surface,
  },
  deleteIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },

  // Dropdown styles
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  dropdownBottomSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 9999,
    zIndex: 10000,
  },
  dropdownHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.neutral.light,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  dropdownContent: {
    paddingTop: 2,
  },
  dropdownOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  dropdownOptionText: {
    fontSize: 16,
    color: Colors.neutral.dark,
    textAlign: 'center',
  },
  lastDropdownOption: {
    borderBottomWidth: 0,
  },
});

export default ProjectDetailScreen;
