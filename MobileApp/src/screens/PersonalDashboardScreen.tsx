import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TaskCardModern from '../components/TaskCardModern';
import TaskDetailModal from '../components/TaskDetailModal';
import DashboardHeader from '../components/DashboardHeader';
import { taskService, workspaceService } from '../services';
import { timeTrackingService, TimeTrackingSession } from '../services/timeTrackingService';
import { notificationService } from '../services/notificationService';
import { useToastContext } from '../context/ToastContext';
import NotificationModal from '../components/NotificationModal';
import { WorkspaceType } from '../types';

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
  startDate?: Date;
  projectName: string;
  projectId: string;
  workspaceName: string;
  workspaceId: string;
  workspaceType: 'personal' | 'group';
  assigneeName?: string;
  assigneeId?: number;
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
  const { showError, showSuccess } = useToastContext();
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
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});

  // Pomodoro settings state
  const [focusMin, setFocusMin] = useState<number>(25);
  const [shortBreakMin, setShortBreakMin] = useState<number>(5);
  const [longBreakMin, setLongBreakMin] = useState<number>(15);


  useEffect(() => {
    loadUserData();
    loadNotificationCount();
    loadPomodoroSettings();
  }, []);

  const loadPomodoroSettings = async () => {
    try {
      const raw = await AsyncStorage.getItem('pomodoroSettings');
      if (raw) {
        const s = JSON.parse(raw);
        if (Number.isFinite(s.focus)) setFocusMin(parseInt(String(s.focus), 10));
        if (Number.isFinite(s.shortBreak)) setShortBreakMin(parseInt(String(s.shortBreak), 10));
        if (Number.isFinite(s.longBreak)) setLongBreakMin(parseInt(String(s.longBreak), 10));
      } else {
        // Default to easy-test values; change to 25/5/15 later
        setFocusMin(2);
        setShortBreakMin(1);
        setLongBreakMin(2);
      }
    } catch {}
  };

  // Refresh dashboard whenever screen gains focus (ensure latest task status)
  useFocusEffect(
    React.useCallback(() => {
      // Always refresh when screen focused to ensure latest task status
      handleRefresh();
      // Also reload latest Pomodoro settings immediately after returning from Settings
      loadPomodoroSettings();
      return undefined;
    }, [])
  );

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
          const workspaceTypeNormalized: 'group' | 'personal' =
            workspace.workspaceType === WorkspaceType.GROUP ? 'group' : 'personal';

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
                startDate: task.startTime ? new Date(task.startTime) : undefined,
                projectName: task.project?.projectName || 'Unknown Project',
                projectId: String(task.projectId),
                workspaceName: workspace.workspaceName,
                workspaceId: String(workspace.id),
                workspaceType: workspaceTypeNormalized,
                assigneeName: task.assignee?.username || 'Unassigned',
                assigneeId: task.assignedTo,
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

      // Compute today's focus time (real data) across all assigned tasks
      let focusSecondsToday = 0;
      try {
        const taskIds = Array.from(new Set(allTasks.map(t => t.id))).filter(Boolean);
        const results = await Promise.allSettled(taskIds.map(id => timeTrackingService.getSessionsByTaskToday(Number(id))));
        for (const r of results) {
          if (r.status === 'fulfilled' && Array.isArray(r.value)) {
            for (const ss of r.value as TimeTrackingSession[]) {
              const upper = String(ss.sessionType || '').toUpperCase();
              const durSec = ss.startTime && ss.endTime
                ? Math.max(0, Math.round((new Date(ss.endTime).getTime() - new Date(ss.startTime).getTime()) / 1000))
                : Math.round(((ss.duration || 0) as number) * 60);
              if (upper.includes('FOCUS')) focusSecondsToday += durSec;
            }
          }
        }
      } catch {}
      const focusTime = Math.floor(focusSecondsToday / 60);

      setStats({ ongoing, completed, overdue, focusTime, urgent, dueToday });

      // Get top 5 most important tasks (recommended tasks)
      // Scoring algorithm: 
      // - Priority: urgent=10, high=7, medium=4, low=1
      // - Due date proximity: closer = higher score
      // - Status: in_progress gets bonus
      // - Completed tasks: always at the bottom
      const incompleteTasks = allTasks.filter(t => t.status !== 'completed');
      const completedTasks = allTasks.filter(t => t.status === 'completed');
      
      const scoredIncompleteTasks = incompleteTasks
        .map(task => {
          let score = 0;
          
          // Priority score
          const priorityScores = { urgent: 10, high: 7, medium: 4, low: 1 };
          score += priorityScores[task.priority];
          
          // Due date score (closer date = higher score)
          if (task.dueDate) {
            const daysUntilDue = Math.ceil((task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntilDue < 0) {
              // Overdue tasks get highest priority
              score += 15;
            } else if (daysUntilDue === 0) {
              // Due today
              score += 12;
            } else if (daysUntilDue <= 3) {
              // Due within 3 days
              score += 8;
            } else if (daysUntilDue <= 7) {
              // Due within a week
              score += 5;
            }
          }
          
          // Status bonus
          if (task.status === 'in_progress') {
            score += 3;
          }
          
          return { task, score };
        })
        .sort((a, b) => b.score - a.score);

      // Take top 5 incomplete tasks, then add completed tasks at the end
      const topIncompleteTasks = scoredIncompleteTasks.slice(0, 5).map(({ task }) => task);
      const remainingSlots = 5 - topIncompleteTasks.length;
      const tasksToShow = remainingSlots > 0
        ? [...topIncompleteTasks, ...completedTasks.slice(0, remainingSlots)]
        : topIncompleteTasks;

      setTodayTasks(tasksToShow as TaskSummary[]);
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      showError(error.message || 'Failed to load dashboard data');
    }
  };

  const convertStatusToString = (status?: string): 'todo' | 'in_progress' | 'completed' => {
    const s = (status || '').toLowerCase();
    if (s.includes('review')) return 'in_progress';
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

  const handleTaskPress = async (task: TaskSummary) => {
    try {
      const latest = await taskService.getTaskById(parseInt(task.id));
      const updated: TaskSummary = {
        ...task,
        title: latest.taskName || task.title,
        description: latest.description || task.description,
        status: convertStatusToString(latest.status),
        priority: convertPriorityToString(latest.priority || 3),
        startDate: latest.startTime ? new Date(latest.startTime as any) : task.startDate,
        dueDate: latest.endTime ? new Date(latest.endTime as any) : task.dueDate,
      };
      // Update list item locally so card shows fresh status
      setTodayTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      setSelectedTask(updated);
    } catch (e) {
      // fallback open with current data
      setSelectedTask(task);
    } finally {
      setIsTaskDetailVisible(true);
    }
  };

  const getFreshPomodoro = async () => {
    try {
      const raw = await AsyncStorage.getItem('pomodoroSettings');
      const s = raw ? JSON.parse(raw) : {};
      return {
        focus: Number.parseInt(String(s.focus ?? focusMin), 10) || focusMin,
        shortBreak: Number.parseInt(String(s.shortBreak ?? shortBreakMin), 10) || shortBreakMin,
        longBreak: Number.parseInt(String(s.longBreak ?? longBreakMin), 10) || longBreakMin,
      };
    } catch {
      return { focus: focusMin, shortBreak: shortBreakMin, longBreak: longBreakMin };
    }
  };

  const handleTrackTask = async (task: TaskSummary) => {
    const fresh = await getFreshPomodoro();
    try {
      const { activeTimer } = await import('../services/activeTimer');
      const active = activeTimer.get() || await activeTimer.load();
      if (active && active.isRunning && active.taskId !== parseInt(task.id)) {
        Alert.alert(
          'Switch tracking task?',
          `You are tracking another task. Do you want to pause it and start "${task.title}"?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Pause & Start',
              onPress: async () => {
                await activeTimer.update({ isRunning: false, remainingAtPause: Math.max(0, Math.round(((active.expectedEndTs || Date.now()) - Date.now()) / 1000)), expectedEndTs: null });
                navigation.navigate('TaskTracking', {
                  task,
                  timerConfig: fresh,
                  onStatusChanged: (newStatusLabel: string) => {
                    const mapped = ((): 'todo' | 'in_progress' | 'completed' => {
                      const s = newStatusLabel.toLowerCase();
                      if (s.includes('progress')) return 'in_progress';
                      if (s.includes('done') || s.includes('complete')) return 'completed';
                      return 'todo';
                    })();
                    setTodayTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: mapped } : t));
                    setStatusOverrides(prev => ({ ...prev, [task.id]: mapped }));
                  },
                });
              },
            },
          ]
        );
        return;
      }
      // If the active timer belongs to the same task, clear it so new settings apply cleanly
      if (active && Number(active.taskId) === parseInt(task.id)) {
        await activeTimer.clear();
      }
    } catch {}

    navigation.navigate('TaskTracking', {
      task,
      timerConfig: fresh,
      onStatusChanged: (newStatusLabel: string) => {
        const mapped = ((): 'todo' | 'in_progress' | 'completed' => {
          const s = newStatusLabel.toLowerCase();
          if (s.includes('progress')) return 'in_progress';
          if (s.includes('done') || s.includes('complete')) return 'completed';
          return 'todo';
        })();
        setTodayTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: mapped } : t));
        setStatusOverrides(prev => ({ ...prev, [task.id]: mapped }));
      },
    });
  };

  const handleToggleTaskStatus = async (task: TaskSummary) => {
    // Check if task is already completed
    const effectiveStatus = (statusOverrides[task.id] || task.status || '').toLowerCase();
    const isCompleted = effectiveStatus === 'completed' || effectiveStatus === 'done';
    
    if (isCompleted) {
      showSuccess('Task này đã được đánh dấu hoàn thành');
      return;
    }

    const recomputeIfExhausted = async (updatedList: TaskSummary[], overrides: Record<string, string>) => {
      try {
        const { activeTimer } = await import('../services/activeTimer');
        const st = activeTimer.get() || await activeTimer.load();
        const activeId = st?.taskId ? String(st.taskId) : null;
        const exhausted = updatedList.every(t => (overrides[t.id] || t.status) === 'completed' || t.id === activeId);
        if (exhausted && currentUser) {
          await loadDashboardData(currentUser.id);
        }
      } catch {}
    };

    // Show confirmation dialog
    Alert.alert(
      'Hoàn thành task',
      'Bạn có muốn đánh dấu hoàn thành task này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          onPress: async () => {
            // Optimistically update status + move to end of list
            setStatusOverrides(prev => ({ ...prev, [task.id]: 'completed' }));
            setTodayTasks(prev => {
              const list = prev.map(t => t.id === task.id ? { ...t, status: 'completed' as const } : t);
              const idx = list.findIndex(t => t.id === task.id);
              if (idx >= 0) {
                const [item] = list.splice(idx, 1);
                list.push(item);
              }
              // Trigger recompute if needed (all tasks completed/tracked)
              setTimeout(() => recomputeIfExhausted(list, { ...statusOverrides, [task.id]: 'completed' }), 0);
              return list as TaskSummary[];
            });

            try {
              await taskService.updateTask(parseInt(task.id), { status: 'Done' });
            } catch (error: any) {
              // Revert optimistic update on error
              setStatusOverrides(prev => {
                const newOverrides = { ...prev };
                delete newOverrides[task.id];
                return newOverrides;
              });
              setTodayTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
              console.error('Error toggling task status:', error);
              showError(error?.message || 'Cập nhật trạng thái thất bại');
            }
          },
        },
      ]
    );
  };

  const handleNavigateToProject = (projectId: string, workspaceId: string) => {
    // Pass minimal project object as ProjectDetailScreen expects route.params.project
    const pid = parseInt(projectId);
    const wid = parseInt(workspaceId);
    const projectObj = {
      id: pid,
      projectName: selectedTask?.projectName || 'Project',
      workspace: { id: wid, workspaceName: selectedTask?.workspaceName || 'Workspace', workspaceType: selectedTask?.workspaceType?.toUpperCase?.() || 'PERSONAL' },
    } as any;
    setIsTaskDetailVisible(false);
    navigation.navigate('ProjectDetail', { project: projectObj });
  };

  const handleAcceptInvitation = async (notificationId: number) => {
    try {
      // TODO: Implement invitation acceptance logic
      console.log('Accept invitation:', notificationId);
      await loadNotificationCount();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      showError('Failed to accept invitation');
    }
  };

  const handleDeclineInvitation = async (notificationId: number) => {
    try {
      // TODO: Implement invitation decline logic
      console.log('Decline invitation:', notificationId);
      await loadNotificationCount();
    } catch (error) {
      console.error('Error declining invitation:', error);
      showError('Failed to decline invitation');
    }
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
        <View style={styles.headerSpacing}>
          <DashboardHeader
            username={currentUser?.username || 'User'}
            subtitle="Here's a quick look at your tasks today"
            actions={[
              {
                icon: 'notifications',
                onPress: () => setShowNotificationModal(true),
                badgeCount: notificationCount,
              },
              {
                icon: 'settings',
                onPress: () => {
                  try {
                    const parent = navigation?.getParent?.();
                    if (parent?.navigate) parent.navigate('PersonalSettings');
                    else navigation?.navigate?.('PersonalSettings');
                  } catch { /* fallback */ }
                },
              },
            ]}
            searchPlaceholder="Search tasks..."
            searchQuery=""
            onSearchChange={() => {}}
            showSearchBar={false}
            onToggleSearchBar={() => {}}
            onClearSearch={() => {}}
            showSearchOptionsButton={false}
            enableSearch={false}
          />
        </View>
        {/* Fixed header blocks (non-scrollable) */}
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

        {/* Recommended Tasks Section - header fixed, list scrollable */}
        <View style={styles.tasksSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended Tasks</Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.primary]} />
            }
            contentContainerStyle={styles.tasksScrollContent}
          >
          {todayTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="check-circle-outline" size={48} color={Colors.neutral.medium} />
              <Text style={styles.emptyStateText}>No pending tasks</Text>
              <Text style={styles.emptyStateSubtext}>You're all caught up! 🎉</Text>
            </View>
          ) : (
            <View style={styles.tasksList}>
              {todayTasks.map((task) => {
                // Apply status override if exists
                const effectiveTask: TaskSummary = statusOverrides[task.id]
                  ? { ...task, status: statusOverrides[task.id] as 'todo' | 'in_progress' | 'completed' }
                  : task;
                
                return (
                <TaskCardModern
                  key={task.id}
                    task={effectiveTask as any}
                  showProjectName={true}
                    onEdit={() => handleTaskPress(effectiveTask)}
                    onNavigateToTracking={() => handleTrackTask(effectiveTask)}
                    onToggleStatus={() => handleToggleTaskStatus(task)}
                />
                );
              })}
            </View>
          )}
        </ScrollView>
        </View>
      </View>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          visible={isTaskDetailVisible}
          task={selectedTask as any}
          onClose={() => setIsTaskDetailVisible(false)}
          showProjectChip={true}
          onUpdateTask={async () => {
            setIsTaskDetailVisible(false);
            // Clear status override for this task
            setStatusOverrides(prev => {
              const newOverrides = { ...prev };
              delete newOverrides[selectedTask.id];
              return newOverrides;
            });
            await handleRefresh();
          }}
          onDeleteTask={() => {
            setIsTaskDetailVisible(false);
            handleRefresh();
          }}
          onNavigateToProject={(projectId) => {
            handleNavigateToProject(projectId, selectedTask.workspaceId);
          }}
        />
      )}

      {/* Notification Modal */}
      <NotificationModal
        visible={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onAcceptInvitation={handleAcceptInvitation}
        onDeclineInvitation={handleDeclineInvitation}
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
  headerSpacing: {
    marginBottom: 2,
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
  statsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Colors.neutral.white,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    padding: 10,
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
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 14,
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
    paddingLeft: 18,
    borderLeftWidth: 1,
    borderLeftColor: Colors.neutral.light,
  },
  miniStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
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
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 24,
    paddingBottom: 0,
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
  tasksScrollView: {
    maxHeight: 400, // Limit height to prevent screen stretching
  },
  tasksScrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  tasksList: {
    gap: 8,
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

