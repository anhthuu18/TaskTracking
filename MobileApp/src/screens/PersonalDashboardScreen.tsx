import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import TaskCardModern from '../components/TaskCardModern';
import TaskDetailModal from '../components/TaskDetailModal';
import BottomTabNavigator from '../navigation/BottomTabNavigator';
import { taskService, workspaceService } from '../services';
import { notificationService } from '../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToastContext } from '../context/ToastContext';
import NotificationModal from '../components/NotificationModal';

interface PersonalDashboardScreenProps {
  navigation: any;
}

interface TaskSummary {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  projectName: string;
  projectId: string;
  workspaceName: string;
  workspaceId: string;
  assigneeName?: string;
  estimatedMinutes?: number;
}

interface DashboardStats {
  ongoing: number;
  completed: number;
  overdue: number;
  focusTime: number; // in minutes
  urgent: number;
  dueToday: number;
}

const PersonalDashboardScreen: React.FC<PersonalDashboardScreenProps> = ({ navigation }) => {
  const { showError } = useToastContext();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    ongoing: 0,
    completed: 0,
    overdue: 0,
    focusTime: 0,
    urgent: 0,
    dueToday: 0,
  });
  const [todayTasks, setTodayTasks] = useState<TaskSummary[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskSummary | null>(null);
  const [isTaskDetailVisible, setIsTaskDetailVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    loadUserData();
    loadNotificationCount();
  }, []);

  const loadUserData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        await loadDashboardData(user.id);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      showError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async (userId: number) => {
    try {
      // Fetch all workspaces for the user
      const workspacesRes = await workspaceService.getAllWorkspaces();
      if (!workspacesRes.success || !workspacesRes.data) {
        throw new Error('Failed to fetch workspaces');
      }

      const workspaces = workspacesRes.data;
      let allTasks: TaskSummary[] = [];

      // Fetch tasks from all workspaces
      for (const workspace of workspaces) {
        try {
          const tasksRes = await taskService.getTasksByWorkspace(workspace.id);
          if (tasksRes && Array.isArray(tasksRes)) {
            const workspaceTasks = tasksRes
              .filter((task: any) => task.assignedTo === userId)
              .map((task: any) => ({
                id: String(task.id),
                title: task.taskName,
                description: task.description || '',
                status: convertStatusToString(task.status),
                priority: convertPriorityToString(task.priority || 3),
                dueDate: task.endTime ? new Date(task.endTime) : undefined,
                projectName: task.project?.projectName || 'Unknown Project',
                projectId: String(task.projectId),
                workspaceName: workspace.workspaceName,
                workspaceId: String(workspace.id),
                assigneeName: task.assignee?.username || 'Unassigned',
                estimatedMinutes: task.estimatedMinutes,
              }));
            allTasks = [...allTasks, ...workspaceTasks];
          }
        } catch (error) {
          console.error(`Error fetching tasks for workspace ${workspace.id}:`, error);
        }
      }

      // Calculate stats
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const ongoing = allTasks.filter(t => t.status !== 'completed').length;
      const completed = allTasks.filter(t => t.status === 'completed').length;
      const overdue = allTasks.filter(t => 
        t.status !== 'completed' && 
        t.dueDate && 
        t.dueDate < now
      ).length;
      const urgent = allTasks.filter(t => 
        t.status !== 'completed' && 
        t.priority === 'urgent'
      ).length;
      const dueToday = allTasks.filter(t => 
        t.status !== 'completed' && 
        t.dueDate && 
        t.dueDate >= now &&
        t.dueDate <= today
      ).length;

      // Mock focus time for now (TODO: integrate with time tracking)
      const focusTime = 270; // 4h 30m

      setStats({ ongoing, completed, overdue, focusTime, urgent, dueToday });

      // Filter today's tasks (due today or overdue)
      const tasksForToday = allTasks
        .filter(t => {
          if (t.status === 'completed') return false;
          if (!t.dueDate) return false;
          return t.dueDate <= today;
        })
        .sort((a, b) => {
          // Sort by priority first, then by due date
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.getTime() - b.dueDate.getTime();
        });

      setTodayTasks(tasksForToday);
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      showError(error.message || 'Failed to load dashboard data');
    }
  };

  const convertStatusToString = (status?: string): 'todo' | 'in_progress' | 'completed' => {
    const s = (status || '').toLowerCase();
    if (s.includes('progress')) return 'in_progress';
    if (s.includes('done') || s.includes('complete')) return 'completed';
    return 'todo';
  };

  const convertPriorityToString = (priority: number): 'low' | 'medium' | 'high' | 'urgent' => {
    switch (priority) {
      case 5: return 'urgent';
      case 4: return 'high';
      case 3: return 'medium';
      case 2:
      case 1:
      default: return 'low';
    }
  };

  const loadNotificationCount = async () => {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        setNotificationCount(0);
        return;
      }

      const response = await notificationService.getUserNotifications();
      if (response.success) {
        setNotificationCount(response.data.length);
      }
    } catch (error: any) {
      const errorMessage = error?.message || '';
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
        setNotificationCount(0);
      } else {
        console.error('Error loading notification count:', error);
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (currentUser) {
      await loadDashboardData(currentUser.id);
    }
    await loadNotificationCount();
    setRefreshing(false);
  };

  const handleTaskPress = (task: TaskSummary) => {
    setSelectedTask(task);
    setIsTaskDetailVisible(true);
  };

  const handleTrackTask = (task: TaskSummary) => {
    navigation.navigate('TaskTracking', { task });
  };

  const formatFocusTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.contentWrapper}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.textContainer}>
              <Text style={styles.greeting}>Hi, {currentUser?.username || 'User'}!</Text>
              <Text style={styles.subtitle}>Here's a quick look at your tasks today</Text>
            </View>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => setShowNotificationModal(true)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="notifications" size={24} color={Colors.neutral.dark} />
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.primary]} />
          }
          contentContainerStyle={styles.scrollContent}
        >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: Colors.semantic.error + '15' }]}>
              <View style={[styles.statIcon, { backgroundColor: Colors.semantic.error + '25' }]}>
                <MaterialIcons name="priority-high" size={24} color={Colors.semantic.error} />
              </View>
              <Text style={styles.statValue}>{stats.urgent}</Text>
              <Text style={styles.statLabel}>Urgent</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: Colors.semantic.warning + '15' }]}>
              <View style={[styles.statIcon, { backgroundColor: Colors.semantic.warning + '25' }]}>
                <MaterialIcons name="today" size={24} color={Colors.semantic.warning} />
              </View>
              <Text style={styles.statValue}>{stats.dueToday}</Text>
              <Text style={styles.statLabel}>Due Today</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: Colors.primary + '15' }]}>
              <View style={[styles.statIcon, { backgroundColor: Colors.primary + '25' }]}>
                <MaterialIcons name="pending-actions" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.statValue}>{stats.ongoing}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
          </View>

          <View style={styles.focusTimeCard}>
            <View style={styles.focusTimeLeft}>
              <Text style={styles.focusTimeLabel}>Focus Time</Text>
              <Text style={styles.focusTimeValue}>{formatFocusTime(stats.focusTime)}</Text>
              <Text style={styles.focusTimeSubtext}>Today</Text>
            </View>
            <View style={styles.focusTimeRight}>
              <View style={styles.miniStatRow}>
                <View style={styles.miniStat}>
                  <Text style={styles.miniStatValue}>{stats.completed}</Text>
                  <Text style={styles.miniStatLabel}>Done</Text>
                </View>
                <View style={styles.miniStatDivider} />
                <View style={styles.miniStat}>
                  <Text style={[styles.miniStatValue, { color: Colors.semantic.error }]}>{stats.overdue}</Text>
                  <Text style={styles.miniStatLabel}>Overdue</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Today's Tasks Section */}
        <View style={styles.tasksSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tasks for Today</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => navigation.navigate('WorkspaceSelection')}>
                <Text style={styles.seeAllText}>Workspaces</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('TaskList')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
          </View>

          {todayTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="check-circle-outline" size={48} color={Colors.neutral.medium} />
              <Text style={styles.emptyStateText}>No tasks for today</Text>
              <Text style={styles.emptyStateSubtext}>You're all caught up! 🎉</Text>
            </View>
          ) : (
            <View style={styles.tasksList}>
              {todayTasks.map((task) => (
                <TaskCardModern
                  key={task.id}
                  task={task as any}
                  showProjectName={true}
                  onEdit={() => handleTaskPress(task)}
                  onNavigateToTracking={() => handleTrackTask(task)}
                />
              ))}
            </View>
          )}
        </View>
        </ScrollView>
      </View>

      <BottomTabNavigator
        navigation={navigation}
        activeRoute="dashboard"
        onCreateTask={() => navigation.navigate('WorkspaceSelection')}
      />

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          visible={isTaskDetailVisible}
          task={selectedTask as any}
          onClose={() => setIsTaskDetailVisible(false)}
          showProjectChip={true}
          onUpdateTask={() => {
            setIsTaskDetailVisible(false);
            handleRefresh();
          }}
          onDeleteTask={() => {
            setIsTaskDetailVisible(false);
            handleRefresh();
          }}
          onNavigateToProject={(projectId) => {
            // TODO: Navigate to project detail
            console.log('Navigate to project:', projectId);
          }}
        />
      )}

      {/* Notification Modal */}
      <NotificationModal
        visible={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentWrapper: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.neutral.medium,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light + '40',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.neutral.dark,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: Colors.neutral.medium,
  },
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.neutral.light + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    minHeight: 16,
    borderRadius: 8,
    backgroundColor: Colors.semantic.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontSize: 10,
    color: Colors.neutral.white,
    fontWeight: '600',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: Colors.neutral.white,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 6,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.neutral.dark,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.neutral.medium,
    fontWeight: '500',
  },
  focusTimeCard: {
    flexDirection: 'row',
    backgroundColor: Colors.accent + '15',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  focusTimeLeft: {
    flex: 1,
  },
  focusTimeLabel: {
    fontSize: 14,
    color: Colors.neutral.medium,
    fontWeight: '500',
    marginBottom: 4,
  },
  focusTimeValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.neutral.dark,
    marginBottom: 2,
  },
  focusTimeSubtext: {
    fontSize: 13,
    color: Colors.neutral.medium,
  },
  focusTimeRight: {
    paddingLeft: 20,
    borderLeftWidth: 1,
    borderLeftColor: Colors.neutral.light,
  },
  miniStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  miniStat: {
    alignItems: 'center',
  },
  miniStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.success,
  },
  miniStatLabel: {
    fontSize: 11,
    color: Colors.neutral.medium,
    fontWeight: '500',
    marginTop: 2,
  },
  miniStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.neutral.light,
  },
  tasksSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.neutral.dark,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  tasksList: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.neutral.medium,
  },
});

export default PersonalDashboardScreen;

