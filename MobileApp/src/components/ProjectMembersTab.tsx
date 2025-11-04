import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { ProjectMember, ProjectMemberRole } from '../types/Project';
import { projectService } from '../services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToastContext } from '../context/ToastContext';
import { cardStyles, getRoleColor } from '../styles/cardStyles';

interface ProjectMembersTabProps {
  projectId: number;
  onInviteMember?: () => void;
}

const ProjectMembersTab: React.FC<ProjectMembersTabProps> = ({ projectId, onInviteMember }) => {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<ProjectMemberRole | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const { showSuccess, showError } = useToastContext();
  const [isActionModalVisible, setActionModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(null);

  useEffect(() => {
    loadMembers();
  }, [projectId]);

  const loadMembers = async () => {
    try {
      setLoading(true);

      // Get current user ID from AsyncStorage
      const storedUser = await AsyncStorage.getItem('user');
      const currentUserId = storedUser ? JSON.parse(storedUser).id : null;
      setCurrentUserId(currentUserId);

      const membersResponse = await projectService.getProjectMembers(projectId);

      if (membersResponse.success) {
        const membersData = membersResponse.data || [];
        setMembers(membersData);
        
        // Find current user's role in this project
        if (currentUserId) {
          const currentUserMember = membersData.find(
            member => member.userId === currentUserId
          );
          if (currentUserMember) {
            setCurrentUserRole(currentUserMember.role);
          }
        }
      } else {
        console.error('Failed to load members:', membersResponse.message);
        setMembers([]);
      }
    } catch (error) {
      console.error('Error loading members:', error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for permissions
  const canManageMembers = () => {
    return currentUserRole === ProjectMemberRole.OWNER || 
           currentUserRole === ProjectMemberRole.ADMIN;
  };

  const canRemoveMember = (member: ProjectMember) => {
    const isOwnerOrAdmin = currentUserRole === ProjectMemberRole.OWNER || 
                           currentUserRole === ProjectMemberRole.ADMIN;
    const targetIsOwner = member.role === ProjectMemberRole.OWNER;
    return isOwnerOrAdmin && !targetIsOwner;
  };

  // Member actions
  const showMemberActions = (member: ProjectMember) => {
    if (canRemoveMember(member)) {
      setSelectedMember(member);
      setActionModalVisible(true);
    } else {
      Alert.alert('No Actions', 'You do not have permission to perform actions on this member.');
    }
  };

  const handleRemoveMember = () => {
    if (selectedMember) {
      removeMember(selectedMember);
    }
    setActionModalVisible(false);
    setSelectedMember(null);
  };

  const removeMember = async (member: ProjectMember) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.user.name || member.user.username} from this project?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await projectService.removeMemberFromProject(projectId, member.id);
              
              if (response.success) {
                showSuccess(`${member.user.name || member.user.username} has been removed`);
                // Refresh members list
                loadMembers();
              } else {
                showError(response.message || 'Failed to remove member');
              }
            } catch (error: any) {
              console.error('Error removing member:', error);
              const errorMsg = error?.message || 'Failed to remove member';
              showError(errorMsg);
            }
          }
        }
      ]
    );
  };

  const getRoleIcon = (role: ProjectMemberRole) => {
    switch (role) {
      case ProjectMemberRole.OWNER:
        return 'admin-panel-settings';
      case ProjectMemberRole.ADMIN:
        return 'verified-user';
      case ProjectMemberRole.MEMBER:
        return 'person';
      default:
        return 'person';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading members...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Member Action Modal */}
      <Modal
        transparent={true}
        visible={isActionModalVisible}
        animationType="fade"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setActionModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Actions for {selectedMember?.user.name || selectedMember?.user.username}</Text>
            <TouchableOpacity style={styles.modalAction} onPress={handleRemoveMember}>
              <MaterialIcons name="delete" size={20} color={Colors.error} />
              <Text style={[styles.modalActionText, { color: Colors.error }]}>Remove Member</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalAction, { borderBottomWidth: 0 }]} onPress={() => setActionModalVisible(false)}>
              <Text style={styles.modalActionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      {/* Members Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Members ({members.length})</Text>
          {canManageMembers() && onInviteMember && (
            <TouchableOpacity style={styles.addButton} onPress={onInviteMember}>
              <MaterialIcons name="person-add" size={16} color={Colors.neutral.white} />
              <Text style={styles.addButtonText}>Add Member</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <ScrollView 
          style={styles.sectionScrollView}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >   
          {members.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="people-outline" size={48} color={Colors.neutral.medium} />
              <Text style={styles.emptyStateText}>No members found</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {members.map((member) => (
                <View key={member.id} style={cardStyles.memberCard}>
                  <View style={cardStyles.memberInfo}>
                    <View style={cardStyles.avatar}>
                      <View style={cardStyles.avatarPlaceholder}>
                        <Text style={cardStyles.avatarText}>
                          {(member.user.name || member.user.username).charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={cardStyles.memberDetails}>
                      <Text style={cardStyles.memberName}>
                        {member.user.name || member.user.username}
                      </Text>
                      <Text style={cardStyles.memberEmail}>{member.user.email}</Text>
                      <Text style={cardStyles.joinedDate}>
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <View style={cardStyles.memberActions}>
                    <View style={[
                      cardStyles.roleContainer, 
                      { backgroundColor: getRoleColor(member.role as any) }
                    ]}>
                      <Text style={cardStyles.roleText}>
                        {(member.role || 'member').charAt(0).toUpperCase() + 
                         (member.role || 'member').slice(1)}
                      </Text>
                    </View>
                    {canRemoveMember(member) && (
                      <TouchableOpacity 
                        style={{ padding: 4, borderRadius: 4 }}
                        onPress={() => showMemberActions(member)}
                      >
                        <MaterialIcons name="more-vert" size={20} color={Colors.neutral.medium} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    marginTop: 20,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: Colors.neutral.medium,
  },
  
  // Section Styles
  section: {
    flex: 1,
    paddingVertical: 16,
  },
  sectionScrollView: {
    flex: 1,
  },
  sectionHeader: {  
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  
  // Add Button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: Colors.neutral.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  
  // List Container
  listContainer: {
    gap: 12,
    paddingHorizontal: 12,
  },
  
  // Empty States
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 12,
  },
  emptyStateText: {
    fontSize: 14,   
    color: Colors.neutral.medium,
    marginTop: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.medium,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  modalActionText: {
    fontSize: 16,
    color: Colors.neutral.dark,
    marginLeft: 12,
  },
});

export default ProjectMembersTab;

