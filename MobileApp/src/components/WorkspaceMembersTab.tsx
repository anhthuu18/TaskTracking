import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { WorkspaceMember, WorkspaceInvitation, MemberRole } from '../types/Workspace';

interface WorkspaceMembersTabProps {
  workspaceId: number;
  onInviteMember: () => void;
}

const WorkspaceMembersTab: React.FC<WorkspaceMembersTabProps> = ({ workspaceId, onInviteMember }) => {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for UI testing
  const mockMembers: WorkspaceMember[] = [
    {
      id: 1,
      workspaceId: workspaceId,
      userId: 1,
      role: MemberRole.OWNER,
      joinedAt: new Date('2024-01-15T10:30:00Z'),
      user: {
        id: 1,
        username: 'workspace_creator',
        email: 'creator@example.com',
        name: 'Workspace Creator'
      }
    },
    {
      id: 2,
      workspaceId: workspaceId,
      userId: 2,
      role: MemberRole.ADMIN,
      joinedAt: new Date('2024-01-20T14:15:00Z'),
      user: {
        id: 2,
        username: 'john_doe',
        email: 'john.doe@example.com',
        name: 'John Doe'
      }
    },
    {
      id: 3,
      workspaceId: workspaceId,
      userId: 3,
      role: MemberRole.MEMBER,
      joinedAt: new Date('2024-02-01T09:45:00Z'),
      user: {
        id: 3,
        username: 'jane_smith',
        email: 'jane.smith@example.com',
        name: 'Jane Smith'
      }
    },
    {
      id: 4,
      workspaceId: workspaceId,
      userId: 4,
      role: MemberRole.MEMBER,
      joinedAt: new Date('2024-02-10T16:20:00Z'),
      user: {
        id: 4,
        username: 'mike_wilson',
        email: 'mike.wilson@example.com',
        name: 'Mike Wilson'
      }
    }
  ];

  const mockInvitations: WorkspaceInvitation[] = [
    {
      id: 1,
      workspaceId: workspaceId,
      email: 'pending1@example.com',
      role: MemberRole.MEMBER,
      status: 'pending',
      createdAt: new Date('2024-02-15T10:00:00Z'),
      invitedBy: 1
    },
    {
      id: 2,
      workspaceId: workspaceId,
      email: 'pending2@example.com',
      role: MemberRole.ADMIN,
      status: 'pending',
      createdAt: new Date('2024-02-16T14:30:00Z'),
      invitedBy: 1
    }
  ];

  useEffect(() => {
    loadMembersAndInvitations();
  }, [workspaceId]);

  const loadMembersAndInvitations = async () => {
    try {
      setLoading(true);
      
      // Use mock data for UI testing
      setTimeout(() => {
        setMembers(mockMembers);
        setInvitations(mockInvitations);
        setLoading(false);
      }, 1000); // Simulate loading delay
      
      // TODO: Replace with actual API calls when ready
      // const [membersResponse, invitationsResponse] = await Promise.all([
      //   workspaceService.getWorkspaceMembers(workspaceId),
      //   workspaceService.getWorkspaceInvitations(workspaceId)
      // ]);

      // if (membersResponse.success) {
      //   setMembers(membersResponse.data);
      // }
      // if (invitationsResponse.success) {
      //   setInvitations(invitationsResponse.data);
      // }
    } catch (error) {
      console.error('Error loading members and invitations:', error);
      setLoading(false);
    }
  };

  const getRoleIcon = (role: MemberRole) => {
    switch (role) {
      case MemberRole.OWNER:
        return 'admin-panel-settings';
      case MemberRole.ADMIN:
        return 'manage-accounts';
      case MemberRole.MEMBER:
        return 'person';
      default:
        return 'person';
    }
  };

  const getRoleColor = (role: MemberRole) => {
    switch (role) {
      case MemberRole.OWNER:
        return Colors.error;
      case MemberRole.ADMIN:
        return Colors.warning;
      case MemberRole.MEMBER:
        return Colors.primary;
      default:
        return Colors.neutral.medium;
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
      {/* Invitations Section */}
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
                      {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Members Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitlemember}>Members ({members.length})</Text>
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
                <View key={member.id} style={styles.memberCard}>
                  <View style={styles.memberInfo}>
                    <View style={styles.avatar}>
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>
                          {(member.user.name || member.user.username).charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.memberDetails}>
                      <Text style={styles.memberName}>{member.user.name || member.user.username}</Text>
                      <Text style={styles.memberEmail}>{member.user.email}</Text>
                      <Text style={styles.joinedDate}>
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.roleContainer, { backgroundColor: getRoleColor(member.role) }]}>
                    <Text style={styles.roleText}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </Text>
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
    maxHeight: 220, // Limit height for each section
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
  
  // Member Card Styles - Updated to match invitation style
  sectionTitlemember: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 12,
    marginBottom: 16,
    color: Colors.neutral.dark,
  },
  
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 12,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.neutral.light + '40',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: 12,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 12,
    color: Colors.neutral.medium,
  },
  joinedDate: {
    fontSize: 12,
    color: Colors.neutral.medium,
  },
  roleContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.surface,
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
    fontSize: 16,
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
    fontSize: 12,
    fontWeight: '600',
  },
});

export default WorkspaceMembersTab;
