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

interface CreateTaskEventDropdownProps {
  visible: boolean;
  onClose: () => void;
  onCreateTask: () => void;
  onCreateEvent: () => void;
}

const CreateTaskEventDropdown: React.FC<CreateTaskEventDropdownProps> = ({
  visible,
  onClose,
  onCreateTask,
  onCreateEvent,
}) => {
  const dropdownOptions = [
    { 
      id: 'task', 
      title: 'Create task', 
      icon: 'assignment',
      onPress: onCreateTask,
    },
    { 
      id: 'event', 
      title: 'Create event', 
      icon: 'event_note',
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
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.bottomSheet}>
          <View style={styles.handle} />
          
          <View style={styles.content}>
            {dropdownOptions.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.option,
                  index === dropdownOptions.length - 1 && styles.lastOption
                ]}
                onPress={() => handleOptionPress(option)}
              >
                <Text style={styles.optionText}>{option.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 9999, // Very high z-index
  },
  bottomSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area for home indicator
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 9999, // Very high elevation
    zIndex: 10000, // Very high z-index
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.neutral.light,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  content: {
    paddingTop: 2,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  optionText: {
    fontSize: 16,
    color: Colors.neutral.dark,
    textAlign: 'center',
  },
  lastOption: {
    borderBottomWidth: 0,
  },
});

export default CreateTaskEventDropdown;
