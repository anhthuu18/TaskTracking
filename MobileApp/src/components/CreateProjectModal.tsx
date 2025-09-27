import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { CreateProjectRequest, ProjectLabel } from '../types/Project';
import { WorkspaceMember } from '../types/Workspace';
import DatePicker from './DatePicker';
import MemberDropdown from './MemberDropdown';
import LabelSelector from './LabelSelector';

interface CreateProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateProject?: (projectData: CreateProjectRequest) => void;
  onProjectCreated?: (project: any) => void;
  workspaceId?: string;
  workspaceMembers?: WorkspaceMember[];
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  visible,
  onClose,
  onCreateProject,
  onProjectCreated,
  workspaceId = '',
  workspaceMembers = [],
}) => {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 days from now
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [labels, setLabels] = useState<Omit<ProjectLabel, 'id'>[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setProjectName('');
    setDescription('');
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    setSelectedMembers([]);
    setInviteEmails([]);
    setLabels([]);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    if (!projectName.trim()) {
      Alert.alert('Error', 'Please enter a project name');
      return;
    }

    if (startDate >= endDate) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }

    const projectData: CreateProjectRequest = {
      projectName: projectName.trim(),
      description: description.trim() || undefined,
      workspaceId: Number(workspaceId),
    };

    try {
      setIsLoading(true);
      
      if (onCreateProject) {
        await onCreateProject(projectData);
      }
      
      if (onProjectCreated) {
        // Mock project for onProjectCreated callback
        const mockProject = {
          id: Date.now().toString(),
          ...projectData,
          members: [],
          status: 'active',
          progress: 0,
          completedTasks: 0,
          totalTasks: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        onProjectCreated(mockProject);
      }
      
      handleClose();
    } catch (error) {
      console.error('Error creating project:', error);
      Alert.alert('Error', 'Failed to create project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberSelect = (memberIds: string[]) => {
    setSelectedMembers(memberIds);
  };

  const handleLabelChange = (newLabels: Omit<ProjectLabel, 'id'>[]) => {
    setLabels(newLabels);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={Colors.neutral.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create project</Text>
          <TouchableOpacity 
            onPress={handleCreate} 
            style={[styles.createButton, (!projectName.trim() || isLoading) && styles.createButtonDisabled]}
            disabled={!projectName.trim() || isLoading}
          >
            <Text style={[styles.createButtonText, (!projectName.trim() || isLoading) && styles.createButtonTextDisabled]}>
              {isLoading ? 'Creating...' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Project Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Project name"
              value={projectName}
              onChangeText={setProjectName}
              maxLength={100}
            />
          </View>

          {/* Add Members */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add member</Text>
            <MemberDropdown
              members={workspaceMembers}
              selectedMemberIds={selectedMembers}
              onMemberSelect={handleMemberSelect}
            />
          </View>

          {/* Date and Time */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date and time</Text>
            <View style={styles.dateContainer}>
              <DatePicker
                date={startDate}
                onDateChange={setStartDate}
                label="Start Date"
                style={styles.datePicker}
              />
              <DatePicker
                date={endDate}
                onDateChange={setEndDate}
                label="End Date"
                style={styles.datePicker}
              />
            </View>
          </View>

          {/* Add Labels */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add label</Text>
            <LabelSelector
              labels={labels}
              onLabelsChange={handleLabelChange}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.descriptionInput]}
              placeholder="Project description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>
        </ScrollView>
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
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  createButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonDisabled: {
    backgroundColor: Colors.neutral.light,
  },
  createButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  createButtonTextDisabled: {
    color: Colors.neutral.medium,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.neutral.dark,
    backgroundColor: Colors.surface,
  },
  descriptionInput: {
    minHeight: 100,
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  datePicker: {
    flex: 1,
  },
});

export default CreateProjectModal;
