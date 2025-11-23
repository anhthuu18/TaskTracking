import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';

interface WorkspaceActionDropdownProps {
  visible: boolean;
  onClose: () => void;
  onCreateProject: () => void;
}

const WorkspaceActionDropdown: React.FC<WorkspaceActionDropdownProps> = ({
  visible,
  onClose,
  onCreateProject,
}) => {
  const handleCreateProject = () => {
    onClose();
    onCreateProject();
  };



  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.dropdown}>
          <TouchableOpacity style={styles.option} onPress={handleCreateProject}>
            <View style={[styles.iconContainer, { backgroundColor: Colors.primary + '20' }]}>
              <MaterialIcons name="add" size={20} color={Colors.primary} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Create Project</Text>
              <Text style={styles.optionDescription}>Start a new project in this workspace</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={Colors.neutral.medium} />
          </TouchableOpacity>


        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    paddingBottom: 100, // Position above bottom tab
    paddingHorizontal: 20,
  },
  dropdown: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
    color: Colors.neutral.medium,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.neutral.light,
    marginHorizontal: 16,
  },
});

export default WorkspaceActionDropdown;


