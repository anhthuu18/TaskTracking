import React, { useEffect, useMemo, useState } from 'react';
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
import { WorkspaceMember, MemberRole } from '../types/Workspace';
import MemberDropdown from './MemberDropdown';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CreateProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateProject?: (projectData: CreateProjectRequest, memberUserIds: number[]) => Promise<void> | void;
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
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [labels, setLabels] = useState<Omit<ProjectLabel, 'id'>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          if (user?.id) setCurrentUserId(Number(user.id));
        }
      } catch {}
    };
    loadUser();
  }, []);

  const workspaceOwner: WorkspaceMember | undefined = useMemo(
    () => workspaceMembers.find(m => m.role === MemberRole.OWNER),
    [workspaceMembers]
  );

  // Hide the creator (current user) from dropdown; they will be admin by default on backend
  const filteredMembers: WorkspaceMember[] = useMemo(() => {
    if (!currentUserId) return workspaceMembers;
    return workspaceMembers.filter(m => m.user.id !== currentUserId);
  }, [workspaceMembers, currentUserId]);

  // Do not pre-select any member on open per requirement

  const resetForm = () => {
    setProjectName('');
    setDescription('');
    setSelectedMembers([]);
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

    const projectData: CreateProjectRequest = {
      projectName: projectName.trim(),
      description: description.trim() || undefined,
      workspaceId: Number(workspaceId),
    };

    try {
      setIsLoading(true);
      
      if (onCreateProject) {
        const memberUserIds = selectedMembers.map(id => Number(id)).filter(n => !isNaN(n));
        await onCreateProject(projectData, memberUserIds);
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
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerSideSpacer} />
            <Text style={styles.headerTitle}>Create project</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={Colors.neutral.dark} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Project Name */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Project name"
                placeholderTextColor={Colors.neutral.medium}
                value={projectName}
                onChangeText={setProjectName}
                maxLength={100}
              />
            </View>

            {/* Add Members */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Add member</Text>
            {/* Owner card removed per requirement; dropdown shows only workspace members except creator */}
              <MemberDropdown
                members={filteredMembers}
                selectedMemberIds={selectedMembers}
                onMemberSelect={handleMemberSelect}
              />
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.descriptionInput]}
                placeholder="Project description"
                placeholderTextColor={Colors.neutral.medium}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
            </View>
          </ScrollView>

          {/* Footer Create Button */}
          <View style={styles.footer}>
            <TouchableOpacity 
              onPress={handleCreate} 
              style={[styles.createButton, (!projectName.trim() || isLoading) && styles.createButtonDisabled]}
              disabled={!projectName.trim() || isLoading}
              activeOpacity={0.8}
            >
              <Text style={[styles.createButtonText, (!projectName.trim() || isLoading) && styles.createButtonTextDisabled]}>
                {isLoading ? 'Creating...' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    //padding: 20,
  },
  modalCard: {
    width: '90%',
    maxHeight: '60%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    flex: 1,
    textAlign: 'center',
  },
  headerSideSpacer: { width: 64 },
  createButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    backgroundColor: Colors.neutral.medium,
  },
  createButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  createButtonTextDisabled: {
    color: Colors.neutral.white,
  },
  content: {
    paddingHorizontal: 10,
    paddingVertical: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.light,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  // Owner styles removed (no longer used)
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.neutral.medium,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.neutral.dark,
    backgroundColor: Colors.surface,
  },
  descriptionInput: {
    minHeight: 100,
  }
});

export default CreateProjectModal;
