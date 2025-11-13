import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { useTheme } from '../hooks/useTheme';
import { Task } from '../types/Task';
import TaskCardModern from '../components/TaskCardModern';

interface TimeTracking {
  id: string;
  taskId: string;
  taskTitle: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
}

// Enriched type for rendering
interface EnrichedTimeTracking extends TimeTracking {
  task?: Task;
}

interface CalendarScreenProps {
  navigation?: any;
  route?: any;
}

const CalendarScreen: React.FC<CalendarScreenProps> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const passedTasks = route?.params?.tasks;
  const passedTimeTrackings = route?.params?.timeTrackings;

  const [selectedDate, setSelectedDate] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [tasks, setTasks] = useState<Task[]>(passedTasks || []);
  const [timeTrackings, setTimeTrackings] = useState<EnrichedTimeTracking[]>(passedTimeTrackings || []);
  const [loading, setLoading] = useState(!passedTasks);
  const [refreshing, setRefreshing] = useState(false);

  // Load tasks and time trackings if not passed as props
  useEffect(() => {
    if (!passedTasks) {
      loadData();
    }
  }, [selectedDate, passedTasks]);

  const loadData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API calls
      // const tasksResponse = await taskService.getTasks();
      // const trackingsResponse = await timeTrackingService.getTrackings();
      
      // Mock tasks data with due dates
      const mockToday = new Date();
      mockToday.setHours(0, 0, 0, 0);
      
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'API Integration Testing',
          description: 'Complete API integration and testing',
          status: 'in_progress' as any,
          priority: 'urgent' as any,
          dueDate: new Date(mockToday.getFullYear(), mockToday.getMonth(), mockToday.getDate() + 1),
          createdAt: new Date(),
          updatedAt: new Date(),
          assignee: 'John Doe',
          project: 'Mobile App',
        },
        {
          id: '2',
          title: 'UI Design Review',
          description: 'Review and finalize UI designs',
          status: 'todo' as any,
          priority: 'high' as any,
          dueDate: new Date(mockToday.getFullYear(), mockToday.getMonth(), mockToday.getDate() + 2),
          createdAt: new Date(),
          updatedAt: new Date(),
          assignee: 'Jane Smith',
          project: 'Mobile App',
        },
        {
          id: '3',
          title: 'Database Optimization',
          description: 'Optimize database queries',
          status: 'in_progress' as any,
          priority: 'medium' as any,
          dueDate: mockToday,
          createdAt: new Date(),
          updatedAt: new Date(),
          assignee: 'Bob Johnson',
          project: 'Backend',
        },
        {
          id: '4',
          title: 'Code Review',
          description: 'Review pull requests',
          status: 'done' as any,
          priority: 'medium' as any,
          dueDate: new Date(mockToday.getFullYear(), mockToday.getMonth(), mockToday.getDate() - 1),
          createdAt: new Date(),
          updatedAt: new Date(),
          assignee: 'Alice Brown',
          project: 'Backend',
        },
        {
          id: '5',
          title: 'Documentation Update',
          description: 'Update project documentation',
          status: 'todo' as any,
          priority: 'low' as any,
          dueDate: new Date(mockToday.getFullYear(), mockToday.getMonth(), mockToday.getDate() + 5),
          createdAt: new Date(),
          updatedAt: new Date(),
          assignee: 'Charlie Wilson',
          project: 'Documentation',
        },
      ];
      
      // Mock time tracking data for past dates
      const rawMockTrackings: TimeTracking[] = [
        {
          id: '1',
          taskId: '4',
          taskTitle: 'Code Review',
          startTime: new Date(mockToday.getFullYear(), mockToday.getMonth(), mockToday.getDate() - 1, 9, 0),
          endTime: new Date(mockToday.getFullYear(), mockToday.getMonth(), mockToday.getDate() - 1, 11, 30),
          duration: 150,
        },
        {
          id: '2',
          taskId: '4',
          taskTitle: 'Code Review',
          startTime: new Date(mockToday.getFullYear(), mockToday.getMonth(), mockToday.getDate() - 1, 14, 0),
          endTime: new Date(mockToday.getFullYear(), mockToday.getMonth(), mockToday.getDate() - 1, 16, 0),
          duration: 120,
        },
        {
          id: '3',
          taskId: '3',
          taskTitle: 'Database Optimization',
          startTime: new Date(mockToday.getFullYear(), mockToday.getMonth(), mockToday.getDate() - 2, 10, 0),
          endTime: new Date(mockToday.getFullYear(), mockToday.getMonth(), mockToday.getDate() - 2, 13, 0),
          duration: 180,
        },
      ];

      // Enrich tracking data with full task details
      const enrichedTrackings = rawMockTrackings.map(tracking => {
        const task = mockTasks.find(t => t.id === tracking.taskId);
        return { ...tracking, task };
      });
      
      setTasks(mockTasks);
      setTimeTrackings(enrichedTrackings);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const isDateInPast = (date: Date) => {
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    return compareDate < todayDate;
  };

  const isDateToday = (date: Date) => {
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    return compareDate.getTime() === todayDate.getTime();
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  };

  const getWeekdayName = (day: number) => {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return weekdays[day];
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.calendarDay} />
      );
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(currentYear, currentMonth, day);
      currentDate.setHours(0, 0, 0, 0);
      
      const isSelected = selectedDate.getDate() === day && 
                        selectedDate.getMonth() === currentMonth && 
                        selectedDate.getFullYear() === currentYear;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isToday = today.getDate() === day && 
                     today.getMonth() === currentMonth && 
                     today.getFullYear() === currentYear;
      
      // Check if there are tasks due on this day OR trackings (red dot for both)
      const hasDueTasks = tasks.some(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === currentDate.getTime();
      });
      
      const hasTrackings = timeTrackings.some(tracking => {
        const trackingDate = new Date(tracking.startTime);
        trackingDate.setHours(0, 0, 0, 0);
        return trackingDate.getTime() === currentDate.getTime();
      });
      
      // Show red dot if there are tasks due OR trackings
      const hasActivity = hasDueTasks || hasTrackings;
      
      days.push(
        <TouchableOpacity
          key={day}
          style={styles.calendarDay}
          onPress={() => {
            const newDate = new Date(currentYear, currentMonth, day);
            setSelectedDate(newDate);
          }}
        >
          <View style={[
            styles.calendarDayInner,
            isToday && styles.calendarDayToday,
            isSelected && styles.calendarDaySelected
          ]}>
            <Text style={[
              styles.calendarDayText,
              isSelected && styles.calendarDayTextSelected,
              isToday && styles.calendarDayTextToday
            ]}>
              {day}
            </Text>
          </View>
          {/* Show red dot for dates with activity (tasks or trackings) */}
          {hasActivity && (
            <View style={styles.activityDot} />
          )}
        </TouchableOpacity>
      );
    }
    
    // Add empty cells to fill the remaining space (always 42 cells total)
    const totalCells = 42;
    const remainingCells = totalCells - days.length;
    for (let i = 0; i < remainingCells; i++) {
      days.push(
        <View key={`empty-end-${i}`} style={styles.calendarDay} />
      );
    }
    
    return days;
  };

  const getTasksForSelectedDate = () => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.getDate() === selectedDate.getDate() &&
             taskDate.getMonth() === selectedDate.getMonth() &&
             taskDate.getFullYear() === selectedDate.getFullYear();
    });
  };

  const getTrackingsForSelectedDate = () => {
    return timeTrackings.filter(tracking => {
      const trackingDate = new Date(tracking.startTime);
      return trackingDate.getDate() === selectedDate.getDate() &&
             trackingDate.getMonth() === selectedDate.getMonth() &&
             trackingDate.getFullYear() === selectedDate.getFullYear();
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };



  const renderTaskItem = (task: Task) => {
    // Convert Task to TaskSummary format for TaskCardModern
    const taskSummary = {
      id: task.id,
      title: task.title,
      description: task.description || '',
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      dueDate: task.dueDate,
      projectName: task.project || '',
      assigneeName: task.assignee || '',
      tags: task.tags || [],
    };

    return (
      <TaskCardModern
        key={task.id}
        task={taskSummary as any}
        onPress={() => {
          // TODO: Navigate to task detail
          console.log('Task pressed:', task.id);
        }}
        onTrackTime={() => {
          // TODO: Handle time tracking
          console.log('Track time for task:', task.id);
        }}
      />
    );
  };

  const renderTrackingItem = (tracking: EnrichedTimeTracking) => {
    // If we have the full task data, use TaskCardModern
    if (tracking.task) {
      const taskSummary = {
        id: tracking.task.id,
        title: tracking.task.title,
        description: tracking.task.description || '',
        status: tracking.task.status || 'todo',
        priority: tracking.task.priority || 'medium',
        dueDate: tracking.task.dueDate,
        projectName: tracking.task.project || '',
        assigneeName: tracking.task.assignee || '',
        tags: tracking.task.tags || [],
      };

      return (
        <View key={tracking.id} style={styles.trackingItemContainer}>
          {/* Time Tracking Label */}
          <View style={styles.trackingTimeLabel}>
            <MaterialIcons name="schedule" size={16} color={Colors.primary} />
            <Text style={styles.trackingTimeLabelText}>
              {formatTime(tracking.startTime)} - {formatTime(tracking.endTime)}
            </Text>
            <View style={styles.trackingDurationBadge}>
              <Text style={styles.trackingDurationBadgeText}>
                {Math.floor(tracking.duration / 60)}h {tracking.duration % 60}m
              </Text>
            </View>
          </View>
          
          {/* Task Card */}
          <TaskCardModern
            task={taskSummary as any}
            onPress={() => {
              // TODO: Navigate to task detail
              console.log('Tracking pressed:', tracking.id);
            }}
            onTrackTime={() => {
              // TODO: Handle time tracking
              console.log('Track time for task:', tracking.task?.id);
            }}
          />
        </View>
      );
    }

    // Fallback to simple card if task data is not available
    return (
      <View key={tracking.id} style={styles.trackingItemContainer}>
        {/* Time Tracking Label */}
        <View style={styles.trackingTimeLabel}>
          <MaterialIcons name="schedule" size={16} color={Colors.primary} />
          <Text style={styles.trackingTimeLabelText}>
            {formatTime(tracking.startTime)} - {formatTime(tracking.endTime)}
          </Text>
          <View style={styles.trackingDurationBadge}>
            <Text style={styles.trackingDurationBadgeText}>
              {Math.floor(tracking.duration / 60)}h {tracking.duration % 60}m
            </Text>
          </View>
        </View>
        
        {/* Simple Task Card */}
        <TouchableOpacity 
          style={styles.trackingCard}
          onPress={() => {
            console.log('Tracking pressed:', tracking.id);
          }}
        >
          <Text style={styles.trackingTaskTitle}>{tracking.taskTitle}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const selectedDateTasks = getTasksForSelectedDate();
  const selectedDateTrackings = getTrackingsForSelectedDate();
  const isPastDate = isDateInPast(selectedDate);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: colors.text }]}>Calendar</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {isPastDate ? 'View your tracked tasks' : 'Manage your tasks and deadlines'}
            </Text>
          </View>
        </View>

        {/* Calendar Grid */}
        <View style={[styles.calendarContainer, { backgroundColor: colors.surface }]}>
          {/* Calendar Header */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity 
              onPress={() => navigateMonth('prev')}
              style={styles.navButton}
            >
              <MaterialIcons name="chevron-left" size={20} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.calendarTitleContainer}>
              <Text style={[styles.calendarTitle, { color: colors.text }]}>
                {getMonthName(currentMonth)}
              </Text>
              <Text style={[styles.calendarYear, { color: colors.textSecondary }]}>
                {currentYear}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => navigateMonth('next')}
              style={styles.navButton}
            >
              <MaterialIcons name="chevron-right" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {/* Weekday Headers */}
            <View style={styles.calendarHeaderRow}>
              {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                <View key={day} style={styles.weekdayHeaderContainer}>
                  <Text style={[styles.weekdayHeader, { color: colors.textSecondary }]}>
                    {getWeekdayName(day)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar Days */}
            <View style={styles.calendarDays}>
              {renderCalendarDays()}
            </View>
          </View>
        </View>

        {/* Selected Date Display */}
        <View style={styles.selectedDateSection}>
          <Text style={[styles.selectedDateText, { color: colors.text }]}>
            {formatDate(selectedDate)}
          </Text>
          {isPastDate ? (
            selectedDateTrackings.length > 0 && (
              <Text style={[styles.itemCountText, { color: colors.textSecondary }]}>
                {selectedDateTrackings.length} tracking{selectedDateTrackings.length > 1 ? 's' : ''}
              </Text>
            )
          ) : (
            selectedDateTasks.length > 0 && (
              <Text style={[styles.itemCountText, { color: colors.textSecondary }]}>
                {selectedDateTasks.length} task{selectedDateTasks.length > 1 ? 's' : ''}
              </Text>
            )
          )}
        </View>

        {/* Tasks or Trackings List - Based on selected date */}
        <View style={styles.itemsSection}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : isPastDate ? (
            // Show time trackings for past dates
            selectedDateTrackings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="history" size={48} color={Colors.neutral.medium} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No tracking history</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  No tasks were tracked on this date
                </Text>
              </View>
            ) : (
              <ScrollView 
                style={styles.itemsScrollView}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {selectedDateTrackings.map((tracking) => renderTrackingItem(tracking))}
              </ScrollView>
            )
          ) : (
            // Show tasks due for current/future dates
            selectedDateTasks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="check-circle" size={48} color={Colors.neutral.medium} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No tasks due</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  No tasks are due on this date
                </Text>
              </View>
            ) : (
              <ScrollView 
                style={styles.itemsScrollView}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {selectedDateTasks.map((task) => renderTaskItem(task))}
              </ScrollView>
            )
          )}
        </View>
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 10,
    paddingBottom: 16,
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  header: {
    paddingTop: 10,
    paddingBottom: 20,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  createButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
    marginTop: 4,
  },
  createButtonSmallText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.white,
  },
  calendarContainer: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    marginHorizontal: 20,
    shadowColor: Colors.neutral.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.neutral.light + '40',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light + '60',
  },
  navButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: Colors.neutral.light + '30',
  },
  calendarTitleContainer: {
    alignItems: 'center',
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  calendarYear: {
    fontSize: 12,
    fontWeight: '500',
  },
  calendarGrid: {
    marginTop: 8,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Match calendarDays alignment
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  weekdayHeaderContainer: {
    width: '14.28%',
    alignItems: 'center',
  },
  weekdayHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.neutral.medium,
  },
  calendarDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: 4,
  },
  calendarDay: {
    width: '14.28%', // 100% / 7 days = 14.28%
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    position: 'relative',
  },
  calendarDayInner: {
    width: 34,
    height: 34,
    borderRadius: 17, // Half of width/height for perfect circle
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDaySelected: {
    backgroundColor: Colors.primary + '20',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 17, // Match inner container
  },
  calendarDayToday: {
    backgroundColor: Colors.neutral.light,
    borderRadius: 17, // Match inner container
  },
  calendarDayText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  calendarDayTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  calendarDayTextToday: {
    color: Colors.neutral.dark,
    fontWeight: '600',
  },
  activityDot: {
    position: 'absolute',
    bottom: 2,
    width: 4  ,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.semantic.error,
  },
  selectedDateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemCountText: {
    fontSize: 13,
  },
  itemsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  itemsScrollView: {
    maxHeight: 400,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  
  // New Tracking Card Styles
  trackingItemContainer: {
    marginBottom: 16,
  },
  trackingTimeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 8,
  },
  trackingTimeLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    flex: 1,
  },
  trackingDurationBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  trackingDurationBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.white,
  },
  trackingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.neutral.light + '60',
    shadowColor: Colors.neutral.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  trackingTaskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
});

export default CalendarScreen;
