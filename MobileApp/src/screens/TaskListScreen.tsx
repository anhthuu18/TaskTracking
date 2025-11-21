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
  const [selectedTask, setSelectedTask] = useState<TaskSummary | null>(null);
  const [isTaskDetailVisible, setIsTaskDetailVisible] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  type ProjectMemberCache = { ids: number[]; usernames: string[]; emails: string[]; rolesById: Record<number, string>; rolesByUsername: Record<string, string>; rolesByEmail: Record<string, string> };
  const [membersByProject, setMembersByProject] = useState<Record<string, ProjectMemberCache>>({});
  const [allowedDeleteProjects, setAllowedDeleteProjects] = useState<Set<string>>(new Set());
  const [hiddenTaskIds, setHiddenTaskIds] = useState<Set<string>>(new Set());
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
              newMap[pid] = { ids: [], usernames: [], emails: [] };
            }
            changed = true;
          } catch {
            newMap[pid] = { ids: [], usernames: [], emails: [] };
            changed = true;
          }
        }
      }
      if (changed) setMembersByProject(newMap);
    };
    fetchMembers();
  }, [workspaceData?.allTasks]);

  useEffect(() => {
    const tasks = (workspaceData?.allTasks || []).filter(t => !hiddenTaskIds.has(t.id));
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

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query));
    }

    setFilteredTasks(filtered);
  }, [workspaceData?.allTasks, searchQuery, selectedFilter, hiddenTaskIds]);

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

  const renderTaskItem = ({ item }: { item: TaskSummary }) => (
    <TaskCardModern
      task={item}
      showProjectName={false}
      canDelete={canDeleteTask(item)}
      onDelete={() => confirmAndDeleteTask(item)}
      onPress={() => handleTaskPress(item)}
    />
  );

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
