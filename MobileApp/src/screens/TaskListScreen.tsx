import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { TextInput } from 'react-native-paper';
import { Colors } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';
import TaskCardModern from '../components/TaskCardModern';
import TaskDetailModal from '../components/TaskDetailModal';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { TaskSummary, useWorkspaceData } from '../hooks/useWorkspaceData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { projectService, taskService } from '../services';

interface TaskListScreenProps {
  navigation?: any;
  route?: any;
  onViewAllTasksComplete?: () => void;
}

const TaskListScreen: React.FC<TaskListScreenProps> = ({ navigation, route, onViewAllTasksComplete }) => {
  const { colors } = useTheme();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [filteredTasks, setFilteredTasks] = useState<TaskSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskSummary | null>(null);
  const [isTaskDetailVisible, setIsTaskDetailVisible] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  type ProjectMemberCache = { ids: number[]; usernames: string[]; emails: string[]; rolesById: Record<number, string>; rolesByUsername: Record<string, string>; rolesByEmail: Record<string, string> };
  const [membersByProject, setMembersByProject] = useState<Record<string, ProjectMemberCache>>({});
  const [allowedDeleteProjects, setAllowedDeleteProjects] = useState<Set<string>>(new Set());
  const [hiddenTaskIds, setHiddenTaskIds] = useState<Set<string>>(new Set());
  const [statusOverrides, setStatusOverrides] = useState<Record<string, 'todo'|'in_progress'|'completed'>>({});
  const showAllTasks = route?.params?.showAllTasks || false;
  const workspaceId = route?.params?.workspaceId || '1';

  const { data: workspaceData, loading, error, refreshing, refresh } = useWorkspaceData(workspaceId);

  const filterSetFromViewAllRef = useRef(false);
  const isFirstMountRef = useRef(true);

  useEffect(() => {
    const isShowAll = route?.params?.showAllTasks || false;
    if (isShowAll) {
      setSelectedFilter('upcoming');
      filterSetFromViewAllRef.current = true;
      isFirstMountRef.current = false;
      if (onViewAllTasksComplete) setTimeout(onViewAllTasksComplete, 500);
    } else {
      if (isFirstMountRef.current && !filterSetFromViewAllRef.current && selectedFilter !== 'all') {
        setSelectedFilter('all');
      }
      if (isFirstMountRef.current) isFirstMountRef.current = false;
    }
  }, [route?.params?.showAllTasks, onViewAllTasksComplete, selectedFilter]);

  useEffect(() => {
    if (filterSetFromViewAllRef.current && selectedFilter !== 'upcoming') {
      const id = setTimeout(() => setSelectedFilter('upcoming'), 0);
      return () => clearTimeout(id);
    }
  }, [selectedFilter]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const u = JSON.parse(storedUser);
          if (u?.id) setCurrentUserId(Number(u.id));
          if (u?.username) setCurrentUsername(u.username);
          if (u?.email) setCurrentEmail(u.email);
        }
      } catch {}
    };
    loadUser();
  }, []);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!workspaceData?.allTasks) return;
      const projectIds = Array.from(new Set((workspaceData.allTasks || []).map(t => t.projectId).filter(Boolean)));
      const newMap: Record<string, ProjectMemberCache> = { ...membersByProject };
      let changed = false;
      for (const pid of projectIds) {
        if (!newMap[pid]) {
          try {
            const res = await projectService.getProjectMembers(Number(pid));
            if (res?.success && Array.isArray(res.data)) {
              newMap[pid] = {
                ids: res.data.map(m => m.userId),
                usernames: res.data.map(m => m.user?.username).filter(Boolean) as string[],
                emails: res.data.map(m => m.user?.email).filter(Boolean) as string[],
                rolesById: res.data.reduce((acc: Record<number, string>, m: any) => { acc[m.userId] = m.role; return acc; }, {}),
                rolesByUsername: res.data.reduce((acc: Record<string, string>, m: any) => { if (m.user?.username) acc[m.user.username] = m.role; return acc; }, {}),
                rolesByEmail: res.data.reduce((acc: Record<string, string>, m: any) => { if (m.user?.email) acc[m.user.email] = m.role; return acc; }, {}),
              };
            } else {
              newMap[pid] = { ids: [], usernames: [], emails: [], rolesById: {}, rolesByUsername: {}, rolesByEmail: {} };
            }
            changed = true;
          } catch {
            newMap[pid] = { ids: [], usernames: [], emails: [], rolesById: {}, rolesByUsername: {}, rolesByEmail: {} };
            changed = true;
          }
        }
      }
      if (changed) setMembersByProject(newMap);
    };
    fetchMembers();
  }, [workspaceData?.allTasks]);

  useEffect(() => {
    const tasks = (workspaceData?.allTasks || []).filter(t => !hiddenTaskIds.has(t.id)).map(t => statusOverrides[t.id] ? { ...t, status: statusOverrides[t.id] } : t);
    let filtered = tasks;
    const now = new Date();
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    switch (selectedFilter) {
      case 'upcoming':
        filtered = tasks.filter(t => t.dueDate && t.status !== 'completed' && t.dueDate.getTime() > now.getTime() && t.dueDate.getTime() <= sevenDaysLater.getTime());
        filtered.sort((a, b) => (!a.dueDate ? 1 : !b.dueDate ? -1 : a.dueDate.getTime() - b.dueDate.getTime()));
        break;
      case 'overdue':
        filtered = tasks.filter(t => t.dueDate && t.status !== 'completed' && t.dueDate < now);
        filtered.sort((a, b) => (!a.dueDate ? 1 : !b.dueDate ? -1 : a.dueDate.getTime() - b.dueDate.getTime()));
        break;
      case 'completed':
        filtered = tasks.filter(t => t.status === 'completed');
        break;
      case 'all':
      default:
        filtered.sort((a, b) => (!a.dueDate ? 1 : !b.dueDate ? -1 : a.dueDate.getTime() - b.dueDate.getTime()));
        break;
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => {
        const s = String(t.status || '').toLowerCase();
        if (statusFilter === 'todo') return s.includes('to do') || s.includes('todo');
        if (statusFilter === 'in_progress') return s.includes('progress');
        if (statusFilter === 'review') return s.includes('review');
        if (statusFilter === 'done') return s.includes('done') || s.includes('complete');
        return true;
      });
    }

    // Apply assignee filter
    if (assigneeFilter !== 'all') {
      filtered = filtered.filter(t => String(t.assigneeId || '') === assigneeFilter || t.assigneeName === assigneeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query));
    }

    setFilteredTasks(filtered);
  }, [workspaceData?.allTasks, searchQuery, selectedFilter, statusFilter, assigneeFilter, hiddenTaskIds, statusOverrides]);

  const canDeleteTask = (task: TaskSummary) => {
    const cache = membersByProject[task.projectId];
    if (!currentUserId) return false;
    if (task.createdById && task.createdById === currentUserId) return true;
    const role = cache?.rolesById?.[currentUserId];
    const roleNorm = role ? String(role).toLowerCase() : '';
    if (roleNorm === 'owner' || roleNorm === 'admin') return true;
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
            // Optimistic hide
            setHiddenTaskIds(prev => new Set([...prev, task.id]));
            try {
              await taskService.deleteTask(Number(task.id));
              setFilteredTasks(prev => prev.filter(t => t.id !== task.id));
              showSuccess('Đã xóa task');
              refresh();
            } catch (e: any) {
              // Revert optimistic hide on failure
              setHiddenTaskIds(prev => {
                const next = new Set(prev);
                next.delete(task.id);
                return next;
              });
              showError(e?.message || 'Xóa task thất bại');
            }
          },
        },
      ]
    );
  };

  const handleTaskPress = (task: TaskSummary) => {
    setSelectedTask(task);
    setIsTaskDetailVisible(true);
  };

  const handleRefresh = () => {
    refresh();
  };

  const handleNavigateToProject = (projectId: string) => {
    if (navigation) {
      const project = workspaceData?.projects.find(p => p.id === projectId);
      if (project) {
        navigation.navigate('ProjectDetail', { project: { id: projectId, name: project.name, description: project.description } });
      }
    }
    setIsTaskDetailVisible(false);
  };

  const filterButtons = [
    { value: 'all', label: 'All' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'completed', label: 'Completed' },
  ];

  const confirmComplete = (task: TaskSummary) => {
    if (task.status === 'completed') return;
    const assigneeNum = task.assigneeId ? Number(task.assigneeId) : undefined;
    const cache = membersByProject[task.projectId];
    const role = cache?.rolesById?.[currentUserId ?? -999];
    const roleNorm = role ? String(role).toLowerCase() : '';
    const isCreator = task.createdById && currentUserId && task.createdById === currentUserId;
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
            // Optimistic update
            setStatusOverrides(prev => ({ ...prev, [task.id]: 'completed' }));
            setFilteredTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed' } : t));
            try {
              await taskService.updateTask(Number(task.id), { status: 'Done' });
              // Auto switch to Completed tab
              setSelectedFilter('completed');
              refresh();
              showSuccess('Đã hoàn thành task');
            } catch (e: any) {
              const msg = String(e?.message || '');
              setStatusOverrides(prev => { const n = { ...prev }; delete n[task.id]; return n; });
              setFilteredTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
              showError(msg || 'Cập nhật trạng thái thất bại');
            }
          },
        },
      ]
    );
  };

  const renderTaskItem = ({ item }: { item: TaskSummary }) => {
    const effective = statusOverrides[item.id] ? { ...item, status: statusOverrides[item.id] } : item;
    return (
      <TaskCardModern
        task={effective}
        showProjectName={false}
        canDelete={canDeleteTask(effective)}
        onDelete={() => confirmAndDeleteTask(effective)}
        onToggleStatus={() => confirmComplete(effective)}
        onEdit={() => handleTaskPress(effective)}
        onNavigateToTracking={() => {
          if (navigation) {
            navigation.navigate('TaskTracking', { task: effective });
          }
        }}
      />
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="assignment" size={48} color={Colors.neutral.medium} />
      <Text style={[styles.emptyText, { color: colors.text }]}>No tasks found</Text>
      <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>Try changing the filter or creating a new task.</Text>
    </View>
  );

  if (loading && !workspaceData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <StatusBar backgroundColor={Colors.neutral.white} barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading tasks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !workspaceData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <StatusBar backgroundColor={Colors.neutral.white} barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={Colors.semantic.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>Error loading tasks</Text>
          <Text style={[styles.errorSubText, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar backgroundColor={Colors.neutral.white} barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>All Tasks</Text>
      </View>

      <View style={styles.searchAndFilterContainer}>
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
              text: colors.text,
              placeholder: Colors.neutral.medium,
            },
          }}
        />
        
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
                {assigneeFilter === 'all' ? 'Assignee' : (workspaceData?.allTasks.find(t => String(t.assigneeId) === assigneeFilter || t.assigneeName === assigneeFilter)?.assigneeName || 'Assignee')}
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
                  {Array.from(new Set((workspaceData?.allTasks || []).map(t => t.assigneeName).filter(Boolean))).map(name => (
                    <TouchableOpacity
                      key={name}
                      style={styles.dropdownFilterOption}
                      onPress={() => {
                        setAssigneeFilter(name || 'all');
                        setShowAssigneeDropdown(false);
                      }}
                    >
                      <View style={styles.assigneeOptionContent}>
                        <View style={styles.assigneeAvatar}>
                          <Text style={styles.assigneeAvatarText}>{(name || 'U').charAt(0).toUpperCase()}</Text>
                        </View>
                        <Text style={[styles.dropdownFilterOptionText, assigneeFilter === name && styles.dropdownFilterOptionTextActive]}>
                          {name}
                        </Text>
                      </View>
                      {assigneeFilter === name && <MaterialIcons name="check" size={18} color={Colors.primary} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {filterButtons.map(button => (
            <TouchableOpacity
              key={button.value}
              style={[styles.filterButton, selectedFilter === button.value && styles.activeFilterButton]}
              onPress={() => {
                setSelectedFilter(button.value);
                filterSetFromViewAllRef.current = false;
              }}
            >
              <Text style={[styles.filterButtonText, selectedFilter === button.value && styles.activeFilterButtonText]}>
                {button.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredTasks}
        renderItem={renderTaskItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.primary]} />}
        ListEmptyComponent={renderEmptyList}
      />

      <TaskDetailModal
        visible={isTaskDetailVisible}
        task={selectedTask as any}
        onClose={() => setIsTaskDetailVisible(false)}
        showProjectChip={true}
        onUpdateTask={() => {
          try { refresh(); } catch {}
        }}
        onDeleteTask={() => {
          setIsTaskDetailVisible(false);
          try { refresh(); } catch {}
        }}
        onNavigateToProject={handleNavigateToProject}
      />

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 10, paddingBottom: 16, paddingHorizontal: 20, backgroundColor: Colors.neutral.white },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  searchAndFilterContainer: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: Colors.neutral.white, borderBottomWidth: 1, borderBottomColor: Colors.neutral.light },
  searchInput: { fontSize: 15, backgroundColor: Colors.neutral.light + '50' },
  searchOutline: { borderRadius: 12, borderWidth: 1.5 },
  dropdownFiltersRow: { flexDirection: 'row', marginTop: 12, gap: 12 },
  dropdownFilterWrap: { flex: 1, position: 'relative' },
  dropdownFilterBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.neutral.white, borderWidth: 1.5, borderColor: Colors.neutral.light, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  dropdownFilterText: { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.neutral.dark },
  dropdownFilterMenu: { position: 'absolute', top: 46, left: 0, right: 0, backgroundColor: Colors.neutral.white, borderRadius: 8, borderWidth: 1, borderColor: Colors.neutral.light, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, maxHeight: 220, zIndex: 1000 },
  dropdownFilterOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.neutral.light + '30' },
  dropdownFilterOptionText: { fontSize: 14, color: Colors.neutral.dark },
  dropdownFilterOptionTextActive: { fontWeight: '600', color: Colors.primary },
  assigneeOptionContent: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  assigneeAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary + '20', justifyContent: 'center', alignItems: 'center' },
  assigneeAvatarText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  filterContainer: { paddingVertical: 12, backgroundColor: Colors.neutral.white, paddingHorizontal: 0 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.neutral.light + '50', marginHorizontal: 4, height: 36, justifyContent: 'center' },
  activeFilterButton: { backgroundColor: Colors.primary },
  filterButtonText: { fontSize: 14, fontWeight: '600', color: Colors.neutral.dark },
  activeFilterButtonText: { color: Colors.neutral.white },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8, textAlign: 'center' },
  emptySubText: { fontSize: 14, textAlign: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, marginTop: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  errorText: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8, textAlign: 'center' },
  errorSubText: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  retryButton: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: Colors.neutral.white, fontWeight: '600' },
});

export default TaskListScreen;
