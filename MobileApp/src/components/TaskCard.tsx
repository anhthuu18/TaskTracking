import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Task, TaskPriority } from '../types/Task';
import { Colors } from '../constants/Colors';
import { cardStyles, getPriorityBadgeStyle, getDeadlineStyle } from '../styles/cardStyles';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onStatusChange: (status: any) => void; // Keep for compatibility but won't be used
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onPress }) => {
  const getTaskIcon = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT:
        return 'priority-high';
      case TaskPriority.HIGH:
        return 'assignment';
      case TaskPriority.MEDIUM:
        return 'assignment';
      case TaskPriority.LOW:
        return 'assignment';
      case TaskPriority.LOWEST:
        return 'assignment';
      default:
        return 'assignment';
    }
  };

  const getTaskColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT:
        return Colors.priority.urgent;
      case TaskPriority.HIGH:
        return Colors.priority.high;
      case TaskPriority.MEDIUM:
        return Colors.priority.medium;
      case TaskPriority.LOW:
        return Colors.priority.low;
      case TaskPriority.LOWEST:
        return Colors.priority.lowest;
      default:
        return Colors.primary;
    }
  };

  const getPriorityText = (priority: TaskPriority): string => {
    switch (priority) {
      case TaskPriority.URGENT:
        return 'Urgent';
      case TaskPriority.HIGH:
        return 'High';
      case TaskPriority.MEDIUM:
        return 'Medium';
      case TaskPriority.LOW:
        return 'Low';
      case TaskPriority.LOWEST:
        return 'Lowest';
      default:
        return 'Medium';
    }
  };

  const formatDueDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Due: Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Due: Tomorrow';
    } else {
      return `Due: ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
  };

  return (
    <TouchableOpacity onPress={onPress} style={cardStyles.taskCard} activeOpacity={0.7}>
      <View style={cardStyles.taskIcon}>
        <MaterialIcons name={getTaskIcon(task.priority) as any} size={24} color={getTaskColor(task.priority)} />
      </View>
      <View style={cardStyles.taskContent}>
        <Text style={cardStyles.taskTitle}>{task.title}</Text>
        <Text style={cardStyles.taskProject}>{(task as any).project || 'Mane UiKit'}</Text>
        <View style={cardStyles.taskDeadline}>
          <MaterialIcons name="schedule" size={14} color={getTaskColor(task.priority)} />
          <Text style={[cardStyles.deadlineText, task.dueDate ? getDeadlineStyle(task.dueDate) : cardStyles.upcoming]}>
            {task.dueDate ? formatDueDate(task.dueDate) : 'No due date'}
          </Text>
        </View>
      </View>
      <View style={[cardStyles.priorityBadge, getPriorityBadgeStyle(task.priority)]}>
        <Text style={cardStyles.priorityText}>
          {getPriorityText(task.priority)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // No additional styles needed - using cardStyles.taskCard directly
});

export default TaskCard;

