import React, {useState, useEffect} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Appbar,
  FAB,
  Searchbar,
  SegmentedButtons,
  Text,
} from 'react-native-paper';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

import TaskCard from '../components/TaskCard';
import {Task, TaskStatus, TaskPriority} from '../types/Task';

const TaskListScreen: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for demonstration
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Phát triển giao diện đăng nhập',
      description: 'Tạo màn hình đăng nhập với xác thực JWT và validation form',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      assignee: 'Nguyễn Văn A',
      dueDate: new Date('2024-01-15'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-10'),
      tags: ['Frontend', 'Authentication', 'UI/UX'],
    },
    {
      id: '2',
      title: 'Thiết kế database schema',
      description: 'Thiết kế cấu trúc cơ sở dữ liệu cho hệ thống quản lý task',
      status: TaskStatus.TODO,
      priority: TaskPriority.URGENT,
      assignee: 'Trần Thị B',
      dueDate: new Date('2024-01-12'),
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
      tags: ['Database', 'Backend'],
    },
    {
      id: '3',
      title: 'Viết API endpoints',
      description: 'Phát triển các API REST cho CRUD operations của tasks',
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      assignee: 'Lê Văn C',
      dueDate: new Date('2024-01-08'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-08'),
      tags: ['Backend', 'API'],
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
    },
  ];

  useEffect(() => {
    // Initialize with mock data
    setTasks(mockTasks);
    setFilteredTasks(mockTasks);
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchQuery, selectedStatus]);

  const filterTasks = () => {
    let filtered = tasks;

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(task => task.status === selectedStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        task =>
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query) ||
          task.assignee?.toLowerCase().includes(query) ||
          task.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredTasks(filtered);
  };

  const handleTaskPress = (task: Task) => {
    Alert.alert(
      'Chi tiết Task',
      `Tiêu đề: ${task.title}\n\nMô tả: ${task.description}\n\nTrạng thái: ${getStatusText(task.status)}\n\nĐộ ưu tiên: ${getPriorityText(task.priority)}`,
      [
        {text: 'Đóng', style: 'cancel'},
        {text: 'Chỉnh sửa', onPress: () => {}},
      ]
    );
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {...task, status: newStatus, updatedAt: new Date()}
          : task
      )
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleAddTask = () => {
    Alert.alert(
      'Thêm Task Mới',
      'Tính năng thêm task mới sẽ được phát triển trong phiên bản tiếp theo.',
      [{text: 'OK'}]
    );
  };

  const getStatusText = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.TODO:
        return 'Cần làm';
      case TaskStatus.IN_PROGRESS:
        return 'Đang làm';
      case TaskStatus.DONE:
        return 'Hoàn thành';
      case TaskStatus.CANCELLED:
        return 'Đã hủy';
      default:
        return 'Không xác định';
    }
  };

  const getPriorityText = (priority: TaskPriority): string => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'Thấp';
      case TaskPriority.MEDIUM:
        return 'Trung bình';
      case TaskPriority.HIGH:
        return 'Cao';
      case TaskPriority.URGENT:
        return 'Khẩn cấp';
      default:
        return 'Không xác định';
    }
  };

  const statusButtons = [
    {value: 'all', label: 'Tất cả'},
    {value: TaskStatus.TODO, label: 'Cần làm'},
    {value: TaskStatus.IN_PROGRESS, label: 'Đang làm'},
    {value: TaskStatus.DONE, label: 'Hoàn thành'},
  ];

  const renderTaskItem = ({item}: {item: Task}) => (
    <TaskCard
      task={item}
      onPress={handleTaskPress}
      onStatusChange={handleStatusChange}
    />
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text variant="titleMedium" style={styles.emptyText}>
        Không tìm thấy task nào
      </Text>
      <Text variant="bodyMedium" style={styles.emptySubText}>
        Thử thay đổi bộ lọc hoặc thêm task mới
      </Text>
    </View>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* App Bar */}
        <Appbar.Header>
          <Appbar.Content title="Quản lý Công việc" />
          <Appbar.Action
            icon="filter-variant"
            onPress={() => {}}
          />
          <Appbar.Action
            icon="dots-vertical"
            onPress={() => {}}
          />
        </Appbar.Header>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Tìm kiếm task..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
        </View>

        {/* Status Filter */}
        <View style={styles.filterContainer}>
          <SegmentedButtons
            value={selectedStatus}
            onValueChange={setSelectedStatus}
            buttons={statusButtons}
            style={styles.segmentedButtons}
          />
        </View>

        {/* Task List */}
        <FlatList
          data={filteredTasks}
          renderItem={renderTaskItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={renderEmptyList}
          contentContainerStyle={
            filteredTasks.length === 0 ? styles.emptyListContainer : undefined
          }
        />

        {/* Floating Action Button */}
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={handleAddTask}
          label="Thêm Task"
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: 'white',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  segmentedButtons: {
    backgroundColor: 'white',
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    color: '#999',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default TaskListScreen;
