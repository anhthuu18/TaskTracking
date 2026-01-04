import React, { useState, useEffect, useMemo } from 'react';
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
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../hooks/useTheme';
import { Colors } from '../constants/Colors';
import { workspaceService } from '../services/workspaceService';
import { useToastContext } from '../context/ToastContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MemberRole, WorkspaceMember } from '../types/Workspace';
import { CommonActions } from '@react-navigation/native';

interface SettingsScreenProps {
  navigation?: any;
  workspace?: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({
  navigation,
  workspace,
}) => {
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
  const [workspaceDescription, setWorkspaceDescription] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);

  // Invite member states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  // Workspace data
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [workspaceDetails, setWorkspaceDetails] = useState<any>(null);

  // Check if user is owner or admin
  const meMember = useMemo(() => {
    if (!currentUserId) return null;
    const member = members.find(m => m.userId === currentUserId) || null;
    return member;
  }, [members, currentUserId]);

  const isOwner = useMemo(() => {
    if (meMember?.role === MemberRole.OWNER) {
      return true;
    }
    if (
      currentUserId &&
      (workspaceDetails?.userId === currentUserId ||
        workspace?.userId === currentUserId)
    ) {
      return true;
    }
    return false;
  }, [meMember, currentUserId, workspaceDetails, workspace]);

  const isAdmin = useMemo(
    () => meMember?.role === MemberRole.OWNER || isOwner,
    [meMember, isOwner],
  );

  // Display role - show OWNER if user is creator even if not in members list
  const displayRole = useMemo(() => {
    if (isOwner) return 'OWNER';
    if (meMember?.role) return meMember.role;
    return 'MEMBER';
  }, [isOwner, meMember]);

  const ownerName = useMemo(() => {
    const ownerMember = members.find(m => m.role === MemberRole.OWNER);
    return (
      ownerMember?.user?.username || workspaceDetails?.creator?.username || ''
    );
  }, [members, workspaceDetails]);

  // Load notification settings from storage
  useEffect(() => {
    loadNotificationSettings();
    loadWorkspaceDetails();
  }, []);

  // Set workspace name when workspace changes
  useEffect(() => {
    if (workspace?.workspaceName) {
      setWorkspaceName(workspace.workspaceName);
    }
    if (workspace?.description) {
      setWorkspaceDescription(workspace.description);
    }
  }, [workspace]);

  const loadWorkspaceDetails = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem('user');
      let userId = null;
      if (stored) {
        const u = JSON.parse(stored);
        userId = Number(u?.id);
        setCurrentUserId(userId);
      }

