import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { CreateProjectRequest } from '../types/Project';
import { WorkspaceMember } from '../types/Workspace';
import MemberDropdown from './MemberDropdown';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToastContext } from '../context/ToastContext';

import { projectService, workspaceService } from '../services';

interface CreateProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onProjectCreated: () => void; // Simplified callback
  workspaceId: number;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  visible,
  onClose,
  onProjectCreated,
  workspaceId,
}) => {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMembers, setIsFetchingMembers] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const { showSuccess, showError } = useToastContext();

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

  // Load workspace members when modal opens
  useEffect(() => {
    if (visible && workspaceId) {
      loadWorkspaceMembers();
    }
  }, [visible, workspaceId]);

  const loadWorkspaceMembers = async () => {
    try {
      setIsFetchingMembers(true);
      const response = await workspaceService.getWorkspaceMembers(workspaceId);
      
      if (response.success && response.data) {
        setWorkspaceMembers(response.data);
      } else {
        setWorkspaceMembers([]);
        showError('Failed to load workspace members');
      }
    } catch (error) {
      console.error('Error loading workspace members:', error);
      setWorkspaceMembers([]);
      showError('Failed to load workspace members');
    } finally {
      setIsFetchingMembers(false);
    }
  };

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
    setWorkspaceMembers([]);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = () => {
    if (!projectName.trim()) {
      showError('Please enter a project name');
      return false;
    }

    if (projectName.trim().length < 3) {
      showError('Project name must be at least 3 characters');
      return false;
    }

    if (projectName.trim().length > 100) {
      showError('Project name must not exceed 100 characters');
      return false;
    }

    if (description.trim().length > 500) {
      showError('Description must not exceed 500 characters');
      return false;
    }

    if (!workspaceId || isNaN(workspaceId)) {
      showError('Invalid workspace. Please try again.');
      return false;
    }

    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

    const projectData: CreateProjectRequest = {
      projectName: projectName.trim(),
      description: description.trim() || undefined,
      workspaceId: workspaceId,
    };

    try {
      setIsLoading(true);
      
      // Step 1: Create the project
      const createResponse = await projectService.createProject(projectData);
      
      if (!createResponse.success || !createResponse.data) {
        throw new Error(createResponse.message || 'Failed to create project');
      }

      const newProject = createResponse.data;
      
      // Step 2: Add selected members to the project (if any)
      if (selectedMembers.length > 0) {
        const memberUserIds = selectedMembers.map(id => Number(id)).filter(n => !isNaN(n));
        
        for (const userId of memberUserIds) {
          try {
            await projectService.addMemberToProject(newProject.id, userId);
          } catch (memberError) {
            console.error(`Failed to add member ${userId}:`, memberError);
            // Continue adding other members even if one fails
          }
        }
      }
      
      showSuccess('Project created successfully!');
      onProjectCreated(); // Trigger parent to reload projects
      handleClose();
    } catch (error) {
      console.error('Error creating project:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberSelect = (memberIds: string[]) => {
    setSelectedMembers(memberIds);
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
              {isFetchingMembers ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.loadingText}>Loading members...</Text>
                </View>
              ) : (
                <MemberDropdown
                  members={filteredMembers}
                  selectedMemberIds={selectedMembers}
                  onMemberSelect={handleMemberSelect}
                />
              )}
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description (Optional)</Text>
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
              <Text style={styles.characterCount}>
                {description.length}/500 characters
              </Text>
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
  },
  characterCount: {
    fontSize: 12,
    color: Colors.neutral.medium,
    marginTop: 4,
    textAlign: 'right',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.neutral.medium,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.neutral.medium,
  },
});

export default CreateProjectModal;
