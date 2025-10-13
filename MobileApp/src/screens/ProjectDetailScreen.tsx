import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { Project, ProjectMember, ProjectMemberRole } from '../types/Project';
import { MemberRole } from '../types/Workspace';
import { Task, TaskStatus } from '../types/Task';
import { CreateTaskEventDropdown, CreateTaskModal, CreateEventModal, CreateProjectModal, MemberSortDropdown, TaskCard, AddMemberModal, ProjectSettingModal, SwipeableMemberCard, TaskFilterDropdown } from '../components';
import ProjectNotificationModal from '../components/ProjectNotificationModal';
import { projectService } from '../services';
import { mockProject, mockProjectMembers, mockTasks } from '../services/sharedMockData';
import { getRoleColor, getDeadlineStyle } from '../styles/cardStyles';

interface ProjectDetailScreenProps {
  navigation: any;
  route: {
    params: {
      project: Project;
    };
  };
}

const ProjectDetailScreen: React.FC<ProjectDetailScreenProps> = ({ navigation, route }) => {
  // Use mock data for testing UI
  const [project, setProject] = useState<Project>(mockProject);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showMemberSort, setShowMemberSort] = useState(false);

  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>(mockProjectMembers);
  const [projectTasks, setProjectTasks] = useState<Task[]>(mockTasks);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'members'>('tasks');
  
  // Mock workspace members for AddMemberModal
  const [workspaceMembers] = useState([
    {
      id: 1,
      workspaceId: 1,
      userId: 1,
      role: MemberRole.OWNER,
      joinedAt: new Date('2024-01-01'),
      user: {
        id: 1,
        username: 'john_doe',
        email: 'john.doe@example.com',
        name: 'John Doe',
      }
    },
    {
      id: 2,
      workspaceId: 1,
      userId: 2,
      role: MemberRole.MEMBER,
      joinedAt: new Date('2024-01-02'),
      user: {
        id: 2,
        username: 'jane_smith',
        email: 'jane.smith@example.com',
        name: 'Jane Smith',
      }
    },
    {
      id: 3,
      workspaceId: 1,
      userId: 3,
      role: MemberRole.MEMBER,
      joinedAt: new Date('2024-01-03'),
      user: {
        id: 3,
        username: 'mike_johnson',
        email: 'mike.johnson@example.com',
        name: 'Mike Johnson',
      }
    },
    {
      id: 4,
      workspaceId: 1,
      userId: 4,
      role: MemberRole.MEMBER,
      joinedAt: new Date('2024-01-05'),
      user: {
        id: 4,
        username: 'sarah_wilson',
        email: 'sarah.wilson@example.com',
        name: 'Sarah Wilson',
      }
    },
    {
      id: 5,
      workspaceId: 1,
      userId: 5,
      role: MemberRole.MEMBER,
      joinedAt: new Date('2024-01-08'),
      user: {
        id: 5,
        username: 'alex_brown',
        email: 'alex.brown@example.com',
        name: 'Alex Brown',
      }
    },
    {
      id: 6,
      workspaceId: 1,
      userId: 6,
      role: MemberRole.MEMBER,
      joinedAt: new Date('2024-01-10'),
      user: {
        id: 6,
        username: 'emma_davis',
        email: 'emma.davis@example.com',
        name: 'Emma Davis',
      }
    },
    {
      id: 7,
      workspaceId: 1,
      userId: 7,
      role: MemberRole.MEMBER,
      joinedAt: new Date('2024-01-12'),
      user: {
        id: 7,
        username: 'david_miller',
        email: 'david.miller@example.com',
        name: 'David Miller',
      }
    }
  ]);
  
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
  const [showTaskFilter, setShowTaskFilter] = useState(false);
  const [taskFilter, setTaskFilter] = useState({ priority: 'All', dueDate: 'All', assigneeId: null } as any);

  const getFilteredTasks = () => {
    const tasks = projectTasks;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return tasks.filter((t) => {
      // priority
      if (taskFilter.priority !== 'All') {
        const p = String(t.priority || '').toLowerCase();
        const want = String(taskFilter.priority || '').toLowerCase();
        if (p !== want) return false;
      }
      // assignee
      if (taskFilter.assigneeId) {
        if (String(t.assignee || '') !== String(taskFilter.assigneeId)) return false;
      }
      // due date
      const due = t.dueDate ? new Date(t.dueDate) : null;
      switch (taskFilter.dueDate) {
        case 'Overdue':
          if (!(due && due < new Date(now.getFullYear(), now.getMonth(), now.getDate()))) return false;
          break;
        case 'Today':
          if (!(due && due.toDateString() === new Date().toDateString())) return false;
          break;
        case 'Tomorrow': {
          const tm = new Date();
          tm.setDate(tm.getDate() + 1);
          if (!(due && due.toDateString() === tm.toDateString())) return false;
          break;
        }
        case 'ThisWeek':
          if (!(due && due >= startOfWeek && due < endOfWeek)) return false;
          break;
        case 'NextWeek': {
          const ns = new Date(endOfWeek);
          const ne = new Date(endOfWeek);
          ne.setDate(ne.getDate() + 7);
          if (!(due && due >= ns && due < ne)) return false;
          break;
        }
        case 'NoDue':
          if (due) return false;
          break;
        default:
          break;
      }
      return true;
    });
  };

  // Mock: Set current user as admin for testing
  const isCurrentUserAdmin = true;

  // Load project details, members and tasks on component mount
  useEffect(() => {
    // Using mock data, no need to load from API
    // loadProjectDetails();
    
    // Load notification count
    loadNotificationCount();
    // loadProjectMembers();
    // loadProjectTasks();
  }, []);

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

  const loadProjectDetails = async () => {
    try {
      const response = await projectService.getProjectDetails(Number(project.id));
      
      if (response.success) {
        setProject(response.data);
      } else {
        console.error('Failed to load project details:', response.message);
      }
    } catch (error: any) {
      console.error('Error loading project details:', error);
    }
  };

  const loadProjectMembers = async () => {
    try {
      setLoading(true);
      const response = await projectService.getProjectMembers(Number(project.id));
      
      if (response.success) {
        setProjectMembers(response.data);
      } else {
        console.error('Failed to load project members:', response.message);
      }
    } catch (error: any) {
      console.error('Error loading project members:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectTasks = async () => {
    try {
      // Using mock data from mockData.ts
      setProjectTasks(mockTasks);
    } catch (error: any) {
      console.error('Error loading project tasks:', error);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
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

  const renderTaskCard = ({ item }: { item: Task }) => (
    <TaskCard
      task={item}
      onPress={() => {
        // TODO: Navigate to task detail
        console.log('Task pressed:', item.id);
      }}
      onStatusChange={() => {}} // Not used anymore
    />
  );

  const renderTabContent = () => {
    if (activeTab === 'tasks') {
      return (
        <View style={styles.tabContent}>
          {/* Single filter chip */}
          <View style={styles.filterBar}>
            <TouchableOpacity style={styles.filterChip} onPress={() => setShowTaskFilter(true)}>
              <MaterialIcons name="filter-alt" size={16} color={Colors.primary} />
              <Text style={styles.filterChipText}>Filter</Text>
            </TouchableOpacity>
          </View>
          {projectTasks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="assignment" size={32} color={Colors.neutral.medium} />
              <Text style={styles.emptyTitle}>No tasks found</Text>
              <Text style={styles.emptySubtitle}>Create your first task to get started</Text>
            </View>
          ) : (
            (() => {
              const filtered = getFilteredTasks();
              if (filtered.length === 0) {
                return (
                  <View style={styles.emptyContainer}>
                    <MaterialIcons name="filter-list" size={32} color={Colors.neutral.medium} />
                    <Text style={styles.emptyTitle}>No tasks match current filters</Text>
                    <TouchableOpacity style={styles.clearFilterBtn} onPress={() => setTaskFilter({ priority: 'All', dueDate: 'All', assigneeId: null } as any)}>
                      <Text style={styles.clearFilterText}>Clear filter</Text>
                    </TouchableOpacity>
                  </View>
                );
              }
              return (
            <View style={styles.tasksList}>
                  {filtered.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onPress={() => {
                    console.log('Task pressed:', task.id);
                  }}
                      onStatusChange={() => {}}
                />
              ))}
            </View>
              );
            })()
          )}
        </View>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="keyboard-arrow-left" size={24} color={Colors.neutral.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Project detail</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowDropdown(true)}
        >
          <MaterialIcons name="add" size={24} color={Colors.surface} />
        </TouchableOpacity>
      </View>

        {/* Project Info */}
        <View style={styles.projectInfo}>
          <View style={styles.projectHeader}>
          <View style={styles.projectLeft}>
              <Text style={styles.projectTitle}>{project.projectName}</Text>
            </View>
          <View style={styles.projectActions}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => {
                setShowProjectNotificationModal(true);
              }}
            >
              <MaterialIcons name="notifications" size={24} color={Colors.neutral.dark} />
              {/* Notification badge */}
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            {isCurrentUserAdmin && (
            <TouchableOpacity 
              style={styles.moreActionsButton}
                onPress={() => setShowProjectSettingModal(true)}
            >
              <MaterialIcons name="more-vert" size={24} color={Colors.neutral.dark} />
            </TouchableOpacity>
            )}
          </View>
            </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabSection}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'tasks' && styles.activeTabButton]}
            onPress={() => setActiveTab('tasks')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'tasks' && styles.activeTabButtonText]}>
              All Tasks
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'members' && styles.activeTabButton]}
            onPress={() => setActiveTab('members')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'members' && styles.activeTabButtonText]}>
              Members
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={true}>
        {renderTabContent()}
      </ScrollView>

      {/* Create Task/Event Dropdown */}
      <CreateTaskEventDropdown
        visible={showDropdown}
        onClose={() => setShowDropdown(false)}
        onCreateTask={() => setShowCreateTaskModal(true)}
        onCreateEvent={() => setShowCreateEventModal(true)}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        visible={showCreateProjectModal}
        onClose={() => setShowCreateProjectModal(false)}
        onProjectCreated={(project: any) => {
          setShowCreateProjectModal(false);
          console.log('Project created:', project);
        }}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        visible={showCreateTaskModal}
        onClose={() => setShowCreateTaskModal(false)}
        onCreateTask={(taskData: any) => {
          setShowCreateTaskModal(false);
          console.log('Task created:', taskData);
        }}
        projectId={String(project.id)}
        projectMembers={projectMembers}
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

      {/* Task Filter Dropdown */}
      <TaskFilterDropdown
        visible={showTaskFilter}
        onClose={() => setShowTaskFilter(false)}
        value={taskFilter}
        onChange={setTaskFilter}
        assignees={projectMembers.map(m => ({ id: String(m.user.id), name: m.user.username }))}
      />

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
    paddingTop: 60,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flex: 1,
  },
  projectInfo: {
    padding: 12,
    backgroundColor: Colors.surface,
  },
  titleSection: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.neutral.dark,
    marginBottom: 4,
  },
  adminText: {
    fontSize: 14,
    color: Colors.neutral.medium,
    fontWeight: '500',
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  clearFilterBtn: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  clearFilterText: {
    color: Colors.surface,
    fontWeight: '600',
  },
  tabSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
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
  tabContent: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tasksList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
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
  projectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  projectActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  notificationBadgeText: {
    fontSize: 12,
    fontWeight: '600',
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
});

export default ProjectDetailScreen;
