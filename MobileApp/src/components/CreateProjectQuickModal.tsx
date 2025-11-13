import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';

interface CreateProjectQuickModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateTask: () => void;
  onCreateEvent: () => void;
}

const CreateProjectQuickModal: React.FC<CreateProjectQuickModalProps> = ({
  visible,
  onClose,
  onCreateTask,
  onCreateEvent,
}) => {
  const options = [
    {
      id: 'task',
      title: 'New Task',
      subtitle: 'Create a new task for this project',
      icon: 'assignment',
      onPress: onCreateTask,
    },
    {
      id: 'event',
      title: 'New Event',
      subtitle: 'Schedule an event for this project',
      icon: 'event',
      onPress: onCreateEvent,
    },
  ];

  const handlePress = (cb: () => void) => {
    onClose();
    cb();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Create</Text>
          <Text style={styles.subtitle}>What would you like to create?</Text>

          <View style={styles.list}>
            {options.map(opt => (
              <TouchableOpacity key={opt.id} style={styles.item} onPress={() => handlePress(opt.onPress)}>
                <View style={[styles.iconWrap, { backgroundColor: Colors.primary + '15' }]}>
                  <MaterialIcons name={opt.icon as any} size={22} color={Colors.primary} />
                </View>
                <View style={styles.itemTextWrap}>
                  <Text style={styles.itemTitle}>{opt.title}</Text>
                  <Text style={styles.itemSubtitle}>{opt.subtitle}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={Colors.neutral.medium} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.neutral.dark,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.neutral.medium,
    marginTop: 6,
    marginBottom: 16,
  },
  list: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemTextWrap: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  itemSubtitle: {
    fontSize: 12,
    color: Colors.neutral.medium,
    marginTop: 2,
  },
  cancelBtn: {
    marginTop: 4,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    color: Colors.neutral.medium,
    fontWeight: '500',
  },
});

export default CreateProjectQuickModal;

