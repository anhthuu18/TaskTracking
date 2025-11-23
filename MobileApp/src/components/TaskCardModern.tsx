import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Swipeable } from 'react-native-gesture-handler';

import { Colors } from '../constants/Colors';
import { TaskSummary } from '../hooks/useWorkspaceData';

interface TaskCardModernProps {
  task: TaskSummary;
  onPress?: () => void;
  onTrackTime?: () => void;
  onDelete?: () => void;
  onToggleStatus?: () => void;
  showProjectName?: boolean; // when true, show a small project chip under description (default true)
  canDelete?: boolean; // controls whether swipe-to-delete action is shown
}

const TaskCardModern: React.FC<TaskCardModernProps> = ({ 
  task, 
  onPress,
  onTrackTime,
  onDelete,
  onToggleStatus,
  showProjectName = true,
  canDelete = false,
}) => {
  // Helper function to normalize priority to string
  const normalizePriority = (priority: any): string => {
    if (typeof priority === 'number') {
      // Convert numeric priority (1-5) to string
      switch (priority) {
        case 5: return 'urgent';
        case 4: return 'high';
        case 3: return 'medium';
        case 2:
        case 1:
        default: return 'low';
      }
    }
    // If it's already a string or undefined, return it (or default to 'medium')
    return priority?.toLowerCase() || 'medium';
  };

  const getPriorityColor = (priority: string) => {
    const normalizedPriority = normalizePriority(priority);
    switch (normalizedPriority) {
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
    if (!canDelete) return null;
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
        <TouchableOpacity
            onPress={(e) => {
                e.stopPropagation();
                if (onToggleStatus) onToggleStatus();
            }}
            style={styles.radioButtonContainer}
        >
            <View style={[styles.radioButton, task.status === 'completed' && styles.radioButtonCompleted]}>
                {task.status === 'completed' && (
                    <MaterialIcons name="check" size={16} color={Colors.neutral.white} />
                )}
            </View>
        </TouchableOpacity>
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

          {/* Description (truncate, fallback) */}
          <Text style={styles.description} numberOfLines={1}>
            {task.description && task.description.trim().length > 0 ? task.description : 'No description'}
          </Text>

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
              {showProjectName && !!task.projectName && (
                <View style={styles.projectChipRight}>
                  <MaterialIcons name="folder" size={12} color={Colors.neutral.medium} />
                  <Text style={styles.projectChipText} numberOfLines={1}>{task.projectName}</Text>
                </View>
              )}
              <View style={styles.rightFooterRow}>
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
                    {normalizePriority(task.priority).toUpperCase()}
                  </Text>
                </View>
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
    flexDirection: 'row',
    alignItems: 'center',
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
  radioButtonContainer: {
    paddingRight: 12,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.neutral.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonCompleted: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
  description: {
    fontSize: 12,
    color: Colors.neutral.medium,
    marginBottom: 6,
  },
  projectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: Colors.neutral.light + '30',
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    marginBottom: 8,
  },
  projectChipText: {
    fontSize: 11,
    color: Colors.neutral.medium,
    maxWidth: '85%',
  },
  projectChipRight: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: Colors.neutral.light + '30',
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    marginBottom: 4,
    maxWidth: '70%',
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
    alignItems: 'flex-end',
  },
  rightFooterRow: {
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
