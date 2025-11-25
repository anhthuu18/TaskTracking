import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Swipeable } from 'react-native-gesture-handler';

import { Colors } from '../constants/Colors';
import { TaskSummary } from '../hooks/useWorkspaceData';

interface TaskCardModernProps {
  task: TaskSummary;
  onPress?: () => void;
  onEdit?: () => void;
  onNavigateToTracking?: () => void;
  onDelete?: () => void;
  onToggleStatus?: () => void;
  showProjectName?: boolean;
  canDelete?: boolean;
  isActiveTracking?: boolean; // when true, show highlighted style
}

const getWorkspaceTheme = (type?: 'personal' | 'group') => {
  const color = type === 'group' ? Colors.semantic.success : Colors.semantic.info;
  return {
    container: {
      backgroundColor: color + '20',
      borderColor: color + '40',
    },
    text: {
      color,
    },
    icon: color,
  };
};

const TaskCardModern: React.FC<TaskCardModernProps> = ({ 
  task, 
  onPress,
  onEdit,
  onNavigateToTracking,
  onDelete,
  onToggleStatus,
  showProjectName = true,
  canDelete = false,
  isActiveTracking = false,
}) => {
  // Helper function to normalize priority to string
  const normalizePriority = (priority: any): string => {
    if (typeof priority === 'number') {
      switch (priority) {
        case 5: return 'urgent';
        case 4: return 'high';
        case 3: return 'medium';
        case 2:
        case 1:
        default: return 'low';
      }
    }
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
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) return 'No date';
      date = parsedDate;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
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
    if (diffDays < 0) return Colors.semantic.error;
    if (diffDays <= 3) return Colors.warning;
    return Colors.neutral.dark;
  };

  const workspaceTheme = getWorkspaceTheme(task.workspaceType);
  const projectIconName = task.workspaceType === 'group' ? 'groups' : 'person';

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
      <View 
        style={[
          styles.container,
          { borderLeftColor: getPriorityColor(task.priority) },
          isActiveTracking && styles.activeTrackingContainer,
        ]}
      >
        {/* Active tracking badge */}
        {isActiveTracking && (
          <View style={styles.trackingBadge}>
            <MaterialIcons name="whatshot" size={12} color={Colors.primary} />
            <Text style={styles.trackingBadgeText}>Tracking</Text>
          </View>
        )}

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
        <TouchableOpacity 
          style={styles.content}
          onPress={onNavigateToTracking}
          activeOpacity={0.7}
        >
          <View style={styles.header}>
            <Text style={[styles.title, task.status === 'completed' && styles.completedTitle]} numberOfLines={2}>
              {task.title}
            </Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={(e) => {
                e.stopPropagation();
                if (onEdit) onEdit();
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons name="edit" size={18} color={Colors.neutral.medium} />
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
                <View style={[styles.projectChipRight, workspaceTheme.container]}>
                  <MaterialIcons name={projectIconName as any} size={12} color={workspaceTheme.icon} />
                  <Text
                    style={[styles.projectChipText, workspaceTheme.text]}
                    numberOfLines={1}
                  >
                    {task.projectName}
                  </Text>
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
        </TouchableOpacity>
        </View>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    borderRadius: 8,
    padding: 8,
    marginVertical: 4,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.neutral.light + '30',
    position: 'relative',
  },
  activeTrackingContainer: {
    backgroundColor: Colors.primary + '12',
    borderColor: Colors.primary + '60',
  },
  trackingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    zIndex: 1,
  },
  trackingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  radioButtonContainer: {
    paddingRight: 10,
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
  editButton: {
    padding: 4,
    marginLeft: 8,
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