      if (workspace?.id) {
        const details = await workspaceService.getWorkspaceDetails(
          workspace.id,
        );

        const membersResponse = await workspaceService.getWorkspaceMembers(
          workspace.id,
        );

        if (details.success && details.data) {
          setWorkspaceDetails(details.data);

          let apiMembers = [];
          if (membersResponse.success && membersResponse.data) {
            apiMembers = membersResponse.data;
          } else {
            apiMembers = (details.data as any).members || [];
          }

          if (apiMembers.length === 0) {
            if (userId && details.data.userId === userId) {
              const ownerMember = {
                userId: userId,
                role: MemberRole.OWNER,
                user: {
                  id: userId,
                  username: (details.data as any).creator?.username || 'You',
                },
              };
              apiMembers = [ownerMember as any];
            }
          }

          setMembers(apiMembers);
          setWorkspaceName(details.data.workspaceName || '');
          setWorkspaceDescription(details.data.description || '');
        }
      }
    } catch (error) {
      showError('Failed to load workspace details');
    } finally {
      setLoading(false);
    }
  };

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
      // Silent fail for notification settings
    }
  };

  const saveNotificationSettings = async (
    type: 'inApp' | 'push',
    value: boolean,
  ) => {
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
      showError('Failed to save notification settings');
    }
  };

  const handleRenameWorkspace = async () => {
    if (!workspaceName.trim()) {
      showError('Please enter a workspace name');
      return;
    }

    if (!isOwner) {
      showError('Only the workspace owner can edit workspace details');
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
        description: workspaceDescription.trim(),
      });

      if (response.success) {
        showSuccess('Workspace updated successfully');
        setShowRenameModal(false);
        loadWorkspaceDetails();
      } else {
        showError(response.message || 'Failed to update workspace');
      }
    } catch (error) {
      showError('Failed to update workspace. Please try again.');
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

    if (!isOwner) {
      showError('Only the workspace owner can invite members');
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
        inviteMessage.trim() || undefined,
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
      showError('Failed to send invitation. Please try again.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleDeleteWorkspace = () => {
    if (!isOwner) {
      showError('Only the workspace owner can delete the workspace');
      return;
    }

    Alert.alert(
      'Delete Workspace',
      'Are you sure you want to delete this workspace? This action cannot be undone and will delete all projects and tasks.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (workspace?.id) {
                const res = await workspaceService.deleteWorkspace(
                  workspace.id,
                );
                if (res.success) {
                  // Clear workspace from AsyncStorage
                  await AsyncStorage.removeItem('lastUsedWorkspaceId');

                  // Navigate back to workspace selection
                  // Try multiple navigation methods to ensure it works
                  if (navigation) {
                    try {
                      // Method 1: Try to get root navigator
                      const rootNav =
                        navigation.getParent?.()?.getParent?.() ||
                        navigation.getParent?.() ||
                        navigation;

                      // Method 2: Use replace to go to WorkspaceSelection
                      if (rootNav.navigate) {
                        rootNav.navigate('WorkspaceSelection');
                      } else if (rootNav.replace) {
                        rootNav.replace('WorkspaceSelection');
                      } else {
                        // Method 3: Use CommonActions as fallback
                        rootNav.dispatch(
                          CommonActions.reset({
                            index: 0,
                            routes: [{ name: 'WorkspaceSelection' }],
                          }),
                        );
                      }
                    } catch (navError) {
                      navigation.navigate?.('WorkspaceSelection');
                    }
                  }

                  // Show success message after navigation
                  setTimeout(() => {
                    showSuccess(
                      res.message || 'Workspace deleted successfully',
                    );
                  }, 500);
                } else {
                  showError(res.message || 'Delete failed');
                }
              }
            } catch (e: any) {
              showError(e?.message || 'Delete failed');
            }
          },
        },
      ],
    );
  };

  const handleLeaveWorkspace = () => {
    if (isOwner) {
      Alert.alert(
        'Cannot Leave',
        'As the workspace owner, you cannot leave the workspace. Please transfer ownership or delete the workspace instead.',
      );
      return;
    }

    Alert.alert(
      'Leave Workspace',
      'Are you sure you want to leave this workspace? You will lose access to all projects and tasks.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              showSuccess('Left workspace successfully');
              if (navigation) {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'WorkspaceSelection' }],
                });
              }
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to leave workspace');
            }
          },
        },
      ],
    );
  };

  const renderSettingItem = (item: {
    id: string;
    title: string;
    subtitle?: string;
    icon: string;
    iconColor?: string;
    onPress?: () => void;
    showOnlyOwner?: boolean;
    showOnlyAdmin?: boolean;
    rightComponent?: React.ReactNode;
  }) => {
    // Don't show owner-only items if user is not owner
    if (item.showOnlyOwner && !isOwner) {
      return null;
    }
    // Don't show admin-only items if user is not admin
    if (item.showOnlyAdmin && !isAdmin) {
      return null;
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.settingItem,
          { borderBottomColor: Colors.neutral.light },
        ]}
        onPress={item.onPress}
        disabled={!item.onPress}
      >
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: (item.iconColor || Colors.primary) + '20' },
          ]}
        >
          <MaterialIcons
            name={item.icon as any}
            size={20}
            color={item.iconColor || Colors.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>
            {item.title}
          </Text>
          {!!item.subtitle && (
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          )}
        </View>
        {item.rightComponent ||
          (item.onPress && (
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={Colors.neutral.medium}
            />
          ))}
      </TouchableOpacity>
    );
  };

  const settingsItems = [
    {
      id: 'rename-workspace',
      title: 'Workspace Name & Description',
      subtitle: 'Update workspace title and description',
      icon: 'edit',
      iconColor: Colors.primary,
      showOnlyOwner: true,
      onPress: () => setShowRenameModal(true),
    },
    {
      id: 'add-member',
      title: 'Invite Members',
      subtitle: 'Add new members to this workspace',
      icon: 'person-add',
      iconColor: Colors.primary,
      showOnlyOwner: true,
      onPress: () => setShowInviteModal(true),
    },
    {
      id: 'leave-workspace',
      title: 'Leave Workspace',
      subtitle: 'Remove yourself from this workspace',
      icon: 'exit-to-app',
      iconColor: Colors.warning,
      onPress: handleLeaveWorkspace,
    },
    {
      id: 'delete-workspace',
      title: 'Delete Workspace',
      subtitle: 'Permanently delete this workspace and all its data',
      icon: 'delete',
      iconColor: Colors.semantic.error,
      showOnlyOwner: true,
      onPress: handleDeleteWorkspace,
    },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar
        backgroundColor={Colors.neutral.white}
        barStyle="dark-content"
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {isOwner ? 'Manage your workspace' : 'View workspace information'}
        </Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
      >
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : (
          <>
            {/* About Card */}
            <View style={styles.aboutCard}>
              <Text style={styles.sectionTitle}>About</Text>
              <View style={styles.row}>
                <MaterialIcons
                  name="workspaces"
                  size={18}
                  color={Colors.neutral.medium}
                />
                <Text style={styles.rowLabel}>Name</Text>
                <Text style={styles.rowValue} numberOfLines={1}>
                  {workspaceDetails?.workspaceName ||
                    workspaceDetails?.name ||
                    workspace?.workspaceName ||
                    '-'}
                </Text>
              </View>
              {!!(workspaceDetails?.description || workspace?.description) && (
                <View style={[styles.row, { alignItems: 'flex-start' }]}>
                  <MaterialIcons
                    name="description"
                    size={18}
                    color={Colors.neutral.medium}
                  />
                  <Text style={styles.rowLabel}>Description</Text>
                  <Text style={styles.rowValue}>
                    {workspaceDetails?.description || workspace?.description}
                  </Text>
                </View>
              )}
              <View style={styles.row}>
                <MaterialIcons
                  name="category"
                  size={18}
                  color={Colors.neutral.medium}
                />
                <Text style={styles.rowLabel}>Type</Text>
                <Text style={styles.rowValue} numberOfLines={1}>
                  {workspaceDetails?.type ||
                    workspace?.type ||
                    workspace?.workspaceType ||
                    'Personal'}
                </Text>
              </View>
              {!!ownerName && (
                <View style={styles.row}>
                  <MaterialIcons
                    name="person"
                    size={18}
                    color={Colors.neutral.medium}
                  />
                  <Text style={styles.rowLabel}>Owner</Text>
                  <Text style={styles.rowValue} numberOfLines={1}>
                    {ownerName}
                  </Text>
                </View>
              )}
              <View style={styles.row}>
                <MaterialIcons
                  name="groups"
                  size={18}
                  color={Colors.neutral.medium}
                />
                <Text style={styles.rowLabel}>Members</Text>
                <Text style={styles.rowValue}>{members?.length || 0}</Text>
              </View>
              <View style={styles.row}>
                <MaterialIcons
                  name="event"
                  size={18}
                  color={Colors.neutral.medium}
                />
                <Text style={styles.rowLabel}>Created</Text>
                <Text style={styles.rowValue}>
                  {workspaceDetails?.createdAt || workspace?.dateCreated
                    ? new Date(
                        workspaceDetails?.createdAt || workspace?.dateCreated,
                      ).toLocaleDateString()
                    : '-'}
                </Text>
              </View>
              <View style={[styles.row, { borderBottomWidth: 0 }]}>
                <MaterialIcons
                  name="update"
                  size={18}
                  color={Colors.neutral.medium}
                />
                <Text style={styles.rowLabel}>Updated</Text>
                <Text style={styles.rowValue}>
                  {workspaceDetails?.updatedAt || workspace?.dateModified
                    ? new Date(
                        workspaceDetails?.updatedAt || workspace?.dateModified,
                      ).toLocaleDateString()
                    : '-'}
                </Text>
              </View>
            </View>

            {/* Role Badge */}
            <View style={styles.roleCard}>
              <MaterialIcons
                name="badge"
                size={18}
                color={Colors.neutral.medium}
              />
              <Text style={styles.roleLabel}>Your Role:</Text>
              <View
                style={[
                  styles.roleBadge,
                  {
                    backgroundColor: isOwner
                      ? Colors.semantic.error + '20'
                      : isAdmin
                      ? Colors.primary + '20'
                      : Colors.neutral.light,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.roleBadgeText,
                    {
                      color: isOwner
                        ? Colors.semantic.error
                        : isAdmin
                        ? Colors.primary
                        : Colors.neutral.dark,
                    },
                  ]}
                >
                  {displayRole}
                </Text>
              </View>
            </View>

            {/* Settings Section */}
            <View style={styles.settingsContainer}>
              <Text style={styles.sectionTitle}>
                {isOwner ? 'Manage' : 'Actions'}
              </Text>
              {settingsItems.map(renderSettingItem)}
            </View>
          </>
        )}
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
                <MaterialIcons
                  name="close"
                  size={24}
                  color={Colors.neutral.dark}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.modalLabel}>Workspace Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={workspaceName}
                  onChangeText={setWorkspaceName}
                  placeholder="Enter workspace name"
                  placeholderTextColor={Colors.neutral.medium}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.modalLabel}>Description</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea]}
                  value={workspaceDescription}
                  onChangeText={setWorkspaceDescription}
                  placeholder="Add a workspace description..."
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
                onPress={() => setShowRenameModal(false)}
                disabled={renameLoading}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalSaveButton,
                  renameLoading && styles.modalButtonDisabled,
                ]}
                onPress={handleRenameWorkspace}
                disabled={renameLoading}
              >
                {renameLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={Colors.neutral.white}
                  />
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
                <MaterialIcons
                  name="close"
                  size={24}
                  color={Colors.neutral.dark}
                />
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
                style={[
                  styles.modalSaveButton,
                  inviteLoading && styles.modalButtonDisabled,
                ]}
                onPress={handleInviteMember}
                disabled={inviteLoading}
              >
                {inviteLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={Colors.neutral.white}
                  />
                ) : (
                  <>
                    <MaterialIcons
                      name="send"
                      size={16}
                      color={Colors.neutral.white}
                    />
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
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: Colors.neutral.medium,
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
  // About & Role Cards
  aboutCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    gap: 8,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.dark,
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light + '40',
    gap: 12,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.medium,
    flex: 1,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.dark,
    flex: 1,
    textAlign: 'right',
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
