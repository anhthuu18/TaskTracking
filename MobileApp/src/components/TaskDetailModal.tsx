import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TextInput,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { TaskSummary } from '../types/Task';

interface TaskDetailModalProps {
  visible: boolean;
  task: TaskSummary | null;
  onClose: () => void;
  onUpdateTask: (task: TaskSummary) => void;
  onDeleteTask: (taskId: number | string) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  visible,
  task,
  onClose,
  onUpdateTask,
}) => {
  const [editableTask, setEditableTask] = useState<TaskSummary | null>(task);

  useEffect(() => {
    setEditableTask(task);
  }, [task]);

  if (!editableTask) return null;

  const handleUpdate = (field: keyof TaskSummary, value: any) => {
    if (!editableTask) return;
    const updatedTask = { ...editableTask, [field]: value };
    setEditableTask(updatedTask);
    onUpdateTask(updatedTask);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return Colors.semantic.error;
      case 'high': return Colors.warning;
      case 'medium': return Colors.accent;
      case 'low': return Colors.success;
      default: return Colors.neutral.medium;
    }
  };

  const renderInfoField = (label: string, value: string | undefined, color?: string, containerStyle?: object) => {
    if (!value) return null;
    return (
      <View style={[styles.fieldContainer, containerStyle]}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={[styles.fieldValueContainer, { backgroundColor: color ? color + '15' : Colors.neutral.light + '40' }]}>
          <Text style={[styles.fieldValue, { color: color || Colors.neutral.dark }]}>{value}</Text>
        </View>
      </View>
    );
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{task.title}</Text>
            {renderInfoField('Description', task.description)}
            {renderInfoField('Project', task.projectName, Colors.primary)}
            <View style={styles.rowContainer}>
              {renderInfoField('Status', task.status, undefined, { flex: 1 })}
              {renderInfoField('Priority', task.priority, getPriorityColor(task.priority), { flex: 1 })}
            </View>
            <View style={styles.rowContainer}>
              {renderInfoField('Assignee', task.assigneeName, undefined, { flex: 1 })}
              {renderInfoField('Due Date', formatDate(task.dueDate), undefined, { flex: 1 })}
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: Dimensions.get('window').height * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.neutral.dark,
    marginBottom: 24,
    textAlign: 'left',
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldContainer: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  fieldValueContainer: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default TaskDetailModal;
