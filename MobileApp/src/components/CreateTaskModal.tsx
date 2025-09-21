import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { TaskPriority } from '../types';

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateTask: (taskData: any) => void;
  projectId?: string;
  projectName?: string;
  projectMembers?: any[];
  isPersonalWorkspace?: boolean;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  visible,
  onClose,
  onCreateTask,
  projectId,
  projectName,
  projectMembers = [],
  isPersonalWorkspace = false,
}) => {
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [startDate] = useState(new Date());
  const [endDate] = useState(new Date());
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);

  const priorityOptions = [
    { value: TaskPriority.URGENT, label: 'Urgent', color: Colors.priority.urgent },
    { value: TaskPriority.HIGH, label: 'High', color: Colors.priority.high },
    { value: TaskPriority.MEDIUM, label: 'Medium', color: Colors.priority.medium },
    { value: TaskPriority.LOW, label: 'Low', color: Colors.priority.low },
    { value: TaskPriority.LOWEST, label: 'Lowest', color: Colors.priority.lowest },
  ];

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleCreate = () => {
    if (!taskName.trim()) {
      Alert.alert('Error', 'Please enter a task name');
      return;
    }

    const taskData = {
      name: taskName,
      description,
      projectId,
      assignedMembers: isPersonalWorkspace ? [] : selectedMembers,
      startDate,
      endDate,
      priority,
    };

    onCreateTask(taskData);
    
    // Reset form
    setTaskName('');
    setDescription('');
    setSelectedMembers([]);
    setPriority(TaskPriority.MEDIUM);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color={Colors.neutral.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create task</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Project Selection */}
          {projectName && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Project</Text>
              <View style={styles.projectSelector}>
                <Text style={styles.projectName}>{projectName}</Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.primary} />
              </View>
            </View>
          )}

          {/* Task Name */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Name</Text>
            <TextInput
              style={styles.textInput}
              value={taskName}
              onChangeText={setTaskName}
              placeholder="Text"
              placeholderTextColor={Colors.primary}
            />
          </View>

          {/* Add Member - Only show for project tasks */}
          {!isPersonalWorkspace && projectMembers.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Add member</Text>
              <View style={styles.membersRow}>
                {projectMembers.slice(0, 1).map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.memberAvatar,
                      selectedMembers.includes(member.id) && styles.selectedMemberAvatar
                    ]}
                    onPress={() => handleMemberToggle(member.id)}
                  >
                    <Text style={styles.memberInitial}>
                      {member.username.charAt(0).toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.addMemberButton}>
                  <MaterialIcons name="add" size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Calendar */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Calendar</Text>
            <View style={styles.dateContainer}>
              <TouchableOpacity style={styles.dateButton}>
                <MaterialIcons name="event" size={20} color={Colors.surface} />
                <Text style={styles.dateText}>Jan 1 2021</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dateButton, styles.endDateButton]}>
                <MaterialIcons name="event" size={20} color={Colors.surface} />
                <Text style={styles.dateText}>Jan 1 2021</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Priority */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Priority</Text>
            <View style={styles.priorityContainer}>
              {priorityOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.priorityOption,
                    priority === option.value && styles.selectedPriorityOption
                  ]}
                  onPress={() => setPriority(option.value)}
                >
                  <View style={[styles.priorityDot, { backgroundColor: option.color }]} />
                  <Text style={[
                    styles.priorityText,
                    priority === option.value && styles.selectedPriorityText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.descriptionInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Text"
              placeholderTextColor={Colors.primary}
              multiline
              numberOfLines={4}
            />
          </View>
        </ScrollView>

        {/* Create Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
            <Text style={styles.createButtonText}>Create</Text>
            <MaterialIcons name="arrow-forward" size={20} color={Colors.surface} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
   );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 12,
  },
  projectSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  projectName: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.neutral.dark,
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    backgroundColor: Colors.surface,
    gap: 8,
  },
  selectedPriorityOption: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 14,
    color: Colors.neutral.dark,
    fontWeight: '500',
  },
  selectedPriorityText: {
    color: Colors.primary,
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedMemberAvatar: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  memberInitial: {
    color: Colors.surface,
    fontSize: 18,
    fontWeight: '600',
  },
  addMemberButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },

  dateContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.neutral.dark,
    borderRadius: 20,
    gap: 8,
  },
  endDateButton: {
    backgroundColor: Colors.primary,
  },
  dateText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateTaskModal;
