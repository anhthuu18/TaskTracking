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
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { useWorkspaceData, TaskSummary, WorkspaceData } from '../hooks/useWorkspaceData';
import ProjectCardModern from '../components/ProjectCardModern';
import TaskCardModern from '../components/TaskCardModern';
import TaskDetailModal from '../components/TaskDetailModal';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { projectService, workspaceService, taskService } from '../services';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WorkspaceDashboardModernProps {
  navigation: any;
  route?: any;
  onSwitchWorkspace?: () => void;
  onLogout?: () => void;
}

interface TaskTabHeaderProps {
  workspaceData: WorkspaceData | null;
  searchInput: string;
  setSearchInput: (value: string) => void;
  activeFilter: string;
  setActiveFilter: (value: string) => void;
  currentUserId: number | null;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  showStatusDropdown: boolean;
  setShowStatusDropdown: (value: boolean) => void;
}

const TaskTabHeader = React.memo<TaskTabHeaderProps>(({ 
  workspaceData, 
  searchInput, 
  setSearchInput, 
  activeFilter, 
  setActiveFilter,
  currentUserId,
  statusFilter,
  setStatusFilter,
  showStatusDropdown,
  setShowStatusDropdown,
}) => {
  if (!workspaceData) return null;

  // Filter tasks: only count tasks assigned to current user
  const allTasks = workspaceData.allTasks || [];
  const userTasks = allTasks.filter(t => {
    const assigneeNum = t.assigneeId ? Number(t.assigneeId) : undefined;
    return assigneeNum === currentUserId;
  });

  // URGENT: priority = urgent (not completed)
  const urgentCount = userTasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;
  
  // TODAY: due date = today (not completed)
  const todayCount = userTasks.filter(t => {
    if (!t.dueDate || t.status === 'completed') return false;
    const today = new Date();
    return new Date(t.dueDate).toDateString() === today.toDateString();
  }).length;
  
  // ACTIVE: status != done/completed
  const activeCount = userTasks.filter(t => {
    const s = String(t.status || '').toLowerCase();
    return !s.includes('done') && !s.includes('complete');
  }).length;

  const filters = ['All', 'Overdue', 'Upcoming'];

  return (
    <>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color={Colors.neutral.medium} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          value={searchInput}
          onChangeText={setSearchInput}
        />
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, {backgroundColor: Colors.semantic.error + '15'}]}>
          <View>
            <Text style={styles.summaryLabel}>URGENT</Text>
            <Text style={styles.summaryValue}>{urgentCount}</Text>
          </View>
          <View style={[styles.summaryIcon, {backgroundColor: Colors.semantic.error + '30'}]}>
            <MaterialIcons name="error-outline" size={24} color={Colors.semantic.error} />
          </View>
        </View>
        <View style={[styles.summaryCard, {backgroundColor: Colors.semantic.info + '15'}]}>
          <View>
            <Text style={styles.summaryLabel}>TODAY</Text>
            <Text style={styles.summaryValue}>{todayCount}</Text>
          </View>
          <View style={[styles.summaryIcon, {backgroundColor: Colors.semantic.info + '30'}]}>
            <MaterialIcons name="today" size={24} color={Colors.semantic.info} />
          </View>
        </View>
      </View>
      <View style={[styles.summaryCard, {backgroundColor: Colors.semantic.success + '15', width: 'auto', marginBottom: 16}]}>
        <View>
          <Text style={styles.summaryLabel}>ACTIVE</Text>
          <Text style={styles.summaryValue}>{activeCount}</Text>
        </View>
        <View style={[styles.summaryIcon, {backgroundColor: Colors.semantic.success + '30'}]}>
          <MaterialIcons name="hourglass-top" size={24} color={Colors.semantic.success} />
        </View>
      </View>

      {/* Quick Filters + Status Dropdown */}
      <View style={styles.filtersRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
          {filters.map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterButton, activeFilter === filter && styles.activeFilterButton]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterButtonText, activeFilter === filter && styles.activeFilterButtonText]}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Status Dropdown Filter */}
        <View style={[styles.statusDropdownWrap, { zIndex: showStatusDropdown ? 100 : 1 }]}>
          <TouchableOpacity
            style={styles.statusDropdownBtn}
            onPress={() => setShowStatusDropdown(!showStatusDropdown)}
          >
            <MaterialIcons name="filter-list" size={16} color={Colors.neutral.dark} />
            <Text style={styles.statusDropdownText}>
              {statusFilter === 'all' ? 'Status' : statusFilter === 'todo' ? 'To Do' : statusFilter === 'in_progress' ? 'In Progress' : statusFilter === 'review' ? 'Review' : 'Done'}
            </Text>
            <MaterialIcons name={showStatusDropdown ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={18} color={Colors.neutral.medium} />
          </TouchableOpacity>
          {showStatusDropdown && (
            <View style={styles.statusDropdownMenu}>
              {[
                { value: 'all', label: 'All Status' },
                { value: 'todo', label: 'To Do' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'review', label: 'Review' },
                { value: 'done', label: 'Done' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={styles.statusDropdownOption}
                  onPress={() => {
                    setStatusFilter(opt.value);
                    setShowStatusDropdown(false);
                  }}
                >
                  <Text style={[styles.statusDropdownOptionText, statusFilter === opt.value && styles.statusDropdownOptionTextActive]}>
                    {opt.label}
                  </Text>
                  {statusFilter === opt.value && <MaterialIcons name="check" size={18} color={Colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
      
      <Text style={styles.listHeader}>All Tasks</Text>
    </>
  );
});

const WorkspaceDashboardModern: React.FC<WorkspaceDashboardModernProps> = ({
  navigation,
  route,
  onSwitchWorkspace,
}) => {
  const workspace = route?.params?.workspace;
  const externalReloadKey: number | undefined = route?.params?.reloadKey;
  const onViewAllTasks = route?.params?.onViewAllTasks;
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [availableWorkspaces, setAvailableWorkspaces] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskSummary | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' or 'tasks'
  const [taskOverrides, setTaskOverrides] = useState<Record<string, TaskSummary>>({});
  const [deletedTaskIds, setDeletedTaskIds] = useState<Set<string>>(new Set());

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Deletion permission/context
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  type ProjectMemberCache = { ids: number[]; usernames: string[]; emails: string[]; rolesById: Record<number, string> };
  const [membersByProject, setMembersByProject] = useState<Record<string, ProjectMemberCache>>({});
  const [statusOverrides, setStatusOverrides] = useState<Record<string, 'todo'|'in_progress'|'completed'>>({});


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

  // Load current user for permission
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

  // Prefetch project members for all tasks
  useEffect(() => {
    const fetchMembers = async () => {
      if (!workspaceData?.allTasks) return;
      const ids = Array.from(new Set(workspaceData.allTasks.map(t => t.projectId).filter(Boolean)));
      const newMap: Record<string, ProjectMemberCache> = { ...membersByProject } as any;
      let changed = false;
      for (const pid of ids) {
        if (!newMap[pid]) {
          try {
            const res = await projectService.getProjectMembers(Number(pid));
            if (res?.success && Array.isArray(res.data)) {
              newMap[pid] = {
                ids: res.data.map(m => m.userId),
                usernames: res.data.map(m => m.user?.username).filter(Boolean) as string[],
                emails: res.data.map(m => m.user?.email).filter(Boolean) as string[],
                rolesById: res.data.reduce((acc: Record<number, string>, m: any) => { acc[m.userId] = m.role; return acc; }, {}),
              };
            } else {
              newMap[pid] = { ids: [], usernames: [], emails: [], rolesById: {} } as any;
            }
            changed = true;
          } catch {
            newMap[pid] = { ids: [], usernames: [], emails: [], rolesById: {} } as any;
            changed = true;
          }
        }
      }
      if (changed) setMembersByProject(newMap);
    };
    fetchMembers();
  }, [workspaceData?.allTasks]);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchInput);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchInput]);

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

  const handleProjectPress = async (projectId: string) => {
    try {
      await projectService.updateProjectLastOpened(Number(projectId));
      // No need to refresh here, data will be stale until next refresh cycle
    } catch (error) {
      console.error('Failed to update last opened time:', error);
    }

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
    if (navigation) {
      navigation.navigate('TaskTracking', { task });
    }
  };

  const handleDeleteTask = (taskId: string) => {
    // TODO: Implement actual deletion logic (API call, state update)
    console.log('Deleting task:', taskId);
    // For now, just refresh the data to simulate removal if the backend deletes it
    refresh();
  };

  const handleToggleTaskStatus = (taskToToggle: TaskSummary) => {
    // This is a mock implementation. Ideally, you would call an API here.
    console.log('Toggling status for task:', taskToToggle.id);
    const newStatus = taskToToggle.status === 'completed' ? 'in_progress' : 'completed';

    // Update the local state to provide immediate feedback
    if (workspaceData && workspaceData.allTasks) {
      const updatedTasks = workspaceData.allTasks.map(task => 
        task.id === taskToToggle.id ? { ...task, status: newStatus } : task
      );
      // This part is tricky without a proper state management library like Redux or Zustand.
      // For now, we'll just log it and rely on a full refresh to get the updated state.
      // A more robust solution would be to update the 'data' state directly.
    }

    // Refresh data from the server
    refresh();
  };

  const handleToggleStar = async (projectId: string) => {
    try {
      await projectService.toggleStarProject(Number(projectId));
      refresh(); // Refresh data to get the new star status
    } catch (error) {
      console.error('Failed to toggle star status:', error);
      // Optionally, show an error message to the user
    }
  };

  const renderTasksTab = () => {
    if (!workspaceData) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }

    // Filter tasks: only show tasks assigned to current user
    const allTasks = (workspaceData.allTasks || [])
      .filter(task => !deletedTaskIds.has(task.id))
      .map(t => statusOverrides[t.id] ? { ...t, status: statusOverrides[t.id] } : t);
    
    const userTasks = allTasks.filter(task => {
      const assigneeNum = task.assigneeId ? Number(task.assigneeId) : undefined;
      return assigneeNum === currentUserId;
    });

    const filteredTasks = userTasks.filter(task => {
      // Search filter
      if (debouncedSearchQuery && !task.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) {
        return false;
      }

      // Base filter (All/Overdue/Upcoming)
      if (activeFilter !== 'All') {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        if (activeFilter === 'Overdue') {
          if (!task.dueDate) return false;
          const taskDate = new Date(task.dueDate);
          taskDate.setHours(0, 0, 0, 0);
          const s = String(task.status || '').toLowerCase();
          const isDone = s.includes('done') || s.includes('complete');
          if (isDone || taskDate.getTime() >= now.getTime()) return false;
        } else if (activeFilter === 'Upcoming') {
          if (!task.dueDate) return false;
          const taskDate = new Date(task.dueDate);
          taskDate.setHours(0, 0, 0, 0);
          const s = String(task.status || '').toLowerCase();
          const isDone = s.includes('done') || s.includes('complete');
          if (isDone || taskDate.getTime() < now.getTime()) return false;
        }
      }

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

      return true;
    })
      .sort((a, b) => {
        const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
        if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
          return priorityWeight[b.priority] - priorityWeight[a.priority];
        }
        return (a.dueDate?.getTime() || Infinity) - (b.dueDate?.getTime() || Infinity);
      });

    const confirmComplete = (task: TaskSummary) => {
      if (task.status === 'completed') return;
      
      const cache = membersByProject[task.projectId];
      const role = cache?.rolesById?.[currentUserId ?? -999];
      const roleNorm = role ? String(role).toLowerCase() : '';
      const isCreator = task.createdById && currentUserId && task.createdById === currentUserId;
      const assigneeNum = task.assigneeId ? Number(task.assigneeId) : undefined;
      const isAssignee = assigneeNum && currentUserId && assigneeNum === currentUserId;
      const isOwnerAdmin = roleNorm === 'owner' || roleNorm === 'admin';
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
              setStatusOverrides(prev => ({ ...prev, [task.id]: 'completed' }));
              try {
                await taskService.updateTask(Number(task.id), { status: 'Done' });
                refresh();
              } catch (e: any) {
                const msg = String(e?.message || '');
                setStatusOverrides(prev => { const n = { ...prev }; delete n[task.id]; return n; });
                showError(msg || 'Cập nhật trạng thái thất bại');
              }
            },
          },
        ]
      );
    };

    const canDeleteTask = (task: TaskSummary) => {
      const cache = membersByProject[task.projectId];
      if (!cache) return false;
      if (currentUserId && cache.ids.includes(currentUserId)) return true;
      if (currentUsername && cache.usernames.includes(currentUsername)) return true;
      if (currentEmail && cache.emails.includes(currentEmail)) return true;
      return false;
    };

    const confirmAndDeleteTask = (task: TaskSummary) => {
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
                setDeletedTaskIds(prev => new Set([...prev, task.id]));
                refresh();
              } catch (e) {
                console.error('Delete task failed', e);
              }
            },
          },
        ]
      );
    };

    return (
      <FlatList
        data={filteredTasks}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<TaskTabHeader 
          workspaceData={workspaceData} 
          searchInput={searchInput} 
          setSearchInput={setSearchInput} 
          activeFilter={activeFilter} 
          setActiveFilter={setActiveFilter}
          currentUserId={currentUserId}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          showStatusDropdown={showStatusDropdown}
          setShowStatusDropdown={setShowStatusDropdown}
        />}
        renderItem={({ item }) => {
          const effective = statusOverrides[item.id] ? { ...item, status: statusOverrides[item.id] } : item;
          return (
            <TaskCardModern
              task={effective}
              showProjectName={false}
              canDelete={canDeleteTask(effective)}
              onDelete={() => confirmAndDeleteTask(effective)}
              onEdit={() => handleTaskPress(effective)}
              onNavigateToTracking={() => handleTrackTime(effective)}
              onToggleStatus={() => confirmComplete(effective)}
            />
          );
        }}
        ListEmptyComponent={() => (
            <View style={styles.emptyStateContainer}>
              <MaterialIcons name="check-circle-outline" size={48} color={Colors.neutral.medium} />
              <Text style={styles.emptyStateText}>No tasks match your filters.</Text>
            </View>
        )}
      />
    );
  };

  const renderProjectsTab = () => {
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
        {/* Recent Projects */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Projects</Text>

          </View>
          {workspaceData.projects.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <MaterialIcons name="folder-open" size={48} color={Colors.neutral.medium} />
              <Text style={styles.emptyStateText}>No projects</Text>
            </View>
          ) : (
            workspaceData.projects
              .slice()
              .sort((a, b) => {
                const aIsStarred = a.isStarred || false;
                const bIsStarred = b.isStarred || false;
                if (aIsStarred !== bIsStarred) {
                  return bIsStarred ? 1 : -1;
                }

                const aDate = new Date(a.lastOpened || 0).getTime();
                const bDate = new Date(b.lastOpened || 0).getTime();
                return bDate - aDate;
              })
              .map((project) => {
                const hasUrgent = (workspaceData?.allTasks || []).some(task => {
                  if (task.projectId !== project.id || !task.dueDate) return false;
                  const diffDays = (new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
                  return diffDays <= 3 && task.status !== 'completed';
                });

                return (
                  <ProjectCardModern
                    key={project.id}
                    project={project}
                    onPress={() => handleProjectPress(project.id)}
                    isStarred={project.isStarred}
                    onToggleStar={() => handleToggleStar(project.id)}
                    hasUrgentTasks={hasUrgent}
                  />
                );
              })
          )}
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
          {/* Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'projects' && styles.activeTab]}
              onPress={() => setActiveTab('projects')}
            >
              <MaterialIcons name="folder-shared" size={20} color={activeTab === 'projects' ? Colors.primary : Colors.neutral.medium} />
              <Text style={[styles.tabText, activeTab === 'projects' && styles.activeTabText]}>Projects</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
              onPress={() => setActiveTab('tasks')}
            >
              <MaterialIcons name="list-alt" size={20} color={activeTab === 'tasks' ? Colors.primary : Colors.neutral.medium} />
              <Text style={[styles.tabText, activeTab === 'tasks' && styles.activeTabText]}>Tasks</Text>
            </TouchableOpacity>
          </View>

          {/* Conditional Content */}
          {activeTab === 'projects' ? renderProjectsTab() : renderTasksTab()}
        </View>

        <TaskDetailModal
          visible={showTaskDetail}
          task={selectedTask as any}
          onClose={() => setShowTaskDetail(false)}
          showProjectChip={true}
          onUpdateTask={(updated) => {
            setSelectedTask(updated as any);
            try { refresh(); } catch {}
          }}
          onDeleteTask={(taskId) => {
            handleDeleteTask(String(taskId));
            setShowTaskDetail(false);
          }}
          onNavigateToProject={(projectId) => {
            const project = workspaceData?.projects.find(p => p.id === projectId);
            if (project && navigation) {
              navigation.navigate('ProjectDetail', {
                project: {
                  id: projectId,
                  name: project.name,
                  description: project.description,
                }
              });
              setShowTaskDetail(false);
            }
          }}
        />

        <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
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
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: Colors.neutral.light + '40',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  activeTab: {
    backgroundColor: Colors.neutral.white,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.medium,
  },
  activeTabText: {
    color: Colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.light + '60',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 48,
    paddingLeft: 12,
    fontSize: 16,
    color: Colors.neutral.dark,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 16,
  },
  summaryCard: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.neutral.dark,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.neutral.dark,
  },
  summaryIcon: {
    padding: 8,
    borderRadius: 99,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  filterScrollView: {
    flex: 1,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.neutral.light + '60',
    marginRight: 10,
  },
  activeFilterButton: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  activeFilterButtonText: {
    color: Colors.neutral.white,
  },
  statusDropdownWrap: {
    position: 'relative',
    minWidth: 120,
  },
  statusDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    borderWidth: 1.5,
    borderColor: Colors.neutral.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  statusDropdownText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.neutral.dark,
  },
  statusDropdownMenu: {
    position: 'absolute',
    top: 38,
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
    maxHeight: 200,
    zIndex: 1000,
  },
  statusDropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light + '30',
  },
  statusDropdownOptionText: {
    fontSize: 13,
    color: Colors.neutral.dark,
  },
  statusDropdownOptionTextActive: {
    fontWeight: '600',
    color: Colors.primary,
  },
  listHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.neutral.dark,
    marginBottom: 8,
  },
});

export default WorkspaceDashboardModern;
