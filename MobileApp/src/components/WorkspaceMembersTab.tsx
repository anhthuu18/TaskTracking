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
import { WorkspaceMember, WorkspaceInvitation, MemberRole } from '../types/Workspace';
import { workspaceService } from '../services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToastContext } from '../context/ToastContext';
import { cardStyles, getRoleColor } from '../styles/cardStyles';

interface WorkspaceMembersTabProps {
  workspaceId: number;
  onInviteMember: () => void;
}

const WorkspaceMembersTab: React.FC<WorkspaceMembersTabProps> = ({ workspaceId, onInviteMember }) => {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<MemberRole | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const { showSuccess, showError } = useToastContext();

  // Mock data removed - using real API data only

  useEffect(() => {
    loadCurrentUserInfo();
  }, [workspaceId]);

  useEffect(() => {
    if (currentUserId && currentUserId > 0) {
      loadMembersAndInvitations();
    }
  }, [currentUserId, workspaceId]);

  // Refresh data when member is added

  const loadCurrentUserInfo = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Error loading current user info:', error);
    }
  };

  const loadMembersAndInvitations = async () => {
    try {
      setLoading(true);
      
      // Use real API calls
      const [membersResponse, invitationsResponse] = await Promise.all([
        workspaceService.getWorkspaceMembers(workspaceId),
        workspaceService.getWorkspaceInvitations(workspaceId)
      ]);

      if (membersResponse.success) {
        setMembers(membersResponse.data);
        
        // Find current user's role in this workspace
        if (currentUserId) {
          const currentUserMember = membersResponse.data.find(member => member.userId === currentUserId);
          if (currentUserMember) {
            setCurrentUserRole(currentUserMember.role);
          }
        }
      } else {
        console.error('Failed to load members:', membersResponse.message);
        setMembers([]);
      }
      
      if (invitationsResponse.success) {
        setInvitations(invitationsResponse.data);
      } else {
        console.error('Failed to load invitations:', invitationsResponse.message);
        setInvitations([]);
      }
    } catch (error) {
      console.error('Error loading members and invitations:', error);
      setMembers([]);
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for permissions
  const canManageMembers = () => {
    return currentUserRole === MemberRole.OWNER;
  };

  const canRemoveMember = (member: WorkspaceMember) => {
    const isOwner = currentUserRole === MemberRole.OWNER;
    const targetIsOwner = member.role === MemberRole.OWNER;
    return isOwner && !targetIsOwner;
  };

  // Member actions
  const showMemberActions = (member: WorkspaceMember) => {
    const actions = [];
    
    if (canRemoveMember(member)) {
      actions.push({
        text: 'Remove Member',
        onPress: () => removeMember(member),
        style: 'destructive' as const
      });
    }
    
    if (actions.length > 0) {
      Alert.alert(
        'Member Actions',
        `Actions for ${member.user.name || member.user.username}`,
        actions
      );
    } else {
      Alert.alert('No Actions', 'You do not have permission to perform actions on this member.');
    }
  };


  const removeMember = async (member: WorkspaceMember) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.user.name || member.user.username} from this workspace?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await workspaceService.removeMemberFromWorkspace(workspaceId, member.id);
              
              if (response.success) {
                showSuccess(`${member.user.name || member.user.username} has been removed`);
                // Refresh members list
                loadMembersAndInvitations();
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

  const getRoleIcon = (role: MemberRole) => {
    switch (role) {
      case MemberRole.OWNER:
        return 'admin-panel-settings';
      case MemberRole.MEMBER:
        return 'person';
      default:
        return 'person';
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return Colors.warning;
      case 'accepted':
        return Colors.success;
      case 'declined':
        return Colors.error;
      default:
        return Colors.neutral.medium;
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
      {/* Invitations Section - Only show for admin/owner */}
      {(canManageMembers() || currentUserRole === null) && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Invitations ({invitations.length})</Text>
            <TouchableOpacity style={styles.addButton} onPress={onInviteMember}>
              <MaterialIcons name="person-add" size={16} color={Colors.neutral.white} />
              <Text style={styles.addButtonText}>Add Member</Text>
            </TouchableOpacity>
          </View>
        <ScrollView 
          style={styles.sectionScrollView}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {invitations.length === 0 ? (
            <View style={styles.emptyStateSmall}>
              <Text style={styles.emptyStateText}>No pending invitations.</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {invitations.map((invitation) => (
                <View key={invitation.id} style={styles.invitationCard}>
                  <View style={styles.invitationInfo}>
                    <MaterialIcons name="mail-outline" size={32} color={Colors.neutral.medium} />
                    <View style={styles.invitationDetails}>
                      <Text style={styles.invitationEmail}>{invitation.email}</Text>
                      <Text style={styles.invitationDate}>
                        Invited on {new Date(invitation.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invitation.status) }]}>
                    <Text style={styles.statusText}>
                      {(invitation.status || 'pending').charAt(0).toUpperCase() + (invitation.status || 'pending').slice(1)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
        </View>
      )}

      {/* Members Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Members ({members.length})</Text>
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
                      <Text style={cardStyles.memberName}>{member.user.name || member.user.username}</Text>
                      <Text style={cardStyles.memberEmail}>{member.user.email}</Text>
                      <Text style={cardStyles.joinedDate}>
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <View style={cardStyles.memberActions}>
                    <View style={[cardStyles.roleContainer, { backgroundColor: getRoleColor(member.role) }]}>
                      <Text style={cardStyles.roleText}>
                        {(member.role || 'member').charAt(0).toUpperCase() + (member.role || 'member').slice(1)}
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light + '40',
  },
  sectionScrollView: {
    flex: 1,
    maxHeight: 240, // Limit height for each section
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
  emptyStateSmall: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  emptyStateText: {
    fontSize: 14,   
    color: Colors.neutral.medium,
    marginTop: 8,
  },
  
  
  // Invitation Card Styles - Vertical Layout
  invitationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  invitationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  invitationDetails: {
    marginLeft: 12,
    flex: 1,
  },
  invitationEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 2,
  },
  invitationDate: {
    fontSize: 12,
    color: Colors.neutral.medium,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: Colors.surface,
    fontSize: 11,
    fontWeight: '600',
  },
});

export default WorkspaceMembersTab;
