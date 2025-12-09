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
import { Project, ProjectMemberRole } from '../types/Project';
import { projectService } from '../services';
import { useToastContext } from '../context/ToastContext';

interface ProjectSettingsScreenProps {
  navigation: any;
  route: {
    params: {
      project: Project;
    };
  };
}

const ProjectSettingsScreen: React.FC<ProjectSettingsScreenProps> = ({ navigation, route }) => {
  const { showSuccess, showError } = useToastContext();
  const { project: initialProject } = route.params;
  const [project, setProject] = useState<Project>(initialProject);

  // State for the edit modal
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [projectName, setProjectName] = useState(initialProject.projectName);
  const [projectDescription, setProjectDescription] = useState(initialProject.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [isStarred, setIsStarred] = useState<boolean>((initialProject as any)?.isStarred || false);

  useEffect(() => {
    const boot = async () => {
      try {
        setLoading(true);
        const stored = await AsyncStorage.getItem('user');
        if (stored) {
          const u = JSON.parse(stored);
          setCurrentUserId(Number(u?.id));
        }
        // Ensure we have fresh project details with members
        const details = await projectService.getProjectDetails(initialProject.id);
        if (details.success && details.data) {
          setProject(details.data);
          setMembers((details.data as any).members || []);
          setProjectName(details.data.projectName || '');
          setProjectDescription(details.data.description || '');
        }
      } catch {}
      finally { setLoading(false); }
    };
    boot();
  }, [initialProject.id]);

  const meMember = useMemo(() => {
    if (!currentUserId) return null as any;
    return members.find(m => m.userId === currentUserId) || null;
  }, [members, currentUserId]);

  const isOwner = useMemo(() => meMember?.role === ProjectMemberRole.OWNER, [meMember]);
  const isAdmin = useMemo(() => meMember?.role === ProjectMemberRole.ADMIN || meMember?.role === ProjectMemberRole.OWNER, [meMember]);

  const ownerName = useMemo(() => {
    const ownerFromMembers = members.find(m => (m.role === 'OWNER' || m.role === ProjectMemberRole.OWNER))?.user?.username;
    const creatorName = (project as any)?.creator?.username || (project as any)?.user?.username;
    return ownerFromMembers || creatorName || '';
  }, [members, project]);

  const handleUpdateProject = async () => {
    if (!isAdmin) return;
    if (!projectName.trim()) {
      Alert.alert('Validation', 'Project name is required.');
      return;
    }
    setIsSaving(true);
    try {
      const response = await projectService.updateProject(project.id, {
        projectName: projectName.trim(),
        description: projectDescription.trim(),
      });
      if (response.success && response.data) {
        setProject(response.data);
        setIsEditModalVisible(false);
        showSuccess('Project updated');
        navigation.goBack();
      } else {
        Alert.alert('Error', response.message || 'Failed to update project.');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'An error occurred while updating the project.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = () => {
    if (!isAdmin) return;
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              const res = await projectService.deleteProject(project.id);
              if (res.success) {
                showSuccess(res.message || 'Project deleted');
                navigation.goBack();
              } else {
                Alert.alert('Error', res.message || 'Delete failed');
              }
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Delete failed');
            }
          }
        }
      ]
    );
  };

  const renderSettingItem = (item: {
    id: string;
    title: string;
    subtitle?: string;
    icon: string;
    iconColor?: string;
    onPress?: () => void;
    adminOnly?: boolean;
    danger?: boolean;
  }) => {
    if (item.adminOnly && !isAdmin) return null;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.settingItem}
        onPress={item.onPress}
        disabled={!item.onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: (item.iconColor || Colors.primary) + '20' }]}>
          <MaterialIcons name={item.icon as any} size={20} color={item.iconColor || Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.settingTitleText}>{item.title}</Text>
          {!!item.subtitle && <Text style={styles.settingSubtitleText}>{item.subtitle}</Text>}
        </View>
        {item.onPress && <MaterialIcons name="chevron-right" size={20} color={Colors.neutral.medium} />}
      </TouchableOpacity>
    );
  };

  const handleToggleStar = async () => {
    try {
      const res = await projectService.toggleStarProject(project.id);
      if (res?.success !== false) {
        setIsStarred(Boolean((res as any)?.isStarred ?? !isStarred));
      }
    } catch {}
  };

  const settingsItems = [
    {
      id: 'edit-project',
      title: 'Project Name & Description',
      subtitle: 'Update title and description',
      icon: 'edit',
      iconColor: Colors.primary,
      adminOnly: true,
      onPress: () => setIsEditModalVisible(true),
    },
    {
      id: 'star-project',
      title: isStarred ? 'Unstar Project' : 'Star Project',
      subtitle: isStarred ? 'Remove from favorites' : 'Add to favorites',
      icon: isStarred ? 'star' : 'star-border',
      iconColor: Colors.warning,
      adminOnly: true,
      onPress: handleToggleStar,
    },
    // Feature placeholder - hide until backend supports status
    // { id: 'complete-project', title: 'Mark as Complete', icon: 'check-circle', iconColor: Colors.semantic.success, adminOnly: true, onPress: handleCompleteProject },
    {
      id: 'delete-project',
      title: 'Delete Project',
      subtitle: 'Remove this project for everyone',
      icon: 'delete',
      iconColor: Colors.semantic.error,
      adminOnly: true,
      onPress: handleDeleteProject,
      danger: true,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inlineHeader}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>{isAdmin ? 'Manage your project details' : "Some settings are hidden because you don't have admin permissions."}</Text>
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
                <MaterialIcons name="badge" size={18} color={Colors.neutral.medium} />
                <Text style={styles.rowLabel}>Name</Text>
                <Text style={styles.rowValue} numberOfLines={1}>{project?.projectName || '-'}</Text>
              </View>
              {!!project?.description && (
                <View style={[styles.row, { alignItems: 'flex-start' }]}>
                  <MaterialIcons name="description" size={18} color={Colors.neutral.medium} />
                  <Text style={styles.rowLabel}>Description</Text>
                  <Text style={styles.rowValue}>{project?.description}</Text>
                </View>
              )}
              <View style={styles.row}>
                <MaterialIcons name="workspaces" size={18} color={Colors.neutral.medium} />
                <Text style={styles.rowLabel}>Workspace</Text>
                <Text style={styles.rowValue} numberOfLines={1}>{(project as any)?.workspace?.workspaceName || '-'}</Text>
              </View>
              {!!ownerName && (
                <View style={styles.row}>
                  <MaterialIcons name="person" size={18} color={Colors.neutral.medium} />
                  <Text style={styles.rowLabel}>Owner</Text>
                  <Text style={styles.rowValue} numberOfLines={1}>{ownerName}</Text>
                </View>
              )}
              <View style={styles.row}>
                <MaterialIcons name="groups" size={18} color={Colors.neutral.medium} />
                <Text style={styles.rowLabel}>Members</Text>
                <Text style={styles.rowValue}>{members?.length || 0}</Text>
              </View>
              <View style={styles.row}>
                <MaterialIcons name="event" size={18} color={Colors.neutral.medium} />
                <Text style={styles.rowLabel}>Created</Text>
                <Text style={styles.rowValue}>{project?.dateCreated ? new Date(project.dateCreated as any).toLocaleDateString() : '-'}</Text>
              </View>
              <View style={[styles.row, { borderBottomWidth: 0 }]}>
                <MaterialIcons name="update" size={18} color={Colors.neutral.medium} />
                <Text style={styles.rowLabel}>Updated</Text>
                <Text style={styles.rowValue}>{project?.dateModified ? new Date(project.dateModified as any).toLocaleDateString() : '-'}</Text>
              </View>
            </View>

            {/* Preferences - visible for everyone */}
            <View style={[styles.settingsContainer, { marginBottom: 16 }]}>
              <Text style={styles.sectionTitle}>Preferences</Text>
              <TouchableOpacity style={styles.settingItem} onPress={handleToggleStar} activeOpacity={0.7}>
                <View style={[styles.iconContainer, { backgroundColor: Colors.warning + '20' }]}>
                  <MaterialIcons name={isStarred ? 'star' : 'star-border'} size={20} color={Colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingTitleText}>{isStarred ? 'Unstar Project' : 'Star Project'}</Text>
                  <Text style={styles.settingSubtitleText}>{isStarred ? 'Remove from favorites' : 'Add to favorites for quick access'}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Admin actions */}
            {isAdmin && (
              <View style={styles.settingsContainer}>
                <Text style={styles.sectionTitle}>Manage</Text>
                {settingsItems.filter(x => x.id !== 'star-project').map(renderSettingItem)}

                {/* Quick Add Member from Settings */}
                <TouchableOpacity
                  style={styles.settingItem}
                  onPress={() => {
                    try { (navigation as any)?.setParams?.({ openAddMember: true }); } catch {}
                  }}
                >
                  <View style={[styles.iconContainer, { backgroundColor: Colors.primary + '20' }]}>
                    <MaterialIcons name="person-add" size={20} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingTitleText}>Add Members</Text>
                    <Text style={styles.settingSubtitleText}>Invite workspace members to this project</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={Colors.neutral.medium} />
                </TouchableOpacity>
              </View>
            )}

            {/* Non-admin: no manage actions; About only */}
          </>
        )}
      </ScrollView>

      {/* Edit Project Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Project</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={Colors.neutral.dark} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.modalLabel}>Project Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={projectName}
                  onChangeText={setProjectName}
                  placeholder="Enter project name"
                  placeholderTextColor={Colors.neutral.medium}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.modalLabel}>Description</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea]}
                  value={projectDescription}
                  onChangeText={setProjectDescription}
                  placeholder="Add a project description..."
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
                style={[styles.modalSaveButton, isSaving && styles.modalButtonDisabled]}
                onPress={handleUpdateProject}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={Colors.neutral.white} />
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
  header: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 20,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 0,
  },
  inlineHeader: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 0,
    marginBottom: 0,
    color: Colors.neutral.dark,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.neutral.medium,
    marginTop: 0,
  },
  settingsContainer: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  aboutCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral.dark,
    marginBottom: 8,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light + '50',
  },
  rowLabel: {
    width: 92,
    color: Colors.neutral.medium,
    fontSize: 13,
  },
  rowValue: {
    flex: 1,
    color: Colors.neutral.dark,
    fontSize: 14,
    fontWeight: '500',
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
  settingTitleText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral.dark,
  },
  settingSubtitleText: {
    fontSize: 12,
    color: Colors.neutral.medium,
    marginTop: 2,
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
    minHeight: 100,
    textAlignVertical: 'top',
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

export default ProjectSettingsScreen;
