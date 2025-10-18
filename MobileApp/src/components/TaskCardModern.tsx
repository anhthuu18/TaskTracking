import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { TaskSummary } from '../hooks/useWorkspaceData';

interface TaskCardModernProps {
  task: TaskSummary;
  onPress?: () => void;
  onStatusPress?: () => void;
  onAssigneePress?: () => void;
}

const TaskCardModern: React.FC<TaskCardModernProps> = ({ 
  task, 
  onPress, 
  onStatusPress,
  onAssigneePress 
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return Colors.success;
      case 'in_progress': return Colors.warning;
      case 'todo': return Colors.neutral.medium;
      default: return Colors.neutral.medium;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'check-circle';
      case 'in_progress': return 'play-circle';
      case 'todo': return 'radio-button-unchecked';
      default: return 'radio-button-unchecked';
    }
  };

  const formatDueDate = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  const isOverdue = task.dueDate && task.dueDate < new Date() && task.status !== 'completed';

  return (
    <TouchableOpacity 
      style={[styles.container, isOverdue && styles.overdueContainer]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <TouchableOpacity onPress={onStatusPress} style={styles.statusButton}>
            <MaterialIcons 
              name={getStatusIcon(task.status) as any} 
              size={20} 
              color={getStatusColor(task.status)} 
            />
          </TouchableOpacity>
          <View style={styles.titleContent}>
            <Text style={[styles.title, task.status === 'completed' && styles.completedTitle]}>
              {task.title}
            </Text>
            <Text style={styles.projectName}>{task.projectName}</Text>
          </View>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) + '15' }]}>
          <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
            {task.priority.toUpperCase()}
          </Text>
        </View>
      </View>

      {task.description && (
        <Text style={styles.description} numberOfLines={2}>
          {task.description}
        </Text>
      )}

      <View style={styles.footer}>
        <View style={styles.metaInfo}>
          {task.assigneeName && (
            <TouchableOpacity onPress={onAssigneePress} style={styles.assigneeContainer}>
              <View style={styles.assigneeAvatar}>
                <Text style={styles.assigneeInitial}>
                  {task.assigneeName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.assigneeName}>{task.assigneeName}</Text>
            </TouchableOpacity>
          )}
          
          {task.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {task.tags.slice(0, 2).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
              {task.tags.length > 2 && (
                <Text style={styles.moreTagsText}>+{task.tags.length - 2}</Text>
              )}
            </View>
          )}
        </View>

        {task.dueDate && (
          <Text style={[
            styles.dueDate,
            { 
              color: isOverdue 
                ? Colors.semantic.error 
                : task.dueDate.getTime() - new Date().getTime() < 24 * 60 * 60 * 1000
                  ? Colors.warning
                  : Colors.neutral.medium 
            }
          ]}>
            {formatDueDate(task.dueDate)}
          </Text>
        )}
      </View>

      {task.estimatedHours && (
        <View style={styles.timeInfo}>
          <MaterialIcons name="schedule" size={14} color={Colors.neutral.medium} />
          <Text style={styles.timeText}>
            {task.actualHours ? `${task.actualHours}/${task.estimatedHours}h` : `${task.estimatedHours}h estimated`}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.neutral.light + '30',
  },
  overdueContainer: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.semantic.error,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  statusButton: {
    padding: 4,
    marginRight: 8,
  },
  titleContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
    lineHeight: 22,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: Colors.neutral.medium,
  },
  projectName: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: Colors.neutral.medium,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  assigneeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  assigneeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  assigneeInitial: {
    fontSize: 10,
    color: Colors.neutral.white,
    fontWeight: '600',
  },
  assigneeName: {
    fontSize: 12,
    color: Colors.neutral.dark,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  tagText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 10,
    color: Colors.neutral.medium,
    fontWeight: '500',
  },
  dueDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.light,
  },
  timeText: {
    fontSize: 12,
    color: Colors.neutral.medium,
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default TaskCardModern;
