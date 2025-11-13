import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Swipeable } from 'react-native-gesture-handler';
import { Colors } from '../constants/Colors';
import { TaskSummary } from '../hooks/useWorkspaceData';

interface TaskCardModernProps {
  task: TaskSummary;
  onPress?: () => void;
  onTrackTime?: () => void;
  onDelete?: () => void;
}

const TaskCardModern: React.FC<TaskCardModernProps> = ({ 
  task, 
  onPress,
  onTrackTime,
  onDelete
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return Colors.semantic.error;
      case 'high': return Colors.warning;
      case 'medium': return Colors.accent;
      case 'low': return Colors.success;
      default: return Colors.neutral.medium;
    }
  };

  const formatDate = (date: Date) => {
    // Ensure date is a valid Date object before formatting
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      // Try to parse it if it's a string
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) return 'No date'; // Return fallback if invalid
      date = parsedDate;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getDateColor = (date: Date) => {
    if (task.status === 'completed') return Colors.neutral.dark;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      // Overdue - red
      return Colors.semantic.error;
    } else if (diffDays <= 3) {
      // Due soon (within 3 days) - orange
      return Colors.warning;
    } else {
      // Normal - black
      return Colors.neutral.dark;
    }
  };



  const renderRightActions = () => {
    return (
      <TouchableOpacity onPress={onDelete} style={styles.deleteAction}>
        <MaterialIcons name="delete-outline" size={24} color={Colors.semantic.error} />
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      <TouchableOpacity 
        style={[
          styles.container,
          { borderLeftColor: getPriorityColor(task.priority) }
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, task.status === 'completed' && styles.completedTitle]} numberOfLines={2}>
              {task.title}
            </Text>
            <TouchableOpacity 
              style={styles.trackButton}
              onPress={(e) => {
                e.stopPropagation();
                if (onTrackTime) onTrackTime();
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons name="access-time" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.projectName} numberOfLines={1}>{task.projectName}</Text>

          <View style={styles.footer}>
            <View style={styles.leftFooter}>
              {task.dueDate && (
                <View style={styles.dateContainer}>
                  <MaterialIcons 
                    name="event" 
                    size={14} 
                    color={getDateColor(task.dueDate)} 
                  />
                  <Text style={[
                    styles.dateText,
                    { color: getDateColor(task.dueDate) }
                  ]}>
                    {formatDate(task.dueDate)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.rightFooter}>
              {task.assigneeName && (
                <View style={styles.assigneeContainer}>
                  <View style={styles.assigneeAvatar}>
                    <Text style={styles.assigneeInitial}>
                      {task.assigneeName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.assigneeName} numberOfLines={1}>
                    {task.assigneeName}
                  </Text>
                </View>
              )}
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) + '15' }]}>
                <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                  {task.priority.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.neutral.light + '30',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.neutral.dark,
    lineHeight: 20,
    marginRight: 8,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: Colors.neutral.medium,
  },
  trackButton: {
    padding: 2,
  },
  projectName: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftFooter: {
    flex: 1,
  },
  rightFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
  },
  assigneeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 100,
  },
  assigneeAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  assigneeInitial: {
    fontSize: 10,
    color: Colors.neutral.white,
    fontWeight: '600',
  },
  assigneeName: {
    fontSize: 11,
    color: Colors.neutral.dark,
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  deleteAction: {
    backgroundColor: Colors.neutral.white,
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    marginVertical: 6,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.light + '90',
  },
});

export default TaskCardModern;
