import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Card, Chip, Icon} from 'react-native-paper';
import {Task, TaskStatus, TaskPriority} from '../types/Task';

interface TaskCardProps {
  task: Task;
  onPress: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({task, onPress, onStatusChange}) => {
  const getStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.TODO:
        return '#E3F2FD'; // Light Blue
      case TaskStatus.IN_PROGRESS:
        return '#FFF3E0'; // Light Orange
      case TaskStatus.DONE:
        return '#E8F5E8'; // Light Green
      case TaskStatus.CANCELLED:
        return '#FFEBEE'; // Light Red
      default:
        return '#F5F5F5';
    }
  };

  const getPriorityColor = (priority: TaskPriority): string => {
    switch (priority) {
      case TaskPriority.LOW:
        return '#4CAF50'; // Green
      case TaskPriority.MEDIUM:
        return '#FF9800'; // Orange
      case TaskPriority.HIGH:
        return '#F44336'; // Red
      case TaskPriority.URGENT:
        return '#9C27B0'; // Purple
      default:
        return '#757575';
    }
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

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  return (
    <TouchableOpacity onPress={() => onPress(task)} style={styles.container}>
      <Card style={[styles.card, {backgroundColor: getStatusColor(task.status)}]}>
        <Card.Content>
          {/* Header with title and priority */}
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>
              {task.title}
            </Text>
            <Chip
              style={[
                styles.priorityChip,
                {backgroundColor: getPriorityColor(task.priority)},
              ]}
              textStyle={styles.chipText}>
              {getPriorityText(task.priority)}
            </Chip>
          </View>

          {/* Description */}
          {task.description && (
            <Text style={styles.description} numberOfLines={3}>
              {task.description}
            </Text>
          )}

          {/* Status and Due Date */}
          <View style={styles.footer}>
            <View style={styles.statusContainer}>
              <Icon source="circle" size={12} color={getPriorityColor(task.priority)} />
              <Text style={styles.statusText}>{getStatusText(task.status)}</Text>
            </View>
            
            {task.dueDate && (
              <View style={styles.dueDateContainer}>
                <Icon source="calendar" size={16} color="#666" />
                <Text style={styles.dueDateText}>{formatDate(task.dueDate)}</Text>
              </View>
            )}
          </View>

          {/* Assignee */}
          {task.assignee && (
            <View style={styles.assigneeContainer}>
              <Icon source="account" size={16} color="#666" />
              <Text style={styles.assigneeText}>Người thực hiện: {task.assignee}</Text>
            </View>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {task.tags.slice(0, 3).map((tag, index) => (
                <Chip key={index} style={styles.tagChip} textStyle={styles.tagText}>
                  {tag}
                </Chip>
              ))}
              {task.tags.length > 3 && (
                <Text style={styles.moreTagsText}>+{task.tags.length - 3} thêm</Text>
              )}
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  card: {
    elevation: 2,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  priorityChip: {
    minWidth: 80,
    height: 28,
  },
  chipText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  assigneeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  assigneeText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tagChip: {
    backgroundColor: '#E0E0E0',
    marginRight: 6,
    marginBottom: 4,
    height: 24,
  },
  tagText: {
    fontSize: 11,
    color: '#666',
  },
  moreTagsText: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default TaskCard;
