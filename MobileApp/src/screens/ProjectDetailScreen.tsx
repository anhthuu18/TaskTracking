import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Alert,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../constants/Colors';
import { Project, ProjectMember, ProjectMemberRole } from '../types/Project';
import { MemberRole, WorkspaceMember, WorkspaceType } from '../types/Workspace';
import { Task, TimeTracking } from '../types/Task';
import {
  CreateProjectModal,
  MemberSortDropdown,
  AddMemberModal,
  ProjectSettingModal,
  SwipeableMemberCard,
  TaskCardModern,
  CreateOptionsModal,
  TaskDetailModal,
} from '../components';
import type { CreateOption } from '../components/CreateOptionsModal';
import CalendarScreen from './CalendarScreen';
import ProjectNotificationModal from '../components/ProjectNotificationModal';
import ProjectSettingsScreen from './ProjectSettingsScreen';
import { projectService, workspaceService, taskService } from '../services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRoleColor } from '../styles/cardStyles';
import { useToastContext } from '../context/ToastContext';

interface ProjectDetailScreenProps {
  navigation: any;
  route: {
    params: {
      project: Project;
      initialTab?: 'tasks' | 'members' | 'calendar' | 'settings';
    };
  };
}

const ProjectDetailScreen: React.FC<ProjectDetailScreenProps> = ({ navigation, route }) => {
  const { project: initialProject, initialTab = 'tasks' } = route.params;
  const { showSuccess, showError } = useToastContext();

  const [project, setProject] = useState<Project | null>(initialProject);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [projectRoles, setProjectRoles] = useState<any[]>([]);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'members' | 'calendar' | 'settings'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTaskFilter, setActiveTaskFilter] = useState<'All' | 'Upcoming' | 'Overdue' | 'Completed'>('All');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  const [workspaceInfo, setWorkspaceInfo] = useState<{ name: string; type?: WorkspaceType | string } | null>(null);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);

  // Modals and dropdowns state
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showProjectSettingModal, setShowProjectSettingModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailVisible, setIsTaskDetailVisible] = useState(false);

  // Current user for delete permission
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);

  // Determine if current user can manage members (Owner/Admin)
  const canManageMembers = useMemo(() => {
    if (!currentUserId) return false;
    const me = projectMembers.find(m => m.userId === currentUserId);
    return me?.role === ProjectMemberRole.OWNER || me?.role === ProjectMemberRole.ADMIN;
  }, [projectMembers, currentUserId]);

  // Helper function to convert numeric priority to string priority
  const convertPriorityToString = (priority: number): 'low' | 'medium' | 'high' | 'urgent' => {
    switch (priority) {
      case 5:
        return 'urgent';
      case 4:
        return 'high';
      case 3:
        return 'medium';
      case 2:
      case 1:
      default:
        return 'low';
    }
  };

  const handleCreateOptionSelect = (optionId: CreateOption) => {
    setShowCreateDropdown(false);
    switch (optionId) {
      case 'task':
        // Use the project state which is guaranteed to be updated
        if (project?.id) {
          navigation.navigate('CreateTask', {
            projectId: Number(project.id),
            // Pass workspaceType if available; CreateTaskScreen will resolve if missing
            workspaceType: (project as any)?.workspace?.workspaceType || (workspaceInfo?.type as any),
          } as any);
        }
        break;
      case 'project':
        // This would typically be handled in a different screen
        break;
      case 'workspace':
        navigation.navigate('CreateWorkspace');
        break;
    }
  };

  const loadProjectTasks = useCallback(async (id: number) => {
    try {
      setLoadingTasks(true);
      const tasks = await taskService.getTasksByProject(id);
      setProjectTasks(tasks || []);
    } catch (error: any) {
      showError(`Failed to load tasks: ${error.message}`);
      setProjectTasks([]); // Clear tasks on error
    } finally {
      setLoadingTasks(false);
    }
  }, [showError]);

  // Load current user for delete permission
  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await AsyncStorage.getItem('user');
        if (stored) {
          const u = JSON.parse(stored);
          if (u?.id) setCurrentUserId(Number(u.id));
          if (u?.username) setCurrentUsername(u.username);
          if (u?.email) setCurrentEmail(u.email);
        }
      } catch {}
    };
    loadUser();
  }, []);

  const loadInitialData = useCallback(async (id: number) => {
    try {
      setLoading(true);
      // Fetch project details, which also contains members and workspace info
      const response = await projectService.getProjectDetails(id);
      if (response.success && response.data) {
        const proj = response.data;
        setProject(proj);
        setProjectMembers((proj as any).members || []);
        setProjectRoles((proj as any).projectRoles || []);
        if (proj.workspace) {
          setWorkspaceInfo({
            name: proj.workspace.workspaceName,
            type: proj.workspace.workspaceType,
          });
          // Fetch full workspace member list cho Add Member modal chỉ khi bạn là Admin/Owner
          const myRole = (proj as any).members?.find((m: any) => m.userId === currentUserId)?.role;
          const isAdminOrOwner = myRole === ProjectMemberRole.ADMIN || myRole === ProjectMemberRole.OWNER;
          if (isAdminOrOwner) {
            const wsMembersRes = await workspaceService.getWorkspaceMembers(proj.workspace.id);
            if (wsMembersRes.success && wsMembersRes.data) {
              setWorkspaceMembers(wsMembersRes.data as any);
            }
          } else {
            setWorkspaceMembers([] as any);
          }
        }
      } else {
        showError(response.message || 'Failed to load project details');
      }
      // Fetch tasks separately
      await loadProjectTasks(id);
    } catch (error: any) {
      showError(`Error loading project data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [showError, loadProjectTasks]);

  useEffect(() => {
    if (initialProject?.id) {
      loadInitialData(initialProject.id);
    }
  }, [initialProject?.id, loadInitialData]);

  // Reload tasks when the screen is focused
  useFocusEffect(
    useCallback(() => {
      if (project?.id) {
        loadProjectTasks(project.id);
      }
    }, [project?.id, loadProjectTasks])
  );

  const canDeleteTask = (task: Task): boolean => {
    const ids = projectMembers.map(m => m.userId);
    const usernames = projectMembers.map(m => m.user?.username).filter(Boolean) as string[];
    const emails = projectMembers.map(m => m.user?.email).filter(Boolean) as string[];
    if (currentUserId && ids.includes(currentUserId)) return true;
    if (currentUsername && usernames.includes(currentUsername)) return true;
    if (currentEmail && emails.includes(currentEmail)) return true;
    return false;
  };

  const confirmAndDeleteTask = (task: Task) => {
    if (!canDeleteTask(task)) return;
    Alert.alert(
      'Xóa task',
      'Bạn có chắc muốn xóa task này? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await taskService.deleteTask(Number(task.id));
              setProjectTasks(prev => prev.filter(t => t.id !== task.id));
              showSuccess('Đã xóa task');
            } catch (e: any) {
              showError(e?.message || 'Xóa task thất bại');
            }
          },
        },
      ]
    );
  };

  const convertStatusToString = (status?: string): 'todo'|'in_progress'|'completed' => {
    const s = (status || '').toLowerCase();
    if (s.includes('progress')) return 'in_progress';
    if (s.includes('done') || s.includes('complete')) return 'completed';
    return 'todo';
  };

  const handleAddMember = async (userId: number, role: ProjectMemberRole) => {
    try {
      // Map UI role to backend ProjectRole id
      const desiredRoleName = role === ProjectMemberRole.ADMIN ? 'Admin' : 'Member';
      let roleId: number | undefined = projectRoles?.find((r: any) => r.roleName === desiredRoleName)?.id;

      // Create role if missing (edge case)
      if (!roleId && project?.id) {
        const created = await projectService.createProjectRole(project.id, desiredRoleName, undefined, undefined);
        roleId = created?.id;
      }

      const response = await projectService.addMemberToProject(project!.id, userId, roleId);
      
      if (response.success) {
        showSuccess(`Đã thêm thành viên${desiredRoleName === 'Admin' ? ' (Admin)' : ''}`);
        // Reload project data
        if (project?.id) {
          await loadInitialData(project.id);
        }
        setShowAddMemberModal(false);
      } else {
        showError(response.message || 'Failed to add member');
      }
    } catch (error: any) {
      showError(error?.message || 'Failed to add member');
    }
  };

  const confirmComplete = (task: Task) => {
    // Check if task is already completed
    const taskStatus = (task.status || '').toLowerCase();
    const isCompleted = taskStatus.includes('done') || taskStatus.includes('complete');
    
    if (isCompleted) {
      showSuccess('Task này đã được đánh dấu hoàn thành');
      return;
    }

    const isCreator = currentUserId && task.createdBy === currentUserId;
    const isAssignee = currentUserId && task.assignedTo === currentUserId;
    const role = projectMembers.find(m => m.userId === currentUserId)?.role;
    const isOwnerAdmin = role === ProjectMemberRole.OWNER || role === ProjectMemberRole.ADMIN;
    const canUpdate = Boolean(isCreator || isAssignee || isOwnerAdmin);
    
    if (!canUpdate) {
      showError('Bạn không có quyền cập nhật trạng thái task này');
      return;
    }

    Alert.alert(
      'Hoàn thành task',
      'Bạn có muốn đánh dấu hoàn thành task này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          onPress: async () => {
            const prev = task.status;
            setProjectTasks(prevTasks => prevTasks.map(t => t.id === task.id ? { ...t, status: 'Done' } : t));
              try {
                await taskService.updateTask(Number(task.id), { status: 'Done' });
                showSuccess('Đã hoàn thành task');
              } catch (e: any) {
                const msg = String(e?.message || '');
                setProjectTasks(prevTasks => prevTasks.map(t => t.id === task.id ? { ...t, status: prev } : t));
                showError(msg || 'Cập nhật trạng thái thất bại');
              }
          },
        },
      ]
    );
  };

  const renderTaskCard = (task: Task) => {
    const taskSummary = {
      id: String(task.id),
      title: task.taskName,
      description: task.description || '',
      status: convertStatusToString(task.status),
      priority: convertPriorityToString(task.priority || 3),
      dueDate: task.endTime ? new Date(task.endTime) : undefined,
      startDate: task.startTime ? new Date(task.startTime) : undefined,
      projectName: project?.projectName || '',
      assigneeName: task.assignee?.username || 'Unassigned',
      assigneeId: task.assignedTo,
      estimatedMinutes: task.estimatedMinutes,
      // Pass original task fields for TaskDetailModal
      taskName: task.taskName,
      startTime: task.startTime,
      endTime: task.endTime,
      assignedTo: task.assignedTo,
      projectId: task.projectId,
    };

    return (
      <TaskCardModern
        key={task.id}
        task={taskSummary as any}
        showProjectName={false}
        canDelete={canDeleteTask(task)}
        onDelete={() => confirmAndDeleteTask(task)}
        onToggleStatus={() => confirmComplete(task)}
        onEdit={() => {
          setSelectedTask(task);
          setIsTaskDetailVisible(true);
        }}
        onNavigateToTracking={() => {
          if (navigation) {
            navigation.navigate('TaskTracking', { task: taskSummary });
          }
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
          task.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesSearch) return false;

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // Base filter (All/Upcoming/Overdue/Completed)
        let matchesBaseFilter = false;
        switch (activeTaskFilter) {
          case 'Upcoming':
            matchesBaseFilter = task.status !== 'Done' && !!task.endTime && new Date(task.endTime) >= now;
            break;
          case 'Overdue':
            matchesBaseFilter = task.status !== 'Done' && !!task.endTime && new Date(task.endTime) < now;
            break;
          case 'Completed':
            matchesBaseFilter = task.status === 'Done';
            break;
          case 'All':
          default:
            matchesBaseFilter = true;
            break;
        }

        if (!matchesBaseFilter) return false;

        // Status filter
        if (statusFilter !== 'all') {
          const s = String(task.status || '').toLowerCase();
          let matchesStatus = false;
          if (statusFilter === 'todo') matchesStatus = s.includes('to do') || s.includes('todo');
          else if (statusFilter === 'in_progress') matchesStatus = s.includes('progress');
          else if (statusFilter === 'review') matchesStatus = s.includes('review');
          else if (statusFilter === 'done') matchesStatus = s.includes('done') || s.includes('complete');
          if (!matchesStatus) return false;
        }

        // Assignee filter
        if (assigneeFilter !== 'all') {
          const matchesAssignee = String(task.assignedTo ?? '') === assigneeFilter;
          if (!matchesAssignee) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by created date (newest first)
        const aTime = a.dateCreated ? new Date(a.dateCreated).getTime() : 0;
        const bTime = b.dateCreated ? new Date(b.dateCreated).getTime() : 0;
        return bTime - aTime;
      });

      return (
        <ScrollView
          style={styles.tabContent}
          refreshControl={<RefreshControl refreshing={loadingTasks} onRefresh={() => loadProjectTasks(project.id)} />}
        >
          <View style={styles.taskHeader}>
            <View style={styles.taskSearchContainer}>
              <TextInput
                placeholder="Search tasks..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                mode="outlined"
                style={styles.searchInput}
                outlineStyle={styles.searchOutline}
                left={<TextInput.Icon icon="magnify" color={Colors.neutral.medium} />}
                theme={{
                  colors: {
                    primary: Colors.primary,
                    outline: 'transparent',
                    background: Colors.neutral.light + '50',
                    text: Colors.neutral.dark,
                    placeholder: Colors.neutral.medium,
                  },
                }}
              />
            </View>

            {/* Status & Assignee Filters */}
            <View style={styles.dropdownFiltersRow}>
              {/* Status Filter */}
              <View style={[styles.dropdownFilterWrap, { zIndex: showStatusDropdown ? 100 : 1 }]}>
                <TouchableOpacity
                  style={styles.dropdownFilterBtn}
                  onPress={() => {
                    setShowStatusDropdown(!showStatusDropdown);
                    setShowAssigneeDropdown(false);
                  }}
                >
                  <MaterialIcons name="filter-list" size={16} color={Colors.neutral.dark} />
                  <Text style={styles.dropdownFilterText}>
                    {statusFilter === 'all' ? 'Status' : statusFilter === 'todo' ? 'To Do' : statusFilter === 'in_progress' ? 'In Progress' : statusFilter === 'review' ? 'Review' : 'Done'}
                  </Text>
                  <MaterialIcons name={showStatusDropdown ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={18} color={Colors.neutral.medium} />
                </TouchableOpacity>
                {showStatusDropdown && (
                  <View style={styles.dropdownFilterMenu}>
                    {[
                      { value: 'all', label: 'All Status' },
                      { value: 'todo', label: 'To Do' },
                      { value: 'in_progress', label: 'In Progress' },
                      { value: 'review', label: 'Review' },
                      { value: 'done', label: 'Done' },
                    ].map(opt => (
                      <TouchableOpacity
                        key={opt.value}
                        style={styles.dropdownFilterOption}
                        onPress={() => {
                          setStatusFilter(opt.value);
                          setShowStatusDropdown(false);
                        }}
                      >
                        <Text style={[styles.dropdownFilterOptionText, statusFilter === opt.value && styles.dropdownFilterOptionTextActive]}>
                          {opt.label}
                        </Text>
                        {statusFilter === opt.value && <MaterialIcons name="check" size={18} color={Colors.primary} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Assignee Filter */}
              <View style={[styles.dropdownFilterWrap, { zIndex: showAssigneeDropdown ? 100 : 1 }]}>
                <TouchableOpacity
                  style={styles.dropdownFilterBtn}
                  onPress={() => {
                    setShowAssigneeDropdown(!showAssigneeDropdown);
                    setShowStatusDropdown(false);
                  }}
                >
                  <MaterialIcons name="person" size={16} color={Colors.neutral.dark} />
                  <Text style={styles.dropdownFilterText}>
                    {assigneeFilter === 'all' ? 'Assignee' : (projectMembers.find(m => String(m.userId) === assigneeFilter)?.user?.username || 'Assignee')}
                  </Text>
                  <MaterialIcons name={showAssigneeDropdown ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={18} color={Colors.neutral.medium} />
                </TouchableOpacity>
                {showAssigneeDropdown && (
                  <View style={styles.dropdownFilterMenu}>
                    <ScrollView style={{ maxHeight: 200 }}>
                      <TouchableOpacity
                        style={styles.dropdownFilterOption}
                        onPress={() => {
                          setAssigneeFilter('all');
                          setShowAssigneeDropdown(false);
                        }}
                      >
                        <Text style={[styles.dropdownFilterOptionText, assigneeFilter === 'all' && styles.dropdownFilterOptionTextActive]}>
                          All Assignees
                        </Text>
                        {assigneeFilter === 'all' && <MaterialIcons name="check" size={18} color={Colors.primary} />}
                      </TouchableOpacity>
                      {projectMembers.map(m => (
                        <TouchableOpacity
                          key={m.userId}
                          style={styles.dropdownFilterOption}
                          onPress={() => {
                            setAssigneeFilter(String(m.userId));
                            setShowAssigneeDropdown(false);
                          }}
                        >
                          <View style={styles.assigneeOptionContent}>
                            <View style={styles.assigneeAvatar}>
                              <Text style={styles.assigneeAvatarText}>{(m.user?.username || 'U').charAt(0).toUpperCase()}</Text>
                            </View>
                            <Text style={[styles.dropdownFilterOptionText, assigneeFilter === String(m.userId) && styles.dropdownFilterOptionTextActive]}>
                              {m.user?.username || m.user?.email || m.userId}
                            </Text>
                          </View>
                          {assigneeFilter === String(m.userId) && <MaterialIcons name="check" size={18} color={Colors.primary} />}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.taskFilterContainer}>
              {(['All', 'Upcoming', 'Overdue', 'Completed'] as const).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterChip, activeTaskFilter === filter && styles.activeFilterChip]}
                  onPress={() => setActiveTaskFilter(filter)}
                >
                  <Text style={[styles.filterChipText, activeTaskFilter === filter && styles.activeFilterChipText]}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {loadingTasks && filteredTasks.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading tasks...</Text>
            </View>
          ) : filteredTasks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name={searchQuery ? 'search-off' : 'check-circle-outline'} size={32} color={Colors.neutral.medium} />
              <Text style={styles.emptyTitle}>{searchQuery ? 'No tasks match' : 'No tasks yet'}</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Try adjusting your filter' : 'Create a new task to get started'}
              </Text>
            </View>
          ) : (
            <View style={styles.tasksList}>
              {filteredTasks.map((task) => renderTaskCard(task))}
            </View>
          )}
        </ScrollView>
      );
    }
    // Other tabs remain the same for now
    else if (activeTab === 'calendar') {
      return <CalendarScreen navigation={navigation} contentTopSpacing={12} safeAreaEdges={[]} />;
    } else if (activeTab === 'settings') {
      return <ProjectSettingsScreen navigation={navigation} route={route as any} />;
    } else {
      // Members Tab
      return (
        <ScrollView style={styles.tabContent}>
          <View style={styles.membersSection}>
            {/* Header with Add Member Button */}
            <View style={styles.membersSectionHeader}>
              <View>
                <Text style={styles.membersSectionTitle}>Members</Text>
                <Text style={styles.membersSectionCount}>{projectMembers.length} member{projectMembers.length !== 1 ? 's' : ''}</Text>
              </View>
              {canManageMembers && (
                <TouchableOpacity 
                  style={styles.addMemberButton}
                  onPress={() => setShowAddMemberModal(true)}
                >
                  <MaterialIcons name="person-add" size={18} color={Colors.neutral.white} />
                  <Text style={styles.addMemberButtonText}>Add</Text>
                </TouchableOpacity>
              )}
            </View>

            {projectMembers.length === 0 ? (
              <View style={styles.emptyMembersContainer}>
                <MaterialIcons name="group-outline" size={48} color={Colors.neutral.medium} />
                <Text style={styles.emptyMembersTitle}>No members yet</Text>
                <Text style={styles.emptyMembersSubtitle}>Add members to collaborate on this project</Text>
              </View>
            ) : (
              <View style={styles.membersList}>
                {/* Separate members by role - Leaders first */}
                {projectMembers
                  .filter(m => m.role === ProjectMemberRole.OWNER || m.role === ProjectMemberRole.ADMIN)
                  .map((member) => (
                    <View key={member.id} style={styles.memberCard}>
                      <View style={styles.memberCardContent}>
                        <View style={styles.memberAvatar}>
                          <Text style={styles.memberAvatarText}>
                            {(member.user?.name || member.user?.username || 'U').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.memberInfo}>
                          <View style={styles.memberNameRow}>
                            <Text style={styles.memberName} numberOfLines={1}>
                              {member.user?.name || member.user?.username}
                            </Text>

                          </View>
                          <Text style={styles.memberEmail} numberOfLines={1}>
                            {member.user?.email}
                          </Text>
                          <Text style={styles.memberJoinedDate}>
                            Joined {new Date(member.joinedAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.memberCardRight}>
                        <View style={[
                          styles.roleBadge,
                          member.role === ProjectMemberRole.OWNER 
                            ? styles.ownerBadge 
                            : styles.adminBadge
                        ]}>
                          <MaterialIcons 
                            name={member.role === ProjectMemberRole.OWNER ? 'admin-panel-settings' : 'verified-user'} 
                            size={14} 
                            color={Colors.neutral.white} 
                          />
                          <Text style={styles.roleBadgeText}>
                            {member.role === ProjectMemberRole.OWNER ? 'Owner' : 'Admin'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}

                {/* Regular members */}
                {projectMembers
                  .filter(m => m.role === ProjectMemberRole.MEMBER)
                  .map((member) => (
                    <View key={member.id} style={styles.memberCard}>
                      <View style={styles.memberCardContent}>
                        <View style={styles.memberAvatar}>
                          <Text style={styles.memberAvatarText}>
                            {(member.user?.name || member.user?.username || 'U').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.memberInfo}>
                          <View style={styles.memberNameRow}>
                            <Text style={styles.memberName} numberOfLines={1}>
                              {member.user?.name || member.user?.username}
                            </Text>

                          </View>
                          <Text style={styles.memberEmail} numberOfLines={1}>
                            {member.user?.email}
                          </Text>
                          <Text style={styles.memberJoinedDate}>
                            Joined {new Date(member.joinedAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.memberCardRight}>
                        <View style={styles.memberBadge}>
                          <MaterialIcons 
                            name="person" 
                            size={14} 
                            color={Colors.neutral.white} 
                          />
                          <Text style={styles.roleBadgeText}>Member</Text>
                        </View>
                      </View>
                    </View>
                  ))}
              </View>
            )}
          </View>
        </ScrollView>
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.neutral.dark} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle} numberOfLines={1}>{project?.projectName || 'Project'}</Text>
          {workspaceInfo?.name && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>{workspaceInfo.name}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.headerActionButton}>
          <MaterialIcons name="more-vert" size={24} color={Colors.neutral.dark} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {renderTabContent()}

      {/* Footer Tab Navigator */}
      <View style={styles.footerTabSection}>
        <TouchableOpacity style={styles.footerTabButton} onPress={() => setActiveTab('tasks')}>
          <View style={[styles.iconContainer, activeTab === 'tasks' && styles.activeIconContainer]}>
            <MaterialIcons name="home" size={20} color={activeTab === 'tasks' ? Colors.neutral.white : Colors.neutral.medium} />
          </View>
          <Text style={[styles.footerTabButtonText, activeTab === 'tasks' && styles.activeFooterTabButtonText]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerTabButton} onPress={() => setActiveTab('calendar')}>
          <View style={[styles.iconContainer, activeTab === 'calendar' && styles.activeIconContainer]}>
            <MaterialIcons name="event" size={20} color={activeTab === 'calendar' ? Colors.neutral.white : Colors.neutral.medium} />
          </View>
          <Text style={[styles.footerTabButtonText, activeTab === 'calendar' && styles.activeFooterTabButtonText]}>Calendar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerTabButton} onPress={() => setShowCreateDropdown(true)}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="add" size={20} color={Colors.neutral.medium} />
          </View>
          <Text style={styles.footerTabButtonText}>Create</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerTabButton} onPress={() => setActiveTab('members')}>
          <View style={[styles.iconContainer, activeTab === 'members' && styles.activeIconContainer]}>
            <MaterialIcons name="group" size={20} color={activeTab === 'members' ? Colors.neutral.white : Colors.neutral.medium} />
          </View>
          <Text style={[styles.footerTabButtonText, activeTab === 'members' && styles.activeFooterTabButtonText]}>Members</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerTabButton} onPress={() => setActiveTab('settings')}>
          <View style={[styles.iconContainer, activeTab === 'settings' && styles.activeIconContainer]}>
            <MaterialIcons name="settings" size={20} color={activeTab === 'settings' ? Colors.neutral.white : Colors.neutral.medium} />
          </View>
          <Text style={[styles.footerTabButtonText, activeTab === 'settings' && styles.activeFooterTabButtonText]}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <CreateOptionsModal
        visible={showCreateDropdown}
        onClose={() => setShowCreateDropdown(false)}
        onOptionSelect={handleCreateOptionSelect}
        allowedOptions={['voice', 'task']}
      />

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask as any}
          visible={isTaskDetailVisible}
          onClose={() => setIsTaskDetailVisible(false)}
          showProjectChip={false}
          onUpdateTask={async (updatedTask) => {
            // Reload project data to update progress bar and task list
            if (project?.id) {
              await loadInitialData(project.id);
            }
            setIsTaskDetailVisible(false);
          }}
          onDeleteTask={(taskId) => {
            setProjectTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
            showSuccess('Task deleted');
          }}
        />
      )}

      <AddMemberModal
        visible={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onAddMember={handleAddMember}
        workspaceMembers={workspaceMembers}
        projectMembers={projectMembers}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light + '40',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.neutral.dark,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.neutral.medium,
    marginTop: 2,
  },
  headerActionButton: {
    padding: 8,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.neutral.medium,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.neutral.medium,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  tabContent: {
    flex: 1,
  },
  taskHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: Colors.background,
  },
  taskSearchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    fontSize: 15,
    backgroundColor: Colors.neutral.light + '50',
  },
  searchOutline: {
    borderRadius: 12,
    borderWidth: 1.5,
  },
  dropdownFiltersRow: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 12,
    gap: 12,
  },
  dropdownFilterWrap: {
    flex: 1,
    position: 'relative',
  },
  dropdownFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    borderWidth: 1.5,
    borderColor: Colors.neutral.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  dropdownFilterText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.dark,
  },
  dropdownFilterMenu: {
    position: 'absolute',
    top: 46,
    left: 0,
    right: 0,
    backgroundColor: Colors.neutral.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: 220,
    zIndex: 1000,
  },
  dropdownFilterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light + '30',
  },
  dropdownFilterOptionText: {
    fontSize: 14,
    color: Colors.neutral.dark,
  },
  dropdownFilterOptionTextActive: {
    fontWeight: '600',
    color: Colors.primary,
  },
  assigneeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  assigneeAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assigneeAvatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  taskFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
  },
  activeFilterChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    color: Colors.neutral.dark,
    fontWeight: '600',
    fontSize: 12,
  },
  activeFilterChipText: {
    color: Colors.surface,
  },
  tasksList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  footerTabSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 80,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: Colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.light + '70',
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 6,
  },
  footerTabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconContainer: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconContainer: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  footerTabButtonText: {
    fontSize: 11,
    color: Colors.neutral.medium,
    fontWeight: '500',
  },
  activeFooterTabButtonText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  membersSection: {
    flex: 1,
    paddingVertical: 16,
  },
  membersSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  membersSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.neutral.dark,
  },
  membersSectionCount: {
    fontSize: 12,
    color: Colors.neutral.medium,
    marginTop: 2,
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addMemberButtonText: {
    color: Colors.neutral.white,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyMembersContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyMembersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  emptyMembersSubtitle: {
    fontSize: 14,
    color: Colors.neutral.medium,
    textAlign: 'center',
  },
  membersList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.light + '40',
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  memberCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.neutral.dark,
    flex: 1,
  },
  youBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  youBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  memberEmail: {
    fontSize: 13,
    color: Colors.neutral.medium,
    marginBottom: 4,
  },
  memberJoinedDate: {
    fontSize: 12,
    color: Colors.neutral.medium,
  },
  memberCardRight: {
    marginLeft: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  ownerBadge: {
    backgroundColor: Colors.primary,
  },
  adminBadge: {
    backgroundColor: Colors.primary + 'CC',
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.neutral.medium,
    gap: 4,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.white,
  },
});

export default ProjectDetailScreen;
