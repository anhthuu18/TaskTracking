import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { Task } from '../types/Task';

interface CalendarViewProps {
  tasks: Task[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks }) => {
  // Group tasks by due date
  const tasksByDate = tasks.reduce((acc, task) => {
    if (task.dueDate) {
      const dateKey = task.dueDate.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(task);
    }
    return acc;
  }, {} as Record<string, Task[]>);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return Colors.success;
      case 'in_progress':
        return Colors.warning;
      case 'todo':
        return Colors.neutral.medium;
      default:
        return Colors.neutral.medium;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return Colors.error;
      case 'high':
        return Colors.warning;
      case 'medium':
        return Colors.primary;
      case 'low':
        return Colors.neutral.medium;
      default:
        return Colors.neutral.medium;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {Object.keys(tasksByDate).length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="event" size={48} color={Colors.neutral.medium} />
          <Text style={styles.emptyTitle}>No tasks scheduled</Text>
          <Text style={styles.emptySubtitle}>Tasks with due dates will appear here</Text>
        </View>
      ) : (
        Object.entries(tasksByDate)
          .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
          .map(([dateString, tasks]) => (
            <View key={dateString} style={styles.dateSection}>
              <View style={styles.dateHeader}>
                <MaterialIcons name="event" size={20} color={Colors.primary} />
                <Text style={styles.dateText}>{formatDate(dateString)}</Text>
                <Text style={styles.taskCount}>({tasks.length} tasks)</Text>
              </View>
              
              <View style={styles.tasksContainer}>
                {tasks.map((task) => (
                  <View key={task.id} style={styles.taskItem}>
                    <View style={styles.taskHeader}>
                      <Text style={styles.taskTitle} numberOfLines={1}>
                        {task.title}
                      </Text>
                      <View style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityColor(task.priority) }
                      ]}>
                        <Text style={styles.priorityText}>
                          {task.priority.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.taskMeta}>
                      <View style={styles.statusContainer}>
                        <View style={[
                          styles.statusDot,
                          { backgroundColor: getStatusColor(task.status) }
                        ]} />
                        <Text style={styles.statusText}>
                          {task.status.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                      
                      {task.assignee && (
                        <View style={styles.assigneeContainer}>
                          <MaterialIcons name="person" size={14} color={Colors.neutral.medium} />
                          <Text style={styles.assigneeText}>{task.assignee}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.neutral.medium,
    textAlign: 'center',
  },
  dateSection: {
    marginBottom: 24,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginLeft: 8,
  },
  taskCount: {
    fontSize: 14,
    color: Colors.neutral.medium,
    marginLeft: 8,
  },
  tasksContainer: {
    gap: 8,
  },
  taskItem: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.dark,
    flex: 1,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.surface,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: Colors.neutral.medium,
    fontWeight: '500',
  },
  assigneeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assigneeText: {
    fontSize: 12,
    color: Colors.neutral.medium,
    marginLeft: 4,
  },
});

export default CalendarView;
