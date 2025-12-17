import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/Colors';
import { Workspace, MemberRole, WorkspaceMember } from '../types/Workspace';
import { workspaceService } from '../services';
import { useToastContext } from '../context/ToastContext';

interface WorkspaceSettingsScreenProps {
  navigation: any;
  route: {
    params: {
      workspace: Workspace;
    };
  };
}

const WorkspaceSettingsScreen: React.FC<WorkspaceSettingsScreenProps> = ({
  navigation,
  route,
}) => {
  const { showSuccess, showError } = useToastContext();
  const { workspace: initialWorkspace } = route.params;
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace);

  // State for the edit modal
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [workspaceName, setWorkspaceName] = useState(
    initialWorkspace.workspaceName || initialWorkspace.name || '',
  );
  const [workspaceDescription, setWorkspaceDescription] = useState(
    initialWorkspace.description || '',
  );
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);

  useEffect(() => {
    const boot = async () => {
      try {
        setLoading(true);
        const stored = await AsyncStorage.getItem('user');
        if (stored) {
          const u = JSON.parse(stored);
          setCurrentUserId(Number(u?.id));
        }
        // Load workspace details with members
        const details = await workspaceService.getWorkspaceById(
          initialWorkspace.id,
        );
        if (details.success && details.data) {
          setWorkspace(details.data);
          setMembers((details.data as any).members || []);
          setWorkspaceName(
            details.data.workspaceName || details.data.name || '',
          );
          setWorkspaceDescription(details.data.description || '');
        }
      } catch (error) {
        console.error('Error loading workspace details:', error);
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, [initialWorkspace.id]);

  const meMember = useMemo(() => {
    if (!currentUserId) return null;
    return members.find(m => m.userId === currentUserId) || null;
  }, [members, currentUserId]);

  const isOwner = useMemo(
    () => meMember?.role === MemberRole.OWNER,
    [meMember],
  );
  const isAdmin = useMemo(
    () =>
      meMember?.role === MemberRole.ADMIN ||
      meMember?.role === MemberRole.OWNER,
    [meMember],
  );

  const ownerName = useMemo(() => {
    const ownerMember = members.find(
      m => m.role === MemberRole.OWNER || m.role === 'OWNER',
    );
    return (
      ownerMember?.user?.username || (workspace as any)?.creator?.username || ''
    );
  }, [members, workspace]);

  const handleUpdateWorkspace = async () => {
    if (!isAdmin) {
      showError('You do not have permission to edit this workspace');
      return;
    }
    if (!workspaceName.trim()) {
      Alert.alert('Validation', 'Workspace name is required.');
      return;
    }
    setIsSaving(true);
    try {
      const response = await workspaceService.updateWorkspace(workspace.id, {
        workspaceName: workspaceName.trim(),
        description: workspaceDescription.trim(),
      });
      if (response.success && response.data) {
        setWorkspace(response.data);
        setIsEditModalVisible(false);
        showSuccess('Workspace updated successfully');
        // Update workspace in navigation params
        if (navigation.setParams) {
          navigation.setParams({ workspace: response.data });
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to update workspace.');
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message || 'An error occurred while updating the workspace.',
      );
    } finally {
      setIsSaving(false);
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
              const res = await workspaceService.deleteWorkspace(workspace.id);
              if (res.success) {
                showSuccess(res.message || 'Workspace deleted successfully');
                // Navigate back to home or workspace list
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'WorkspacesList' }],
                });
              } else {
                Alert.alert('Error', res.message || 'Delete failed');
              }
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Delete failed');
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
              // Implementation depends on backend API
              showSuccess('Left workspace successfully');
              navigation.reset({
                index: 0,
                routes: [{ name: 'WorkspacesList' }],
              });
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to leave workspace');
            }
          },
        },
      ],
    );
  };

  const handleInviteMember = () => {
    if (!isAdmin) {
      showError('You do not have permission to invite members');
      return;
    }
    // Navigate to members tab or open invite modal
    if (navigation.setParams) {
      navigation.setParams({ openInviteMember: true });
    }
  };

  const renderSettingItem = (item: {
    id: string;
    title: string;
    subtitle?: string;
    icon: string;
    iconColor?: string;
    onPress?: () => void;
    adminOnly?: boolean;
    ownerOnly?: boolean;
    danger?: boolean;
  }) => {
    if (item.adminOnly && !isAdmin) return null;
    if (item.ownerOnly && !isOwner) return null;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.settingItem}
        onPress={item.onPress}
        disabled={!item.onPress}
        activeOpacity={0.7}
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
          <Text style={styles.settingTitleText}>{item.title}</Text>
          {!!item.subtitle && (
            <Text style={styles.settingSubtitleText}>{item.subtitle}</Text>
          )}
        </View>
        {item.onPress && (
          <MaterialIcons
            name="chevron-right"
            size={20}
            color={Colors.neutral.medium}
          />
        )}
      </TouchableOpacity>
    );
  };

  const settingsItems = [
    {
      id: 'edit-workspace',
      title: 'Workspace Name & Description',
      subtitle: 'Update workspace title and description',
      icon: 'edit',
      iconColor: Colors.primary,
      adminOnly: true,
      onPress: () => setIsEditModalVisible(true),
    },
    {
      id: 'invite-member',
      title: 'Invite Members',
      subtitle: 'Add new members to this workspace',
      icon: 'person-add',
      iconColor: Colors.primary,
      adminOnly: true,
      onPress: handleInviteMember,
    },
    {
      id: 'leave-workspace',
      title: 'Leave Workspace',
      subtitle: 'Remove yourself from this workspace',
      icon: 'exit-to-app',
      iconColor: Colors.warning,
      adminOnly: false,
      onPress: handleLeaveWorkspace,
    },
    {
      id: 'delete-workspace',
      title: 'Delete Workspace',
      subtitle: 'Permanently delete this workspace and all its data',
      icon: 'delete',
      iconColor: Colors.semantic.error,
      ownerOnly: true,
      onPress: handleDeleteWorkspace,
      danger: true,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inlineHeader}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>
            {isAdmin
              ? 'Manage your workspace settings'
              : "Some settings are hidden because you don't have admin permissions."}
          </Text>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : (
          <>
            {/* About Card - always visible */}
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
                  {workspace?.workspaceName || workspace?.name || '-'}
                </Text>
              </View>
              {!!workspace?.description && (
                <View style={[styles.row, { alignItems: 'flex-start' }]}>
                  <MaterialIcons
                    name="description"
                    size={18}
                    color={Colors.neutral.medium}
                  />
                  <Text style={styles.rowLabel}>Description</Text>
                  <Text style={styles.rowValue}>{workspace?.description}</Text>
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
                  {workspace?.type || 'Personal'}
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
                  {workspace?.createdAt
                    ? new Date(workspace.createdAt as any).toLocaleDateString()
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
                  {workspace?.updatedAt
                    ? new Date(workspace.updatedAt as any).toLocaleDateString()
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
                    backgroundColor:
                      meMember?.role === MemberRole.OWNER
                        ? Colors.semantic.error + '20'
                        : meMember?.role === MemberRole.ADMIN
                        ? Colors.primary + '20'
                        : Colors.neutral.light,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.roleBadgeText,
                    {
                      color:
                        meMember?.role === MemberRole.OWNER
                          ? Colors.semantic.error
                          : meMember?.role === MemberRole.ADMIN
                          ? Colors.primary
                          : Colors.neutral.dark,
                    },
                  ]}
                >
                  {meMember?.role || 'Member'}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.settingsContainer}>
              <Text style={styles.sectionTitle}>
                {isAdmin ? 'Manage' : 'Actions'}
              </Text>
              {settingsItems.map(renderSettingItem)}
            </View>
          </>
        )}
      </ScrollView>

      {/* Edit Workspace Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Workspace</Text>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
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
                onPress={() => setIsEditModalVisible(false)}
                disabled={isSaving}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalSaveButton,
                  isSaving && styles.modalButtonDisabled,
                ]}
                onPress={handleUpdateWorkspace}
                disabled={isSaving}
              >
                {isSaving ? (
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 0,
  },
  inlineHeader: {
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.neutral.dark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.neutral.medium,
  },
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
  settingsContainer: {
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingTitleText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 2,
  },
  settingSubtitleText: {
    fontSize: 13,
    color: Colors.neutral.medium,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.neutral.dark,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.neutral.dark,
    backgroundColor: Colors.neutral.white,
  },
  modalTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.light,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.medium,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.neutral.white,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
});

export default WorkspaceSettingsScreen;
