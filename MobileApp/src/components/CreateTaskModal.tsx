import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { useToastContext } from '../context/ToastContext';
import { ProjectMember } from '../types/Project';

// Project Member Dropdown Component
interface ProjectMemberDropdownProps {
  members: ProjectMember[];
  selectedMemberIds: string[];
  onMemberSelect: (memberIds: string[]) => void;
}

const ProjectMemberDropdown: React.FC<ProjectMemberDropdownProps> = ({
  members,
  selectedMemberIds,
  onMemberSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMember = (memberId: string) => {
    if (selectedMemberIds.includes(memberId)) {
      onMemberSelect(selectedMemberIds.filter(id => id !== memberId));
    } else {
      onMemberSelect([...selectedMemberIds, memberId]);
    }
  };

  const getSelectedMembersDisplay = () => {
    const selectedMemberObjects = members.filter(member => 
      selectedMemberIds.includes(String(member.id))
    );
    const totalSelected = selectedMemberObjects.length;
    if (totalSelected === 0) {
      return 'Select members';
    }
    
    if (totalSelected <= 3) {
      const names = selectedMemberObjects.map(m => m.user.username);
      return names.join(', ');
    }
    
    return `${totalSelected} members selected`;
  };

  return (
    <View style={dropdownStyles.container}>
      <TouchableOpacity
        style={dropdownStyles.dropdownButton}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={dropdownStyles.dropdownText} numberOfLines={1}>{getSelectedMembersDisplay()}</Text>
        <MaterialIcons 
          name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
          size={24} 
          color={Colors.neutral.medium} 
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={dropdownStyles.dropdown}>
          <View style={dropdownStyles.membersSection}>
            <Text style={dropdownStyles.sectionTitle}>Project Members</Text>
            <ScrollView style={dropdownStyles.membersList} nestedScrollEnabled>
              {members.map((member) => (
                <TouchableOpacity
                  key={String(member.id)}
                  style={dropdownStyles.memberItem}
                  onPress={() => toggleMember(String(member.id))}
                >
                  <View style={dropdownStyles.memberInfo}>
                    <View style={dropdownStyles.avatar}>
                      <Text style={dropdownStyles.avatarText}>
                        {(member.user.username || member.user.email || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={dropdownStyles.memberDetails}>
                      <Text style={dropdownStyles.memberName}>
                        {member.user.username || member.user.email}
                      </Text>
                      <Text style={dropdownStyles.memberEmail}>
                        {member.user.email}
                      </Text>
                    </View>
                  </View>
                  <View style={dropdownStyles.checkbox}>
                    {selectedMemberIds.includes(String(member.id)) && (
                      <MaterialIcons name="check" size={20} color={Colors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

// Priority Dropdown Component
interface PriorityDropdownProps {
  selectedPriority: string;
  onPrioritySelect: (priority: string) => void;
}

const PriorityDropdown: React.FC<PriorityDropdownProps> = ({
  selectedPriority,
  onPrioritySelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const priorityOptions = [
    { value: 'urgent', label: 'Urgent', color: Colors.error },
    { value: 'high', label: 'High', color: Colors.warning },
    { value: 'medium', label: 'Medium', color: Colors.primary },
    { value: 'low', label: 'Low', color: Colors.accent },
    { value: 'lowest', label: 'Lowest', color: Colors.neutral.medium },
  ];

  const getDisplayText = () => {
    if (!selectedPriority) return 'Select priority';
    const option = priorityOptions.find(opt => opt.value === selectedPriority);
    return option ? option.label : 'Select priority';
  };

  return (
    <View style={dropdownStyles.container}>
      <TouchableOpacity
        style={dropdownStyles.dropdownButton}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={dropdownStyles.dropdownText}>{getDisplayText()}</Text>
        <MaterialIcons 
          name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
          size={24} 
          color={Colors.neutral.medium} 
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={dropdownStyles.dropdown}>
          {priorityOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={dropdownStyles.option}
              onPress={() => {
                onPrioritySelect(option.value);
                setIsOpen(false);
              }}
            >
              <View style={[dropdownStyles.priorityIndicator, { backgroundColor: option.color + '20' }]}>
                <View style={[dropdownStyles.priorityDot, { backgroundColor: option.color }]} />
              </View>
              <Text style={dropdownStyles.optionText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// Status Dropdown Component
interface StatusDropdownProps {
  selectedStatus: string;
  onStatusSelect: (status: string) => void;
}

const StatusDropdown: React.FC<StatusDropdownProps> = ({
  selectedStatus,
  onStatusSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'waiting_for_review', label: 'Waiting for Review' },
    { value: 'waiting_for_test', label: 'Waiting for Test' },
    { value: 'done', label: 'Done' },
  ];

  const getDisplayText = () => {
    if (!selectedStatus) return 'Select status';
    const option = statusOptions.find(opt => opt.value === selectedStatus);
    return option ? option.label : 'Select status';
  };

  return (
    <View style={dropdownStyles.container}>
      <TouchableOpacity
        style={dropdownStyles.dropdownButton}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={dropdownStyles.dropdownText}>{getDisplayText()}</Text>
        <MaterialIcons 
          name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
          size={24} 
          color={Colors.neutral.medium} 
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={dropdownStyles.dropdown}>
          {statusOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={dropdownStyles.option}
              onPress={() => {
                onStatusSelect(option.value);
                setIsOpen(false);
              }}
            >
              <Text style={dropdownStyles.optionText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateTask: (taskData: any) => void;
  projectMembers?: ProjectMember[];
  projectId?: string;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  visible,
  onClose,
  onCreateTask,
  projectMembers = [],
  projectId,
}) => {
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('todo');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringRule, setRecurringRule] = useState('');
  const [showRecurringOptions, setShowRecurringOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess, showError } = useToastContext();

  const resetForm = () => {
    setTaskName('');
    setDescription('');
    setSelectedMembers([]);
    setPriority('');
    setStatus('todo');
    setStartTime('');
    setEndTime('');
    setEstimatedDuration('');
    setIsRecurring(false);
    setRecurringRule('');
    setShowRecurringOptions(false);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleMemberSelect = (memberIds: string[]) => {
    setSelectedMembers(memberIds);
  };

  const handleCreate = async () => {
    if (!taskName.trim()) {
      showError('Please enter a task name');
      return;
    }

    if (!priority) {
      showError('Please select a priority');
      return;
    }

    if (!status) {
      showError('Please select a status');
      return;
    }

    const taskData = {
      taskName: taskName.trim(),
      description: description.trim() || undefined,
      projectId: projectId || undefined,
      assignedMembers: selectedMembers,
      priority,
      status,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
      isRecurring,
      recurringRule: isRecurring ? recurringRule : undefined,
    };

    try {
      setIsLoading(true);
      await onCreateTask(taskData);
      showSuccess('Task created successfully!');
      handleClose();
    } catch (error) {
      console.error('Error creating task:', error);
      showError('Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="fade"
        transparent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Create task</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={Colors.neutral.dark} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Task Name */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Task name"
                  placeholderTextColor={Colors.neutral.medium}
                  value={taskName}
                  onChangeText={setTaskName}
                  maxLength={100}
                />
              </View>

              {/* Description */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Task description"
                  placeholderTextColor={Colors.neutral.medium}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Assigned Members */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Assigned to</Text>
                <ProjectMemberDropdown
                  members={projectMembers}
                  selectedMemberIds={selectedMembers}
                  onMemberSelect={handleMemberSelect}
                />
              </View>

              {/* Priority */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Priority</Text>
                <PriorityDropdown
                  selectedPriority={priority}
                  onPrioritySelect={setPriority}
                />
              </View>

              {/* Status */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Status</Text>
                <StatusDropdown
                  selectedStatus={status}
                  onStatusSelect={setStatus}
                />
              </View>

              {/* Start Time */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Start time</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="dd/mm/yyyy hh:mm (e.g., 15/12/2024 10:00)"
                  placeholderTextColor={Colors.neutral.medium}
                  value={startTime}
                  onChangeText={setStartTime}
                />
              </View>

              {/* End Time */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>End time (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="dd/mm/yyyy hh:mm (e.g., 15/12/2024 18:00)"
                  placeholderTextColor={Colors.neutral.medium}
                  value={endTime}
                  onChangeText={setEndTime}
                />
              </View>

              {/* Estimated Duration */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Estimated duration (minutes)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter estimated duration"
                  placeholderTextColor={Colors.neutral.medium}
                  value={estimatedDuration}
                  onChangeText={setEstimatedDuration}
                  keyboardType="numeric"
                />
              </View>

              {/* Recurring Toggle */}
              <View style={styles.section}>
                <View style={styles.toggleContainer}>
                  <Text style={styles.sectionTitle}>Repeat</Text>
                  <TouchableOpacity
                    style={[styles.toggleButton, isRecurring && styles.toggleButtonActive]}
                    onPress={() => {
                      setIsRecurring(!isRecurring);
                      if (!isRecurring) {
                        setShowRecurringOptions(true);
                      } else {
                        setShowRecurringOptions(false);
                      }
                    }}
                  >
                    <View style={[styles.toggleCircle, isRecurring && styles.toggleCircleActive]} />
                  </TouchableOpacity>
                </View>
                
                {isRecurring && (
                  <View style={styles.recurringSection}>
                    <TouchableOpacity
                      style={styles.textInput}
                      onPress={() => setShowRecurringOptions(!showRecurringOptions)}
                    >
                      <View style={styles.dropdownInput}>
                        <Text style={[
                          styles.dropdownText,
                          !recurringRule && styles.placeholderText
                        ]}>
                          {recurringRule || 'Select repeat frequency'}
                        </Text>
                        <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.neutral.medium} />
                      </View>
                    </TouchableOpacity>
                    
                    {showRecurringOptions && (
                      <View style={styles.recurringDropdown}>
                        <TouchableOpacity
                          style={styles.recurringOption}
                          onPress={() => {
                            setRecurringRule('Daily');
                            setShowRecurringOptions(false);
                          }}
                        >
                          <Text style={styles.recurringOptionText}>Daily</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.recurringOption}
                          onPress={() => {
                            setRecurringRule('Weekly');
                            setShowRecurringOptions(false);
                          }}
                        >
                          <Text style={styles.recurringOptionText}>Weekly</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.recurringOption}
                          onPress={() => {
                            setRecurringRule('Monthly');
                            setShowRecurringOptions(false);
                          }}
                        >
                          <Text style={styles.recurringOptionText}>Monthly</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.recurringOption}
                          onPress={() => {
                            setRecurringRule('Yearly');
                            setShowRecurringOptions(false);
                          }}
                        >
                          <Text style={styles.recurringOptionText}>Yearly</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Footer Create Button */}
            <View style={styles.footer}>
              <TouchableOpacity 
                style={[styles.createButton, isLoading && styles.createButtonDisabled]}
                onPress={handleCreate}
                disabled={isLoading}
              >
                <Text style={styles.createButtonText}>
                  {isLoading ? 'Creating...' : 'Create task'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.neutral.light + '20',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.neutral.light,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
  },
  toggleCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleCircleActive: {
    transform: [{ translateX: 20 }],
  },
  recurringSection: {
    marginTop: 12,
    position: 'relative',
    zIndex: 1000,
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  placeholderText: {
    color: Colors.neutral.medium,
  },
  recurringDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    borderRadius: 8,
    marginTop: 4,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1001,
  },
  recurringOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light + '50',
  },
  recurringOptionText: {
    fontSize: 16,
    color: Colors.neutral.dark,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.light,
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    backgroundColor: Colors.neutral.medium,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.surface,
  },
});

// Dropdown styles
const dropdownStyles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    borderRadius: 8,
    backgroundColor: Colors.neutral.light + '20',
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    borderRadius: 8,
    marginTop: 4,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1001,
  },
  membersSection: {
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.dark,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.neutral.light + '30',
  },
  membersList: {
    maxHeight: 200,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light + '50',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.surface,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral.dark,
  },
  memberEmail: {
    fontSize: 14,
    color: Colors.neutral.medium,
  },
  checkbox: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light + '50',
  },
  optionText: {
    fontSize: 16,
    color: Colors.neutral.dark,
    marginLeft: 12,
  },
  priorityIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default CreateTaskModal;