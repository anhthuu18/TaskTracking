import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

const CreateScreen: React.FC = () => {
  const { colors } = useTheme();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const createOptions = [
    { id: 'task', title: 'New Task', icon: '✓', description: 'Create a new task' },
    { id: 'project', title: 'New Project', icon: '📁', description: 'Start a new project' },
    { id: 'workspace', title: 'New Workspace', icon: '🏢', description: 'Create a workspace' },
    { id: 'event', title: 'New Event', icon: '📅', description: 'Schedule an event' },
  ];

  const renderCreateOption = (option: typeof createOptions[0]) => (
    <TouchableOpacity
      key={option.id}
      style={[styles.createOption, { backgroundColor: colors.background }]}
      onPress={() => {
        setShowCreateModal(false);
        // Handle create option press
        console.log(`Creating ${option.title}`);
      }}
    >
      <Text style={styles.createIcon}>{option.icon}</Text>
      <View style={styles.createTextContainer}>
        <Text style={[styles.createTitle, { color: colors.text }]}>
          {option.title}
        </Text>
        <Text style={[styles.createDescription, { color: colors.textSecondary }]}>
          {option.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Create</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            What would you like to create?
          </Text>
        </View>
        
        <View style={styles.optionsContainer}>
          {createOptions.map(renderCreateOption)}
        </View>

        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Quick Create
            </Text>
            <View style={styles.modalOptions}>
              {createOptions.map(renderCreateOption)}
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  createOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  createTextContainer: {
    flex: 1,
  },
  createTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  createDescription: {
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOptions: {
    gap: 12,
    marginBottom: 20,
  },
  closeButton: {
    padding: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CreateScreen;
