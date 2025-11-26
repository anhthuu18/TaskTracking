import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../hooks/useTheme';
import { Colors } from '../constants/Colors';
import { workspaceService } from '../services/workspaceService';
import { useToastContext } from '../context/ToastContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MemberRole } from '../types/Workspace';

interface SettingsScreenProps {
  navigation?: any;
  workspace?: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation, workspace }) => {
  const { colors } = useTheme();
  const { showSuccess, showError } = useToastContext();
  
  // Notification settings
  const [notificationInApp, setNotificationInApp] = useState(true);
  const [notificationPush, setNotificationPush] = useState(true);
  
  // Modals
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Rename workspace states
  const [workspaceName, setWorkspaceName] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);
  
  // Invite member states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  
  // Check if user is owner
  const isOwner = workspace?.userRole === 'OWNER' || workspace?.userRole === MemberRole.OWNER;

  // Load notification settings from storage
  useEffect(() => {
    loadNotificationSettings();
  }, []);

  // Set workspace name when workspace changes
  useEffect(() => {
    if (workspace?.workspaceName) {
      setWorkspaceName(workspace.workspaceName);
    }
  }, [workspace]);

  const loadNotificationSettings = async () => {
    try {
      const inApp = await AsyncStorage.getItem('notificationInApp');
      const push = await AsyncStorage.getItem('notificationPush');
      
      if (inApp !== null) {
        setNotificationInApp(inApp === 'true');
      }
      if (push !== null) {
        setNotificationPush(push === 'true');
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const saveNotificationSettings = async (type: 'inApp' | 'push', value: boolean) => {
    try {
      if (type === 'inApp') {
        setNotificationInApp(value);
        await AsyncStorage.setItem('notificationInApp', value.toString());
      } else {
        setNotificationPush(value);
        await AsyncStorage.setItem('notificationPush', value.toString());
      }
      showSuccess('Notification settings updated');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      showError('Failed to save notification settings');
    }
  };

  const handleRenameWorkspace = async () => {
    if (!workspaceName.trim()) {
      showError('Please enter a workspace name');
      return;
    }

    if (!workspace?.id) {
      showError('Workspace not found');
      return;
    }

    try {
      setRenameLoading(true);
      const response = await workspaceService.updateWorkspace(workspace.id, {
        workspaceName: workspaceName.trim(),
      });

      if (response.success) {
        showSuccess('Workspace renamed successfully');
        setShowRenameModal(false);
        // Reload workspace data if there's a callback
        // navigation?.goBack() or trigger refresh
      } else {
        showError(response.message || 'Failed to rename workspace');
      }
    } catch (error) {
      console.error('Error renaming workspace:', error);
      showError('Failed to rename workspace. Please try again.');
    } finally {
      setRenameLoading(false);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      showError('Please enter an email address');
      return;
    }

    if (!validateEmail(inviteEmail)) {
      showError('Please enter a valid email address');
      return;
    }

    if (!workspace?.id) {
      showError('Workspace not found');
      return;
    }

    try {
      setInviteLoading(true);
      const response = await workspaceService.inviteMember(
        workspace.id,
        inviteEmail.trim(),
        'MEMBER',
        inviteMessage.trim() || undefined
      );

      if (response.success) {
        showSuccess('Invitation sent successfully!');
        setInviteEmail('');
        setInviteMessage('');
        setShowInviteModal(false);
      } else {
        showError(response.message || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      showError('Failed to send invitation. Please try again.');
    } finally {
      setInviteLoading(false);
    }
  };

  const renderSettingItem = (item: {
    id: string;
    title: string;
    icon: string;
    iconColor?: string;
    onPress?: () => void;
    showOnlyOwner?: boolean;
    rightComponent?: React.ReactNode;
  }) => {
    // Don't show owner-only items if user is not owner
    if (item.showOnlyOwner && !isOwner) {
      return null;
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.settingItem, { borderBottomColor: Colors.neutral.light }]}
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
        <Text style={[styles.settingTitle, { color: colors.text }]}>
          {item.title}
        </Text>
        {item.rightComponent || (
          item.onPress && <MaterialIcons name="chevron-right" size={20} color={Colors.neutral.medium} />
        )}
      </TouchableOpacity>
    );
  };

  const settingsItems = [
    {
      id: 'rename-workspace',
      title: 'Rename Workspace',
      icon: 'edit',
      iconColor: Colors.primary,
      showOnlyOwner: true,
      onPress: () => setShowRenameModal(true),
    },
    {
      id: 'add-member',
      title: 'Add Member',
      icon: 'person-add',
      iconColor: Colors.primary,
      showOnlyOwner: true,
      onPress: () => setShowInviteModal(true),
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar backgroundColor={Colors.neutral.white} barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Manage your preferences
        </Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={{ backgroundColor: colors.background }} 
        contentContainerStyle={styles.content}
      >
        <View style={styles.settingsContainer}>
          {settingsItems.map(renderSettingItem)}
        </View>
      </ScrollView>

      {/* Rename Workspace Modal */}
      <Modal
        visible={showRenameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRenameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rename Workspace</Text>
              <TouchableOpacity
                onPress={() => setShowRenameModal(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={Colors.neutral.dark} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.modalLabel}>Workspace Name *</Text>
              <TextInput
                style={styles.modalInput}
                value={workspaceName}
                onChangeText={setWorkspaceName}
                placeholder="Enter workspace name"
                placeholderTextColor={Colors.neutral.medium}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowRenameModal(false)}
                disabled={renameLoading}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalSaveButton, renameLoading && styles.modalButtonDisabled]}
                onPress={handleRenameWorkspace}
                disabled={renameLoading}
              >
                {renameLoading ? (
                  <ActivityIndicator size="small" color={Colors.neutral.white} />
                ) : (
                  <Text style={styles.modalSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Invite Member Modal */}
      <Modal
        visible={showInviteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Member</Text>
              <TouchableOpacity
                onPress={() => setShowInviteModal(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={Colors.neutral.dark} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.modalLabel}>Email *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  placeholder="Enter member email"
                  placeholderTextColor={Colors.neutral.medium}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.modalLabel}>Message (Optional)</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea]}
                  value={inviteMessage}
                  onChangeText={setInviteMessage}
                  placeholder="Add a personal message..."
                  placeholderTextColor={Colors.neutral.medium}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <Text style={styles.modalInfoText}>
                The invitation will be sent via email and is valid for 7 days.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowInviteModal(false)}
                disabled={inviteLoading}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalSaveButton, inviteLoading && styles.modalButtonDisabled]}
                onPress={handleInviteMember}
                disabled={inviteLoading}
              >
                {inviteLoading ? (
                  <ActivityIndicator size="small" color={Colors.neutral.white} />
                ) : (
                  <>
                    <MaterialIcons name="send" size={16} color={Colors.neutral.white} />
                    <Text style={styles.modalSaveText}>Send Invitation</Text>
                  </>
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
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20, // Add padding to create space below the header
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
  },
  subtitle: {
    fontSize: 16,
  },
  settingsContainer: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  settingTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontSize: 14,
    marginRight: 4,
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalInfoText: {
    fontSize: 12,
    color: Colors.neutral.medium,
    marginTop: 8,
    lineHeight: 16,
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

export default SettingsScreen;
