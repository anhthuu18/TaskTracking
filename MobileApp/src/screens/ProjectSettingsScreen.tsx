import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
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
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to update project.');
        console.error('Failed to update project:', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while updating the project.');
      console.error('Error updating project:', error);
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="keyboard-arrow-left" size={32} color={Colors.neutral.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Project Settings</Text>
        <View style={styles.headerActions} />
      </View>

      <ScrollView style={styles.content}>
        {/* General Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Project Name</Text>
              <TextInput
                style={styles.input}
                value={projectName}
                onChangeText={setProjectName}
                placeholder="Enter project name"
                editable={isCurrentUserAdmin}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={projectDescription}
                onChangeText={setProjectDescription}
                placeholder="Enter project description"
                multiline
                editable={isCurrentUserAdmin}
              />
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        {isCurrentUserAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Danger Zone</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.dangerButton} onPress={handleCompleteProject}>
                <MaterialIcons name="check-circle" size={20} color={Colors.semantic.success} />
                <Text style={[styles.dangerButtonText, { color: Colors.semantic.success }]}>Mark as Complete</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteProject}>
                <MaterialIcons name="delete" size={20} color={Colors.semantic.error} />
                <Text style={[styles.dangerButtonText, { color: Colors.semantic.error }]}>Delete Project</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Save Button */}
      {isCurrentUserAdmin && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleUpdateProject}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.neutral.dark,
  },
  headerActions: {
    width: 32, // To balance the header
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.medium,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.dark,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.neutral.dark,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.light,
    backgroundColor: Colors.surface,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: Colors.neutral.medium,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.surface,
  },
});

export default ProjectSettingsScreen;
