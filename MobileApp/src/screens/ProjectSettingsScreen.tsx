import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { Project } from '../types/Project';
import { projectService } from '../services';

interface ProjectSettingsScreenProps {
  navigation: any;
  route: {
    params: {
      project: Project;
    };
  };
}

const ProjectSettingsScreen: React.FC<ProjectSettingsScreenProps> = ({ navigation, route }) => {
  const { project: initialProject } = route.params;
  const [project, setProject] = useState<Project>(initialProject);

  // State for the edit modal
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [projectName, setProjectName] = useState(initialProject.projectName);
  const [projectDescription, setProjectDescription] = useState(initialProject.description || '');
  const [isSaving, setIsSaving] = useState(false);

  // Mock: Assume current user is an admin for UI purposes
  const isCurrentUserAdmin = true;

  const handleUpdateProject = async () => {
    if (!isCurrentUserAdmin) return;
    setIsSaving(true);
    try {
      const response = await projectService.updateProject(project.id, {
        projectName,
        description: projectDescription,
      });
      if (response.success && response.data) {
        setProject(response.data);
        setIsEditModalVisible(false); // Close modal on success
        navigation.goBack(); // Or update the parent state
      } else {
        Alert.alert('Error', 'Failed to update project.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while updating the project.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteProject = () => {
    Alert.alert(
      'Confirm Completion',
      'Are you sure you want to mark this project as complete?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Complete', onPress: () => console.log('Project marked as complete') },
      ]
    );
  };

  const handleDeleteProject = () => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this project? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => console.log('Project deleted'), style: 'destructive' },
      ]
    );
  };

  const renderSettingItem = (item: {
    id: string;
    title: string;
    icon: string;
    iconColor?: string;
    onPress?: () => void;
    showOnlyAdmin?: boolean;
  }) => {
    if (item.showOnlyAdmin && !isCurrentUserAdmin) {
      return null;
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.settingItem}
        onPress={item.onPress}
        disabled={!item.onPress}
      >
        <View style={[styles.iconContainer, { backgroundColor: (item.iconColor || Colors.primary) + '20' }]}>
          <MaterialIcons
            name={item.icon as any}
            size={20}
            color={item.iconColor || Colors.primary}
          />
        </View>
        <Text style={styles.settingTitleText}>
          {item.title}
        </Text>
        {item.onPress && <MaterialIcons name="chevron-right" size={20} color={Colors.neutral.medium} />}
      </TouchableOpacity>
    );
  };

  const settingsItems = [
    {
      id: 'edit-project',
      title: 'Project Name & Description',
      icon: 'edit',
      iconColor: Colors.primary,
      showOnlyAdmin: true,
      onPress: () => setIsEditModalVisible(true),
    },
    {
      id: 'complete-project',
      title: 'Mark as Complete',
      icon: 'check-circle',
      iconColor: Colors.semantic.success,
      showOnlyAdmin: true,
      onPress: handleCompleteProject,
    },
    {
      id: 'delete-project',
      title: 'Delete Project',
      icon: 'delete',
      iconColor: Colors.semantic.error,
      showOnlyAdmin: true,
      onPress: handleDeleteProject,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your project details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.settingsContainer}>
          {settingsItems.map(renderSettingItem)}
        </View>
      </ScrollView>

      {/* Edit Project Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Project</Text>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={Colors.neutral.dark} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.modalLabel}>Project Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={projectName}
                  onChangeText={setProjectName}
                  placeholder="Enter project name"
                  placeholderTextColor={Colors.neutral.medium}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.modalLabel}>Description</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea]}
                  value={projectDescription}
                  onChangeText={setProjectDescription}
                  placeholder="Add a project description..."
                  placeholderTextColor={Colors.neutral.medium}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setIsEditModalVisible(false)}
                disabled={isSaving}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalSaveButton, isSaving && styles.modalButtonDisabled]}
                onPress={handleUpdateProject}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={Colors.neutral.white} />
                ) : (
                  <Text style={styles.modalSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: Colors.neutral.dark,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.neutral.medium,
  },
  settingsContainer: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTitleText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral.dark,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral.dark,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.neutral.light + '20',
  },
  modalTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.light,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral.dark,
  },
  modalSaveButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalButtonDisabled: {
    backgroundColor: Colors.neutral.medium,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral.white,
  },
});

export default ProjectSettingsScreen;
