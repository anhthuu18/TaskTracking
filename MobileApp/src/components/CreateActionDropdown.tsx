import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';

interface CreateActionDropdownProps {
  visible: boolean;
  onClose: () => void;
  onCreateProject: () => void;
  onCreateTask: () => void;
  onCreateEvent: () => void;
}

const CreateActionDropdown: React.FC<CreateActionDropdownProps> = ({
  visible,
  onClose,
  onCreateProject,
  onCreateTask,
  onCreateEvent,
}) => {
  const dropdownOptions = [
    { 
      id: 'project', 
      title: 'Create project', 
      icon: 'folder',
      onPress: onCreateProject,
    },
    { 
      id: 'task', 
      title: 'Create task', 
      icon: 'add_task',
      onPress: onCreateTask,
    },
    { 
      id: 'event', 
      title: 'Create event', 
      icon: 'event',
      onPress: onCreateEvent,
    },
  ];

  const handleOptionPress = (option: any) => {
    onClose();
    option.onPress();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.dropdownMenu}>
          {dropdownOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.dropdownItem}
              onPress={() => handleOptionPress(option)}
            >
              <MaterialIcons name={option.icon} size={20} color={Colors.neutral.dark} />
              <Text style={styles.dropdownItemText}>{option.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80,
    paddingRight: 20,
  },
  dropdownMenu: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    color: Colors.neutral.dark,
    fontWeight: '500',
  },
});

export default CreateActionDropdown;
