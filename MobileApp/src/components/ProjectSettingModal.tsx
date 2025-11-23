import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';

interface ProjectSettingModalProps {
  visible: boolean;
  onClose: () => void;
  projectName: string;
  projectDescription: string;
  onUpdateProject: (name: string, description: string) => void;
  isAdmin?: boolean;
}

const ProjectSettingModal: React.FC<ProjectSettingModalProps> = ({
  visible,
  onClose,
  projectName,
  projectDescription,
  onUpdateProject,
  isAdmin = true,
}) => {
  const [name, setName] = useState(projectName);
  const [description, setDescription] = useState(projectDescription);

  const handleSave = () => {
    if (name.trim() === '') {
      Alert.alert('Error', 'Project name cannot be empty');
      return;
    }
    onUpdateProject(name.trim(), description.trim());
    onClose();
  };

  const handleClose = () => {
    setName(projectName);
    setDescription(projectDescription);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Project Settings</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={Colors.neutral.medium} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.modalContent}>
            {/* Project Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Project Name *</Text>
              <TextInput
                style={[styles.textInput, !isAdmin && styles.readOnlyInput]}
                value={name}
                onChangeText={setName}
                placeholder="Enter project name"
                placeholderTextColor={Colors.neutral.medium}
                editable={isAdmin}
              />
            </View>

            {/* Project Description */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea, !isAdmin && styles.readOnlyInput]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter project description"
                placeholderTextColor={Colors.neutral.medium}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={isAdmin}
              />
            </View>
          </View>

          {/* Actions */}
          <View style={styles.modalActions}>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              {isAdmin && (
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.dark,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.neutral.dark,
    backgroundColor: Colors.background,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  readOnlyInput: {
    backgroundColor: Colors.neutral.light + '50',
    color: Colors.neutral.medium,
  },
  modalActions: {
    gap: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral.medium,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.surface,
  },
});

export default ProjectSettingModal;
