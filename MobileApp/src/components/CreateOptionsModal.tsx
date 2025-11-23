import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Text,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../hooks/useTheme';
import { Colors } from '../constants/Colors';

export type CreateOption = 'voice' | 'workspace' | 'project' | 'task';

interface CreateOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onOptionSelect: (optionId: CreateOption) => void;
  allowedOptions?: CreateOption[]; // optional - filter which options to show
}

const baseCreateOptions = [
  {
    id: 'voice',
    title: 'Voice',
    icon: 'mic',
    description: 'Create with voice',
    color: '#8B5CF6', // Purple
  },

  {
    id: 'project',
    title: 'New Project',
    icon: 'folder',
    description: 'Start a new project',
    color: '#FCD34D', // Yellow
  },
  {
    id: 'task',
    title: 'New Task',
    icon: 'check-circle',
    description: 'Create a new task',
    color: '#8B5CF6', // Purple
  },
];

const CreateOptionsModal: React.FC<CreateOptionsModalProps> = ({ visible, onClose, onOptionSelect, allowedOptions }) => {
  const { colors } = useTheme();

  const createOptions = (allowedOptions && allowedOptions.length > 0)
    ? baseCreateOptions.filter(opt => allowedOptions.includes(opt.id as CreateOption))
    : baseCreateOptions;

  const renderCreateOption = (option: typeof baseCreateOptions[0]) => (
    <TouchableOpacity
      key={option.id}
      style={[styles.createOption, { backgroundColor: colors.surface }]}
      onPress={() => onOptionSelect(option.id as CreateOption)}
      activeOpacity={0.7}
    >
      <View style={[styles.createIconContainer, { backgroundColor: option.color + '20' }]}>
        <MaterialIcons
          name={option.icon as any}
          size={20}
          color={option.color}
        />
      </View>
      <View style={styles.createTextContainer}>
        <Text style={[styles.createTitle, { color: colors.text }]}>
          {option.title}
        </Text>
        <Text style={[styles.createDescription, { color: colors.textSecondary }]}>
          {option.description}
        </Text>
      </View>
      <MaterialIcons
        name="chevron-right"
        size={20}
        color={Colors.neutral.light}
      />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[styles.modalContent, { backgroundColor: colors.surface }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Create
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              What would you like to create?
            </Text>
          </View>

          <ScrollView
            style={styles.modalOptions}
            showsVerticalScrollIndicator={false}
          >
            {createOptions.map(renderCreateOption)}
          </ScrollView>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 12,
    padding: 16,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
  },
  modalOptions: {
    maxHeight: 300,
    marginBottom: 12,
  },
  createOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.light + '40',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  createIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  createTextContainer: {
    flex: 1,
  },
  createTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  createDescription: {
    fontSize: 12,
  },
  closeButton: {
    padding: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.neutral.light + '30',
  },
  closeButtonText: {
    color: Colors.neutral.dark,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CreateOptionsModal;
