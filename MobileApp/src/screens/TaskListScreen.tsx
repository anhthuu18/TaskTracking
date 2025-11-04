import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { TextInput } from 'react-native-paper';
import { Colors } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';

import TaskCardModern from '../components/TaskCardModern';
import { TaskSummary } from '../hooks/useWorkspaceData';
import {Task, TaskStatus, TaskPriority} from '../types/Task';

interface TaskListScreenProps {
  navigation?: any;
  route?: any;
  onViewAllTasksComplete?: () => void;
}

const TaskListScreen: React.FC<TaskListScreenProps> = ({ navigation, route, onViewAllTasksComplete }) => {
  const { colors } = useTheme();
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  // Initialize filter - default to 'all', will be set to 'upcoming' if coming from View All
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  
  const showAllTasks = route?.params?.showAllTasks || false;

  // Convert Task to TaskSummary
  const convertTaskToTaskSummary = (task: Task): TaskSummary => {
    const statusMap: { [key: string]: 'todo' | 'in_progress' | 'completed' } = {
      [TaskStatus.TODO]: 'todo',
      [TaskStatus.IN_PROGRESS]: 'in_progress',
      [TaskStatus.DONE]: 'completed',
      [TaskStatus.CANCELLED]: 'todo',
    };

    const priorityMap: { [key: string]: 'low' | 'medium' | 'high' | 'urgent' } = {
      [TaskPriority.LOWEST]: 'low',
      [TaskPriority.LOW]: 'low',
      [TaskPriority.MEDIUM]: 'medium',
      [TaskPriority.HIGH]: 'high',
      [TaskPriority.URGENT]: 'urgent',
    };

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: statusMap[task.status] || 'todo',
      priority: priorityMap[task.priority] || 'medium',
      dueDate: task.dueDate,
      projectId: (task as any).projectId || '1',
      projectName: task.project || 'Default Project',
      assigneeName: task.assignee,
      tags: task.tags || [],
    };
  };

  // Mock data for demonstration
  const mockTasks: (Task & { projectId?: string })[] = [
    {
      id: '1',
      title: 'Phát triển giao diện đăng nhập',
      description: 'Tạo màn hình đăng nhập với xác thực JWT và validation form',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      assignee: 'Nguyễn Văn A',
      dueDate: new Date('2025-11-05T10:31:45.987Z'), // Upcoming
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-10'),
      tags: ['Frontend', 'Authentication', 'UI/UX'],
      projectId: '1',
    },
    {
      id: '2',
      title: 'Thiết kế database schema',
      description: 'Thiết kế cấu trúc cơ sở dữ liệu cho hệ thống quản lý task',
      status: TaskStatus.TODO,
      priority: TaskPriority.URGENT,
      assignee: 'Trần Thị B',
      dueDate: new Date('2025-10-20T10:31:45.987Z'), // Overdue
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
      tags: ['Database', 'Backend'],
      projectId: '1',
    },
    {
      id: '3',
      title: 'Viết API endpoints',
      description: 'Phát triển các API REST cho CRUD operations của tasks',
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      assignee: 'Lê Văn C',
      dueDate: new Date('2025-11-10T10:31:45.987Z'), // Completed
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-08'),
      tags: ['Backend', 'API'],
      projectId: '2',
    },
    {
      id: '4',
      title: 'Thiết lập CI/CD pipeline',
      description: 'Cấu hình GitHub Actions cho auto deployment',
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      assignee: 'Phạm Văn D',
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
      tags: ['DevOps', 'Automation'],
      projectId: '2',
    },
  ];

  // Track if filter was set from View All to prevent resetting it
  // Use ref instead of state to persist across re-renders
  const filterSetFromViewAllRef = useRef(false);
  // Track if this is the first mount to distinguish between View All and direct tab click
  const isFirstMountRef = useRef(true);

  useEffect(() => {
    const currentShowAllTasks = route?.params?.showAllTasks || false;
    const tasksToProcess = mockTasks.map(convertTaskToTaskSummary);

    const sorted = tasksToProcess.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
    
    setTasks(sorted);

    // Update filter based on showAllTasks
    if (currentShowAllTasks) {
      console.log('[TaskListScreen] Setting filter to upcoming from View All');
      setSelectedFilter('upcoming');
      filterSetFromViewAllRef.current = true; // Mark that filter was set from View All
      isFirstMountRef.current = false; // No longer first mount
      
      // Call onViewAllTasksComplete after a delay to ensure filter is set and applied
      if (onViewAllTasksComplete) {
        setTimeout(() => {
          onViewAllTasksComplete();
        }, 500); // Increase delay to ensure filter is fully applied
      }
    } else {
      // showAllTasks is false
      // Only reset to 'all' if:
      // 1. This is the first mount (component just mounted)
      // 2. Filter wasn't set from View All (user clicked tab directly)
      // 3. Filter is not already 'all'
      if (isFirstMountRef.current && !filterSetFromViewAllRef.current && selectedFilter !== 'all') {
        console.log('[TaskListScreen] First mount with showAllTasks=false, setting filter to all');
        setSelectedFilter('all');
      }
      // Mark that first mount is done
      if (isFirstMountRef.current) {
        isFirstMountRef.current = false;
      }
      // If filterSetFromViewAllRef.current is true, filter was set from View All
      // and should remain 'upcoming' - DON'T reset it
    }
  }, [route?.params?.showAllTasks, onViewAllTasksComplete]);

  // Guard effect: Protect filter from being reset after onViewAllTasksComplete is called
  // This effect runs whenever selectedFilter changes and ensures it stays 'upcoming' 
  // if it was set from View All
  useEffect(() => {
    // If filter was set from View All and somehow got reset, restore it immediately
    if (filterSetFromViewAllRef.current && selectedFilter !== 'upcoming') {
      console.log('[TaskListScreen] Guard: Restoring filter to upcoming (was set from View All)');
      // Use a small timeout to avoid infinite loops and allow state updates to settle
      const timeoutId = setTimeout(() => {
        setSelectedFilter('upcoming');
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedFilter]);


  useEffect(() => {
    filterTasks();
  }, [tasks, searchQuery, selectedFilter]);

  const filterTasks = () => {
    let filtered = tasks;
    const now = new Date();
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    switch (selectedFilter) {
      case 'upcoming':
        filtered = tasks.filter(task => {
          if (!task.dueDate || task.status === 'completed') return false;
          const dueDate = task.dueDate.getTime();
          return dueDate > now.getTime() && dueDate <= sevenDaysLater.getTime();
        });
        // Sort upcoming tasks by due date (nearest first)
        filtered.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.getTime() - b.dueDate.getTime();
        });
        break;
      case 'overdue':
        filtered = tasks.filter(task => task.dueDate && task.dueDate < now && task.status !== 'completed');
        // Sort overdue tasks by due date (most overdue first)
        filtered.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.getTime() - b.dueDate.getTime();
        });
        break;
      case 'completed':
        filtered = tasks.filter(task => task.status === 'completed');
        break;
      case 'all':
      default:
        // Sort all tasks by due date (nearest first, no due date at end)
        filtered.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.getTime() - b.dueDate.getTime();
        });
        break;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        task =>
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query)
      );
    }

    setFilteredTasks(filtered);
  };

  const handleTaskPress = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && navigation) {
      navigation.navigate('ProjectDetail' as never, { projectId: task.projectId });
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const filterButtons = [
    {value: 'all', label: 'All'},
    {value: 'upcoming', label: 'Upcoming'},
    {value: 'overdue', label: 'Overdue'},
    {value: 'completed', label: 'Completed'},
  ];

  const renderTaskItem = ({item}: {item: TaskSummary}) => (
    <TaskCardModern
      task={item}
      onPress={() => handleTaskPress(item.id)}
    />
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="assignment" size={48} color={Colors.neutral.medium} />
      <Text style={[styles.emptyText, { color: colors.text }]}>
        No tasks found
      </Text>
      <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
        Try changing the filter or creating a new task.
      </Text>
    </View>
  );

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
            }
          }}
        />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {filterButtons.map(button => (
            <TouchableOpacity
              key={button.value}
              style={[
                styles.filterButton,
                selectedFilter === button.value && styles.activeFilterButton
              ]}
              onPress={() => {
                setSelectedFilter(button.value);
                // Reset flag when user manually selects a filter
                filterSetFromViewAllRef.current = false;
              }}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === button.value && styles.activeFilterButtonText
              ]}>
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
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyList}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 10,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.neutral.white,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchAndFilterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  searchInput: {
    fontSize: 15,
    backgroundColor: Colors.neutral.light + '50',
  },
  searchOutline: {
    borderRadius: 12,
    borderWidth: 1.5,
  },
  filterContainer: {
    paddingVertical: 12,
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: 0, // Remove horizontal padding from the container
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.neutral.light + '50',
    marginHorizontal: 4,
    height: 36,
    justifyContent: 'center',
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default TaskListScreen;
